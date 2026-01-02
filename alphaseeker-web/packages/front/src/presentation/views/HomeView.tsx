import { useState, useEffect, ChangeEvent } from 'react';
import { Container, Pagination, Box, Typography, Fade } from '@mui/material';
import { NewsItem } from '@alphaseeker/shared';
import { newsService } from '../../infrastructure/services/NewsService';
import { Header } from '../components/Header';
import { NewsFilter, FilterState } from '../components/NewsFilter';
import { NewsCard } from '../components/NewsCard';
import cryptoLoader from '../../assets/Cryptocurrency.gif';

export function HomeView() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState<FilterState>({ title: '', date: '', sentiment: '', action: '' });
    const LIMIT = 10;

    useEffect(() => {
        loadNews();
    }, [page, filters]);

    const loadNews = async () => {
        setLoading(true);
        try {
            // In real world, we would pass filters to the API
            const response = await newsService.getNews(page, LIMIT);
            
            let data = response.data;

            // Client-side filtering
            if (filters.title) {
                data = data.filter(n => n.title.toLowerCase().includes(filters.title.toLowerCase()));
            }
            if (filters.sentiment) {
                data = data.filter(n => n.sentiment === filters.sentiment);
            }
            if (filters.action) {
                // Check both root level action and nested investment_advice action
                data = data.filter(n => {
                    const itemAction = n.action || (n.investment_advice as any)?.action; 
                    return itemAction === filters.action
                });
            }
             // Date filtering would be server side usually
            
            setNews(data);
            setTotal(response.total);
        } catch (error) {
            console.error('Failed to load news', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (newFilters: FilterState) => {
        setFilters(newFilters);
        setPage(1); // Reset to first page on filter change
    };

    const handlePageChange = (_event: ChangeEvent<unknown>, value: number) => {
        setPage(value);
         window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <Box sx={{ 
            minHeight: '100vh', 
            bgcolor: 'background.default',
            backgroundImage: 'radial-gradient(at 0% 0%, hsla(253,16%,17%,0.2) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(225,39%,30%,0.2) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(339,49%,30%,0.2) 0, transparent 50%)' 
        }}>
            <Header />
            
            <Container maxWidth="lg" sx={{ py: 6 }}>
                <Fade in={true} timeout={800}>
                    <Box>
                         <Box sx={{ mb: 4, textAlign: 'center' }}>
                            <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-0.03em', mb: 1, color: 'text.primary' }}>
                                Market Insights
                            </Typography>
                             <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
                                Daily AI-driven investment advice and news analysis.
                            </Typography>
                        </Box>

                        <NewsFilter onFilterChange={handleFilterChange} />

                        <Box sx={{ minHeight: 400 }}>
                            {loading ? (
                                <Box sx={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    height: 400,
                                    // Glassmorphism effect
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    backdropFilter: 'blur(10px)',
                                    borderRadius: 4,
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
                                }}>
                                    {/* Increased size for better visibility of the GIF details */}
                                    <img src={cryptoLoader} alt="Loading..." width="140" height="140" style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.2))' }} />
                                    <Typography variant="body1" sx={{ 
                                        mt: 3, 
                                        color: '#bbb', 
                                        fontWeight: 600, 
                                        letterSpacing: '0.1em',
                                        fontFamily: 'monospace',
                                        textTransform: 'uppercase'
                                    }}>
                                        Analyzing Market Data...
                                    </Typography>
                                </Box>
                            ) : (
                                <>
                                    {news.map((item, index) => (
                                        <NewsCard key={item.id} item={item} delay={index * 0.1} />
                                    ))}
                                    {news.length === 0 && (
                                        <Typography variant="h6" color="text.secondary" align="center" sx={{ mt: 8 }}>
                                            No news found.
                                        </Typography>
                                    )}
                                </>
                            )}
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                            <Pagination 
                                count={Math.ceil(total / LIMIT)} 
                                page={page} 
                                onChange={handlePageChange} 
                                size="large"
                                shape="rounded"
                                color="primary" 
                            />
                        </Box>
                    </Box>
                </Fade>
            </Container>
        </Box>
    );
}
