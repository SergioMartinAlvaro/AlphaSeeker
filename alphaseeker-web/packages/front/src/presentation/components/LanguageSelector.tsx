import { IconButton, Menu, MenuItem, Tooltip, Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import TranslateIcon from '@mui/icons-material/Translate';
import React, { useState } from 'react';

const languages = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' }
];

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    handleClose();
  };

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  return (
    <Box>
      <Tooltip title="Cambiar Idioma">
        <IconButton
          onClick={handleOpen}
          sx={{ 
            color: 'primary.main',
            bgcolor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
          }}
        >
          <TranslateIcon />
          <Typography variant="caption" sx={{ ml: 1, fontWeight: 700 }}>
            {currentLang.code.toUpperCase()}
          </Typography>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            border: '1px solid rgba(255,255,255,0.1)',
            mt: 1.5,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1.5,
              gap: 2,
              '&:hover': { bgcolor: 'rgba(247, 147, 26, 0.1)' }
            }
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {languages.map((lang) => (
          <MenuItem 
            key={lang.code} 
            onClick={() => changeLanguage(lang.code)}
            selected={i18n.language === lang.code}
          >
            <Typography fontSize="1.2rem">{lang.flag}</Typography>
            <Typography fontWeight={600}>{lang.label}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
