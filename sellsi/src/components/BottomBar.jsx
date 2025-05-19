import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

const BottomBar = () => {
  return (
    <Box
      sx={{
        backgroundColor: '#2e2e2e',
        color: '#fff',
        width: '100vw',
        px: 0,
        py: 1,
        display: 'flex',
        justifyContent: 'center', // 🧠 centramos el contenedor interno
      }}
    >
      <Box
        sx={{
          width: '100%',
          px: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
                {/* Logo + texto */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <img src="/logo.svg" alt="SELLSI Logo" style={{ height: 28 }} />
          <Typography>
            Marketplace que conecta
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton href="#" color="inherit">
            <LinkedInIcon />
          </IconButton>
          <IconButton href="#" color="inherit">
            <InstagramIcon />
          </IconButton>
          <IconButton href="#" color="inherit">
            <WhatsAppIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default BottomBar;
