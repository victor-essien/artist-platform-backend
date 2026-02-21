import { Router } from "express";
import { body } from "express-validator";
import { EventController } from "./event.controller";
import { authenticate, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validator";

const eventRouter = Router();
const eventController = new EventController();

eventRouter.post(
  "/",
  authenticate,
  validate([
    body("title").notEmpty(),
    body("description").notEmpty(),
    body("venue").notEmpty(),
    body("address").notEmpty(),
    body("city").notEmpty(),
    body("country").notEmpty(),
    body("date").isISO8601(),
    body("startTime").notEmpty(),
    body("totalSeats").isInt({ min: 1 }),
    body("ticketTypes").isArray({ min: 1 }),
  ]),
  eventController.create.bind(eventController),
);

eventRouter.get("/", eventController.getAll.bind(eventController));
eventRouter.get("/:id", eventController.getById.bind(eventController));
eventRouter.put(
  "/:id",
  authenticate,
  eventController.update.bind(eventController),
);
eventRouter.delete(
  "/:id",
  authenticate,
  eventController.delete.bind(eventController),
);
eventRouter.post(
  "/:id/publish",
  authenticate,
  eventController.publish.bind(eventController),
);
eventRouter.post(
  "/:id/cancel",
  authenticate,
  eventController.cancel.bind(eventController),
);
eventRouter.get(
  "/:id/stats",
  authenticate,
  eventController.getStats.bind(eventController),
);
eventRouter.post(
  "/:id/ticket-types",
  authenticate,
  eventController.addTicketType.bind(eventController),
);
eventRouter.put(
  "/ticket-types/:id",
  authenticate,
  eventController.updateTicketType.bind(eventController),
);
eventRouter.delete(
  "/ticket-types/:id",
  authenticate,
  eventController.deleteTicketType.bind(eventController),
);

export default eventRouter;
