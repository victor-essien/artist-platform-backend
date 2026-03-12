import cloudinary from "../utils/cloudinary";
import { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";
import logger from "../utils/logger";
import { AppError } from "../utils/error";

export class AudioUploadService {
  /**
   * Upload audio file to Cloudinary
   */
  async uploadAudio(
    buffer: Buffer,
    options: {
      songId: string;
      title: string;
      artist: string;
    }
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        resource_type: 'video' as const, // Audio files use 'video' resource type
        folder: `${process.env.CLOUDINARY_FOLDER}/songs`,
        public_id: `song-${options.songId}`,
        // Audio-specific options
        format: 'mp3', // Convert to mp3 for consistency
        audio_codec: 'mp3',
        audio_frequency: 44100,
        
        // Metadata
        context: {
          title: options.title,
          artist: options.artist,
        },
        
        // Transformations for optimization
        transformation: [
          {
            audio_codec: 'mp3',
            bit_rate: '320k', // High quality
          },
        ],
      };

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) {
            logger.error('Cloudinary audio upload error:', error);
            reject(new AppError('Audio upload failed', 500));
          } else if (result) {
            logger.info(`Audio uploaded successfully: ${result.public_id}`);
            resolve(result);
          }
        }
      );

      uploadStream.end(buffer);
    });
  }

  /**
   * Upload song with cover image
   */
  async uploadSongWithCover(
    audioBuffer: Buffer,
    coverBuffer: Buffer | null,
    metadata: {
      songId: string;
      title: string;
      artist: string;
    }
  ): Promise<{ audioUrl: string; coverUrl?: string; duration: number; fileSize: number }> {
    // Upload audio
    const audioResult = await this.uploadAudio(audioBuffer, metadata);

    let coverUrl: string | undefined;

    // Upload cover image if provided
    if (coverBuffer) {
      const coverResult = await cloudinary.uploader.upload_stream(
        {
          folder: `${process.env.CLOUDINARY_FOLDER}/covers`,
          public_id: `cover-${metadata.songId}`,
          transformation: [
            { width: 800, height: 800, crop: 'fill', quality: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            logger.error('Cover image upload failed:', error);
          }
        }
      );

      return new Promise((resolve, reject) => {
        coverResult.on('finish', () => {
          resolve({
            audioUrl: audioResult.secure_url,
            coverUrl: coverUrl!,
            duration: Math.round(audioResult.duration || 0),
            fileSize: audioResult.bytes,
          });
        });

        coverResult.on('error', (error) => {
          // Continue even if cover upload fails
          resolve({
            audioUrl: audioResult.secure_url,
            duration: Math.round(audioResult.duration || 0),
            fileSize: audioResult.bytes,
          });
        });

        coverResult.end(coverBuffer);
      });
    }

    return {
      audioUrl: audioResult.secure_url,
      duration: Math.round(audioResult.duration || 0),
      fileSize: audioResult.bytes,
    };
  }

  /**
   * Generate waveform visualization (optional advanced feature)
   */
  async generateWaveform(audioUrl: string): Promise<string> {
    try {
      // Extract public_id from URL
      const publicId = this.extractPublicId(audioUrl);

      if (!publicId) {
        throw new Error('Invalid audio URL');
      }

      // Generate waveform using Cloudinary's video transformation
      const waveformUrl = cloudinary.url(publicId, {
        resource_type: 'video',
        transformation: [
          { flags: 'waveform', color: '#667eea', background: 'white' },
          { width: 800, crop: 'scale' },
        ],
        format: 'png',
      });

      return waveformUrl;
    } catch (error) {
      logger.error('Waveform generation error:', error);
      throw new AppError('Waveform generation failed', 500);
    }
  }

  /**
   * Delete audio from Cloudinary
   */
  async deleteAudio(audioUrl: string): Promise<void> {
    try {
      const publicId = this.extractPublicId(audioUrl);

      if (!publicId) {
        throw new Error('Invalid audio URL');
      }

      await cloudinary.uploader.destroy(publicId, {
        resource_type: 'video',
      });

      logger.info(`Audio deleted: ${publicId}`);
    } catch (error) {
      logger.error('Audio deletion error:', error);
      throw new AppError('Audio deletion failed', 500);
    }
  }

  /**
   * Delete cover image
   */
  async deleteCover(coverUrl: string): Promise<void> {
    try {
      const publicId = this.extractPublicId(coverUrl);

      if (!publicId) {
        return;
      }

      await cloudinary.uploader.destroy(publicId);
      logger.info(`Cover deleted: ${publicId}`);
    } catch (error) {
      logger.error('Cover deletion error:', error);
    }
  }

  /**
   * Extract public_id from Cloudinary URL
   */
  private extractPublicId(url: string): string | null {
    try {
      const parts = url.split('/');
      const filename = parts[parts.length - 1]!;
      const publicId = filename.split('.')[0]!;

      const folderIndex = parts.indexOf(
        process.env.CLOUDINARY_FOLDER || 'artist-platform'
      );

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
   * Get audio metadata
   */
  async getAudioMetadata(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: 'video',
      });

      return {
        duration: result.duration,
        format: result.format,
        bitRate: result.bit_rate,
        audioCodec: result.audio?.codec,
        audioFrequency: result.audio?.frequency,
        fileSize: result.bytes,
      };
    } catch (error) {
      logger.error('Error fetching audio metadata:', error);
      throw new AppError('Failed to fetch audio metadata', 500);
    }
  }

  /**
   * Create streaming URL with quality options
   */
  generateStreamUrl(
    publicId: string,
    quality: 'low' | 'medium' | 'high' = 'high'
  ): string {
    const qualitySettings = {
      low: { audio_codec: 'mp3', bit_rate: '128k' },
      medium: { audio_codec: 'mp3', bit_rate: '192k' },
      high: { audio_codec: 'mp3', bit_rate: '320k' },
    };

    return cloudinary.url(publicId, {
      resource_type: 'video',
      transformation: [qualitySettings[quality]],
      secure: true,
    });
  }
}

export default new AudioUploadService();