import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import { AdminService } from './admin.service';
const adminService = new AdminService();

export class AdminController {
  async register(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, password, name, role } = req.body;
      const result = await adminService.register(email, password, name, role);

      // Log activity
      if (req.admin) {
        await adminService.logActivity(
          req.admin.id,
          'ADMIN_CREATED',
          { newAdminEmail: email },
          req.ip,
          req.get('user-agent')
        );
      }

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await adminService.login(email, password);

      // Log activity
      await adminService.logActivity(
        result.admin.id,
        'LOGIN',
        undefined,
        req.ip,
        req.get('user-agent')
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const admin = await adminService.getProfile(req.admin!.id);

      res.json({
        success: true,
        data: admin,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, email } = req.body;
      const admin = await adminService.updateProfile(req.admin!.id, {
        name,
        email,
      });

      await adminService.logActivity(
        req.admin!.id,
        'PROFILE_UPDATED',
        undefined,
        req.ip,
        req.get('user-agent')
      );

      res.json({
        success: true,
        data: admin,
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { oldPassword, newPassword } = req.body;
      const result = await adminService.changePassword(
        req.admin!.id,
        oldPassword,
        newPassword
      );

      await adminService.logActivity(
        req.admin!.id,
        'PASSWORD_CHANGED',
        undefined,
        req.ip,
        req.get('user-agent')
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllAdmins(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await adminService.getAllAdmins(page, limit);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getActivityLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await adminService.getActivityLogs(
        req.admin!.id,
        page,
        limit
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}