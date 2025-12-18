import React from 'react';
import {
  Card,
  CardActionArea,
  Box,
  Stack,
  Typography,
  Collapse,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  LocalShipping as ShippingIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';

const PriceRow = ({ 
  label, 
  value, 
  formatPrice, 
  isFree = false, 
  isTotal = false,
  icon = null 
}) => (
  <Stack direction="row" justifyContent="space-between" alignItems="center">
    <Stack direction="row" alignItems="center" spacing={0.5}>
      {icon}
      <Typography 
        variant={isTotal ? "subtitle1" : "body2"}
        fontWeight={isTotal ? 600 : 400}
        color={isTotal ? "text.primary" : "text.secondary"}
      >
        {label}
      </Typography>
    </Stack>
    
    <Typography 
      variant={isTotal ? "h6" : "body2"}
      fontWeight={isTotal ? 700 : 500}
      color={isFree ? "success.main" : (isTotal ? "primary.main" : "text.primary")}
    >
      {isFree ? "¡GRATIS!" : formatPrice(value)}
    </Typography>
  </Stack>
);

const CollapsibleSummary = ({ 
  calculations, 
  expanded, 
  onToggle, 
  formatPrice,
  itemCount = 0 
}) => {
  return (
    <Card 
      elevation={2}
      sx={{
        borderRadius: { xs: 1.5, sm: 2.5 },
        border: 'none',
        overflow: 'hidden',
        // quitar sombra/borde perceptible en mobile
        boxShadow: { xs: 'none', sm: undefined }
      }}
    >
      {/* Header colapsable */}
      <CardActionArea onClick={onToggle} disableRipple sx={{
        // ocultar el highlight que deja un borde al hacer focus/tap
        '& .MuiCardActionArea-focusHighlight': { display: 'none' }
      }}>
        <Box sx={{ py: { xs: 0.75, sm: 0.9 }, px: { xs: 0.35, sm: 0.9 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            {/* Info izquierda */}
            <Stack>
              <Typography variant="subtitle1" fontWeight={600}>
                Resumen del pedido
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
              </Typography>
            </Stack>
            
            {/* Info derecha */}
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="h6" fontWeight={700} color="primary.main">
                {formatPrice(calculations.total || 0)}
              </Typography>
              <ExpandMoreIcon 
                sx={{ 
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease',
                  color: 'text.secondary'
                }}
              />
            </Stack>
          </Stack>
        </Box>
      </CardActionArea>
      
      {/* Contenido expandible */}
      <Collapse in={expanded}>
  <Box sx={{ px: { xs: 0.5, sm: 0.9 }, pb: { xs: 0.55, sm: 0.95 } }}>
          <Divider sx={{ mb: 2 }} />
          
          <Stack spacing={1.5}>
            {/* Subtotal */}
            <PriceRow 
              label="Subtotal"
              value={calculations.subtotal || 0}
              formatPrice={formatPrice}
              icon={<ReceiptIcon sx={{ fontSize: 16, color: 'text.secondary' }} />}
            />
            
            {/* Envío */}
            <PriceRow 
              label="Envío"
              value={calculations.shipping || 0}
              formatPrice={formatPrice}
              isFree={(calculations.shipping || 0) === 0}
              icon={<ShippingIcon sx={{ fontSize: 16, color: 'text.secondary' }} />}
            />
            
            {/* Descuentos si existen */}
            {calculations.discount > 0 && (
              <PriceRow 
                label="Descuentos"
                value={-Math.abs(calculations.discount)}
                formatPrice={formatPrice}
              />
            )}
            
            <Divider sx={{ my: 1 }} />
            
            {/* Total */}
            <PriceRow 
              label="Total a pagar"
              value={calculations.total || 0}
              formatPrice={formatPrice}
              isTotal
            />
          </Stack>
          
          {/* Mensaje de envío gratis eliminado por petición de UX */}
        </Box>
      </Collapse>
    </Card>
  );
};

export default CollapsibleSummary;
