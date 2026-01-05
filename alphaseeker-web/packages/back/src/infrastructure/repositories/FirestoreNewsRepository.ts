import { NewsItem, PaginatedResponse, NewsFilters } from '@alphaseeker/shared';
import { NewsRepository } from '../../domain/models/NewsRepository';
import * as admin from 'firebase-admin';

export class FirestoreNewsRepository implements NewsRepository {
    private collection = admin.firestore().collection('news');

    async getAll(limit: number, offset: number, filters?: NewsFilters): Promise<PaginatedResponse<NewsItem>> {
        try {
            // BASE STRATEGY: 
            // 1. Fetch from Firestore using date ordering (most common)
            // 2. Filter in memory for complex combinations to avoid index hell for the user
            // 3. We fetch more items to compensate for memory filtering

            let query: admin.firestore.Query = this.collection;

            // Apply simple index-friendly filters first
            if (filters) {
                if (filters.category && filters.category !== 'ALL') {
                    query = query.where('category', '==', filters.category);
                }
                if (filters.asset_class && filters.asset_class !== 'ALL') {
                    query = query.where('asset_class', '==', filters.asset_class);
                }
            }

            // Standard order
            const snapshot = await query
                .orderBy('published_date', 'desc')
                .limit(limit * 5) // Fetch a larger window to filter in memory
                .get();

            let rawData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as NewsItem));

            // Filtering in memory for everything else (Scalable for thousands, but index-friendly)
            rawData = rawData.filter(item => {
                // Must have AI analysis
                if (!item.market_impact) return false;

                if (filters) {
                    if (filters.sentiment && filters.sentiment !== 'ALL' && item.sentiment !== filters.sentiment) return false;
                    if (filters.risk_level && filters.risk_level !== 'ALL' && item.risk_level !== filters.risk_level) return false;
                    if (filters.action && filters.action !== 'ALL' && item.action !== filters.action) return false;
                    if (filters.title && !item.title.toLowerCase().includes(filters.title.toLowerCase())) return false;
                    if (filters.startDate && item.published_date < filters.startDate) return false;
                    if (filters.endDate && item.published_date > filters.endDate) return false;

                    // Hashtag filtering
                    if (filters.tags && filters.tags.length > 0) {
                        const normalizedFilters = filters.tags.map(t => t.startsWith('#') ? t.substring(1).toLowerCase() : t.toLowerCase());
                        const itemTags = (item.tags || []).map(t => t.toLowerCase());
                        if (!normalizedFilters.every(tag => itemTags.includes(tag))) return false;
                    }
                }
                return true;
            });

            // 1. DEDUPLICATE BY TITLE
            const uniqueTitles = new Set();
            const distinctData: NewsItem[] = [];

            for (const item of rawData) {
                if (!uniqueTitles.has(item.title)) {
                    uniqueTitles.add(item.title);
                    distinctData.push(item);
                }
            }

            const pageData = distinctData.slice(offset, offset + limit);

            // 2. TOTAL COUNT Logic
            let total = 0;
            const hasComplexFilters = filters && (filters.title || filters.sentiment !== 'ALL' || filters.risk_level !== 'ALL' || filters.action !== 'ALL' || (filters.tags && filters.tags.length > 0));

            if (hasComplexFilters) {
                total = distinctData.length;
            } else {
                const countSnapshot = await query.count().get();
                total = countSnapshot.data().count;
            }

            return {
                data: pageData,
                total: total,
                page: Math.floor(offset / limit) + 1,
                limit
            };
        } catch (error) {
            console.error('Error fetching news from Firestore:', error);
            throw error;
        }
    }

    async getById(id: string): Promise<NewsItem | null> {
        const doc = await this.collection.doc(id).get();
        if (!doc.exists) return null;
        return { ...doc.data(), id: doc.id } as NewsItem;
    }

    async create(item: NewsItem): Promise<NewsItem> {
        await this.collection.doc(item.id).set(item);
        return item;
    }

    async update(id: string, news: Partial<NewsItem>): Promise<NewsItem | null> {
        const docRef = this.collection.doc(id);
        const doc = await docRef.get();
        if (!doc.exists) return null;
        await docRef.update(news);
        const updated = await docRef.get();
        return updated.data() as NewsItem;
    }

    async delete(id: string): Promise<boolean> {
        const doc = await this.collection.doc(id).get();
        if (!doc.exists) return false;
        await this.collection.doc(id).delete();
        return true;
    }

    async getByDateRange(startDate: Date, endDate: Date): Promise<NewsItem[]> {
        const snapshot = await this.collection
            .where('published_date', '>=', startDate)
            .where('published_date', '<=', endDate)
            .orderBy('published_date', 'desc')
            .get();
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as NewsItem));
    }

    async deleteByDateRange(startDate: Date, endDate: Date): Promise<void> {
        const snapshot = await this.collection
            .where('published_date', '>=', startDate)
            .where('published_date', '<=', endDate)
            .get();

        const batch = admin.firestore().batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    }

    async deleteOlderThan(date: Date): Promise<void> {
        const snapshot = await this.collection
            .where('published_date', '<', date)
            .get();

        const batch = admin.firestore().batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    }

    async deleteInconclusive(): Promise<number> {
        const snapshot = await this.collection
            .where('market_impact', '==', 'Análisis no concluyente.')
            .get();

        if (snapshot.empty) return 0;

        const batch = admin.firestore().batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        return snapshot.size;
    }
}

