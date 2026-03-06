import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../../types";
import paystackService from "./paystack.service";
import { OrderService } from "../orders/order.service";
import { AppError } from "../../utils/error";
import logger from "../../utils/logger";
import crypto from "crypto";
import { prisma } from "../../config/database";

const orderService = new OrderService();

export class PaystackController {
  /**
   * Initialize Paystack payment for an order
   */
  async initializePayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId, currency, callback_url } = req.body;

      if (!orderId) {
        throw new AppError("Order ID is required", 400);
      }

      // Get order details
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          event: {
            select: {
              title: true,
            },
          },
          orderItems: {
            include: {
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!order) {
        throw new AppError("Order not found", 404);
      }

      if (order.paymentStatus === "COMPLETED") {
        throw new AppError("Order already paid", 400);
      }

      // Prepare metadata
      const metadata = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderType: order.orderType,
        customerName: order.customerName,
        custom_fields: [
          {
            display_name: "Order Number",
            variable_name: "order_number",
            value: order.orderNumber,
          },
          {
            display_name: "Customer Name",
            variable_name: "customer_name",
            value: order.customerName,
          },
        ],
      };

      // Add event or product info to metadata
      if (order.event) {
        metadata.custom_fields.push({
          display_name: "Event",
          variable_name: "event",
          value: order.event.title,
        });
      }

      // Initialize payment
      const paymentResponse = await paystackService.initializePayment({
        email: order.customerEmail,
        amount: parseFloat(order.total.toString()),
        reference: `${order.orderNumber}-${Date.now()}`,
        currency: currency || "NGN",
        metadata,
        callback_url:
          callback_url || `${process.env.FRONTEND_URL}/payment/callback`,
      });
      // Store payment reference in database
      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: order.total,
          currency: currency || "NGN",
          paymentMethod: "paystack",
          transactionId: paymentResponse.data.reference,
          status: "PENDING",
          metadata: paymentResponse.data,
        },
      });

      res.status(200).json({
        success: true,
        data: {
          authorization_url: paymentResponse.data.authorization_url,
          access_code: paymentResponse.data.access_code,
          reference: paymentResponse.data.reference,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify Paystack payment
   */
  async verifyPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { reference } = req.params;
      const refference = reference as string;
      if (!reference) {
        throw new AppError("Payment reference is required", 400);
      }

      // Verify payment with Paystack
      const verificationResponse =
        await paystackService.verifyPayment(refference);

      if (!verificationResponse.status) {
        throw new AppError("Payment verification failed", 400);
      }

      const paymentData = verificationResponse.data;

      // Check if payment was successful
      if (paymentData.status !== "success") {
        // Update payment status to failed
        await prisma.payment.updateMany({
          where: { transactionId: refference },
          data: {
            status: "FAILED",
            metadata: paymentData,
          },
        });

        return res.status(400).json({
          success: false,
          message: "Payment was not successful",
          data: {
            status: paymentData.status,
            gateway_response: paymentData.gateway_response,
          },
        });
      }

      // Get order ID from metadata
      const orderId = paymentData.metadata?.orderId;

      if (!orderId) {
        throw new AppError("Order ID not found in payment metadata", 400);
      }

      // Update payment and order status
      await prisma.$transaction([
        // Update payment
        prisma.payment.updateMany({
          where: { transactionId: refference },
          data: {
            status: "COMPLETED",
            metadata: paymentData,
          },
        }),
        // Update order
        prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: "COMPLETED",
            paymentIntentId: refference,
            status: "CONFIRMED",
          },
        }),
      ]);

      // Get updated order
      const order = await orderService.getOrderById(orderId);

      res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        data: {
          payment: {
            reference: paymentData.reference,
            amount: paystackService.convertFromKobo(paymentData.amount),
            currency: paymentData.currency,
            status: paymentData.status,
            paid_at: paymentData.paid_at,
            channel: paymentData.channel,
          },
          order: {
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            paymentStatus: order.paymentStatus,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Webhook handler for Paystack events
   */
  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate webhook signature
      const signature = req.headers["x-paystack-signature"] as string;

      if (!signature) {
        throw new AppError("No signature found", 400);
      }

      const hash = crypto
        .createHmac("sha512", process.env.PAYSTACK_WEBHOOK_SECRET || "")
        .update(JSON.stringify(req.body))
        .digest("hex");

      if (hash !== signature) {
        throw new AppError("Invalid signature", 400);
      }

      const event = req.body;

      logger.info(`Paystack webhook received: ${event.event}`);

      // Handle different event types
      switch (event.event) {
        case "transfer.success":
          await this.handleTransferSuccess(event.data);
          break;

        case "transfer.failed":
          await this.handleTransferFailed(event.data);
          break;

        default:
          logger.info(`Unhandled webhook event: ${event.event}`);
      }

      // Always return 200 to acknowledge receipt
      res.status(200).json({ success: true });
    } catch (error) {
      logger.error("Webhook processing error:", error);
      // Still return 200 to prevent retries
      res.status(200).json({ success: true });
    }
  }

  /**
   * Handle successful transfer (for refunds)
   */
  private async handleTransferSuccess(data: any) {
    logger.info(`Transfer successful: ${data.reference}`);
    // Handle transfer success logic here
  }

  /**
   * Handle failed transfer
   */
  private async handleTransferFailed(data: any) {
    logger.info(`Transfer failed: ${data.reference}`);
    // Handle transfer failure logic here
  }

  /**
   * Get Paystack public key
   */
  async getPublicKey(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        data: {
          publicKey: process.env.PAYSTACK_PUBLIC_KEY,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { reference } = req.params;
      const refference = reference as string;

      const transaction = await paystackService.getTransaction(refference);

      res.status(200).json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List all transactions
   */
  async listTransactions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { perPage, page, customer, status, from, to } = req.query;

      const transactions = await paystackService.listTransactions({
        perPage: perPage ? parseInt(perPage as string) : 50,
        page: page ? parseInt(page as string) : 1,
        customer: customer as string,
        status: status as any,
        from: from as string,
        to: to as string,
      });

      res.status(200).json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      next(error);
    }
  }
}
