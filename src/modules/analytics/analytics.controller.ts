import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../../types";
import { AnalyticsService } from "./analytics.service";

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  async getSalesMetrics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      const dateRange = startDate && endDate
        ? { startDate: new Date(startDate as string), endDate: new Date(endDate as string) }
        : undefined;

      const metrics = await analyticsService.getSalesMetrics(dateRange);
      res.json({ success: true, data: metrics });
    } catch (error) {
      next(error);
    }
  }

  async getTopProducts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const { startDate, endDate } = req.query;
      const dateRange = startDate && endDate
        ? { startDate: new Date(startDate as string), endDate: new Date(endDate as string) }
        : undefined;

      const products = await analyticsService.getTopProducts(limit, dateRange);
      res.json({ success: true, data: products });
    } catch (error) {
      next(error);
    }
  }

  async getTopEvents(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const { startDate, endDate } = req.query;
      const dateRange = startDate && endDate
        ? { startDate: new Date(startDate as string), endDate: new Date(endDate as string) }
        : undefined;

      const events = await analyticsService.getTopEvents(limit, dateRange);
      res.json({ success: true, data: events });
    } catch (error) {
      next(error);
    }
  }

  async getRevenueByMonth(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const year = parseInt(req.params.year as string) || new Date().getFullYear();
      const revenue = await analyticsService.getRevenueByMonth(year);
      res.json({ success: true, data: revenue });
    } catch (error) {
      next(error);
    }
  }

  async getCustomerInsights(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      const dateRange = startDate && endDate
        ? { startDate: new Date(startDate as string), endDate: new Date(endDate as string) }
        : undefined;

      const insights = await analyticsService.getCustomerInsights(dateRange);
      res.json({ success: true, data: insights });
    } catch (error) {
      next(error);
    }
  }

  async getDashboardStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await analyticsService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}