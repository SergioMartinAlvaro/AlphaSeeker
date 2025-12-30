import React, { useState } from 'react';
import { Box, TextField, InputAdornment, MenuItem, FormControl, InputLabel, Select, SelectChangeEvent } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

export interface FilterState {
    title: string;
    date: string;
    sentiment: string;
    action: string;
}

interface NewsFilterProps {
    onFilterChange: (filters: FilterState) => void;
}

export const NewsFilter: React.FC<NewsFilterProps> = ({ onFilterChange }) => {
    const [filters, setFilters] = useState<FilterState>({
        title: '',
        date: '',
        sentiment: '',
        action: ''
    });

    const handleChange = (field: keyof FilterState, value: string) => {
        const newFilters = { ...filters, [field]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const handleSelectChange = (field: keyof FilterState) => (event: SelectChangeEvent) => {
        handleChange(field, event.target.value as string);
    };

    return (
        <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            mb: 4, 
            flexWrap: 'wrap',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            p: 2,
            borderRadius: 3,
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
        }}>
            <TextField 
                label="Search by Title" 
                variant="outlined" 
                size="small"
                fullWidth
                sx={{ flex: '1 1 300px' }}
                value={filters.title}
                onChange={(e) => handleChange('title', e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    ),
                }}
            />

            <FormControl size="small" sx={{ flex: '1 1 150px', minWidth: 120 }}>
                <InputLabel>Sentiment</InputLabel>
                <Select
                    value={filters.sentiment}
                    label="Sentiment"
                    onChange={handleSelectChange('sentiment')}
                >
                    <MenuItem value=""><em>All</em></MenuItem>
                    <MenuItem value="BULLISH">Bullish</MenuItem>
                    <MenuItem value="BEARISH">Bearish</MenuItem>
                    <MenuItem value="NEUTRAL">Neutral</MenuItem>
                </Select>
            </FormControl>

            <FormControl size="small" sx={{ flex: '1 1 150px', minWidth: 120 }}>
                <InputLabel>Action</InputLabel>
                <Select
                    value={filters.action}
                    label="Action"
                    onChange={handleSelectChange('action')}
                >
                    <MenuItem value=""><em>All</em></MenuItem>
                    <MenuItem value="BUY">Buy</MenuItem>
                    <MenuItem value="SELL">Sell</MenuItem>
                    <MenuItem value="HOLD">Hold</MenuItem>
                </Select>
            </FormControl>

            <TextField 
                type="date"
                variant="outlined" 
                size="small"
                fullWidth
                sx={{ flex: '1 1 150px' }}
                value={filters.date}
                onChange={(e) => handleChange('date', e.target.value)}
                InputLabelProps={{ shrink: true }}
                label="Filter by Date"
            />
        </Box>
    );
};
