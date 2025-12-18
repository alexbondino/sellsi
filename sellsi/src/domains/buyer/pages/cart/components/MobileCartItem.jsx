import React, { useState, useCallback } from 'react';
import {
  Card,
  Stack,
  Typography,
  Box,
  IconButton,
  Chip,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  Delete as DeleteIcon,
  LocalShipping as ShippingIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import MobileQuantityControl from './MobileQuantityControl';
import { calculatePriceForQuantity } from '../../../../../utils/priceCalculation';
import { Modal, MODAL_TYPES } from '../../../../../shared/components/feedback';

const MobileCartItem = ({ 
  item, 
  onUpdate, 
  onRemove, 
  formatPrice,
  showShipping = true
}) => {
  const navigate = useNavigate();
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  // Construir slug SEO a partir del nombre del producto
  const getProductSlug = (name) => {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleViewFichaTecnica = useCallback(() => {
    const id = item.product_id || item.id;
    const slug = getProductSlug(item.name || item.nombre);
    navigate(`/marketplace/product/${id}${slug ? `/${slug}` : ''}`, { state: { from: '/buyer/marketplace' } });
  }, [navigate, item]);

  // Determinar precio unitario y total de forma defensiva
  const quantity = Number(item.quantity || 1);
  const price_tiers = item.price_tiers || item.priceTiers || item.price_tier || [];
  const basePrice = Number(
    // ⚠️ CRÍTICO: Convertir a Number para evitar bypass con valores falsy
    Number(item.originalPrice || item.precioOriginal || item.price || item.precio || item.price_at_addition) || 0
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
              
              {/* Botones en fila horizontal */}
              <Stack direction="row" spacing={1} alignItems="center">
                {/* Botón eliminar - a la izquierda */}
                <Tooltip title="Eliminar del carrito" placement="top">
                  <IconButton
                    className="delete-button"
                    onClick={() => setOpenDeleteModal(true)}
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
                </Tooltip>
                
                {/* Botón Ver Ficha Técnica - a la derecha */}
                <Tooltip title="Ver Ficha Técnica" placement="top">
                  <IconButton
                    onClick={handleViewFichaTecnica}
                    sx={{ 
                      color: 'primary.main',
                      opacity: 0.8,
                      transition: 'all 0.2s',
                      width: 36,
                      height: 36,
                      '&:hover': {
                        backgroundColor: 'primary.light',
                        color: 'primary.dark',
                        opacity: 1
                      }
                    }}
                  >
                    <SearchIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
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

        {/* Modal de confirmación para eliminar */}
        <Modal
          isOpen={openDeleteModal}
          onClose={() => setOpenDeleteModal(false)}
          onSubmit={() => {
            onRemove(item.id);
            setOpenDeleteModal(false);
          }}
          type={MODAL_TYPES.DELETE}
          title="Eliminar producto del carrito"
          submitButtonText="Eliminar"
          cancelButtonText="Cancelar"
          showCancelButton
          sx={{
            '& .MuiDialogContent-root': {
              textAlign: 'center',
            },
            '& .MuiDialogActions-root': {
              justifyContent: 'center',
            },
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            ¿Estás seguro que deseas eliminar este producto del carrito?
          </Box>
        </Modal>
      </Card>
    </motion.div>
  );
};

export default MobileCartItem;
