import { NewsItem, PaginatedResponse } from '@alphaseeker/shared';
import { NewsRepository } from '../../domain/models/NewsRepository';

export class InMemoryNewsRepository implements NewsRepository {
    private news: NewsItem[] = [];

    async getAll(limit: number, offset: number): Promise<PaginatedResponse<NewsItem>> {
        const sliced = this.news.slice(offset, offset + limit);
        return {
            data: sliced,
            total: this.news.length,
            page: Math.floor(offset / limit) + 1,
            limit: limit
        };
    }

    async getById(id: string): Promise<NewsItem | null> {
        return this.news.find(n => n.id === id) || null;
    }

    async create(item: NewsItem): Promise<NewsItem> {
        this.news.push(item);
        return item;
    }

    async update(id: string, news: Partial<NewsItem>): Promise<NewsItem | null> {
        const index = this.news.findIndex(n => n.id === id);
        if (index === -1) return null;
        this.news[index] = { ...this.news[index], ...news };
        return this.news[index];
    }

    async delete(id: string): Promise<boolean> {
        const initialLength = this.news.length;
        this.news = this.news.filter(n => n.id !== id);
        return this.news.length !== initialLength;
    }

    async getByDateRange(startDate: Date, endDate: Date): Promise<NewsItem[]> {
        return this.news.filter(n => {
            const date = new Date(n.published_date);
            return date >= startDate && date <= endDate;
        });
    }

    async deleteByDateRange(startDate: Date, endDate: Date): Promise<void> {
        this.news = this.news.filter(n => {
            const date = new Date(n.published_date);
            return date < startDate || date > endDate;
        });
    }

    async deleteOlderThan(date: Date): Promise<void> {
        this.news = this.news.filter(n => new Date(n.published_date) >= date);
    }
}
