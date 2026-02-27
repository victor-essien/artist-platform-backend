import { prisma } from "../../config/database";
import { AppError } from "../../utils/error";
import { CreateOrderDTO, OrderFilterQuery } from "../../types";
import { generateOrderNumber, generateQRCode, calculateShippingFee, calculateTax, paginate, createPaginationMeta, isSalesActive } from "../../utils/helper";
import { sendOrderConfirmation, sendTicketConfirmation, sendRefundConfirmation } from "../../utils/email";
import { OrderStatus, PaymentStatus } from "../../generated/prisma";



export class OrderService {
  async createOrder(data: CreateOrderDTO) {
    const orderNumber = generateOrderNumber();
    let subtotal = 0;
    let shippingFee = 0;
    let tax = 0;

    // Validate and calculate for merch items
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });

        if (!product || !product.isActive) {
          throw new AppError('Product not found or inactive', 404);
        }

        // Check stock
        let price = product.price;
        if (item.productVariantId) {
          const variant = await prisma.productVariant.findUnique({
            where: { id: item.productVariantId },
          });
          if (!variant || variant.stock < item.quantity) {
            throw new AppError(`Insufficient stock for ${product.name}`, 400);
          }
          price = variant.price || product.price;
        } else {
          if (product.stock < item.quantity) {
            throw new AppError(`Insufficient stock for ${product.name}`, 400);
          }
        }

        subtotal += parseFloat(price.toString()) * item.quantity;
      }

      // Calculate shipping for merch orders
      if (data.shippingAddress) {
        const totalWeight = await this.calculateTotalWeight(data.items);
        shippingFee = calculateShippingFee(
          totalWeight,
          data.shippingAddress.country
        );
      }
    }

    // Validate and calculate for tickets
    if (data.tickets && data.tickets.length > 0) {
      if (!data.eventId) {
        throw new AppError('Event ID required for ticket purchase', 400);
      }

      const event = await prisma.event.findUnique({
        where: { id: data.eventId },
        include: { ticketTypes: true },
      });

      if (!event || event.status !== 'PUBLISHED') {
        throw new AppError('Event not available', 404);
      }

      for (const ticket of data.tickets) {
        const ticketType = event.ticketTypes.find(
          (tt) => tt.id === ticket.ticketTypeId
        );

        if (!ticketType || !ticketType.isActive) {
          throw new AppError('Ticket type not found or inactive', 404);
        }

        // Check sales period
        if (!isSalesActive(ticketType.salesStart, ticketType.salesEnd)) {
          throw new AppError(
            `Sales for ${ticketType.name} are not active`,
            400
          );
        }

        // Check availability
        const available = ticketType.quantity - ticketType.sold;
        if (available < ticket.quantity) {
          throw new AppError(
            `Only ${available} tickets available for ${ticketType.name}`,
            400
          );
        }

        // Check max per order
        if (ticket.quantity > ticketType.maxPerOrder) {
          throw new AppError(
            `Maximum ${ticketType.maxPerOrder} tickets per order for ${ticketType.name}`,
            400
          );
        }

        subtotal += parseFloat(ticketType.price.toString()) * ticket.quantity;
      }
    }

    // Calculate tax
    tax = calculateTax(subtotal, data.shippingAddress?.state);
    const total = subtotal + shippingFee + tax;

    // Create order with all related records
    const order = await prisma.$transaction(async (tx) => {
      const orderData: any = {
        orderNumber,
        customerEmail: data.customerEmail.toLowerCase(),
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        orderType: data.orderType,
        shippingAddress: data.shippingAddress?.address,
        shippingCity: data.shippingAddress?.city,
        shippingState: data.shippingAddress?.state,
        shippingZip: data.shippingAddress?.zip,
        shippingCountry: data.shippingAddress?.country,
        subtotal,
        shippingFee,
        tax,
        total,
        paymentMethod: data.paymentMethod,
        status: 'PENDING',
        paymentStatus: 'PENDING',
      };

      if (data.eventId) {
        orderData.eventId = data.eventId;
      }

      const newOrder = await tx.order.create({
        data: orderData,
      });

      // Create order items for merch
      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw new AppError('Product not found', 404);
          }

          let price = product.price;
          if (item.productVariantId) {
            const variant = await tx.productVariant.findUnique({
              where: { id: item.productVariantId },
            });
            price = variant?.price || product.price;
          }

          await tx.orderItem.create({
            data: {
              orderId: newOrder.id,
              productId: item.productId,
              productVariantId: item.productVariantId || null,
              quantity: item.quantity,
              unitPrice: price,
              totalPrice: parseFloat(price.toString()) * item.quantity,
            },
          });

          // Update stock
          if (item.productVariantId) {
            await tx.productVariant.update({
              where: { id: item.productVariantId },
              data: { stock: { decrement: item.quantity } },
            });
          } else {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            });
          }
        }
      }

      // Create tickets
      if (data.tickets && data.tickets.length > 0) {
        for (const ticket of data.tickets) {
          for (let i = 0; i < ticket.quantity; i++) {
            await tx.ticket.create({
              data: {
                orderId: newOrder.id,
                ticketTypeId: ticket.ticketTypeId,
                qrCode: generateQRCode(),
                status: 'VALID',
              },
            });
          }

          // Update sold count
          await tx.ticketType.update({
            where: { id: ticket.ticketTypeId },
            data: { sold: { increment: ticket.quantity } },
          });
        }
      }

      return newOrder;
    });

    // Send confirmation email (non-blocking)
    this.sendOrderEmail(order.id).catch((err) =>
      console.error('Failed to send email:', err)
    );

    return order;
  }

  async getOrders(query: OrderFilterQuery) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const { skip, take } = paginate(page, limit);

    const where: any = {};

    if (query.status) {
      where.status = query.status as OrderStatus;
    }

    if (query.orderType) {
      where.orderType = query.orderType;
    }

    if (query.customerEmail) {
      where.customerEmail = {
        contains: query.customerEmail,
        mode: 'insensitive',
      };
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take,
        include: {
          event: {
            select: {
              id: true,
              title: true,
              date: true,
            },
          },
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                },
              },
            },
          },
          tickets: {
            include: {
              ticketType: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: createPaginationMeta(total, page, limit),
    };
  }

  async getOrderById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        event: true,
        orderItems: {
          include: {
            product: true,
            productVariant: true,
          },
        },
        tickets: {
          include: {
            ticketType: true,
          },
        },
        payments: true,
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    return order;
  }

  async getOrderByNumber(orderNumber: string) {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        event: true,
        orderItems: {
          include: {
            product: true,
            productVariant: true,
          },
        },
        tickets: {
          include: {
            ticketType: true,
          },
        },
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    return order;
  }

  async updateOrderStatus(id: string, status: OrderStatus) {
    const order = await prisma.order.update({
      where: { id },
      data: { status },
    });

    return order;
  }

  async processPayment(orderId: string, paymentIntentId: string) {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'COMPLETED',
        paymentIntentId,
        status: 'CONFIRMED',
      },
    });

    await prisma.payment.create({
      data: {
        orderId,
        amount: order.total,
        paymentMethod: order.paymentMethod || 'stripe',
        transactionId: paymentIntentId,
        status: 'COMPLETED',
      },
    });

    return order;
  }

  async refundOrder(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: true,
        tickets: true,
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.status === 'REFUNDED') {
      throw new AppError('Order already refunded', 400);
    }

    await prisma.$transaction([
      prisma.order.update({
        where: { id },
        data: {
          status: 'REFUNDED',
          paymentStatus: 'REFUNDED',
        },
      }),
      prisma.ticket.updateMany({
        where: { orderId: id },
        data: { status: 'REFUNDED' },
      }),
    ]);

    // Restore stock for merch items
    for (const item of order.orderItems) {
      if (item.productVariantId) {
        await prisma.productVariant.update({
          where: { id: item.productVariantId },
          data: { stock: { increment: item.quantity } },
        });
      } else {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    // Restore ticket count
    for (const ticket of order.tickets) {
      await prisma.ticketType.update({
        where: { id: ticket.ticketTypeId },
        data: { sold: { decrement: 1 } },
      });
    }

    // Send refund email
    sendRefundConfirmation(
      order.customerEmail,
      order.orderNumber,
      parseFloat(order.total.toString())
    ).catch((err) => console.error('Failed to send email:', err));

    return order;
  }

  private async calculateTotalWeight(items: any[]): Promise<number> {
    let totalWeight = 0;

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (product && product.weight) {
        totalWeight += parseFloat(product.weight.toString()) * item.quantity;
      }
    }

    return totalWeight;
  }

  private async sendOrderEmail(orderId: string) {
    const order = await this.getOrderById(orderId);

    if (order.orderType === 'TICKET' && order.event) {
      await sendTicketConfirmation(
        order.customerEmail,
        order.orderNumber,
        order.event,
        order.tickets.length
      );
    } else {
      await sendOrderConfirmation(order.customerEmail, order.orderNumber, {
        total: parseFloat(order.total.toString()),
      });
    }
  }

  async getCustomerOrders(email: string) {
    const orders = await prisma.order.findMany({
      where: {
        customerEmail: email.toLowerCase(),
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            date: true,
          },
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
        tickets: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders;
  }
}