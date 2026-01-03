import React from 'react';
import { 
    Box, 
    TextField, 
    MenuItem, 
    Grid, 
    Button, 
    Typography, 
    IconButton,
    Collapse,
    Tooltip
} from '@mui/material';
import { 
    FilterList as FilterIcon, 
    RestartAlt as ResetIcon,
    ExpandMore as ExpandIcon,
    ExpandLess as ContractIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { NewsFilters } from '@alphaseeker/shared';

interface AdvancedSearchPanelProps {
    filters: NewsFilters;
    onFiltersChange: (filters: NewsFilters) => void;
    onApply: () => void;
    onReset: () => void;
}

export const AdvancedSearchPanel: React.FC<AdvancedSearchPanelProps> = ({ 
    filters, 
    onFiltersChange, 
    onApply, 
    onReset 
}) => {
    const { t } = useTranslation();
    const [expanded, setExpanded] = React.useState(false);

    const handleChange = (field: keyof NewsFilters) => (e: React.ChangeEvent<HTMLInputElement>) => {
        onFiltersChange({ ...filters, [field]: e.target.value });
    };

    return (
        <Box sx={{ 
            mb: 4, 
            p: 3, 
            borderRadius: 4, 
            bgcolor: 'rgba(255,255,255,0.02)', 
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease'
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: expanded ? 3 : 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <FilterIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('common.advanced_search')}</Typography>
                </Box>
                <Box>
                    <Tooltip title={t('common.reset')}>
                        <IconButton onClick={onReset} size="small" sx={{ mr: 1, color: 'text.secondary' }}>
                            <ResetIcon />
                        </IconButton>
                    </Tooltip>
                    <IconButton onClick={() => setExpanded(!expanded)} color="primary">
                        {expanded ? <ContractIcon /> : <ExpandIcon />}
                    </IconButton>
                </Box>
            </Box>

            <Collapse in={expanded}>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    {/* Texto libre */}
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label={t('common.search_title')}
                            value={filters.title || ''}
                            onChange={handleChange('title')}
                            size="small"
                        />
                    </Grid>

                    {/* Sentimiento */}
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            select
                            fullWidth
                            label={t('common.sentiment')}
                            value={filters.sentiment || 'ALL'}
                            onChange={handleChange('sentiment')}
                            size="small"
                        >
                            <MenuItem value="ALL">{t('common.all')}</MenuItem>
                            <MenuItem value="BULLISH">{t('news.sentiment.BULLISH')}</MenuItem>
                            <MenuItem value="NEUTRAL">{t('news.sentiment.NEUTRAL')}</MenuItem>
                            <MenuItem value="BEARISH">{t('news.sentiment.BEARISH')}</MenuItem>
                        </TextField>
                    </Grid>

                    {/* Riesgo */}
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            select
                            fullWidth
                            label={t('common.risk')}
                            value={filters.risk_level || 'ALL'}
                            onChange={handleChange('risk_level')}
                            size="small"
                        >
                            <MenuItem value="ALL">{t('common.all')}</MenuItem>
                            <MenuItem value="LOW">{t('news.risk.LOW')}</MenuItem>
                            <MenuItem value="MEDIUM">{t('news.risk.MEDIUM')}</MenuItem>
                            <MenuItem value="HIGH">{t('news.risk.HIGH')}</MenuItem>
                        </TextField>
                    </Grid>

                    {/* Acción */}
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            select
                            fullWidth
                            label={t('common.action')}
                            value={filters.action || 'ALL'}
                            onChange={handleChange('action')}
                            size="small"
                        >
                            <MenuItem value="ALL">{t('common.all')}</MenuItem>
                            <MenuItem value="BUY">{t('news.action.BUY')}</MenuItem>
                            <MenuItem value="HOLD">{t('news.action.HOLD')}</MenuItem>
                            <MenuItem value="SELL">{t('news.action.SELL')}</MenuItem>
                        </TextField>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', alignItems: 'flex-end' }}>
                        <Button 
                            fullWidth 
                            variant="contained" 
                            onClick={onApply}
                            sx={{ 
                                height: 40,
                                fontWeight: 800,
                                borderRadius: 3,
                                bgcolor: 'primary.main',
                                textTransform: 'none',
                                boxShadow: 'none',
                                border: '1px solid rgba(255,255,255,0.1)',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    bgcolor: 'primary.dark',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                }
                            }}
                        >
                            {t('common.apply_filters')}
                        </Button>
                    </Grid>
                </Grid>
            </Collapse>
        </Box>
    );
};
