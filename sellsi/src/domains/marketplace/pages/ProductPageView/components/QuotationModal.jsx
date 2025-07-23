import React from 'react'
import { Modal, MODAL_TYPES } from '../../../../../shared/components/feedback'
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
          ¿Estás seguro que quieres descargar la cotización para <strong>{product?.productnm || product?.name}</strong>?
        </Typography>
      </Box>
      
      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
        <Box sx={{ mb: 1 }}>
          <Typography variant="body2" component="div" sx={{ color: 'text.secondary' }}>
            La cotización incluirá:
          </Typography>
        </Box>
        <Box sx={{ mb: 0.5 }}>
          <Typography variant="body2" component="div" sx={{ color: 'text.primary', fontWeight: 500 }}>
            Cantidad: {quantity} unidades
          </Typography>
        </Box>
        <Box sx={{ mb: 0.5 }}>
          <Typography variant="body2" component="div" sx={{ color: 'text.primary', fontWeight: 500 }}>
            Precio unitario: ${unitPrice?.toLocaleString('es-CL')} CLP
          </Typography>
        </Box>
        <Box sx={{ mb: 0.5 }}>
          <Typography variant="body2" component="div" sx={{ color: 'text.primary', fontWeight: 500 }}>
            Total neto: ${(quantity * unitPrice)?.toLocaleString('es-CL')} CLP
          </Typography>
        </Box>
        <Box sx={{ mb: 0.5 }}>
          <Typography variant="body2" component="div" sx={{ color: 'text.primary', fontWeight: 500 }}>
            IVA (19%): ${((quantity * unitPrice) * 0.19)?.toLocaleString('es-CL')} CLP
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" component="div" sx={{ color: 'text.primary', fontWeight: 600 }}>
            Total: ${((quantity * unitPrice) * 1.19)?.toLocaleString('es-CL')} CLP
          </Typography>
        </Box>
      </Box>
    </Modal>
  )
}

export default QuotationModal
