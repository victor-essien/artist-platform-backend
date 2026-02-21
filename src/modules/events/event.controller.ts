import { Response, NextFunction } from "express";
import { AuthRequest } from "../../types";
import { EventService } from "./event.service";

const eventService = new EventService();


export class EventController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const event = await eventService.createEvent(req.body, req.admin!.id);
      res.status(201).json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await eventService.getEvents(req.query);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const event = await eventService.getEventById(req.params.id as string);
      res.json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const event = await eventService.updateEvent(req.params.id as string, req.body);
      res.json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await eventService.deleteEvent(req.params.id as string);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async publish(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const event = await eventService.publishEvent(req.params.id as string);
      res.json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await eventService.cancelEvent(req.params.id as string);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await eventService.getEventStats(req.params.id as string);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  async addTicketType(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ticketType = await eventService.addTicketType(req.params.id as string, req.body);
      res.status(201).json({ success: true, data: ticketType });
    } catch (error) {
      next(error);
    }
  }

  async updateTicketType(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ticketType = await eventService.updateTicketType(req.params.id as string, req.body);
      res.json({ success: true, data: ticketType });
    } catch (error) {
      next(error);
    }
  }

  async deleteTicketType(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await eventService.deleteTicketType(req.params.id as string);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}