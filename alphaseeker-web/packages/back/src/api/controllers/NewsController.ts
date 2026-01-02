import { Request, Response } from 'express';
import { NewsService } from '../../application/services/NewsService';
import { Storage } from '@google-cloud/storage'; // Assuming installed or will be mocked for now if local URL needed
import path from 'path';

// Mock storage for dev or unimplemented cloud storage
const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME || 'alphaseeker-assets';

export class NewsController {
    constructor(private newsService: NewsService) { }

    async getNews(req: Request, res: Response): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const result = await this.newsService.getNewsFeed(page, limit);
            res.json(result);
        } catch (error) {
            console.error('Error fetching news:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async getNewsById(req: Request, res: Response): Promise<void> {
        try {
            const result = await this.newsService.getNewsById(req.params.id);
            if (!result) {
                res.status(404).json({ error: 'News item not found' });
                return;
            }
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async getNewsByDate(req: Request, res: Response): Promise<void> {
        try {
            const dateStr = req.params.date; // YYYY-MM-DD
            const start = new Date(dateStr);
            const end = new Date(dateStr);
            end.setHours(23, 59, 59, 999);

            const result = await this.newsService.getNewsByDateRange(start, end);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async getNewsByRange(req: Request, res: Response): Promise<void> {
        try {
            const { startDate, endDate } = req.query;
            if (!startDate || !endDate) {
                res.status(400).json({ error: 'startDate and endDate query params are required' });
                return;
            }
            const result = await this.newsService.getNewsByDateRange(new Date(startDate as string), new Date(endDate as string));
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async deleteNews(req: Request, res: Response): Promise<void> {
        try {
            const result = await this.newsService.deleteNews(req.params.id);
            if (!result) {
                res.status(404).json({ error: 'News item not found' });
                return;
            }
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async deleteNewsByDate(req: Request, res: Response): Promise<void> {
        try {
            const { date, startDate, endDate } = req.query;
            let start: Date, end: Date;

            if (date) {
                start = new Date(date as string);
                end = new Date(date as string);
                end.setHours(23, 59, 59, 999);
            } else if (startDate && endDate) {
                start = new Date(startDate as string);
                end = new Date(endDate as string);
            } else {
                res.status(400).json({ error: 'Provide "date" OR "startDate" and "endDate"' });
                return;
            }

            await this.newsService.deleteNewsByDateRange(start, end);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async updateNews(req: Request, res: Response): Promise<void> {
        try {
            const result = await this.newsService.updateNews(req.params.id, req.body);
            if (!result) {
                res.status(404).json({ error: 'News item not found' });
                return;
            }
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async uploadImage(req: Request, res: Response): Promise<void> {
        try {
            if (!req.file) {
                res.status(400).json({ error: 'No image file provided' });
                return;
            }
            // In a real scenario, we upload to GCS here. 
            // For now, we return the path Multer saved it to or a simulated GCS URL.
            // Assuming Multer saves to 'uploads/' locally for dev.
            const imageUrl = `http://localhost:3000/uploads/${req.file.filename}`;

            res.json({ imageUrl });
        } catch (error) {
            console.error('Upload error:', error);
            res.status(500).json({ error: 'Image upload failed' });
        }
    }

    async deleteInconclusive(req: Request, res: Response): Promise<void> {
        try {
            const count = await this.newsService.deleteInconclusiveNews();
            res.json({ message: `Deleted ${count} inconclusive news items` });
        } catch (error) {
            console.error('Error deleting inconclusive news:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}
