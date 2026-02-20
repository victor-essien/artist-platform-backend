import bcrypt from "bcrypt";
import { prisma } from "../../config/database";
import { generateToken } from "../../utils/jwt";
import { AppError } from "../../utils/error";
import { AdminRole } from "../../generated/prisma/enums";

export class AdminService {
  async register(
    email: string,
    password: string,
    name: string,
    role: AdminRole = "ADMIN",
  ) {
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      throw new AppError("Admin with this email already exists", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    const token = generateToken({
      id: admin.id,
      email: admin.email,
      role: admin.role,
    });
    return { admin, token };
  }

  async login(email: string, password: string) {
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      throw new AppError("Invalid Credentials", 401);
    }

    if (!admin.isActive) {
      throw new AppError("Account is deactivated", 403);
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid Credentials", 401);
    }

    const token = generateToken({
      id: admin.id,
      email: admin.email,
      role: admin.role,
    });

    return {
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
      token,
    };
  }

  async getProfile(adminId: string) {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      throw new AppError("Admin not found", 404);
    }

    return admin;
  }

  async updateProfile(
    adminId: string,
    data: { name?: string; email?: string },
  ) {
    if (data.email) {
      const existing = await prisma.admin.findUnique({
        where: { email: data.email },
      });

      if (existing && existing.id !== adminId) {
        throw new AppError("Email already in use", 400);
      }
    }

    const admin = await prisma.admin.update({
      where: { id: adminId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return admin;
  }

  async changePassword(
    adminId: string,
    oldPassword: string,
    newPassword: string,
  ) {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new AppError("Admin not found", 404);
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, admin.password);

    if (!isPasswordValid) {
      throw new AppError("Current password is incorrect", 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.admin.update({
      where: { id: adminId },
      data: { password: hashedPassword },
    });

    return { message: "Password updated successfully" };
  }

  async getAllAdmins(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [admins, total] = await Promise.all([
      prisma.admin.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.admin.count(),
    ]);

    return {
      admins,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async logActivity(
    adminId: string,
    action: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await prisma.adminActivityLog.create({
      data: {
        adminId,
        action,
        details: details ?? null,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
    });
  }

  async getActivityLogs(adminId: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.adminActivityLog.findMany({
        where: { adminId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.adminActivityLog.count({ where: { adminId } }),
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
