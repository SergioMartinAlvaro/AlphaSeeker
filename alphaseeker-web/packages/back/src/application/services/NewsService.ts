import { NewsItem, PaginatedResponse, NewsFilters } from '@alphaseeker/shared';
import { NewsRepository } from '../../domain/models/NewsRepository';
import { v4 as uuidv4 } from 'uuid';

export class NewsService {
    constructor(
        private repository: NewsRepository
    ) { }

    async getNewsFeed(page: number = 1, limit: number = 10, filters?: NewsFilters): Promise<PaginatedResponse<NewsItem>> {
        const offset = (page - 1) * limit;
        return this.repository.getAll(limit, offset, filters);
    }

    async getNewsById(id: string): Promise<NewsItem | null> {
        return this.repository.getById(id);
    }

    async getNewsByDateRange(startDate: Date, endDate: Date): Promise<NewsItem[]> {
        return this.repository.getByDateRange(startDate, endDate);
    }

    async updateNews(id: string, partialNews: Partial<NewsItem>): Promise<NewsItem | null> {
        return this.repository.update(id, partialNews);
    }

    async deleteNews(id: string): Promise<boolean> {
        return this.repository.delete(id);
    }

    async deleteNewsByDateRange(startDate: Date, endDate: Date): Promise<void> {
        return this.repository.deleteByDateRange(startDate, endDate);
    }

    async addNews(item: NewsItem): Promise<NewsItem> {
        // Ensure ID
        if (!item.id) item.id = uuidv4();
        return this.repository.create(item);
    }

    async deleteInconclusiveNews(): Promise<number> {
        return this.repository.deleteInconclusive();
    }
}
