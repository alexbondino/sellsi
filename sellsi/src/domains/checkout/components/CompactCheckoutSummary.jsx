import React, { useState, useMemo } from 'react';
import { calculatePriceForQuantity } from '../../../utils/priceCalculation';
import {
  Card,
  CardActionArea,
  Box,
  Stack,
  Typography,
  Collapse,
  Divider,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Chip,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  LocalShipping as ShippingIcon,
  Receipt as ReceiptIcon,
  ShoppingCart as CartIcon
} from '@mui/icons-material';

const CompactCheckoutSummary = ({ 
  orderData,
  formatPrice,
  variant = 'minimal', // 'minimal' | 'detailed'
  selectedMethod = null
}) => {
  const [expanded, setExpanded] = useState(false);
  
  const itemCount = orderData.items?.length || 0;
  const shipping = orderData.shipping || 0;

  // Compute prices using tier-aware logic (same as desktop CheckoutSummary)
  const getItemPrice = item => {
    if (item.price_tiers && item.price_tiers.length > 0) {
      const basePrice = item.originalPrice || item.precioOriginal || item.price || item.precio || 0;
      return calculatePriceForQuantity(item.quantity, item.price_tiers, basePrice);
    }
    return item.price || 0;
  };

  const { subtotalFromItems, baseTotal, paymentFee, total } = useMemo(() => {
    const totalBruto = (orderData.items || []).reduce((acc, item) => {
      const unit = getItemPrice(item);
      return acc + unit * (item.quantity || 0);
    }, 0);

    const base = Math.trunc(totalBruto) + shipping;

    let fee = 0;
    if (selectedMethod) {
      if (selectedMethod.id === 'khipu') {
        fee = 500;
      } else if (selectedMethod.id === 'flow') {
        fee = Math.round(base * 0.038);
      }
    }

    return { subtotalFromItems: Math.trunc(totalBruto), baseTotal: base, paymentFee: fee, total: base + fee };
  }, [orderData.items, shipping, selectedMethod]);

  if (variant === 'minimal') {
    return (
      <Card 
        elevation={1}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'rgba(0,0,0,0.08)'
        }}
      >
        <CardActionArea onClick={() => setExpanded(!expanded)}>
          <Box sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" alignItems="center" spacing={1}>
                <CartIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography variant="subtitle2" fontWeight={600}>
                  {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
                </Typography>
              </Stack>
              
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="h6" fontWeight={700} color="primary.main">
                  {formatPrice(total)}
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
        
        <Collapse in={expanded}>
          <Box sx={{ px: 2, pb: 2 }}>
            <Divider sx={{ mb: 2 }} />
            
            {/* Lista de productos compacta */}
            <Stack spacing={1} sx={{ mb: 2 }}>
              {orderData.items?.slice(0, 3).map((item, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar
                    src={item.imageUrl || item.image_url}
                    sx={{ width: 32, height: 32 }}
                  >
                    {(item.name || 'P').charAt(0)}
                  </Avatar>
                  <Typography variant="caption" flex={1} sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    overflow: 'hidden'
                  }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                    {(item.isOffered || item.metadata?.isOffered || item.offer_id || item.offered_price) && (
                      <Tooltip title="Este produco es ofertado" arrow>
                        <Box component="span" sx={{ color: 'success.main', fontSize: 14, ml: 0.5 }}>●</Box>
                      </Tooltip>
                    )}
                    <span style={{ marginLeft: 6 }}>x{item.quantity}</span>
                  </Typography>
                  <Typography variant="caption" fontWeight={600}>
                    {formatPrice((getItemPrice(item) || 0) * (item.quantity || 1))}
                  </Typography>
                </Box>
              ))}
              
              {itemCount > 3 && (
                <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                  +{itemCount - 3} productos más
                </Typography>
              )}
            </Stack>
            
            {/* Totales */}
            <Stack spacing={0.5}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">Subtotal</Typography>
                <Typography variant="caption">{formatPrice(subtotalFromItems || subtotal)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">Envío</Typography>
                <Typography variant="caption" color={shipping === 0 ? 'success.main' : 'text.primary'}>
                  {shipping === 0 ? '¡GRATIS!' : formatPrice(shipping)}
                </Typography>
              </Stack>
              {selectedMethod && paymentFee > 0 && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">Comisión</Typography>
                  <Typography variant="caption">{formatPrice(paymentFee)}</Typography>
                </Stack>
              )}
            </Stack>
          </Box>
        </Collapse>
      </Card>
    );
  }

  // Detailed variant (similar to original)
  return (
    <Card elevation={2} sx={{ borderRadius: 3 }}>
      {/* ... implementación detallada si se necesita ... */}
    </Card>
  );
};

export default CompactCheckoutSummary;
