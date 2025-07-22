import React from 'react';
import { 
  Box, 
  Typography, 
  Chip,
  Alert
} from '@mui/material';
import { 
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Computer as ComputerIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

/**
 * Componente para mostrar información detallada del ban
 */
const BanInfo = ({ banStatus }) => {
  // Motivos estandarizados (igual que en UserBanModal.jsx)
  const BAN_REASONS = [
    { value: 'contenido_no_deseado', label: 'Spam o contenido no deseado' },
    { value: 'actividad_fraudulenta', label: 'Actividad fraudulenta' },
    { value: 'acoso_conducta_inapropiada', label: 'Acoso o comportamiento inapropiado' },
    { value: 'productos_falsos', label: 'Productos falsos o engañosos' },
    { value: 'violacion_terminos', label: 'Violación de términos de servicio' },
    { value: 'riesgo_seguridad', label: 'Compromiso de seguridad' },
    { value: 'other', label: 'Otra razón' }
  ];
  if (!banStatus?.isBanned) return null;

  const getBanTypeIcon = () => {
    return banStatus.banType === 'user' ? <PersonIcon /> : <ComputerIcon />;
  };

  const getBanTypeText = () => {
    return banStatus.banType === 'user' ? 'Usuario' : 'Dirección IP';
  };

  const getBanTypeColor = () => {
    return banStatus.banType === 'user' ? 'warning' : 'error';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Helper para obtener el label del motivo
  const getReasonLabel = (reasonValue) => {
    const found = BAN_REASONS.find(r => r.value === reasonValue);
    return found ? found.label : reasonValue;
  };

  return (
    <Box sx={{
      mt: 3,
      mb:3,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      maxHeight: 80,
      overflow: 'hidden',
      '& .MuiTypography-root': {
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }
    }}>
      <Alert severity="error" icon={false} sx={{ mb: 2, width: '100%', maxWidth: 500, mx: 'auto' }}>
        {/* No AlertTitle, solo contenido */}
        <Box sx={{ mt: 2 }}>
          {banStatus.bannedAt && (
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
              <Typography variant="body2" sx={{ mb: 1, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScheduleIcon fontSize="small" color="error" />
                <strong>Fecha:</strong> {formatDate(banStatus.bannedAt)}
              </Typography>
            </Box>
          )}
          {banStatus.reason && (
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
              <Typography variant="body2" sx={{ mt: 1, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon fontSize="small" color="error" />
                <strong>Motivo:</strong> {getReasonLabel(banStatus.reason)}
              </Typography>
            </Box>
          )}
        </Box>
      </Alert>
    </Box>
  );
};

export default BanInfo;
