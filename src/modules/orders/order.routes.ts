import { Router } from "express";
import { OrderController } from "./order.controller";
import { body } from "express-validator";
import { validate } from "../../middleware/validator";
import { authenticate, authorize } from "../../middleware/auth";

const orderRouter = Router();
const orderController = new OrderController();

orderRouter.post(
  "/",
  validate([
    body("customerEmail").isEmail().normalizeEmail(),
    body("customerName").notEmpty(),
    body("orderType").isIn(["TICKET", "MERCH", "MIXED"]),
    body("paymentMethod").notEmpty(),
  ]),
  orderController.create.bind(orderController),
);

orderRouter.get(
  "/",
  authenticate,
  orderController.getAll.bind(orderController),
);
orderRouter.get(
  "/:id",
  authenticate,
  orderController.getById.bind(orderController),
);
orderRouter.get(
  "/number/:orderNumber",
  orderController.getByNumber.bind(orderController),
);
orderRouter.get(
  "/customer/:email",
  orderController.getCustomerOrders.bind(orderController),
);
orderRouter.patch(
  "/:id/status",
  authenticate,
  orderController.updateStatus.bind(orderController),
);
orderRouter.post(
  "/:id/payment",
  authenticate,
  orderController.processPayment.bind(orderController),
);
orderRouter.post(
  "/:id/refund",
  authenticate,
  orderController.refund.bind(orderController),
);


export default orderRouter;