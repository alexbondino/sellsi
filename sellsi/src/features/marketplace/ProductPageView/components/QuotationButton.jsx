import React, { useState } from 'react'
import { Button, Tooltip, Box } from '@mui/material'
import { Receipt as ReceiptIcon } from '@mui/icons-material'
import QuotationModal from './QuotationModal'

const QuotationButton = ({ product, quantity, unitPrice, tiers }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleQuotationClick = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  return (
    <>
      <Tooltip title="Descargar Cotización" placement="top">
        <Button
          variant="outlined"
          startIcon={<ReceiptIcon />}
          onClick={handleQuotationClick}
          sx={{
            textTransform: 'none',
            borderRadius: 2,
            px: 2,
            py: 1,
            fontSize: '0.875rem',
            fontWeight: 600,
            transition: 'all 0.2s ease',
            borderColor: 'primary.main',
            color: 'primary.main',
            '&:hover': {
              backgroundColor: 'primary.main',
              color: 'white',
              borderColor: 'primary.main',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
            },
          }}
        >
          Solicitar Cotización
        </Button>
      </Tooltip>

      <QuotationModal
        open={isModalOpen}
        onClose={handleCloseModal}
        product={product}
        quantity={quantity}
        unitPrice={unitPrice}
        tiers={tiers}
      />
    </>
  )
}

export default QuotationButton
