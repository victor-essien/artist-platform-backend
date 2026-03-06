import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import cloudinaryService from '../../services/cloudinary.service';
import { AppError } from '../../middleware/errorHandler';
export class UploadController {
  /**
   * Upload event image
   */
  async uploadEventImage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError('No image file provided', 400);
      }

      const { eventId } = req.body;

      if (!eventId) {
        throw new AppError('Event ID is required', 400);
      }

      const imageUrl = await cloudinaryService.uploadEventImage(
        req.file.buffer,
        eventId
      );

      res.status(200).json({
        success: true,
        data: {
          imageUrl,
          message: 'Event image uploaded successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload product image
   */
  async uploadProductImage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError('No image file provided', 400);
      }

      const { productId } = req.body;

      if (!productId) {
        throw new AppError('Product ID is required', 400);
      }

      const imageUrl = await cloudinaryService.uploadProductImage(
        req.file.buffer,
        productId
      );

      res.status(200).json({
        success: true,
        data: {
          imageUrl,
          message: 'Product image uploaded successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload ticket type image
   */
  async uploadTicketImage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError('No image file provided', 400);
      }

      const { ticketTypeId } = req.body;

      if (!ticketTypeId) {
        throw new AppError('Ticket Type ID is required', 400);
      }

      const imageUrl = await cloudinaryService.uploadTicketImage(
        req.file.buffer,
        ticketTypeId
      );

      res.status(200).json({
        success: true,
        data: {
          imageUrl,
          message: 'Ticket image uploaded successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload general image
   */
  async uploadImage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError('No image file provided', 400);
      }

      const { folder } = req.body;

      const result = await cloudinaryService.uploadImage(req.file.buffer, {
        folder: folder || undefined,
      });

      res.status(200).json({
        success: true,
        data: {
          imageUrl: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          message: 'Image uploaded successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete image
   */
  async deleteImage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { imageUrl } = req.body;

      if (!imageUrl) {
        throw new AppError('Image URL is required', 400);
      }

      const publicId = cloudinaryService.extractPublicId(imageUrl);

      if (!publicId) {
        throw new AppError('Invalid image URL', 400);
      }

      await cloudinaryService.deleteImage(publicId);

      res.status(200).json({
        success: true,
        data: {
          message: 'Image deleted successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get image details
   */
  async getImageDetails(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { imageUrl } = req.query;

      if (!imageUrl || typeof imageUrl !== 'string') {
        throw new AppError('Image URL is required', 400);
      }

      const publicId = cloudinaryService.extractPublicId(imageUrl);

      if (!publicId) {
        throw new AppError('Invalid image URL', 400);
      }

      const details = await cloudinaryService.getImageDetails(publicId);

      res.status(200).json({
        success: true,
        data: details,
      });
    } catch (error) {
      next(error);
    }
  }
}