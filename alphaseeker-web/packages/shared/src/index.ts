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

    // Categorization
    category?: string;
    asset_class?: string;
    tags?: string[];
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

export interface NewsFilters {
    title?: string;
    category?: string;
    asset_class?: string;
    sentiment?: string;
    risk_level?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    tags?: string[];
}

