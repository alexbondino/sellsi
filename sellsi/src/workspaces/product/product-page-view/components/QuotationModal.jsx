import React, { useState, useMemo } from 'react';
import Modal from '../../../../shared/components/feedback/Modal/Modal';
import { MODAL_TYPES } from '../../../../shared/components/feedback/Modal/modalConfig';
import { Box, Typography } from '@mui/material';
import { generateQuotationPDF } from '../utils/quotationPDFGeneratorDynamic.js'; // Versión con importación dinámica
import QuantitySelector from '../../../../shared/components/forms/QuantitySelector/QuantitySelector';
import { calculatePriceForQuantity } from '../../../../utils/priceCalculation';
import { useBodyScrollLock } from '../../../../shared/hooks/useBodyScrollLock';

const QuotationModal = ({
  open,
  onClose,
  product,
  quantity: initialQuantity,
  unitPrice: initialUnitPrice,
  tiers,
}) => {
  // ✅ Bloquear scroll del body cuando el modal está abierto
  useBodyScrollLock(open);

  // Estado local para la cantidad seleccionada
  const [selectedQuantity, setSelectedQuantity] = useState(
    initialQuantity || 1
  );

  // Calcular datos del producto (similar a AddToCartModal)
  const productData = useMemo(() => {
    const stock =
      product?.stock || product?.maxStock || product?.productqty || 50;
    const minimumPurchase =
      product?.minimum_purchase ||
      product?.compraMinima ||
      initialQuantity ||
      1;
    return {
      stock,
      maxPurchase: stock, // máximo permitido = stock disponible
      minimumPurchase,
    };
  }, [product, initialQuantity]);

  // Calcular máximo efectivo (igual que AddToCartModal)
  const maxQuantity = useMemo(() => {
    return Math.min(productData.maxPurchase, productData.stock);
  }, [productData.maxPurchase, productData.stock]);

  // Calcular precios dinámicamente basado en la cantidad seleccionada
  const calculatedPrices = useMemo(() => {
    const basePrice =
      product?.precio || product?.price || initialUnitPrice || 0;
    const currentUnitPrice = calculatePriceForQuantity(
      selectedQuantity,
      tiers,
      basePrice
    );
    const totalPrice = currentUnitPrice * selectedQuantity;

    return {
      unitPrice: currentUnitPrice,
      totalPrice: totalPrice,
    };
  }, [selectedQuantity, tiers, product, initialUnitPrice]);

  const handleConfirm = async () => {
    try {
      await generateQuotationPDF({
        product,
        quantity: selectedQuantity, // Usar la cantidad del selector
        unitPrice: calculatedPrices.unitPrice, // Usar el precio calculado
        tiers,
      });
      onClose();
    } catch (error) {
      console.error('Error generando cotización:', error);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      onSubmit={handleConfirm}
      type={MODAL_TYPES.QUOTATION}
      title="Descargar Cotización"
      submitButtonText="Descargar"
      cancelButtonText="Cancelar"
      showCancelButton={true}
    >
      <Box sx={{ p: { xs: 2, sm: 2 }, bgcolor: 'grey.50', borderRadius: 2 }}>
        <Box sx={{ mb: { xs: 1.5, sm: 1 }, textAlign: { xs: 'center', sm: 'left' } }}>
          <Typography
            variant="body2"
            component="div"
            sx={{ 
              color: 'text.secondary',
              fontSize: { xs: '0.9375rem', sm: '0.875rem' }
            }}
          >
            La Cotización incluirá:
          </Typography>
        </Box>

        {/* Precio unitario */}
        <Box sx={{ mb: { xs: 1, sm: 0.5 } }}>
          <Typography
            variant="body2"
            component="div"
            sx={{ 
              color: 'text.primary', 
              fontWeight: 500, 
              textAlign: { xs: 'center', sm: 'left' },
              fontSize: { xs: '0.9375rem', sm: '0.875rem' }
            }}
          >
            Precio unitario: $
            {Math.trunc(calculatedPrices.unitPrice).toLocaleString('es-CL')}
          </Typography>
        </Box>

        {/* Total (IVA incluido) */}
        <Box sx={{ mb: { xs: 2, sm: 2 } }}>
          <Typography
            variant="body2"
            component="div"
            sx={{ 
              color: 'text.primary', 
              fontWeight: 600, 
              textAlign: { xs: 'center', sm: 'left' },
              fontSize: { xs: '1rem', sm: '0.875rem' }
            }}
          >
            Total (IVA incluido): $
            {Math.trunc(calculatedPrices.totalPrice).toLocaleString('es-CL')}
          </Typography>
        </Box>

        {/* Nota sobre precios */}
        <Box sx={{ mb: { xs: 2, sm: 2 } }}>
          <Typography
            variant="body2"
            component="div"
            sx={{
              color: 'text.disabled',
              fontStyle: 'italic',
              textAlign: 'center',
              fontSize: { xs: '0.8125rem', sm: '0.75rem' },
            }}
          >
            Valores expresados en pesos chilenos (CLP).
          </Typography>
        </Box>

        {/* Selector de cantidad */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: { xs: 8, sm: 2 } }}>
          <QuantitySelector
            value={selectedQuantity}
            onChange={setSelectedQuantity}
            min={productData.minimumPurchase}
            max={maxQuantity}
            size="medium"
            label="Cantidad"
            sx={{
              width: { xs: '100%', sm: 'auto' },
              maxWidth: { xs: '280px', sm: 'none' },
              '& .MuiFormLabel-root': {
                textAlign: 'center',
                width: '100%',
              },
              '& .MuiTypography-root': {
                textAlign: 'center',
                color: 'text.primary',
                fontWeight: 500,
                fontSize: { xs: '0.9375rem', sm: '0.875rem' },
              },
            }}
          />
        </Box>

        {/* Mostrar información de stock */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 1.5, sm: 1 } }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              fontSize: { xs: '0.8125rem', sm: '0.75rem' },
              textAlign: 'center',
            }}
          >
            Stock disponible: {productData.stock.toLocaleString('es-CL')}{' '}
            unidades
          </Typography>
        </Box>
      </Box>
    </Modal>
  );
};

export default QuotationModal;
