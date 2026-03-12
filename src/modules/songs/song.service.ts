import { prisma } from "../../config/database";
import { AppError } from "../../utils/error";
import audioUploadService from "../../services/audio-upload.service";
import { paginate, createPaginationMeta } from "../../utils/helper";

interface CreateSongDTO {
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  releaseDate?: Date;
  lyrics?: string;
  description?: string;
  tags?: string[];
}

interface SongFilterQuery {
  page?: string;
  limit?: string;
  genre?: string;
  artist?: string;
  isPublished?: string;
  search?: string;
}



export class SongService{

    /**
     * Create a new song
     */
    async createSong(
        data: CreateSongDTO,
        audioBuffer: Buffer,
        coverBuffer: Buffer | null,
        uploadedById: string
    ) {
        try {
      // First create the song record to get ID
      const song = await prisma.song.create({
        data: {
          title: data.title,
          artist: data.artist,
          album: data.album,
          genre: data.genre,
          releaseDate: data.releaseDate,
          lyrics: data.lyrics,
          description: data.description,
          tags: data.tags || [],
          uploadedById,
          // Temporary values, will be updated after upload
          audioUrl: '',
          duration: 0,
          fileSize: 0,
          format: 'mp3',
        },
      });

      try {
        // Upload to Cloudinary
        const uploadResult = await audioUploadService.uploadSongWithCover(
          audioBuffer,
          coverBuffer,
          {
            songId: song.id,
            title: data.title,
            artist: data.artist,
          }
        );

        // Update song with upload details
        const updatedSong = await prisma.song.update({
          where: { id: song.id },
          data: {
            audioUrl: uploadResult.audioUrl,
            coverImageUrl: uploadResult.coverUrl,
            duration: uploadResult.duration,
            fileSize: uploadResult.fileSize,
            format: 'mp3',
          },
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        return updatedSong;
      } catch (uploadError) {
        // If upload fails, delete the song record
        await prisma.song.delete({ where: { id: song.id } });
        throw uploadError;
      }
    } catch (error) {
      throw new AppError('Failed to create song', 500);
    }
    }

 /**
   * Get all songs with filters
   */
  async getSongs(query: SongFilterQuery) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const { skip, take } = paginate(page, limit);

    const where: any = {};

    if (query.genre) {
      where.genre = query.genre;
    }

    if (query.artist) {
      where.artist = {
        contains: query.artist,
        mode: 'insensitive',
      };
    }

    if (query.isPublished) {
      where.isPublished = query.isPublished === 'true';
    }

    if (query.search) {
      where.OR = [
        {
          title: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
        {
          artist: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
        {
          album: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [songs, total] = await Promise.all([
      prisma.song.findMany({
        where,
        skip,
        take,
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              userLikes: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.song.count({ where }),
    ]);

    return {
      songs,
      pagination: createPaginationMeta(total, page, limit),
    };
  }

   /**
   * Get song by ID
   */
  async getSongById(id: string) {
    const song = await prisma.song.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            userLikes: true,
          },
        },
      },
    });

    if (!song) {
      throw new AppError('Song not found', 404);
    }

    return song;
  }

  /**
   * Update song metadata
   */
  async updateSong(id: string, data: Partial<CreateSongDTO>) {
    const song = await prisma.song.findUnique({
      where: { id },
    });

    if (!song) {
      throw new AppError('Song not found', 404);
    }

    const updatedSong = await prisma.song.update({
      where: { id },
      data: {
        title: data.title,
        artist: data.artist,
        album: data.album,
        genre: data.genre,
        releaseDate: data.releaseDate,
        lyrics: data.lyrics,
        description: data.description,
        tags: data.tags,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return updatedSong;
  }

  /**
   * Delete song
   */
  async deleteSong(id: string) {
    const song = await prisma.song.findUnique({
      where: { id },
    });

    if (!song) {
      throw new AppError('Song not found', 404);
    }

    // Delete audio from Cloudinary
    try {
      await audioUploadService.deleteAudio(song.audioUrl);

      if (song.coverImageUrl) {
        await audioUploadService.deleteCover(song.coverImageUrl);
      }
    } catch (error) {
      // Continue even if cloud deletion fails
      console.error('Cloud deletion error:', error);
    }

    // Delete from database
    await prisma.song.delete({
      where: { id },
    });

    return { message: 'Song deleted successfully' };
  }

  /**
   * Publish/Unpublish song
   */
  async togglePublish(id: string) {
  const existingSong = await prisma.song.findUnique({
    where: { id },
    select: { isPublished: true }
  });

  if (!existingSong) {
    throw new Error("Song not found");
  }

  const newStatus = !existingSong.isPublished;

  const song = await prisma.song.update({
    where: { id },
    data: {
      isPublished: newStatus,
      publishedAt: newStatus ? new Date() : null,
    },
  });

  return song;
}
  
  /**
   * Increment play count
   */
  async incrementPlays(id: string) {
    await prisma.song.update({
      where: { id },
      data: {
        plays: { increment: 1 },
      },
    });
  }


  /**
   * Get featured songs
   */
  async getFeaturedSongs(limit: number = 10) {
    const songs = await prisma.song.findMany({
      where: {
        isFeatured: true,
        isPublished: true,
      },
      take: limit,
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { plays: 'desc' },
    });

    return songs;
  }

  /**
   * Get top songs by plays
   */
  async getTopSongs(limit: number = 20) {
    const songs = await prisma.song.findMany({
      where: {
        isPublished: true,
      },
      take: limit,
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { plays: 'desc' },
    });

    return songs;
  }

  /**
   * Get songs by genre
   */
  async getSongsByGenre(genre: string, limit: number = 20) {
    const songs = await prisma.song.findMany({
      where: {
        genre,
        isPublished: true,
      },
      take: limit,
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return songs;
  }


  /**
   * Get song statistics
   */
  async getSongStats(id: string) {
    const song = await prisma.song.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            userLikes: true,
          },
        },
      },
    });

    if (!song) {
      throw new AppError('Song not found', 404);
    }

    return {
      plays: song.plays,
      likes: song.likes,
      downloads: song.downloads,
      duration: song.duration,
      fileSize: song.fileSize,
    };
  }

}

export default new SongService();