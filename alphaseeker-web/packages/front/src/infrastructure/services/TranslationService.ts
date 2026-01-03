import axios from 'axios';

class TranslationService {
    private cache: Map<string, string> = new Map();

    async translateText(text: string, targetLang: string, sourceLang: string = 'es'): Promise<string> {
        if (!text || targetLang === sourceLang) return text;

        const cacheKey = `${targetLang}:${text}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }

        try {
            const response = await axios.get('https://api.mymemory.translated.net/get', {
                params: {
                    q: text,
                    langpair: `${sourceLang}|${targetLang}`
                }
            });

            const translatedText = response.data.responseData.translatedText;
            this.cache.set(cacheKey, translatedText);
            return translatedText;
        } catch (error) {
            console.error('Translation error:', error);
            return text; // Fallback to original text
        }
    }

    // Specialized method to translate a NewsItem partially or fully
    async translateNewsItem(item: any, targetLang: string): Promise<any> {
        if (targetLang === 'es') return item;

        const fieldsToTranslate = ['title', 'content_summary', 'market_impact', 'analysis'];
        const translatedItem = { ...item };

        if (item.investment_advice) {
            translatedItem.investment_advice = { ...item.investment_advice };
            const adviceFields = ['rating', 'reasoning'];
            for (const field of adviceFields) {
                if (item.investment_advice[field]) {
                    translatedItem.investment_advice[field] = await this.translateText(item.investment_advice[field], targetLang);
                }
            }
        }

        for (const field of fieldsToTranslate) {
            if (item[field]) {
                translatedItem[field] = await this.translateText(item[field], targetLang);
            }
        }

        return translatedItem;
    }
}

export const translationService = new TranslationService();
