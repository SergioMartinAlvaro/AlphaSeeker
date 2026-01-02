import React from 'react';
import { AppBar, Toolbar, Typography, Container, Box } from '@mui/material';
import ShowChartIcon from '@mui/icons-material/ShowChart';

export const Header: React.FC = () => {
    return (
        <AppBar position="static" color="transparent" elevation={0} sx={{ 
            backdropFilter: 'blur(20px)', 
            background: 'rgba(20, 20, 20, 0.8)', // Dark header
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            position: 'sticky',
            top: 0,
            zIndex: 1000
        }}>
            <Container maxWidth="lg">
                <Toolbar disableGutters sx={{ minHeight: '80px !important' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                         <Box sx={{ 
                             bgcolor: 'primary.main', 
                             color: 'white', 
                             p: 1, 
                             borderRadius: 2, 
                             display: 'flex', 
                             boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)'
                         }}>
                            <ShowChartIcon />
                         </Box>
                        <Typography
                            variant="h5"
                            noWrap
                            sx={{
                                mr: 2,
                                display: { xs: 'flex', md: 'flex' },
                                fontWeight: 800,
                                letterSpacing: '-0.02em',
                                color: 'text.primary',
                                textDecoration: 'none',
                            }}
                        >
                            AlphaSeeker
                        </Typography>
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
};
