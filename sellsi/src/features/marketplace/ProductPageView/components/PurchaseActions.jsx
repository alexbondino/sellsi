import React, { useState } from 'react'
import {
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  Divider,
} from '@mui/material'
import { ShoppingCart, Add, Remove } from '@mui/icons-material'
import { toast } from 'react-hot-toast'
import { formatProductForCart } from '../../../../utils/priceCalculation'

const PurchaseActions = ({
  onAddToCart,
  stock,
  product,
  tiers = [],
  isLoggedIn = false,
}) => {
  const [quantity, setQuantity] = useState(1)
  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= stock) {
      setQuantity(newQuantity)
    }
  }
  const handleAddToCart = () => {
    if (onAddToCart && product) {
      console.log(
        '🛒 DEBUG ProductPageView - Producto antes de formatear:',
        product
      )
      console.log(
        '🛒 DEBUG ProductPageView - Campo imagen del producto:',
        product.imagen
      )
      console.log(
        '🛒 DEBUG ProductPageView - Campo image del producto:',
        product.image
      )

      const cartProduct = formatProductForCart(product, quantity, tiers)

      console.log(
        '🛒 DEBUG ProductPageView - Producto formateado para carrito:',
        cartProduct
      )
      onAddToCart(cartProduct)
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
      <Divider sx={{ mb: 3 }} /> {/* Action Buttons */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Add to Cart Button */}
        <Button
          variant="contained"
          size="large"
          fullWidth
          startIcon={<ShoppingCart />}
          onClick={handleAddToCart}
          disabled={!isLoggedIn}
          sx={{
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 700,
            background: isLoggedIn
              ? 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)'
              : 'rgba(0,0,0,0.12)',
            color: isLoggedIn ? 'white' : 'rgba(0,0,0,0.26)',
            boxShadow: isLoggedIn
              ? '0 4px 16px rgba(25, 118, 210, 0.3)'
              : 'none',
            '&:hover': {
              background: isLoggedIn
                ? 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)'
                : 'rgba(0,0,0,0.12)',
              boxShadow: isLoggedIn
                ? '0 6px 20px rgba(25, 118, 210, 0.4)'
                : 'none',
              transform: isLoggedIn ? 'translateY(-2px)' : 'none',
            },
          }}
        >
          {isLoggedIn ? 'Agregar al Carrito' : 'Inicia sesión para agregar'}
        </Button>
      </Box>
    </Box>
  )
}

export default PurchaseActions
