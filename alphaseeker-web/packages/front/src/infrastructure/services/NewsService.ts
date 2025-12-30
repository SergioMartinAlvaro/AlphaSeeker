import axios from 'axios';
import { NewsItem, PaginatedResponse } from '@alphaseeker/shared';

const API_URL = import.meta.env.PROD
    ? 'https://alphaseeker-back-684822784514.us-central1.run.app/api'
    : 'http://localhost:3000/api';

export class NewsService {
    async getNews(page: number = 1, limit: number = 10): Promise<PaginatedResponse<NewsItem>> {
        const response = await axios.get<PaginatedResponse<NewsItem>>(`${API_URL}/news`, {
            params: { page, limit }
        });
        return response.data;
    }
}

export const newsService = new NewsService();
