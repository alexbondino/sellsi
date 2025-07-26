import React from 'react'
import Modal from '../../../shared/components/feedback/Modal/Modal'
import { MODAL_TYPES } from '../../../shared/components/feedback/Modal/modalConfig'
import { Box, Typography } from '@mui/material'
import { generateQuotationPDF } from '../utils/quotationPDFGeneratorDynamic.js' // Versión con importación dinámica

const QuotationModal = ({ open, onClose, product, quantity, unitPrice, tiers }) => {
  const handleConfirm = async () => {
    try {
      await generateQuotationPDF({
        product,
        quantity,
        unitPrice,
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
        <Box sx={{ mb: 0.5 }}>
          <Typography variant="body2" component="div" sx={{ color: 'text.primary', fontWeight: 500, textAlign: 'left' }}>
            Cantidad: {quantity} unidades
          </Typography>
        </Box>
        <Box sx={{ mb: 0.5 }}>
          <Typography variant="body2" component="div" sx={{ color: 'text.primary', fontWeight: 500, textAlign: 'left' }}>
            Precio unitario: ${Math.trunc(unitPrice).toLocaleString('es-CL')}
          </Typography>
        </Box>
        <Box sx={{ mb: 0.5 }}>
          <Typography variant="body2" component="div" sx={{ color: 'text.primary', fontWeight: 500, textAlign: 'left' }}>
            Total neto: ${(Math.trunc(quantity * unitPrice) - Math.trunc((quantity * unitPrice) * 0.19)).toLocaleString('es-CL')}
          </Typography>
        </Box>
        <Box sx={{ mb: 0.5 }}>
          <Typography variant="body2" component="div" sx={{ color: 'text.primary', fontWeight: 500, textAlign: 'left' }}>
            IVA (19%): ${Math.trunc((quantity * unitPrice) * 0.19).toLocaleString('es-CL')}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" component="div" sx={{ color: 'text.primary', fontWeight: 600, textAlign: 'left' }}>
            Total: ${Math.trunc(quantity * unitPrice).toLocaleString('es-CL')}
          </Typography>
        </Box>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" component="div" sx={{ color: 'text.disabled', fontStyle: 'italic', textAlign: 'center' }}>
            Los precios están expresados en pesos chilenos (CLP).
          </Typography>
        </Box>
      </Box>
    </Modal>
  )
}

export default QuotationModal
