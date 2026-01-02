import React from 'react';
import { Card, CardContent, CardMedia, Typography, Box, Chip, Link, useTheme, useMediaQuery } from '@mui/material';
import { NewsItem } from '@alphaseeker/shared';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { motion } from 'framer-motion';
import fallbackImage from '../../assets/placeholder.svg';

interface NewsCardProps {
    item: NewsItem;
    delay: number;
}

export const NewsCard: React.FC<NewsCardProps> = ({ item, delay }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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

    const action = item.action || (item as any).investment_advice?.action || 'HOLD';
    const risk = item.risk_level || (item as any).investment_advice?.risk_level || 'MEDIUM';
    const sentiment = item.sentiment || 'NEUTRAL';

    // Truncate title to 200 chars
    const displayTitle = item.title.length > 200 ? item.title.substring(0, 200) + '...' : item.title;

    // Date Formatting
    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        // Check if date is valid
        if (isNaN(date.getTime())) return '';

        try {
            return new Intl.DateTimeFormat('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);
        } catch (error) {
            console.warn('Invalid date format for:', dateString);
            return '';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: delay }}
            whileHover={{ scale: 1.01 }}
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
                background: theme.palette.background.paper, // Use paper theme color
                border: '1px solid rgba(255,255,255,0.1)' // Clearer border for dark mode
            }}>
                {/* Image Section - Secondary */}
                <CardMedia
                    component="img"
                    sx={{ 
                        width: isMobile ? '100%' : 200, 
                        height: isMobile ? 200 : 'auto',
                        objectFit: 'cover',
                        flexShrink: 0 // Prevent shrinking on flex layouts
                    }}
                    image={item.image_url || fallbackImage}
                    alt={item.title}
                    onError={(e: any) => {
                        e.target.onerror = null; 
                        e.target.src = fallbackImage;
                    }}
                />

                {/* Main Content Section */}
                <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, p: 3 }}>
                    
                    {/* 1. INVESTMENT ADVICE HEADER (Center Stage) */}
                    <Box sx={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: 2, 
                        mb: 2, 
                        justifyContent: 'center',
                        p: 2,
                        bgcolor: 'rgba(0,0,0,0.02)',
                        borderRadius: 2
                    }}>
                        <Chip 
                            icon={getAdviceIcon(action)}
                            label={action}
                            sx={{ 
                                bgcolor: getAdviceColor(action), 
                                color: 'white',
                                fontWeight: 800,
                                fontSize: '1rem',
                                px: 1,
                                borderRadius: 2
                            }} 
                        />
                        <Chip 
                            label={`${risk} RISK`} 
                            variant="outlined"
                            sx={{ fontWeight: 600, borderRadius: 2 }}
                        />
                         <Chip 
                            label={sentiment} 
                            variant="outlined"
                            color={sentiment === 'BULLISH' ? 'success' : sentiment === 'BEARISH' ? 'error' : 'default'}
                            sx={{ fontWeight: 600, borderRadius: 2 }}
                        />
                    </Box>


                    {/* 2. CORE CONTENT */}
                    <CardContent sx={{ flex: '1 0 auto', p: '0 !important' }}>
                        
                        {/* Date Display */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1, color: 'text.secondary', opacity: 0.8 }}>
                            <AccessTimeIcon sx={{ fontSize: 16 }} />
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                                {formatDate(item.published_date)}
                            </Typography>
                        </Box>

                        {/* Title (Truncated) */}
                        <Typography variant="h6" component="div" sx={{ mb: 2, fontWeight: 700, lineHeight: 1.3, fontSize: '1.1rem' }}>
                            {displayTitle}
                        </Typography>

                         {/* Full Analysis Text - Prioritize market_impact */}
                        <Typography variant="body1" sx={{ 
                            fontWeight: 400,
                            color: 'text.primary',
                            lineHeight: 1.6,
                            mb: 2
                        }}>
                           💡 <strong>Analysis:</strong> {item.market_impact || item.investment_advice?.reasoning || item.analysis || "No analysis available."}
                        </Typography>

                    </CardContent>

                    {/* 3. FOOTER ACTIONS */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 'auto', pt: 2, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                        <Link 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener" 
                            sx={{ 
                                textDecoration: 'none', 
                                fontWeight: 700, 
                                color: theme.palette.primary.main,
                                fontSize: '0.95rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                '&:hover': { textDecoration: 'underline' }
                            }}
                        >
                            READ FULL ARTICLE <Box component="span" sx={{ fontSize: '1.2rem' }}>→</Box>
                        </Link>
                    </Box>
                </Box>
            </Card>
        </motion.div>
    );
};
