import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Container, 
    Box, 
    Typography, 
    Chip, 
    Divider, 
    IconButton, 
    CircularProgress, 
    Paper,
    Snackbar,
    Alert
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, TrendingUp, Warning, HelpOutline } from '@mui/icons-material';
import { motion, useScroll, useTransform } from 'framer-motion';
import { NewsItem } from '@alphaseeker/shared';
import { newsService } from '../../infrastructure/services/NewsService';
import { Header } from '../components/Header';
import { useTranslation } from 'react-i18next';
import { translationService } from '../../infrastructure/services/TranslationService';
import { useNewsStore } from '../store/useNewsStore';
import newsPlaceholder from '../../assets/news_placeholder.png';

export function NewsDetailView() {
    const { t, i18n } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addHashtag } = useNewsStore();
    
    const [item, setItem] = useState<NewsItem | null>(null);
    const [displayItem, setDisplayItem] = useState<NewsItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [translating, setTranslating] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [selectedTag, setSelectedTag] = useState('');

    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const opacity = useTransform(scrollY, [0, 300], [1, 0]);

    useEffect(() => {
        if (id) {
            loadDetail(id);
        }
    }, [id]);

    useEffect(() => {
        if (item) {
            if (i18n.language !== 'es') {
                handleTranslation();
            } else {
                setDisplayItem(item);
                setTranslating(false);
            }
        }
    }, [i18n.language, item]);

    const loadDetail = async (newsId: string) => {
        try {
            setLoading(true);
            const data = await newsService.getNewsById(newsId);
            setItem(data);
        } catch (error) {
            console.error('Error loading news detail', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTranslation = async () => {
        if (!item) return;
        try {
            setTranslating(true);
            const translated = await translationService.translateNewsItem(item, i18n.language);
            setDisplayItem(translated);
        } catch (error) {
            console.error('Translation failed', error);
            setDisplayItem(item);
        } finally {
            setTranslating(false);
        }
    };

    const handleTagClick = (tag: string) => {
        addHashtag(tag);
        setSelectedTag(tag);
        setSnackbarOpen(true);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
                <CircularProgress color="primary" />
            </Box>
        );
    }

    if (!displayItem) {
        return (
            <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default', minHeight: '100vh' }}>
                <Typography color="error">{t('common.error_loading')}</Typography>
                <IconButton onClick={() => navigate('/')} sx={{ mt: 2 }} color="primary">
                    <ArrowBackIcon />
                </IconButton>
            </Box>
        );
    }

    const getSentimentColor = (sentiment?: string) => {
        switch (sentiment) {
            case 'BULLISH': return '#4caf50';
            case 'BEARISH': return '#f44336';
            default: return '#ff9800';
        }
    };

    const formatDate = (dateValue: any) => {
        if (!dateValue) return '';
        
        let date: Date;

        if (dateValue instanceof Date) {
            date = dateValue;
        } else if (typeof dateValue === 'object') {
            const seconds = dateValue.seconds ?? dateValue._seconds;
            if (seconds !== undefined) {
                date = new Date(seconds * 1000);
            } else {
                date = new Date(dateValue);
            }
        } else if (typeof dateValue === 'string') {
            const normalizedDate = dateValue.includes('.') 
                ? dateValue.split('.')[0] + '.' + dateValue.split('.')[1].substring(0, 3).replace('Z', '') + 'Z'
                : dateValue;
            date = new Date(normalizedDate);
        } else {
            date = new Date(dateValue);
        }

        if (isNaN(date.getTime())) {
            return typeof dateValue === 'string' ? dateValue : '';
        }

        return new Intl.DateTimeFormat(i18n.language, {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(date);
    };

    return (
        <Box sx={{ 
            minHeight: '100vh', 
            bgcolor: 'background.default',
            position: 'relative',
            overflowX: 'hidden'
        }}>
            <Header />

            {/* Parallax Header */}
            <Box sx={{ height: { xs: '50vh', md: '70vh' }, position: 'relative', overflow: 'hidden' }}>
                <motion.div style={{ y: y1, height: '100%', width: '100%' }}>
                    <Box
                        component="img"
                        src={displayItem.image_url || newsPlaceholder}
                        onError={(e: any) => {
                            e.target.src = newsPlaceholder;
                        }}
                        sx={{
                            width: '100%',
                            height: '110%',
                            objectFit: 'cover',
                            filter: 'brightness(0.6)'
                        }}
                    />
                </motion.div>
                
                <Box sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    p: { xs: 3, md: 8 },
                    background: 'linear-gradient(transparent, rgba(10, 11, 12, 1))',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    zIndex: 2
                }}>
                    <motion.div style={{ opacity }}>
                        <IconButton 
                            onClick={() => navigate('/')} 
                            sx={{ mb: 3, bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                            color="inherit"
                        >
                            <ArrowBackIcon />
                        </IconButton>
                        
                        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                             {displayItem.category && (
                                <Chip label={t(`news.categories.${displayItem.category}`)} color="primary" sx={{ fontWeight: 800, borderRadius: 1 }} />
                             )}
                             {displayItem.asset_class && (
                                <Chip label={t(`news.asset_classes.${displayItem.asset_class}`)} variant="outlined" sx={{ borderColor: 'primary.main', color: 'primary.main', fontWeight: 700 }} />
                             )}
                        </Box>

                        <Typography variant="h2" sx={{ 
                            fontWeight: 900, 
                            lineHeight: 1.1, 
                            mb: 2,
                            fontSize: { xs: '2.5rem', md: '4rem' },
                            textShadow: '0 4px 12px rgba(0,0,0,0.5)',
                            opacity: translating ? 0.6 : 1,
                            transition: 'opacity 0.3s'
                        }}>
                            {displayItem.title}
                        </Typography>
                        
                        <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                            {formatDate(displayItem.published_date)} • {displayItem.source || 'AlphaSeeker AI'}
                        </Typography>
                    </motion.div>
                </Box>
            </Box>

            <Container maxWidth="md" sx={{ mt: -4, position: 'relative', zIndex: 10, pb: 10 }}>
                <Paper sx={{ 
                    p: { xs: 3, md: 5 }, 
                    borderRadius: 4, 
                    bgcolor: 'rgba(19, 21, 23, 0.8)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    opacity: translating ? 0.7 : 1,
                    transition: 'opacity 0.3s'
                }}>
                    {translating && (
                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4, p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                            <CircularProgress size={20} />
                            <Typography variant="body2">{t('analysis.translating')}</Typography>
                         </Box>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 6, flexWrap: 'wrap', gap: 2 }}>
                        <Box>
                            <Typography variant="overline" color="text.secondary">{t('common.sentiment')}</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <TrendingUp sx={{ color: getSentimentColor(displayItem.sentiment) }} />
                                <Typography variant="h5" sx={{ fontWeight: 700, color: getSentimentColor(displayItem.sentiment) }}>
                                    {displayItem.sentiment}
                                </Typography>
                            </Box>
                        </Box>

                        <Box>
                            <Typography variant="overline" color="text.secondary">{t('common.risk')}</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <Warning sx={{ color: displayItem.risk_level === 'HIGH' ? '#f44336' : '#ffc107' }} />
                                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                    {displayItem.risk_level}
                                </Typography>
                            </Box>
                        </Box>

                        <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                            <Typography variant="overline" color="text.secondary">{t('common.action')}</Typography>
                            <Typography variant="h4" sx={{ 
                                fontWeight: 900, 
                                color: displayItem.action === 'BUY' ? '#4caf50' : displayItem.action === 'SELL' ? '#f44336' : 'white',
                                mt: 0.5
                            }}>
                                {displayItem.action}
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ mb: 6 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ width: 4, height: 24, bgcolor: 'primary.main', borderRadius: 1 }} />
                            {t('analysis.executive_summary')}
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem', lineHeight: 1.7 }}>
                            {displayItem.content_summary}
                        </Typography>
                    </Box>

                    <Divider sx={{ my: 6, borderColor: 'rgba(255,255,255,0.05)' }} />

                    <Box sx={{ mb: 6 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ width: 4, height: 24, bgcolor: 'primary.main', borderRadius: 1 }} />
                            {t('analysis.impact_analysis')}
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.1rem', lineHeight: 1.7, fontStyle: 'italic' }}>
                            {displayItem.market_impact || displayItem.analysis}
                        </Typography>
                    </Box>

                    {displayItem.investment_advice && (
                        <Box sx={{ 
                            p: 4, 
                            borderRadius: 3, 
                            bgcolor: 'rgba(247, 147, 26, 0.05)', 
                            border: '1px solid rgba(247, 147, 26, 0.2)',
                            mb: 6
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                <HelpOutline color="primary" />
                                <Typography variant="h6" color="primary" sx={{ fontWeight: 800 }}>{t('analysis.investment_recommendation')}</Typography>
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5 }}>
                                {displayItem.investment_advice.rating}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                                {displayItem.investment_advice.reasoning}
                            </Typography>
                        </Box>
                    )}

                    <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.05)' }} />

                    {/* Tags */}
                    <Box sx={{ mt: 4 }}>
                         <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>{t('analysis.relevant_topics')}</Typography>
                         <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                             {displayItem.tags?.map(tag => (
                                 <Typography 
                                    key={tag} 
                                    variant="body2" 
                                    onClick={() => handleTagClick(tag)}
                                    sx={{ 
                                        color: 'primary.main', 
                                        fontWeight: 700,
                                        fontSize: '1rem',
                                        transition: 'all 0.2s',
                                        '&:hover': { 
                                            textDecoration: 'none', 
                                            cursor: 'pointer',
                                            transform: 'scale(1.05)',
                                            color: 'primary.light'
                                        }
                                    }}
                                >
                                     #{tag.startsWith('#') ? tag.slice(1) : tag}
                                 </Typography>
                             ))}
                         </Box>
                    </Box>
                </Paper>
            </Container>

            {/* Notification Snackbar */}
            <Snackbar 
                open={snackbarOpen} 
                autoHideDuration={3000} 
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    onClose={() => setSnackbarOpen(false)} 
                    severity="success" 
                    variant="filled"
                    sx={{ width: '100%', borderRadius: 2, fontWeight: 600 }}
                >
                    {t('common.filter_added', { defaultValue: 'Filtro añadido: ' })}{selectedTag}
                </Alert>
            </Snackbar>
        </Box>
    );
}

