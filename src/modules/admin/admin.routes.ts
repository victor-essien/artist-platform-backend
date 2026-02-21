import { Router } from "express";
import { body } from "express-validator";
import { AdminController } from "./admin.controller";
import { authenticate, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validator";

const adminRouter = Router();
const adminController = new AdminController();



adminRouter.post(
  '/register',
  authenticate,
  authorize('SUPER_ADMIN'),
  validate([
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('name').notEmpty(),
  ]),
  adminController.register.bind(adminController)
);

adminRouter.post(
  '/login',
  validate([body('email').isEmail().normalizeEmail(), body('password').notEmpty()]),
  adminController.login.bind(adminController)
);

adminRouter.get('/profile', authenticate, adminController.getProfile.bind(adminController));

adminRouter.put(
  '/profile',
  authenticate,
  validate([
    body('name').optional().notEmpty(),
    body('email').optional().isEmail().normalizeEmail(),
  ]),
  adminController.updateProfile.bind(adminController)
);

adminRouter.put(
  '/change-password',
  authenticate,
  validate([
    body('oldPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }),
  ]),
  adminController.changePassword.bind(adminController)
);

adminRouter.get(
  '/all',
  authenticate,
  authorize('SUPER_ADMIN'),
  adminController.getAllAdmins.bind(adminController)
);

adminRouter.get('/activity-logs', authenticate, adminController.getActivityLogs.bind(adminController));
