import { Response, NextFunction } from "express";
import { AuthRequest } from "../../types";
import { OrderService } from "./order.service";

const orderService = new OrderService();

export class OrderController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const order = await orderService.createOrder(req.body);
      res.status(201).json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await orderService.getOrders(req.query);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const order = await orderService.getOrderById(req.params.id as string);
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  async getByNumber(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const order = await orderService.getOrderByNumber(req.params.orderNumber as string);
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      const order = await orderService.updateOrderStatus(req.params.id as string, status);
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  async processPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { paymentIntentId } = req.body;
      const order = await orderService.processPayment(req.params.id as string, paymentIntentId);
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  async refund(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const order = await orderService.refundOrder(req.params.id as string);
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  async getCustomerOrders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email } = req.params;
      const orders = await orderService.getCustomerOrders(email as string);
      res.json({ success: true, data: orders });
    } catch (error) {
      next(error);
    }
  }
}