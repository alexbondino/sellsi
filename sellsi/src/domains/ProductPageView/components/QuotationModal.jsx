import React, { useState, useMemo } from 'react'
import Modal from '../../../shared/components/feedback/Modal/Modal'
import { MODAL_TYPES } from '../../../shared/components/feedback/Modal/modalConfig'
import { Box, Typography } from '@mui/material'
import { generateQuotationPDF } from '../utils/quotationPDFGeneratorDynamic.js' // Versión con importación dinámica
import QuantitySelector from '../../../shared/components/forms/QuantitySelector/QuantitySelector'
import { calculatePriceForQuantity } from '../../../utils/priceCalculation'

const QuotationModal = ({ open, onClose, product, quantity: initialQuantity, unitPrice: initialUnitPrice, tiers }) => {
  // Estado local para la cantidad seleccionada
  const [selectedQuantity, setSelectedQuantity] = useState(initialQuantity || 1)

  // Calcular datos del producto (similar a AddToCartModal)
  const productData = useMemo(() => {
    const stock = product?.stock || product?.maxStock || product?.productqty || 50;
    const minimumPurchase = product?.minimum_purchase || product?.compraMinima || initialQuantity || 1;
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
    const basePrice = product?.precio || product?.price || initialUnitPrice || 0
    const currentUnitPrice = calculatePriceForQuantity(selectedQuantity, tiers, basePrice)
    const totalPrice = currentUnitPrice * selectedQuantity

    return {
      unitPrice: currentUnitPrice,
      totalPrice: totalPrice
    }
  }, [selectedQuantity, tiers, product, initialUnitPrice])

  const handleConfirm = async () => {
    try {
      await generateQuotationPDF({
        product,
        quantity: selectedQuantity, // Usar la cantidad del selector
        unitPrice: calculatedPrices.unitPrice, // Usar el precio calculado
        tiers
      })
      onClose()
    } catch (error) {
      console.error('Error generando cotización:', error)
    }
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      onSubmit={handleConfirm}
      type={MODAL_TYPES.INFO}
      title="Descargar Cotización"
      submitButtonText="Sí, descargar"
      cancelButtonText="Cancelar"
      showCancelButton={true}
    >
      <Box sx={{ mb: 2 }}>
        <Typography variant="body1" component="div" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
          ¿Estás seguro de que deseas continuar?
        </Typography>
      </Box>
      
      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
        <Box sx={{ mb: 1 }}>
          <Typography variant="body2" component="div" sx={{ color: 'text.secondary'}}>
            La Cotización incluirá:
          </Typography>
        </Box>
        
        {/* Precio unitario */}
        <Box sx={{ mb: 0.5 }}>
          <Typography variant="body2" component="div" sx={{ color: 'text.primary', fontWeight: 500, textAlign: 'left' }}>
            Precio unitario: ${Math.trunc(calculatedPrices.unitPrice).toLocaleString('es-CL')}
          </Typography>
        </Box>
        
        {/* Total (IVA incluido) */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" component="div" sx={{ color: 'text.primary', fontWeight: 600, textAlign: 'left' }}>
            Total (IVA incluido): ${Math.trunc(calculatedPrices.totalPrice).toLocaleString('es-CL')}
          </Typography>
        </Box>
        
        {/* Nota sobre precios */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" component="div" sx={{ color: 'text.disabled', fontStyle: 'italic', textAlign: 'center', fontSize: 12 }}>
           Valores expresados en pesos chilenos (CLP).
          </Typography>
        </Box>
        
        {/* Selector de cantidad */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <QuantitySelector
            value={selectedQuantity}
            onChange={setSelectedQuantity}
            min={productData.minimumPurchase} // Usar la cantidad mínima del producto
            max={maxQuantity} // Usar el stock máximo del producto
            size="medium"
            label="Cantidad"
            sx={{ 
              width: 'auto',
              '& .MuiTypography-root': {
                textAlign: 'center',
                color: 'text.primary',
                fontWeight: 500
              }
            }}
          />
        </Box>
        
        {/* Mostrar información de stock */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ 
              fontSize: '0.75rem',
              textAlign: 'center'
            }}
          >
            Stock disponible: {productData.stock.toLocaleString('es-CL')} unidades
          </Typography>
        </Box>
      </Box>
    </Modal>
  )
}

export default QuotationModal
