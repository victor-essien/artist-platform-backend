import { Router } from 'express';
import { UploadController } from './upload.controller';
import { authenticate } from '../../middleware/auth';
import { uploadSingle } from '../../utils/upload';
const uploadRouter = Router();
const uploadController = new UploadController();

// All upload routes require authentication
uploadRouter.use(authenticate);

/**
 * @route   POST /api/upload/event-image
 * @desc    Upload event image
 * @access  Private (Admin)
 */
uploadRouter.post(
  '/event-image',
  uploadSingle,
  uploadController.uploadEventImage.bind(uploadController)
);

/**
 * @route   POST /api/upload/product-image
 * @desc    Upload product image
 * @access  Private (Admin)
 */
uploadRouter.post(
  '/product-image',
  uploadSingle,
  uploadController.uploadProductImage.bind(uploadController)
);

/**
 * @route   POST /api/upload/ticket-image
 * @desc    Upload ticket type image
 * @access  Private (Admin)
 */
uploadRouter.post(
  '/ticket-image',
  uploadSingle,
  uploadController.uploadTicketImage.bind(uploadController)
);

/**
 * @route   POST /api/upload/image
 * @desc    Upload general image
 * @access  Private (Admin)
 */
uploadRouter.post(
  '/image',
  uploadSingle,
  uploadController.uploadImage.bind(uploadController)
);

/**
 * @route   DELETE /api/upload/image
 * @desc    Delete image from Cloudinary
 * @access  Private (Admin)
 */
uploadRouter.delete(
  '/image',
  uploadController.deleteImage.bind(uploadController)
);

/**
 * @route   GET /api/upload/image-details
 * @desc    Get image details
 * @access  Private (Admin)
 */
uploadRouter.get(
  '/image-details',
  uploadController.getImageDetails.bind(uploadController)
);

export default uploadRouter;