import { Router } from 'express';
import { NewsController } from '../controllers/NewsController';
import { NewsService } from '../../application/services/NewsService';
import { FirestoreNewsRepository } from '../../infrastructure/repositories/FirestoreNewsRepository';
import { verifyToken } from '../middleware/authMiddleware';
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Ensure 'uploads' directory exists or assume it does
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage });

const router = Router();

// Dependency Injection ( Switched to Firestore )
const newsRepository = new FirestoreNewsRepository();
const newsService = new NewsService(newsRepository);
const newsController = new NewsController(newsService);

// Routes
/**
 * @swagger
 * /news:
 *   get:
 *     summary: Get paginated news
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', (req, res) => newsController.getNews(req, res));

/**
 * @swagger
 * /news/range:
 *   get:
 *     summary: Get news by date range
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of news
 */
router.get('/range', (req, res) => newsController.getNewsByRange(req, res));

/**
 * @swagger
 * /news/date/{date}:
 *   get:
 *     summary: Get news by specific date
 *     parameters:
 *       - in: path
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of news for a date
 */
router.get('/date/:date', (req, res) => newsController.getNewsByDate(req, res));

/**
 * @swagger
 * /news/{id}:
 *   get:
 *     summary: Get news by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Single news item
 *       404:
 *         description: Not found
 */
router.get('/:id', (req, res) => newsController.getNewsById(req, res));

/**
 * @swagger
 * /news/{id}:
 *   put:
 *     summary: Update a news item
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *            schema:
 *              type: object
 *     responses:
 *       200:
 *         description: Updated news item
 */
router.put('/:id', verifyToken, (req, res) => newsController.updateNews(req, res));

/**
 * @swagger
 * /news:
 *   delete:
 *     summary: Delete news by date or range
 *     parameters:
 *       - in: query
 *         name: date
 *         description: Specific date to delete (YYYY-MM-DD)
 *       - in: query
 *         name: startDate
 *         description: Range start date
 *       - in: query
 *         name: endDate
 *         description: Range end date
 *     responses:
 *       204:
 *         description: Successfully deleted
 */
router.delete('/', verifyToken, (req, res) => newsController.deleteNewsByDate(req, res));

/**
 * @swagger
 * /news/{id}:
 *   delete:
 *     summary: Delete a single news item
 *     responses:
 *       204:
 *         description: Deleted
 */
router.delete('/:id', verifyToken, (req, res) => newsController.deleteNews(req, res));

/**
 * @swagger
 * /news/cleanup/inconclusive:
 *   delete:
 *     summary: Delete news with inconclusive market impact
 *     responses:
 *       200:
 *         description: Deleted count
 */
router.delete('/cleanup/inconclusive', verifyToken, (req, res) => newsController.deleteInconclusive(req, res));

/**
 * @swagger
 * /news/upload:
 *   post:
 *     summary: Upload an image
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image URL
 */
router.post('/upload', verifyToken, upload.single('image'), (req, res) => newsController.uploadImage(req, res));

/**
 * @swagger
 * /news/n8n-webhook:
 *   post:
 *     summary: Webhook for n8n integration
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Received
 */


export default router;
