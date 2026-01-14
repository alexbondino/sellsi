import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Stack,
  Typography,
  Avatar,
  Slider,
  Checkbox,
  FormControlLabel,
  Divider,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material';
import { Close as CloseIcon, RequestQuote as RequestQuoteIcon } from '@mui/icons-material';
import { calculatePriceForQuantity } from '../../../../../utils/priceCalculation';
import { toTitleCase } from '../../../../../utils/textFormatters';

const FinancingConfigModal = ({
  open,
  onClose,
  cartItems = [],
  formatPrice,
  onSave,
  currentFinancing = {},
  shippingByProduct = {},
  overallShipping = 0,
}) => {
  // Estado local para configuración de financiamiento de cada producto
  const [productFinancingConfig, setProductFinancingConfig] = useState(() => {
    // Inicializar con la configuración actual si existe
    return cartItems.reduce((acc, item) => {
      const existing = currentFinancing[item.id];
      acc[item.id] = {
        amount: existing?.amount || 0,
        isFullAmount: existing?.isFullAmount || false,
      };
      return acc;
    }, {});
  });

  // Estado para tracking de qué financiamiento se usará para cada producto
  const [selectedFinancingByProduct, setSelectedFinancingByProduct] = useState(() => {
    return cartItems.reduce((acc, item) => {
      acc[item.id] = ''; // Sin financiamiento asignado por defecto
      return acc;
    }, {});
  });

  // Calcular el total de cada producto (incluyendo envío)
  const getProductTotal = (item) => {
    const quantity = Number(item.quantity || 1);
    const price_tiers = item.price_tiers || item.priceTiers || item.price_tier || [];
    const basePrice = Number(
      item.originalPrice ||
        item.precioOriginal ||
        item.price ||
        item.precio ||
        item.price_at_addition ||
        0
    );
    const unitPrice = calculatePriceForQuantity(quantity, Array.isArray(price_tiers) ? price_tiers : [], basePrice);
    const productSubtotal = unitPrice * quantity;
    
    // Prefer shippingByProduct (calculado por hook) y fallback a item.shipping_cost
    const shippingCost = Number(shippingByProduct[item.id] || item.shipping_cost || item.shippingCost || 0);

    return productSubtotal + shippingCost;
  };

  // Handler para cambiar el monto de financiamiento con el slider
  const handleAmountChange = (productId, newValue) => {
    setProductFinancingConfig(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        amount: newValue,
      },
    }));
  };

  // Handler para el checkbox de "Pagar la totalidad"
  const handleFullAmountToggle = (productId, total) => {
    setProductFinancingConfig(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        isFullAmount: !prev[productId].isFullAmount,
        amount: !prev[productId].isFullAmount ? total : prev[productId].amount,
      },
    }));
  };

  // Mock de financiamientos disponibles (TODO: reemplazar con query real)
  const mockFinancings = useMemo(() => {
    const supplierIdsInCart = new Set(
      cartItems.map(item => item.supplier_id || item.supplierId).filter(Boolean)
    );
    
    if (supplierIdsInCart.size === 0) return [];
    
    const firstSupplierId = Array.from(supplierIdsInCart)[0];
    const firstSupplierName = cartItems.find(item => 
      (item.supplier_id || item.supplierId) === firstSupplierId
    )?.proveedor || 'Proveedor Principal';
    
    return [
      // 1. Financiamiento saludable - mucho disponible, lejos de vencer
      {
        id: 'mock-1',
        supplier_id: firstSupplierId,
        supplier_name: firstSupplierName,
        amount: 800000,
        amount_used: 200000, // 25% usado
        amount_paid: 50000,
        term_days: 45,
        activated_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // Hace 15 días
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // En 30 días
        status: 'approved_by_sellsi',
      },
      // 2. Financiamiento en warning por tiempo (cercano a vencer)
      {
        id: 'mock-2',
        supplier_id: firstSupplierId,
        supplier_name: firstSupplierName,
        amount: 500000,
        amount_used: 150000, // 30% usado
        amount_paid: 50000,
        term_days: 30,
        activated_at: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(), // Hace 23 días
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // En 7 días (warning)
        status: 'approved_by_sellsi',
      },
      // 3. Financiamiento en warning por alto uso (>90%)
      {
        id: 'mock-3',
        supplier_id: firstSupplierId,
        supplier_name: firstSupplierName,
        amount: 300000,
        amount_used: 280000, // 93% usado
        amount_paid: 100000,
        term_days: 15,
        activated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // Hace 5 días
        expires_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // En 10 días
        status: 'approved_by_sellsi',
      },
      // 4. Financiamiento de plazo corto cercano a vencer
      {
        id: 'mock-4',
        supplier_id: firstSupplierId,
        supplier_name: firstSupplierName,
        amount: 200000,
        amount_used: 80000, // 40% usado
        amount_paid: 30000,
        term_days: 7,
        activated_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // Hace 6 días
        expires_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // En 1 día (warning crítico)
        status: 'approved_by_sellsi',
      },
      // 5. Financiamiento grande de plazo largo
      {
        id: 'mock-5',
        supplier_id: firstSupplierId,
        supplier_name: firstSupplierName,
        amount: 1500000,
        amount_used: 600000, // 40% usado
        amount_paid: 200000,
        term_days: 60,
        activated_at: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000).toISOString(), // Hace 42 días
        expires_at: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(), // En 18 días
        status: 'approved_by_sellsi',
      },
    ];
  }, [cartItems]);

  // Función helper para obtener financiamientos del supplier de un producto
  const getFinancingsForProduct = (item) => {
    const supplierId = item.supplier_id || item.supplierId;
    return mockFinancings.filter(f => f.supplier_id === supplierId);
  };

  // Función helper para formatear info del financiamiento
  const getFinancingStatus = (financing) => {
    const available = financing.amount - financing.amount_used;
    const usagePercent = (financing.amount_used / financing.amount) * 100;
    const expiresAt = new Date(financing.expires_at);
    const now = new Date();
    const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
    
    let status = 'primary';
    if (usagePercent >= 90 || daysRemaining <= 7) status = 'warning';
    
    return { available, usagePercent, daysRemaining, status };
  };

  // Handler para cambiar el financiamiento seleccionado
  const handleFinancingChange = (productId, financingId) => {
    setSelectedFinancingByProduct(prev => ({
      ...prev,
      [productId]: financingId,
    }));
  };

  // Guardar configuración
  const handleSave = () => {
    // TODO: Incluir selectedFinancingByProduct en el save
    onSave({
      config: productFinancingConfig,
      financingAssignments: selectedFinancingByProduct,
    });
    onClose();
  };

  // Calcular totales (incluyendo envíos)
  const totals = useMemo(() => {
    let totalFinanced = 0;
    let totalCart = 0;
    let totalShipping = 0;

    cartItems.forEach(item => {
      const productTotal = getProductTotal(item);
      totalCart += productTotal;
      totalFinanced += productFinancingConfig[item.id]?.amount || 0;
      totalShipping += Number(shippingByProduct[item.id] || item.shipping_cost || item.shippingCost || 0);
    });

    // If per-product shipping is not available but overallShipping is, add it
    if (totalShipping === 0 && Number(overallShipping) > 0) {
      totalShipping = Number(overallShipping);
      totalCart += totalShipping;
    }

    return {
      totalCart,
      totalFinanced,
      totalCash: totalCart - totalFinanced,
      totalShipping,
    };
  }, [cartItems, productFinancingConfig, shippingByProduct, overallShipping]);

  React.useEffect(() => {
    if (open) {
      console.log('[FinancingConfigModal] totals:', {
        totalCart: totals.totalCart,
        totalShipping: totals.totalShipping,
        totalFinanced: totals.totalFinanced,
        totalCash: totals.totalCash,
        shippingByProductSample: Object.keys(shippingByProduct).slice(0,5),
        overallShipping
      });
    }
  }, [open, totals, shippingByProduct, overallShipping]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={typeof window !== 'undefined' && window.innerWidth < 900} // fullScreen en mobile (xs, sm)
      disableScrollLock={false} // Usar el scroll lock nativo de MUI (evita saltos)
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, md: 3 }, // Sin bordes redondeados en mobile
          maxHeight: { xs: '100vh', md: '90vh' }, // Altura completa en mobile
          zIndex: 1600, // Mayor que MobileCheckoutBar (1500)
        },
      }}
      sx={{
        zIndex: 1600, // Mayor que MobileCheckoutBar (1500)
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          justifyContent: 'center',
          textAlign: 'center',
          backgroundColor: '#2E52B2',
          color: '#fff',
          py: { xs: 2, sm: 2 },
          px: { xs: 2, sm: 3 },
          position: 'relative',
          fontSize: { xs: '1.125rem', sm: '1.25rem' },
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: { xs: 8, sm: 16 },
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#fff',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            p: { xs: 0.75, sm: 1 },
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            },
          }}
        >
          <CloseIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
        </IconButton>
        <RequestQuoteIcon sx={{ color: '#fff' }} fontSize="small" />
        Configurar Pago con Financiamiento
      </DialogTitle>

      <DialogContent dividers sx={{ px: 3, py: 2 }}>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Selecciona cuánto del total de cada producto deseas pagar con financiamiento
          </Typography>

          {cartItems.map((item) => {
            const productTotal = getProductTotal(item);
            const config = productFinancingConfig[item.id] || { amount: 0, isFullAmount: false };
            const imageUrl = item.imageUrl || item.image_url || item.thumbnail_url || '/placeholder-product.png';

            return (
              <Box
                key={item.id}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: 'background.paper',
                }}
              >
                <Stack spacing={1.5}>
                  {/* Header del producto */}
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    alignItems={{ xs: 'flex-start', sm: 'flex-start' }}
                  >
                    {/* Imagen y datos básicos */}
                    <Stack direction="row" spacing={2} flex={1} alignItems="center">
                      <Avatar
                        src={imageUrl}
                        alt={toTitleCase(item.name || item.nombre)}
                        variant="rounded"
                        sx={{ width: 80, height: 80 }}
                      >
                        {toTitleCase(item.name || item.nombre || 'P').charAt(0)}
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {toTitleCase(item.name || item.nombre)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Cantidad: {item.quantity}
                        </Typography>
                        <Typography variant="h6" color="primary.main" fontWeight={700}>
                          Total: {formatPrice(productTotal)}
                        </Typography>
                        {(item.shipping_cost || item.shippingCost) > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            (incluye envío: {formatPrice(item.shipping_cost || item.shippingCost)})
                          </Typography>
                        )}
                      </Box>
                    </Stack>

                    {/* Selector de financiamiento */}
                    <Box sx={{ minWidth: { xs: '100%', sm: 240 } }}>
                      <FormControl fullWidth size="small">
                        <InputLabel id={`financing-select-${item.id}`}>
                          Financiamiento a usar
                        </InputLabel>
                        <Select
                          labelId={`financing-select-${item.id}`}
                          value={selectedFinancingByProduct[item.id] || ''}
                          onChange={(e) => handleFinancingChange(item.id, e.target.value)}
                          label="Financiamiento a usar"
                          sx={{ bgcolor: 'background.paper' }}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                maxHeight: 300,
                              },
                            },
                            sx: {
                              zIndex: 1700, // Mayor que el Dialog (1600)
                            },
                          }}
                        >
                          <MenuItem value="">
                            <em>Sin asignar</em>
                          </MenuItem>
                          {getFinancingsForProduct(item).map((financing, idx) => {
                            const { available, daysRemaining, status } = getFinancingStatus(financing);
                            return (
                              <MenuItem key={financing.id} value={financing.id}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 45 }}>
                                    Fin #{idx + 1}
                                  </Typography>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" display="block">
                                      Disp: {formatPrice(available)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Vence en {daysRemaining}d
                                    </Typography>
                                  </Box>
                                  <Chip
                                    size="small"
                                    label={status === 'warning' ? '⚠' : '✓'}
                                    color={status}
                                    sx={{ minWidth: 28, height: 20 }}
                                  />
                                </Box>
                              </MenuItem>
                            );
                          })}
                        </Select>
                      </FormControl>
                      {getFinancingsForProduct(item).length === 0 && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          No hay financiamientos disponibles
                        </Typography>
                      )}
                    </Box>
                  </Stack>

                  {/* Checkbox para pagar totalidad */}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={config.isFullAmount}
                        onChange={() => handleFullAmountToggle(item.id, productTotal)}
                        color="primary"
                      />
                    }
                    label={<Typography variant="body2">Pagar la totalidad de este producto con financiamiento</Typography>}
                  />

                  {/* Slider y Input para monto */}
                  <Box>
                    <Typography variant="body2" sx={{ color: '#000' }} style={{ color: '#000' }} gutterBottom>
                      Monto a financiar:
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box sx={{ flex: 0.7 }}>
                        <Slider
                          value={config.amount}
                          onChange={(e, newValue) => handleAmountChange(item.id, newValue)}
                          min={0}
                          max={productTotal}
                          step={1000}
                          disabled={config.isFullAmount}
                          valueLabelDisplay="auto"
                          valueLabelFormat={(value) => formatPrice(value)}
                          sx={{
                            '& .MuiSlider-thumb': {
                              width: 20,
                              height: 20,
                            },
                          }}
                        />
                      </Box>
                      <TextField
                        value={config.amount}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          const clamped = Math.min(Math.max(0, value), productTotal);
                          handleAmountChange(item.id, clamped);
                        }}
                        disabled={config.isFullAmount}
                        type="number"
                        size="small"
                        sx={{ flex: 0.3 }}
                        inputProps={{
                          min: 0,
                          max: productTotal,
                          step: 1000,
                        }}
                      />
                    </Stack>
                  </Box>

                  {/* Resumen del producto */}
                  <Stack direction="row" justifyContent="space-between" sx={{ pt: 0.5 }}>
                    <Typography variant="body2" sx={{ color: '#000' }} style={{ color: '#000' }}>
                      Financiamiento:
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="primary.main">
                      {formatPrice(config.amount)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" sx={{ color: '#000' }} style={{ color: '#000' }}>
                      Pago de contado:
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {formatPrice(productTotal - config.amount)}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
            );
          })}

          {/* Resumen total */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Resumen Total
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Stack spacing={0.5}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Total del carrito:</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {formatPrice(totals.totalCart)}
                </Typography>
              </Stack>
              {totals.totalShipping > 0 && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Incluye envío:
                  </Typography>
                  <Typography variant="body2" fontWeight={500} color="text.secondary">
                    {formatPrice(totals.totalShipping)}
                  </Typography>
                </Stack>
              )}
              <Divider sx={{ my: 0.5 }} />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="primary.main">
                  Total financiado:
                </Typography>
                <Typography variant="body2" fontWeight={700} color="primary.main">
                  {formatPrice(totals.totalFinanced)}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Pago de contado:</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {formatPrice(totals.totalCash)}
                </Typography>
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          p: 2.5,
          bgcolor: '#f8f9fa',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            px: 3,
            py: 1,
            borderRadius: 2,
            fontWeight: 500,
            textTransform: 'none',
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          sx={{
            px: 3,
            py: 1,
            borderRadius: 2,
            fontWeight: 600,
            textTransform: 'none',
          }}
        >
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FinancingConfigModal;
