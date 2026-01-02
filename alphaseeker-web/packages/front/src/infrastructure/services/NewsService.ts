import axios from 'axios';
import { NewsItem, PaginatedResponse } from '@alphaseeker/shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export class NewsService {
    async getNews(page: number = 1, limit: number = 10): Promise<PaginatedResponse<NewsItem>> {
        const response = await axios.get<PaginatedResponse<NewsItem>>(`${API_URL}/news`, {
            params: { page, limit }
        });
        return response.data;
    }
}

export const newsService = new NewsService();
