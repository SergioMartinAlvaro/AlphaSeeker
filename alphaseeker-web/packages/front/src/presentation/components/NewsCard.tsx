import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardMedia, Typography, Box, Chip, Link, useTheme, useMediaQuery, Button } from '@mui/material';
import { NewsItem } from '@alphaseeker/shared';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import newsPlaceholder from '../../assets/news_placeholder.png';
import { translationService } from '../../infrastructure/services/TranslationService';

interface NewsCardProps {
    item: NewsItem;
    delay: number;
}

export const NewsCard: React.FC<NewsCardProps> = ({ item, delay }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    
    const [displayItem, setDisplayItem] = useState<NewsItem>(item);
    const [translating, setTranslating] = useState(false);

    useEffect(() => {
        if (i18n.language !== 'es') {
            handleTranslation();
        } else {
            setDisplayItem(item);
        }
    }, [i18n.language, item]);

    const handleTranslation = async () => {
        try {
            setTranslating(true);
            const translated = await translationService.translateNewsItem(item, i18n.language);
            setDisplayItem(translated);
        } catch (error) {
            console.error('Translation failed', error);
        } finally {
            setTranslating(false);
        }
    };

    const getAdviceColor = (action: string | undefined) => {
        const safeAction = action?.toUpperCase() || 'HOLD';
        switch (safeAction) {
            case 'BUY': return theme.palette.success.main;
            case 'SELL': return theme.palette.error.main;
            default: return theme.palette.warning.main;
        }
    };

    const getAdviceIcon = (action: string | undefined) => {
        const safeAction = action?.toUpperCase() || 'HOLD';
        switch (safeAction) {
            case 'BUY': return <TrendingUpIcon fontSize="small" sx={{ color: 'white' }} />;
            case 'SELL': return <TrendingDownIcon fontSize="small" sx={{ color: 'white' }} />;
            default: return <RemoveCircleOutlineIcon fontSize="small" sx={{ color: 'white' }} />;
        }
    };

    const action = displayItem.action || (displayItem as any).investment_advice?.action || 'HOLD';
    const risk = displayItem.risk_level || (displayItem as any).investment_advice?.risk_level || 'MEDIUM';
    const sentiment = displayItem.sentiment || 'NEUTRAL';

    // Truncate title
    const displayTitle = displayItem.title.length > 200 ? displayItem.title.substring(0, 200) + '...' : displayItem.title;

    const formatDate = (dateValue: any) => {
        if (!dateValue) return '';
        
        let date: Date;

        if (dateValue instanceof Date) {
            date = dateValue;
        } else if (typeof dateValue === 'object') {
            // Manejar Timestamp de Firestore (seconds/nanoseconds o _seconds/_nanoseconds)
            const seconds = dateValue.seconds ?? dateValue._seconds;
            if (seconds !== undefined) {
                date = new Date(seconds * 1000);
            } else {
                date = new Date(dateValue);
            }
        } else if (typeof dateValue === 'string') {
            // Normalización para strings ISO con microsegundos
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

        try {
            return new Intl.DateTimeFormat(i18n.language, {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);
        } catch (error) {
            return typeof dateValue === 'string' ? dateValue : '';
        }
    };

    const handleCardClick = () => {
        navigate(`/news/${item.id}`);
        window.scrollTo(0, 0);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: delay }}
            whileHover={{ scale: 1.01 }}
            style={{ cursor: 'pointer' }}
            onClick={handleCardClick}
        >
            <Card sx={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                minHeight: 280,
                borderRadius: 4,
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                transition: 'all 0.3s ease',
                mb: 3,
                background: theme.palette.background.paper,
                border: '1px solid rgba(255,255,255,0.1)',
                '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: '0 8px 30px rgba(247, 147, 26, 0.15)'
                }
            }}>
                <CardMedia
                    component="img"
                    sx={{ 
                        width: isMobile ? '100%' : 200, 
                        height: isMobile ? 200 : 'auto',
                        objectFit: 'cover',
                        flexShrink: 0
                    }}
                    image={item.image_url || newsPlaceholder}
                    onError={(e: any) => {
                        e.target.src = newsPlaceholder;
                    }}
                    alt={displayItem.title}
                />

                <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, p: 3 }}>
                    <Box sx={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: 1.5, 
                        mb: 2, 
                        justifyContent: 'flex-start',
                        p: 1.5,
                        bgcolor: 'rgba(255,255,255,0.03)',
                        borderRadius: 2
                    }}>
                        <Chip 
                            icon={getAdviceIcon(action)}
                            label={action}
                            size="small"
                            sx={{ 
                                bgcolor: getAdviceColor(action), 
                                color: 'white',
                                fontWeight: 800,
                                borderRadius: 1.5
                            }} 
                        />
                         {displayItem.category && (
                             <Chip 
                                label={t(`news.categories.${displayItem.category}`)} 
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ fontWeight: 700, borderRadius: 1.5, borderColor: 'primary.main' }}
                            />
                         )}
                        <Chip 
                            label={`${risk} ${t('common.risk')}`} 
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 600, borderRadius: 1.5 }}
                        />
                         <Chip 
                            label={sentiment} 
                            size="small"
                            variant="outlined"
                            color={sentiment === 'BULLISH' ? 'success' : sentiment === 'BEARISH' ? 'error' : 'default'}
                            sx={{ fontWeight: 600, borderRadius: 1.5 }}
                        />
                    </Box>

                    <CardContent sx={{ flex: '1 0 auto', p: '0 !important', opacity: translating ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1, color: 'text.secondary', opacity: 0.8 }}>
                            <AccessTimeIcon sx={{ fontSize: 14 }} />
                            <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                {formatDate(item.published_date)}
                            </Typography>
                        </Box>

                        <Typography variant="h6" component="div" sx={{ mb: 2, fontWeight: 700, lineHeight: 1.3, fontSize: '1.1rem' }}>
                            {displayTitle}
                        </Typography>

                        <Typography variant="body2" sx={{ 
                            fontWeight: 400,
                            color: 'text.secondary',
                            lineHeight: 1.6,
                            mb: 2,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                        }}>
                           {displayItem.content_summary}
                        </Typography>
                    </CardContent>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto', pt: 2, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <Button 
                            startIcon={<InfoOutlinedIcon />}
                            size="small"
                            sx={{ 
                                fontWeight: 700, 
                                textTransform: 'none',
                                color: 'primary.main'
                            }}
                        >
                            {t('common.read_more')}
                        </Button>
                        <Link 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener" 
                            onClick={(e) => e.stopPropagation()}
                            sx={{ 
                                textDecoration: 'none', 
                                fontWeight: 600, 
                                color: 'text.secondary',
                                fontSize: '0.85rem',
                                '&:hover': { color: 'primary.main', textDecoration: 'underline' }
                            }}
                        >
                            {t('common.footer_source')} ↗
                        </Link>
                    </Box>
                </Box>
            </Card>
        </motion.div>
    );
};
