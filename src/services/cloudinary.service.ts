import cloudinary from '../utils/cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import logger from '../utils/logger';
import { AppError } from '../utils/error';

interface UploadOptions {
  folder?: string;
  transformation?: any[];
  public_id?: string;
}

export class CloudinaryService {
  /**
   * Upload image to Cloudinary from buffer
   */
  async uploadImage(
    buffer: Buffer,
    options: UploadOptions = {}
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        folder: options.folder || process.env.CLOUDINARY_FOLDER || 'artist-platform',
        resource_type: 'image' as const,
        transformation: options.transformation || [],
        public_id: options.public_id!,
      };

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) {
            logger.error('Cloudinary upload error:', error);
            reject(new AppError('Image upload failed', 500));
          } else if (result) {
            logger.info(`Image uploaded successfully: ${result.public_id}`);
            resolve(result);
          }
        }
      );

      uploadStream.end(buffer);
    });
  }

  /**
   * Upload event image with optimizations
   */
  async uploadEventImage(buffer: Buffer, eventId: string): Promise<string> {
    const result = await this.uploadImage(buffer, {
      folder: `${process.env.CLOUDINARY_FOLDER}/events`,
      public_id: `event-${eventId}`,
      transformation: [
        { width: 1200, height: 630, crop: 'fill', quality: 'auto', fetch_format: 'auto' },
        { flags: 'progressive' },
      ],
    });

    return result.secure_url;
  }

  /**
   * Upload product image with optimizations
   */
  async uploadProductImage(buffer: Buffer, productId: string): Promise<string> {
    const result = await this.uploadImage(buffer, {
      folder: `${process.env.CLOUDINARY_FOLDER}/products`,
      public_id: `product-${productId}`,
      transformation: [
        { width: 800, height: 800, crop: 'fill', quality: 'auto', fetch_format: 'auto' },
        { flags: 'progressive' },
      ],
    });

    return result.secure_url;
  }

  /**
   * Upload ticket image (smaller, optimized for mobile)
   */
  async uploadTicketImage(buffer: Buffer, ticketTypeId: string): Promise<string> {
    const result = await this.uploadImage(buffer, {
      folder: `${process.env.CLOUDINARY_FOLDER}/tickets`,
      public_id: `ticket-${ticketTypeId}`,
      transformation: [
        { width: 600, height: 400, crop: 'fill', quality: 'auto', fetch_format: 'auto' },
        { flags: 'progressive' },
      ],
    });

    return result.secure_url;
  }

  /**
   * Delete image from Cloudinary
   */
  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
      logger.info(`Image deleted: ${publicId}`);
    } catch (error) {
      logger.error('Cloudinary delete error:', error);
      throw new AppError('Image deletion failed', 500);
    }
  }

  /**
   * Extract public_id from Cloudinary URL
   */
  extractPublicId(url: string): string | null {
    try {
      const parts = url.split('/');
      const filename = parts[parts.length - 1]!;
      const publicId = filename.split('.')[0]!;
      
      // Find the folder path
      const folderIndex = parts.indexOf(process.env.CLOUDINARY_FOLDER || 'artist-platform');
      if (folderIndex !== -1) {
        const folderPath = parts.slice(folderIndex, parts.length - 1).join('/');
        return `${folderPath}/${publicId}`;
      }
      
      return publicId;
    } catch (error) {
      logger.error('Error extracting public_id:', error);
      return null;
    }
  }

  /**
   * Generate transformation URL for existing image
   */
  generateTransformedUrl(
    publicId: string,
    transformations: any[]
  ): string {
    return cloudinary.url(publicId, {
      transformation: transformations,
      secure: true,
    });
  }

  /**
   * Get image details from Cloudinary
   */
  async getImageDetails(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.api.resource(publicId);
      return result;
    } catch (error) {
      logger.error('Error fetching image details:', error);
      throw new AppError('Failed to fetch image details', 500);
    }
  }
}

export default new CloudinaryService();