import { prisma } from "../../config/database";
import { AppError } from "../../utils/error";
import { CreateEventDTO, EventFilterQuery } from "../../types";
import {
  paginate,
  createPaginationMeta,
  isUpcomingEvent,
} from "../../utils/helper";
import { EventStatus } from "../../generated/prisma/enums";

export class EventService {
  async createEvent(data: CreateEventDTO, createdById: string) {
    const { ticketTypes, ...eventData } = data;
    const event = await prisma.event.create({
      data: {
        ...eventData,
        createdById,
        ticketTypes: {
          create: ticketTypes.map((tt) => ({
            name: tt.name,
            description: tt.description ?? null,
            price: tt.price,
            quantity: tt.quantity,
            maxPerOrder: tt.maxPerOrder || 10,
            salesStart: tt.salesStart ?? null,
            salesEnd: tt.salesEnd ?? null,
          })),
        },
      },
      include: {
        ticketTypes: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return event;
  }

  async getEvents(query: EventFilterQuery) {
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "10");
    const { skip, take } = paginate(page, limit);

    const where: any = {};

    if (query.status) {
      where.status = query.status as EventStatus;
    }

    if (query.city) {
      where.city = {
        contains: query.city,
        mode: "insensitive",
      };
    }

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) {
        where.date.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.date.lte = new Date(query.endDate);
      }
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take,
        include: {
          ticketTypes: {
            select: {
              id: true,
              name: true,
              price: true,
              quantity: true,
              sold: true,
              isActive: true,
            },
          },
          _count: {
            select: {
              orders: true,
            },
          },
        },
        orderBy: { date: "asc" },
      }),
      prisma.event.count({ where }),
    ]);

    return {
      events,
      pagination: createPaginationMeta(total, page, limit),
    };
  }

  async getEventById(id: string) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        ticketTypes: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!event) {
      throw new AppError("Event not found", 404);
    }

    return event;
  }

  // ADMIN ROLES
  async updateEvent(id: string, data: Partial<CreateEventDTO>) {
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new AppError("Event not found", 404);
    }

    const { ticketTypes, ...eventData } = data;

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: eventData,
      include: {
        ticketTypes: true,
      },
    });

    return updatedEvent;
  }

  async deleteEvent(id: string) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        orders: true,
      },
    });

    if (!event) {
      throw new AppError("Event not found", 404);
    }

    if (event.orders.length > 0) {
      throw new AppError("Cannot delete event with existing orders", 400);
    }

    await prisma.event.delete({
      where: { id },
    });

    return { message: "Event deleted successfully" };
  }

  async publishEvent(id: string) {
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new AppError("Event not found", 404);
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: { status: "PUBLISHED" },
    });

    return updatedEvent;
  }

  async cancelEvent(id: string) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        orders: {
          where: {
            status: {
              notIn: ["CANCELLED", "REFUNDED"],
            },
          },
        },
      },
    });

    if (!event) {
      throw new AppError("Event not found", 404);
    }

    await prisma.$transaction([
      prisma.event.update({
        where: { id },
        data: { status: "CANCELLED" },
      }),
      prisma.order.updateMany({
        where: {
          eventId: id,
          status: {
            notIn: ["CANCELLED", "REFUNDED"],
          },
        },
        data: {
          status: "CANCELLED",
          paymentStatus: "REFUNDED",
        },
      }),
      prisma.ticket.updateMany({
        where: {
          order: {
            eventId: id,
          },
        },
        data: {
          status: "CANCELLED",
        },
      }),
    ]);

    return { message: "Event cancelled and orders refunded" };
  }

  async getEventStats(id: string) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        ticketTypes: true,
        orders: {
          where: {
            status: {
              notIn: ["CANCELLED", "REFUNDED"],
            },
          },
        },
      },
    });

    if (!event) {
      throw new AppError("Event not found", 404);
    }

    const totalTicketsSold = event.ticketTypes.reduce(
      (sum, tt) => sum + tt.sold,
      0,
    );

    const totalRevenue = event.orders.reduce(
      (sum, order) => sum + parseFloat(order.total.toString()),
      0,
    );

    const ticketTypeStats = event.ticketTypes.map((tt) => ({
      name: tt.name,
      quantity: tt.quantity,
      sold: tt.sold,
      remaining: tt.quantity - tt.sold,
      revenue: tt.sold * parseFloat(tt.price.toString()),
    }));

    return {
      totalTicketsSold,
      totalRevenue,
      totalSeats: event.totalSeats,
      occupancyRate: (totalTicketsSold / event.totalSeats) * 100,
      ticketTypes: ticketTypeStats,
    };
  }

  async addTicketType(eventId: string, data: any) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new AppError("Event not found", 404);
    }

    const ticketType = await prisma.ticketType.create({
      data: {
        ...data,
        eventId,
      },
    });

    return ticketType;
  }

  async updateTicketType(id: string, data: any) {
    const ticketType = await prisma.ticketType.update({
      where: { id },
      data,
    });

    return ticketType;
  }

  async deleteTicketType(id: string) {
    const ticketType = await prisma.ticketType.findUnique({
      where: { id },
      include: {
        tickets: true,
      },
    });

    if (!ticketType) {
      throw new AppError("Ticket type not found", 404);
    }

    if (ticketType.tickets.length > 0) {
      throw new AppError("Cannot delete ticket type with sold tickets", 400);
    }

    await prisma.ticketType.delete({
      where: { id },
    });

    return { message: "Ticket type deleted successfully" };
  }
}
