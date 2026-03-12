import { Router } from "express";
import { body } from "express-validator";
import { SongController } from "./song.controller";
import { authenticate } from "../../middleware/auth";
import { uploadSongFiles, uploadSingle } from "../../utils/upload";
import { validate } from "../../middleware/validator";


const songRouter = Router();
const songController = new SongController()


/**
 * @route   POST /api/songs/upload
 * @desc    Upload a new song
 * @access  Private (Admin)
 */
songRouter.post(
  '/upload',
  authenticate,
  uploadSongFiles,
  validate([
    body('title').notEmpty().withMessage('Title is required'),
    body('artist').notEmpty().withMessage('Artist is required'),
    body('album').optional().isString(),
    body('genre').optional().isString(),
    body('releaseDate').optional().isISO8601(),
    body('lyrics').optional().isString(),
    body('description').optional().isString(),
  ]),
  songController.uploadSong.bind(songController)
);

/**
 * @route   GET /api/songs
 * @desc    Get all songs
 * @access  Public
 */
songRouter.get('/', songController.getAllSongs.bind(songController));

/**
 * @route   GET /api/songs/featured
 * @desc    Get featured songs
 * @access  Public
 */
songRouter.get('/featured', songController.getFeaturedSongs.bind(songController));

/**
 * @route   GET /api/songs/popular
 * @desc    Get popular songs
 * @access  Public
 */
// songRouter.get('/popular', songController.getPopularSongs.bind(songController));

/**
 * @route   GET /api/songs/latest
 * @desc    Get latest songs
 * @access  Public
 */
// songRouter.get('/latest', songController.getLatestSongs.bind(songController));

/**
 * @route   GET /api/songs/genres
 * @desc    Get all genres
 * @access  Public
 */
// songRouter.get('/genres', songController.getGenres.bind(songController));

/**
 * @route   GET /api/songs/genre/:genre
 * @desc    Get songs by genre
 * @access  Public
 */
songRouter.get('/genre/:genre', songController.getSongsByGenre.bind(songController));

/**
 * @route   GET /api/songs/:id
 * @desc    Get song by ID
 * @access  Public
 */
songRouter.get('/:id', songController.getSongById.bind(songController));

/**
 * @route   PUT /api/songs/:id
 * @desc    Update song metadata
 * @access  Private (Admin)
 */
songRouter.put(
  '/:id',
  authenticate,
  validate([
    body('title').optional().isString(),
    body('artist').optional().isString(),
    body('album').optional().isString(),
    body('genre').optional().isString(),
    body('releaseDate').optional().isISO8601(),
    body('lyrics').optional().isString(),
    body('description').optional().isString(),
  ]),
  songController.updateSong.bind(songController)
);

/**
 * @route   DELETE /api/songs/:id
 * @desc    Delete song
 * @access  Private (Admin)
 */
songRouter.delete('/:id', authenticate, songController.deleteSong.bind(songController));

/**
 * @route   POST /api/songs/:id/publish
 * @desc    Publish/unpublish song
 * @access  Private (Admin)
 */
songRouter.post(
  '/:id/publish',
  authenticate,
  songController.togglePublish.bind(songController)
);

/**
 * @route   POST /api/songs/:id/play
 * @desc    Increment play count
 * @access  Public
 */
songRouter.post('/:id/play', songController.playsong.bind(songController));

/**
 * @route   GET /api/songs/:id/stats
 * @desc    Get song statistics
 * @access  Private (Admin)
 */
songRouter.get('/:id/stats', authenticate, songController.getSongStats.bind(songController));

/**
 * @route   PUT /api/songs/:id/cover
 * @desc    Update cover image
 * @access  Private (Admin)
 */
// songRouter.put(
//   '/:id/cover',
//   authenticate,
//   uploadSingle,
//   songController.updateCover.bind(songController)
// );

export default songRouter;