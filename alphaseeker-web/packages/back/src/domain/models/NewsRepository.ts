import { NewsItem, PaginatedResponse } from '@alphaseeker/shared';

export interface NewsRepository {
    getAll(limit: number, offset: number): Promise<PaginatedResponse<NewsItem>>;
    getById(id: string): Promise<NewsItem | null>;
    create(news: NewsItem): Promise<NewsItem>;
    update(id: string, news: Partial<NewsItem>): Promise<NewsItem | null>;
    delete(id: string): Promise<boolean>;
    getByDateRange(startDate: Date, endDate: Date): Promise<NewsItem[]>;
    deleteByDateRange(startDate: Date, endDate: Date): Promise<void>;
    deleteOlderThan(date: Date): Promise<void>;
    deleteInconclusive(): Promise<number>;
}
