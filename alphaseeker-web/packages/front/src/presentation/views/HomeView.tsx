import { useState, useEffect, useCallback } from 'react';
import { 
    Container, 
    Typography, 
    Box, 
    Pagination,
    Fade
} from '@mui/material';
import { Header } from '../components/Header';
import { NewsCard } from '../components/NewsCard';
import { AdvancedSearchPanel } from '../components/AdvancedSearchPanel';
import { newsService } from '../../infrastructure/services/NewsService';
import { NewsItem, NewsFilters } from '@alphaseeker/shared';
import { useTranslation } from 'react-i18next';
import cryptoLoader from '../../assets/Cryptocurrency.gif';

const INITIAL_FILTERS: NewsFilters = {
    title: '',
    category: 'ALL',
    asset_class: 'ALL',
    sentiment: 'ALL',
    risk_level: 'ALL',
    action: 'ALL'
};

export function HomeView() {
    const { t } = useTranslation();
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Search & Filters State
    const [filters, setFilters] = useState<NewsFilters>(INITIAL_FILTERS);
    const [appliedFilters, setAppliedFilters] = useState<NewsFilters>(INITIAL_FILTERS);
    
    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const LIMIT = 10;

    const loadNews = useCallback(async () => {
        try {
            setLoading(true);
            const response = await newsService.getNews(page, LIMIT, appliedFilters);
            setNews(response.data);
            setTotalPages(Math.ceil(response.total / LIMIT));
        } catch (error) {
            console.error('Error loading news:', error);
        } finally {
            setLoading(false);
        }
    }, [page, appliedFilters]);

    useEffect(() => {
        loadNews();
    }, [loadNews]);

    const handleApplyFilters = () => {
        setPage(1); // Reset to first page when filtering
        setAppliedFilters(filters);
    };

    const handleResetFilters = () => {
        setFilters(INITIAL_FILTERS);
        setAppliedFilters(INITIAL_FILTERS);
        setPage(1);
    };

    return (
        <Box sx={{ 
            bgcolor: 'background.default', 
            minHeight: '100vh', 
            pb: 8,
            backgroundImage: 'radial-gradient(at 0% 0%, hsla(253,16%,17%,0.2) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(225,39%,30%,0.2) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(339,49%,30%,0.2) 0, transparent 50%)' 
        }}>
            <Header />
            
            <Container maxWidth="lg" sx={{ mt: 6 }}>
                <Fade in={true} timeout={800}>
                    <Box>
                        <Box sx={{ mb: 6, textAlign: 'center' }}>
                            <Typography variant="h2" sx={{ fontWeight: 900, mb: 1, letterSpacing: '-0.04em', color: 'text.primary' }}>
                                AlphaSeeker
                            </Typography>
                            <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 500 }}>
                                {loading ? t('common.loading') : 'AI-Powered Financial Intelligence'}
                            </Typography>
                        </Box>

                        <AdvancedSearchPanel 
                            filters={filters}
                            onFiltersChange={setFilters}
                            onApply={handleApplyFilters}
                            onReset={handleResetFilters}
                        />

                        {loading ? (
                            <Box sx={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                height: 400,
                                background: 'rgba(255, 255, 255, 0.05)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: 4,
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
                            }}>
                                <img src={cryptoLoader} alt="Loading..." width="140" height="140" style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.2))' }} />
                                <Typography variant="body1" sx={{ 
                                    mt: 3, 
                                    color: '#bbb', 
                                    fontWeight: 600, 
                                    letterSpacing: '0.1em',
                                    fontFamily: 'monospace',
                                    textTransform: 'uppercase'
                                }}>
                                    {t('common.loading')}
                                </Typography>
                            </Box>
                        ) : (
                            <>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {news.length > 0 ? (
                                        news.map((item, index) => (
                                            <NewsCard key={item.id} item={item} delay={index * 0.1} />
                                        ))
                                    ) : (
                                        <Box sx={{ textAlign: 'center', py: 10, opacity: 0.5 }}>
                                            <Typography variant="h6">No news found matching your criteria.</Typography>
                                        </Box>
                                    )}
                                </Box>
                                
                                {totalPages > 1 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                                        <Pagination 
                                            count={totalPages} 
                                            page={page} 
                                            onChange={(_, value) => setPage(value)} 
                                            color="primary" 
                                            size="large"
                                        />
                                    </Box>
                                )}
                            </>
                        )}
                    </Box>
                </Fade>
            </Container>
        </Box>
    );
}
