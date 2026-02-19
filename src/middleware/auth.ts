import { Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { AuthRequest } from "../types";
import { AdminRole } from "../generated/prisma/enums";


export const authenticate = (
    req: AuthRequest,
    res:Response,
    next: NextFunction
): void => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        req.admin = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: "Invalid token" });
    }
}


export const authorize = (...roles: AdminRole[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.admin) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        if (roles.length && !roles.includes(req.admin.role as AdminRole)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
    }
}