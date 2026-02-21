import { Router } from "express";
import { AnalyticsController } from "./analytics.controller";
import { authenticate } from "../../middleware/auth";

const analyticsRouter = Router();
const analyticsController = new AnalyticsController();

analyticsRouter.get('/dashboard', authenticate, analyticsController.getDashboardStats.bind(analyticsController));
analyticsRouter.get('/sales', authenticate, analyticsController.getSalesMetrics.bind(analyticsController));
analyticsRouter.get('/top-products', authenticate, analyticsController.getTopProducts.bind(analyticsController));
analyticsRouter.get('/top-events', authenticate, analyticsController.getTopEvents.bind(analyticsController));
analyticsRouter.get('/revenue/:year', authenticate, analyticsController.getRevenueByMonth.bind(analyticsController));
analyticsRouter.get('/customers', authenticate, analyticsController.getCustomerInsights.bind(analyticsController));


export default analyticsRouter;