import { Response, NextFunction } from "express";
import { AuthRequest } from "../../types";
import songService from "./song.service";
import { AppError } from "../../utils/error";
import { prisma } from "../../config/database";
import { number } from "zod";


export class SongController {
    /**
   * Upload a new song
   */
  async uploadSong(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };


      if (!files || !files['audio']) {
        throw new AppError('Audio file is required', 400);
      }

      const audioFile = Array.isArray(files['audio'])
        ? files['audio'][0]
        : files['audio'];

      const coverFile =
        files['cover'] && Array.isArray(files['cover'])
          ? files['cover'][0]
          : files['cover'] || null;


      // Parse metadata
      const metadata = {
        title: req.body.title,
        artist: req.body.artist,
        album: req.body.album,
        genre: req.body.genre,
        releaseDate: req.body.releaseDate
          ? new Date(req.body.releaseDate)
          : undefined,
        lyrics: req.body.lyrics,
        description: req.body.description,
        tags: req.body.tags ? JSON.parse(req.body.tags) : [],
      };

      // Create filename slug
      const filename = `${metadata.artist}-${metadata.title}`
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 50);
 if (!audioFile){
        throw new AppError('Audio file is required', 400);
 }
      const song = await songService.createSong(
         metadata,
        audioFile.buffer,
        coverFile ? coverFile.buffer : null,
        req.admin!.id
      );

      res.status(201).json({
        success: true,
        message: 'Song uploaded successfully',
        data: song,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all songs
   */
async getAllSongs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const params = {
        page: req.query.page as string ,
        limit: req.query.limit as string,
        genre: req.query.genre as string,
        artist: req.query.artist as string,
        isPublished: req.query.isPublished as string,
        search: req.query.search as string,
      };

      const result = await songService.getSongs(params);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get song by ID
   */
  async getSongById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const reqParams = req.params.id as string;
      const song = await songService.getSongById(reqParams);

      res.status(200).json({
        success: true,
        data: song,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update song metadata
   */
  async updateSong(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = {
        title: req.body.title,
        artist: req.body.artist,
        album: req.body.album,
        genre: req.body.genre,
        releaseDate: req.body.releaseDate
          ? new Date(req.body.releaseDate)
          : undefined,
        lyrics: req.body.lyrics,
        description: req.body.description,
        tags: req.body.tags,
      };
      const reqParams = req.params.id as string;

      const song = await songService.updateSong(reqParams, data);

      res.status(200).json({
        success: true,
        message: 'Song updated successfully',
        data: song,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete song
   */
  async deleteSong(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const reqParams = req.params.id as string;
      const result = await songService.deleteSong(reqParams);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Publish/unpublish song
   */
  async togglePublish(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const reqParams = req.params.id as string
      const song = await songService.togglePublish(reqParams);

      res.status(200).json({
        success: true,
        message: song.isPublished ? 'Song published' : 'Song unpublished',
        data: song,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Increment play count
   */
  async playsong(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const reqParams = req.params.id as string;
      await songService.incrementPlays(reqParams);

      res.status(200).json({
        success: true,
        message: 'Play count incremented',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get featured songs
   */
  async getFeaturedSongs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const songs = await songService.getFeaturedSongs(limit);

      res.status(200).json({
        success: true,
        data: songs,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get popular songs
   */
//   async getPopularSongs(req: AuthRequest, res: Response, next: NextFunction) {
//     try {
//       const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
//       const songs = await songService.getPopularSongs(limit);

//       res.status(200).json({
//         success: true,
//         data: songs,
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

  /**
   * Get latest songs
   */
//   async getLatestSongs(req: AuthRequest, res: Response, next: NextFunction) {
//     try {
//       const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
//       const songs = await songService.getLatestSongs(limit);

//       res.status(200).json({
//         success: true,
//         data: songs,
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

  /**
   * Get songs by genre
   */
  async getSongsByGenre(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { genre } = req.params;
      const genreParams = genre as string;
      const songs = await songService.getSongsByGenre(genreParams);

      res.status(200).json({
        success: true,
        data: songs,
      });
    } catch (error) {
      next(error);
    }
  }

 

  /**
   * Get song statistics
   */
  async getSongStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const reqParams = req.params.id as string;
      const stats = await songService.getSongStats(reqParams);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

 
}