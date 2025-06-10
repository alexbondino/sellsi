import React, { useState } from 'react'
import {
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  Divider,
} from '@mui/material'
import { ShoppingCart, Add, Remove, FlashOn } from '@mui/icons-material'

const PurchaseActions = ({ onAddToCart, onBuyNow, stock }) => {
  const [quantity, setQuantity] = useState(1)

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= stock) {
      setQuantity(newQuantity)
    }
  }

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart({ quantity })
    }
  }

  const handleBuyNow = () => {
    if (onBuyNow) {
      onBuyNow({ quantity })
    }
  }

  return (
    <Box>
      {/* Quantity Selector */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
          Cantidad:
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            onClick={() => handleQuantityChange(quantity - 1)}
            disabled={quantity <= 1}
            size="small"
            sx={{
              border: '1px solid',
              borderColor: 'grey.300',
              '&:hover': {
                borderColor: 'primary.main',
              },
            }}
          >
            <Remove fontSize="small" />
          </IconButton>

          <TextField
            value={quantity}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 1
              handleQuantityChange(value)
            }}
            inputProps={{
              min: 1,
              max: stock,
              style: { textAlign: 'center', width: '60px' },
            }}
            size="small"
            variant="outlined"
          />

          <IconButton
            onClick={() => handleQuantityChange(quantity + 1)}
            disabled={quantity >= stock}
            size="small"
            sx={{
              border: '1px solid',
              borderColor: 'grey.300',
              '&:hover': {
                borderColor: 'primary.main',
              },
            }}
          >
            <Add fontSize="small" />
          </IconButton>

          <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
            {stock} disponibles
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Buy Now Button */}
        <Button
          variant="contained"
          size="large"
          fullWidth
          startIcon={<FlashOn />}
          onClick={handleBuyNow}
          sx={{
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            boxShadow: '0 4px 16px rgba(25, 118, 210, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
              boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
              transform: 'translateY(-2px)',
            },
          }}
        >
          Comprar Ahora
        </Button>

        {/* Add to Cart Button */}
        <Button
          variant="outlined"
          size="large"
          fullWidth
          startIcon={<ShoppingCart />}
          onClick={handleAddToCart}
          sx={{
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
            borderWidth: 2,
            '&:hover': {
              borderWidth: 2,
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
            },
          }}
        >
          Agregar al Carrito
        </Button>
      </Box>
    </Box>
  )
}

export default PurchaseActions
