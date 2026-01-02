import { NewsItem, PaginatedResponse } from '@alphaseeker/shared';
import { NewsRepository } from '../../domain/models/NewsRepository';
import * as admin from 'firebase-admin';

export class FirestoreNewsRepository implements NewsRepository {
    private collection = admin.firestore().collection('news');

    async getAll(limit: number, offset: number): Promise<PaginatedResponse<NewsItem>> {
        try {
            // FILTER: Only show news with AI analysis (market_impact present)
            // DISTINCT & PAGINATION STRATEGY:
            // Fetch more items than requested to allow for in-memory deduplication
            const bufferMultiplier = 2; // Fetch 2x limit to filter duplicates safely
            const fetchLimit = limit * bufferMultiplier;

            const snapshot = await this.collection
                .where('market_impact', '!=', null)
                .orderBy('published_date', 'desc')
                .limit(fetchLimit)
                .offset(offset)
                .get();

            const rawData = snapshot.docs.map(doc => {
                const docData = doc.data();
                return { id: doc.id, ...docData } as NewsItem;
            });

            // 1. DEDUPLICATE BY TITLE
            const uniqueTitles = new Set();
            const distinctData: NewsItem[] = [];

            for (const item of rawData) {
                if (!uniqueTitles.has(item.title)) {
                    uniqueTitles.add(item.title);
                    distinctData.push(item);
                    if (distinctData.length === limit) break; // Optimization
                }
            }

            // 2. CORRECT TOTAL COUNT (With Filter)
            const countSnapshot = await this.collection
                .where('market_impact', '!=', null)
                .count()
                .get();
            const total = countSnapshot.data().count;

            return {
                data: distinctData,
                total,
                page: Math.floor(offset / limit) + 1,
                limit
            };
        } catch (error) {
            console.error('Error fetching news from Firestore:', error);
            throw error; // Re-throw to be handled by controller
        }
    }

    async getById(id: string): Promise<NewsItem | null> {
        const doc = await this.collection.doc(id).get();
        return doc.exists ? (doc.data() as NewsItem) : null;
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
            .where('published_date', '>=', startDate.toISOString())
            .where('published_date', '<=', endDate.toISOString())
            .orderBy('published_date', 'desc')
            .get();
        return snapshot.docs.map(doc => doc.data() as NewsItem);
    }

    async deleteByDateRange(startDate: Date, endDate: Date): Promise<void> {
        const snapshot = await this.collection
            .where('published_date', '>=', startDate.toISOString())
            .where('published_date', '<=', endDate.toISOString())
            .get();

        const batch = admin.firestore().batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    }

    async deleteOlderThan(date: Date): Promise<void> {
        const snapshot = await this.collection
            .where('published_date', '<', date.toISOString())
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
