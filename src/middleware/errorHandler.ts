import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    logger.error(`${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    
    res.status(err.statusCode).json({
      error: err.message,
      status: err.statusCode,
    });
    return;
  }

  if (err.name === 'PrismaClientKnownRequestError') {
  console.log("Prisma Error Code:", err);
  console.log("Prisma Error Message:", err.message);

  res.status(400).json({
    error: err.message,
    status: 400,
  });
  return;
}
  // Handle Prisma errors
//   if (err.name === 'PrismaClientKnownRequestError') {
//     logger.error(`Database error: ${err.message}`);
//     res.status(400).json({
//       error: 'Database operation failed',
//       status: 400,
//     });
//     return;
//   }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    logger.error(`Validation error: ${err.message}`);
    res.status(400).json({
      error: err.message,
      status: 400,
    });
    return;
  }

  // Default error
  logger.error(`500 - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  logger.error(err.stack);

  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    status: 500,
  });
};

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    error: 'Route not found',
    status: 404,
  });
};