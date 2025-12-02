import React from 'react';
import {
  Card,
  Stack,
  Typography,
  Box,
  IconButton,
  Chip,
  Avatar
} from '@mui/material';
import {
  Delete as DeleteIcon,
  LocalShipping as ShippingIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import MobileQuantityControl from './MobileQuantityControl';
import { calculatePriceForQuantity } from '../../../../../utils/priceCalculation';

const MobileCartItem = ({ 
  item, 
  onUpdate, 
  onRemove, 
  formatPrice,
  showShipping = true
}) => {
  // Determinar precio unitario y total de forma defensiva
  const quantity = Number(item.quantity || 1);
  const price_tiers = item.price_tiers || item.priceTiers || item.price_tier || [];
  const basePrice = Number(
    item.originalPrice || item.precioOriginal || item.price || item.precio || item.price_at_addition || 0
  );

  // calcularPriceForQuantity maneja ausencia de tramos y devuelve basePrice si no hay tramos
  const unitPrice = calculatePriceForQuantity(quantity, Array.isArray(price_tiers) ? price_tiers : [], basePrice);
  const itemTotal = unitPrice * quantity;
  
  // URL de imagen con fallback
  const imageUrl = item.imageUrl || item.image_url || item.thumbnail_url || '/placeholder-product.png';
  const showOfferDebug = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debugShowOffers') === '1';
  const isOfferedFlag = !!(item.isOffered || item.metadata?.isOffered || item.offer_id || item.offered_price);
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -300 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        elevation={1}
        sx={{
          borderRadius: { xs: 1.5, sm: 2.5 },
          overflow: 'hidden',
          '&:hover': { 
            elevation: 2,
            '& .delete-button': {
              opacity: 1
            }
          },
          border: '1px solid',
          borderColor: 'rgba(0,0,0,0.06)'
        }}
      >
  <Box sx={{ py: { xs: 0.55, sm: 0.9 }, px: { xs: 0.5, sm: 0.9 } }}>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            {/* Imagen producto */}
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: 2,
                overflow: 'hidden',
                flexShrink: 0,
                backgroundColor: 'grey.100',
                border: '1px solid',
                borderColor: 'rgba(0,0,0,0.08)'
              }}
            >
              <Avatar
                src={imageUrl}
                alt={item.name || item.nombre}
                variant="rounded"
                sx={{
                  width: '100%',
                  height: '100%',
                  '& img': {
                    objectFit: 'cover'
                  }
                }}
              >
                {(item.name || item.nombre || 'P').charAt(0).toUpperCase()}
              </Avatar>
            </Box>
            
            {/* Info producto */}
            <Stack flex={1} spacing={1} sx={{ minWidth: 0 }}>
              {/* Nombre producto */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography 
                  variant="body2" 
                  fontWeight={600}
                  sx={{ 
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: 1.3,
                    mb: 0.5,
                    flex: 1,
                    minWidth: 0
                  }}
                >
                  {item.name || item.nombre}
                </Typography>
                {((item.isOffered || item.metadata?.isOffered || item.offer_id || item.offered_price) || showOfferDebug) && (
                  <Typography
                    data-testid="chip-ofertado-text"
                    variant="subtitle2"
                    sx={{
                      color: 'success.main',
                      fontWeight: 800,
                      ml: 0.5,
                      fontSize: '0.95rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      px: 1,
                      py: '3px',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: 'success.main',
                      bgcolor: 'rgba(76, 175, 80, 0.06)'
                    }}
                  >
                    OFERTADO
                  </Typography>
                )}
              </Box>
              
              {/* Precio unitario */}
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: '0.8rem' }}
              >
                {formatPrice(unitPrice)} c/u
              </Typography>
              
              {/* Precio total */}
              <Typography 
                variant="h6" 
                color="primary.main"
                fontWeight={700}
                sx={{ fontSize: '1.1rem' }}
              >
                {formatPrice(itemTotal)}
              </Typography>
              {/* El Chip visual para 'Ofertado' fue removido; se mantiene texto 'OFERTADO' arriba. */}
              
              {/* Info de envío */}
              {showShipping && item.shipping_info && (
                <Chip
                  icon={<ShippingIcon />}
                  label={item.shipping_info}
                  size="small"
                  variant="outlined"
                  color="success"
                  sx={{ 
                    alignSelf: 'flex-start',
                    height: 24,
                    fontSize: '0.7rem'
                  }}
                />
              )}
            </Stack>
            
            {/* Controles derecha */}
            <Stack alignItems="center" spacing={1.5} sx={{ flexShrink: 0 }}>
              {/* Control cantidad */}
              <MobileQuantityControl
                value={item.quantity || 1}
                onChange={(qty) => onUpdate(item.id, qty)}
                min={1}
                max={item.stock || 99}
                size="small"
              />
              
              {/* Botón eliminar */}
              <IconButton
                className="delete-button"
                onClick={() => onRemove(item.id)}
                sx={{ 
                  color: 'error.main',
                  opacity: 0.7,
                  transition: 'opacity 0.2s',
                  width: 36,
                  height: 36,
                  '&:hover': {
                    backgroundColor: 'error.light',
                    color: 'white',
                    opacity: 1
                  }
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>
          
          {/* Stock info */}
          {item.stock && item.stock < 10 && (
            <Box sx={{ mt: 1.5 }}>
              <Typography 
                variant="caption" 
                color="warning.main"
                sx={{ 
                  backgroundColor: 'warning.light',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  fontSize: '0.7rem'
                }}
              >
                ⚠️ Solo quedan {item.stock} unidades
              </Typography>
            </Box>
          )}
        </Box>
      </Card>
    </motion.div>
  );
};

export default MobileCartItem;
