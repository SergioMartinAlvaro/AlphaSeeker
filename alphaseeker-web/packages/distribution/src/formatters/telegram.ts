import { NewsItem } from '@alphaseeker/shared';

export class TelegramFormatter {
    /**
     * Formatea un item de noticia para ser enviado por Telegram usando HTML.
     */
    static formatMessage(item: NewsItem): string {
        const sentimentEmoji = this.getSentimentEmoji(item.sentiment || 'NEUTRAL');
        const title = item.title.toUpperCase();
        const summary = item.content_summary || item.analysis || '';
        const action = item.action || 'HOLD';
        const risk = item.risk_level || 'MEDIUM';
        const newsUrl = `https://alphaseeker-frontend-684822784514.us-central1.run.app/news/${item.id}`;

        return [
            `<b>${sentimentEmoji} ${title}</b>`,
            '',
            summary,
            '',
            `🚀 <b>Análisis de IA:</b> ${action} (${risk} RISK)`,
            '',
            `👇 <i>Lee el análisis detallado y los niveles clave aquí:</i>`,
            newsUrl,
        ].join('\n');
    }

    private static getSentimentEmoji(sentiment: string): string {
        const s = sentiment.toUpperCase();
        if (s.includes('BULLISH') || s === 'POSITIVE') return '🚀';
        if (s.includes('BEARISH') || s === 'NEGATIVE') return '📉';
        return '⚖️';
    }
}
