import React from 'react'
import { Box, Typography, IconButton, useMediaQuery } from '@mui/material'
import LinkedInIcon from '@mui/icons-material/LinkedIn'
import InstagramIcon from '@mui/icons-material/Instagram'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import { useTheme } from '@mui/material/styles'

const BottomBar = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.bars.main,
        width: '100vw',
        px: 2,
        py: 2,
        display: 'flex',
        justifyContent: 'center',
        overflowX: 'hidden',
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: '1200px',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          color: '#fff',
        }}
      >
        {/* Logo + texto */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <img src="/logo.svg" alt="SELLSI Logo" style={{ height: 28 }} />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Marketplace que conecta
          </Typography>
        </Box>

        {/* Íconos redes sociales */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton href="#" sx={{ color: '#fff' }} aria-label="LinkedIn">
            <LinkedInIcon />
          </IconButton>
          <IconButton href="#" sx={{ color: '#fff' }} aria-label="Instagram">
            <InstagramIcon />
          </IconButton>
          <IconButton href="#" sx={{ color: '#fff' }} aria-label="WhatsApp">
            <WhatsAppIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  )
}

export default BottomBar
