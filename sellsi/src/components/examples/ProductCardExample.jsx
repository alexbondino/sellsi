import React, { useState } from 'react'
import { Card, CardContent, CardMedia, Grid, Box, Divider } from '@mui/material'
import {
  ProductInfo,
  PriceDisplay,
  StockIndicator,
  QuantitySelector,
  ActionButtons,
} from '../shared'

/**
 * Ejemplo de uso de los componentes compartidos
 * Este componente muestra cómo combinar los componentes de producto
 * manteniendo la estética específica del carrito cuando sea necesario
 */
const ProductCardExample = ({ product, onAddToCart, onToggleWishlist }) => {
  const [quantity, setQuantity] = useState(1)

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const originalPrice =
    product.discount > 0
      ? Math.round(product.price / (1 - product.discount / 100))
      : null

  return (
    <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
      <CardMedia
        component="img"
        height="200"
        image={product.image}
        alt={product.name}
      />

      <CardContent>
        <Grid container spacing={2}>
          {/* Información del producto */}
          <Grid item xs={12}>
            <ProductInfo
              name={product.name}
              supplier={product.supplier}
              category={product.category}
              rating={product.rating}
              reviews={product.reviews}
              description={product.description}
              compact={true}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Precio */}
          <Grid item xs={12}>
            <PriceDisplay
              price={product.price}
              originalPrice={originalPrice}
              discount={product.discount}
              formatPrice={formatPrice}
              size="medium"
              showDiscount={true}
            />
          </Grid>

          {/* Stock */}
          <Grid item xs={12}>
            <StockIndicator
              stock={product.maxStock}
              maxStock={product.maxStock}
              showProgressBar={true}
              showLabel={true}
            />
          </Grid>

          {/* Selector de cantidad */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
              <QuantitySelector
                quantity={quantity}
                min={1}
                max={product.maxStock}
                onChange={setQuantity}
                size="medium"
              />
            </Box>
          </Grid>

          {/* Botones de acción */}
          <Grid item xs={12}>
            <ActionButtons
              onAddToCart={() => onAddToCart(product, quantity)}
              onToggleWishlist={() => onToggleWishlist(product)}
              isInWishlist={false} // Esto vendría del estado
              isInCart={false} // Esto vendría del estado
              layout="vertical"
              variant="contained"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default ProductCardExample
