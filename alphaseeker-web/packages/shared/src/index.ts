export interface InvestmentAdvice {
    rating: string;
    reasoning: string;
}

export interface NewsItem {
    id: string;
    title: string;
    url: string;
    published_date: string; // ISO String
    content_summary: string;
    content?: string; // New: Raw content preview
    image_url?: string;
    source: string;

    // Rich Analysis Fields
    sentiment?: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | string;
    risk_level?: 'LOW' | 'MEDIUM' | 'HIGH' | string;
    market_impact?: string;
    action?: 'BUY' | 'SELL' | 'HOLD' | string;
    analysis?: string;
    investment_advice?: InvestmentAdvice;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

