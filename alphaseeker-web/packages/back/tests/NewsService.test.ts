import { NewsService } from '../src/application/services/NewsService';
import { InMemoryNewsRepository } from '../src/infrastructure/repositories/InMemoryNewsRepository';
import { NewsItem } from '@alphaseeker/shared';

describe('NewsService', () => {
    let service: NewsService;
    let repository: InMemoryNewsRepository;

    beforeEach(() => {
        repository = new InMemoryNewsRepository();
        service = new NewsService(repository);
    });

    it('should return news feed', async () => {
        const item: NewsItem = {
            id: '1',
            title: 'Test News',
            url: 'http://test.com',
            published_date: new Date().toISOString(),
            content_summary: 'Test summary',
            source: 'Test',
            investment_advice: {
                action: 'BUY',
                risk_level: 'LOW',
                reasoning: 'Good'
            }
        };

        await repository.create(item);

        const result = await service.getNewsFeed(1, 10);
        expect(result.data).toHaveLength(1);
        expect(result.data[0].title).toBe('Test News');
    });
});
