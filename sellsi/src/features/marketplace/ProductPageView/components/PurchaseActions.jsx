import React, { useState, memo } from 'react'
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
  const minimumPurchase = product.minimum_purchase || product.compraMinima || 1
  const [quantity, setQuantity] = useState(minimumPurchase)
  // Permitir edición libre
  const [inputValue, setInputValue] = useState(minimumPurchase.toString())
  const canAdd =
    !isNaN(parseInt(inputValue)) &&
    parseInt(inputValue) >= minimumPurchase &&
    isLoggedIn
  // DEBUG: Verificar estado de sesión y lógica de habilitación del botón
  // ...log eliminado...

  const handleQuantityChange = (newQuantity) => {
    setInputValue(newQuantity.toString())
    if (!isNaN(newQuantity) && newQuantity >= minimumPurchase && newQuantity <= stock) {
      setQuantity(newQuantity)
    }
  }
  const handleAddToCart = () => {
    // ...log eliminado...
    if (!isLoggedIn) {
      toast.error('Debes iniciar sesión para agregar productos al carrito', {
        icon: '🔒',
      })
      const event = new CustomEvent('openLogin')
      window.dispatchEvent(event)
      return
    }
    if (onAddToCart && product) {
      const cartProduct = formatProductForCart(product, quantity, tiers)
      console.log('[PurchaseActions] Enviando al carrito:', cartProduct)
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
            disabled={quantity <= minimumPurchase}
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
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              const value = parseInt(e.target.value)
              if (!isNaN(value)) {
                handleQuantityChange(value)
              }
            }}
            onBlur={() => {
              let value = parseInt(inputValue)
              if (isNaN(value) || value < minimumPurchase) value = minimumPurchase
              if (value > stock) value = stock
              setInputValue(value.toString())
              setQuantity(value)
            }}
            inputProps={{
              min: minimumPurchase,
              max: stock,
              style: { textAlign: 'center', width: '60px' },
            }}
            size="small"
            variant="outlined"
            error={parseInt(inputValue) < minimumPurchase}
            helperText={parseInt(inputValue) < minimumPurchase ? `Mínimo ${minimumPurchase}` : ''}
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
          disabled={!canAdd}
          sx={{
            opacity: canAdd ? 1 : 0.5,
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 700,
            background: canAdd
              ? 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)'
              : 'rgba(0,0,0,0.12)',
            color: !isLoggedIn
              ? '#111 !important' // Negro forzado para el texto cuando no está logueado
              : canAdd
                ? 'white'
                : 'rgba(0,0,0,0.26)',
            boxShadow: canAdd
              ? '0 4px 16px rgba(25, 118, 210, 0.3)'
              : 'none',
            transition: 'opacity 0.2s',
            '&:hover': {
              background: canAdd
                ? 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)'
                : 'rgba(0,0,0,0.12)',
              boxShadow: canAdd
                ? '0 6px 20px rgba(25, 118, 210, 0.4)'
                : 'none',
              transform: canAdd ? 'translateY(-2px)' : 'none',
            },
          }}
        >
          {!isLoggedIn
            ? 'Inicia sesión para agregar'
            : parseInt(inputValue) < minimumPurchase
            ? `Mín: ${minimumPurchase}`
            : 'Agregar al Carrito'}
        </Button>
      </Box>
    </Box>
  )
}

export default memo(PurchaseActions)
