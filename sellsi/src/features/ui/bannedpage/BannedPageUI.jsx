import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button,
  Stack,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Block as BlockIcon, 
  Email as EmailIcon
} from '@mui/icons-material';
import BanInfo from './BanInfo';
import TermsAndConditionsModal from '../TermsAndConditionsModal';

const BannedPageUI = ({ onContactClick, banStatus = null }) => {
  const [openTerms, setOpenTerms] = React.useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper
        elevation={12}
        sx={{
          p: { xs: 3, sm: 4, md: 5 },
          borderRadius: 3,
          textAlign: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          maxWidth: 1350,
          mx: 'auto',
        }}
      >
        {/* Logo de Sellsi */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 3,
          }}
        >
          <img
            src="/logo.svg"
            alt="Sellsi Logo"
            style={{
              height: isMobile ? '60px' : '80px',
              width: 'auto',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))',
            }}
          />
        </Box>

        {/* Icono de bloqueo */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 3,
          }}
        >
          <BlockIcon
            sx={{
              fontSize: { xs: 60, sm: 80 },
              color: '#f44336',
              filter: 'drop-shadow(0 4px 8px rgba(244, 67, 54, 0.3))',
            }}
          />
        </Box>

        {/* Título principal */}
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 'bold',
            color: '#1a1a1a',
            mb: 2,
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
          }}
        >
          Cuenta Suspendida
        </Typography>

        {/* Subtítulo */}
        <Typography
          variant="h6"
          sx={{
            color: '#666',
            mb: 4,
            fontSize: { xs: '1rem', sm: '1.25rem' },
            fontWeight: 500,
          }}
        >
          Tu cuenta ha sido suspendida de Sellsi
        </Typography>

        {/* Información del ban si está disponible */}
        {banStatus && <BanInfo banStatus={banStatus} />}

        {/* Mensaje principal */}
        <Typography
          variant="body1"
          sx={{
            color: '#444',
            mb: 1,
            lineHeight: 1.6,
            fontSize: { xs: '0.9rem', sm: '1rem' },
          }}
        >
          Tu cuenta ha sido temporalmente suspendida debido a una violación de nuestros términos de servicio o políticas de uso.
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: '#444',
            mb: 4,
            lineHeight: 1.6,
            fontSize: { xs: '0.9rem', sm: '1rem' },
          }}
        >
          Si consideras que esta suspensión es un error o deseas obtener más información, por favor contacta a nuestro equipo de soporte.
        </Typography>

        {/* Botón de contacto */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="center"
          alignItems="center"
        >
          <Button
            variant="contained"
            startIcon={<EmailIcon />}
            onClick={onContactClick}
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              px: 4,
              py: 1.5,
              borderRadius: 2,
              fontSize: { xs: '0.9rem', sm: '1rem' },
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
              '&:hover': {
                bgcolor: '#42a5f5',
                boxShadow: '0 12px 32px rgba(102, 126, 234, 0.4)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Contactar Soporte
          </Button>
        </Stack>

        {/* Email directo */}
        <Typography
          variant="body2"
          sx={{
            color: '#888',
            mt: 3,
            fontSize: { xs: '0.8rem', sm: '0.9rem' },
          }}
        >
          {' '}
          <Typography
            component="span"
            sx={{
              color: 'primary.main',
              fontWeight: 600,
              cursor: 'pointer',
              '&:hover': { textDecoration: 'underline' },
            }}
            onClick={onContactClick}
          >
            contacto@sellsi.cl
          </Typography>
        </Typography>

        {/* Información adicional */}
        <Box
          sx={{
            mt: 4,
            pt: 3,
            borderTop: '1px solid rgba(0,0,0,0.1)',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: '#666',
              fontSize: { xs: '0.75rem', sm: '0.85rem' },
              lineHeight: 1.5,
              display: 'inline',
              mr: 1
            }}
          >
            Para más información revisa nuestros
          </Typography>
          <Button
            variant="text"
            onClick={() => setOpenTerms(true)}
            sx={{ color: '#1565C0', textDecoration: 'underline', fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.85rem' }, p: 0, minWidth: 'unset' }}
          >
            Términos y Condiciones
          </Button>
          <TermsAndConditionsModal open={openTerms} onClose={() => setOpenTerms(false)} />
        </Box>
      </Paper>
    </Box>
  );
};

export default BannedPageUI;
