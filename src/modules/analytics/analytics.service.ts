import { prisma } from "../../config/database";
import { AnalyticsDateRange } from "../../types";


export class AnalyticsService {
  async getSalesMetrics(dateRange?: AnalyticsDateRange) {
    const where: any = {
      status: {
        notIn: ['CANCELLED', 'REFUNDED'],
      },
      paymentStatus: 'COMPLETED',
    };

    if (dateRange) {
      where.createdAt = {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      };
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        tickets: true,
        orderItems: true,
      },
    });

    const totalRevenue = orders.reduce(
      (sum, order) => sum + parseFloat(order.total.toString()),
      0
    );

    const totalOrders = orders.length;

    const totalTicketsSold = orders.reduce(
      (sum, order) => sum + order.tickets.length,
      0
    );

    const totalMerchSold = orders.reduce(
      (sum, order) =>
        sum +
        order.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    );

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      totalRevenue,
      totalOrders,
      totalTicketsSold,
      totalMerchSold,
      averageOrderValue,
    };
  }

  async getTopProducts(limit: number = 10, dateRange?: AnalyticsDateRange) {
    const where: any = {
      order: {
        status: {
          notIn: ['CANCELLED', 'REFUNDED'],
        },
        paymentStatus: 'COMPLETED',
      },
    };

    if (dateRange) {
      where.order.createdAt = {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      };
    }

    const orderItems = await prisma.orderItem.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const productMap = new Map<
      string,
      { name: string; totalSold: number; revenue: number }
    >();

    orderItems.forEach((item) => {
      const existing = productMap.get(item.productId);
      const revenue = parseFloat(item.totalPrice.toString());

      if (existing) {
        existing.totalSold += item.quantity;
        existing.revenue += revenue;
      } else {
        productMap.set(item.productId, {
          name: item.product.name,
          totalSold: item.quantity,
          revenue,
        });
      }
    });

    return Array.from(productMap.entries())
      .map(([productId, data]) => ({
        productId,
        productName: data.name,
        totalSold: data.totalSold,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  async getTopEvents(limit: number = 10, dateRange?: AnalyticsDateRange) {
    const where: any = {
      status: {
        notIn: ['CANCELLED', 'REFUNDED'],
      },
      paymentStatus: 'COMPLETED',
      eventId: {
        not: null,
      },
    };

    if (dateRange) {
      where.createdAt = {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      };
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
        tickets: true,
      },
    });

    const eventMap = new Map<
      string,
      { title: string; ticketsSold: number; revenue: number }
    >();

    orders.forEach((order) => {
      if (!order.event) return;

      const existing = eventMap.get(order.eventId!);
      const revenue = parseFloat(order.total.toString());

      if (existing) {
        existing.ticketsSold += order.tickets.length;
        existing.revenue += revenue;
      } else {
        eventMap.set(order.eventId!, {
          title: order.event.title,
          ticketsSold: order.tickets.length,
          revenue,
        });
      }
    });

    return Array.from(eventMap.entries())
      .map(([eventId, data]) => ({
        eventId,
        eventTitle: data.title,
        ticketsSold: data.ticketsSold,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  async getRevenueByMonth(year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const orders = await prisma.order.findMany({
      where: {
        status: {
          notIn: ['CANCELLED', 'REFUNDED'],
        },
        paymentStatus: 'COMPLETED',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        total: true,
        createdAt: true,
      },
    });

    const monthlyRevenue = new Array(12).fill(0);

    orders.forEach((order) => {
      const month = order.createdAt.getMonth();
      monthlyRevenue[month] += parseFloat(order.total.toString());
    });

    return monthlyRevenue.map((revenue, index) => ({
      month: index + 1,
      revenue,
    }));
  }

  async getCustomerInsights(dateRange?: AnalyticsDateRange) {
    const where: any = {
      status: {
        notIn: ['CANCELLED', 'REFUNDED'],
      },
      paymentStatus: 'COMPLETED',
    };

    if (dateRange) {
      where.createdAt = {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      };
    }

    const orders = await prisma.order.findMany({
      where,
      select: {
        customerEmail: true,
        total: true,
      },
    });

    const customerMap = new Map<
      string,
      { orderCount: number; totalSpent: number }
    >();

    orders.forEach((order) => {
      const existing = customerMap.get(order.customerEmail);
      const amount = parseFloat(order.total.toString());

      if (existing) {
        existing.orderCount += 1;
        existing.totalSpent += amount;
      } else {
        customerMap.set(order.customerEmail, {
          orderCount: 1,
          totalSpent: amount,
        });
      }
    });

    const totalCustomers = customerMap.size;
    const repeatCustomers = Array.from(customerMap.values()).filter(
      (c) => c.orderCount > 1
    ).length;

    const topCustomers = Array.from(customerMap.entries())
      .map(([email, data]) => ({
        email,
        ...data,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    return {
      totalCustomers,
      repeatCustomers,
      repeatCustomerRate: (repeatCustomers / totalCustomers) * 100,
      topCustomers,
    };
  }

  async getDashboardStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Current month stats
    const currentMonthOrders = await prisma.order.count({
      where: {
        status: {
          notIn: ['CANCELLED', 'REFUNDED'],
        },
        paymentStatus: 'COMPLETED',
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    const currentMonthRevenue = await prisma.order.aggregate({
      where: {
        status: {
          notIn: ['CANCELLED', 'REFUNDED'],
        },
        paymentStatus: 'COMPLETED',
        createdAt: {
          gte: startOfMonth,
        },
      },
      _sum: {
        total: true,
      },
    });

    // Last month stats
    const lastMonthOrders = await prisma.order.count({
      where: {
        status: {
          notIn: ['CANCELLED', 'REFUNDED'],
        },
        paymentStatus: 'COMPLETED',
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
    });

    const lastMonthRevenue = await prisma.order.aggregate({
      where: {
        status: {
          notIn: ['CANCELLED', 'REFUNDED'],
        },
        paymentStatus: 'COMPLETED',
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
      _sum: {
        total: true,
      },
    });

    // Upcoming events
    const upcomingEvents = await prisma.event.count({
      where: {
        status: 'PUBLISHED',
        date: {
          gte: now,
        },
      },
    });

    // Low stock products
    const lowStockProducts = await prisma.product.count({
      where: {
        isActive: true,
        stock: {
          lte: 10,
        },
      },
    });

    const currentRevenue = parseFloat(
      currentMonthRevenue._sum.total?.toString() || '0'
    );
    const lastRevenue = parseFloat(
      lastMonthRevenue._sum.total?.toString() || '0'
    );

    const revenueGrowth =
      lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;

    const ordersGrowth =
      lastMonthOrders > 0
        ? ((currentMonthOrders - lastMonthOrders) / lastMonthOrders) * 100
        : 0;

    return {
      currentMonth: {
        orders: currentMonthOrders,
        revenue: currentRevenue,
      },
      lastMonth: {
        orders: lastMonthOrders,
        revenue: lastRevenue,
      },
      growth: {
        revenue: revenueGrowth,
        orders: ordersGrowth,
      },
      upcomingEvents,
      lowStockProducts,
    };
  }
}