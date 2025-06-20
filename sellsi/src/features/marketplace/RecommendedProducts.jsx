import React from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Rating,
  Stack,
} from '@mui/material'
import {
  ShoppingCart as ShoppingCartIcon,
  Favorite as FavoriteIcon,
} from '@mui/icons-material'
import { LazyImage } from '../../features/layout'

// ✅ OPTIMIZACIÓN: Memoizar datos estáticos
const RECOMMENDED_PRODUCTS = [
  {
    id: 1,
    name: 'Smartphone Samsung Galaxy',
    price: 599990,
    rating: 4.5,
    reviews: 234,
    image: '/Marketplace productos/notebookasustuf.jpg',
    supplier: 'TechStore',
  },
  {
    id: 2,
    name: 'Auriculares Bluetooth',
    price: 89990,
    rating: 4.2,
    reviews: 156,
    image: '/Marketplace productos/monitor4k240hz32\'\'.jpg',
    supplier: 'AudioMax',
  },
  {
    id: 3,
    name: 'Tablet iPad Air',
    price: 899990,
    rating: 4.8,
    reviews: 89,
    image: '/Marketplace productos/estanteria.jpg',
    supplier: 'Apple Store',
  },
]

// ✅ OPTIMIZACIÓN: Memoizar componente completo
const RecommendedProducts = React.memo(() => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Productos recomendados para ti
      </Typography>{' '}
      <Grid container spacing={2}>
        {RECOMMENDED_PRODUCTS.map((product) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={product.id}>            <Card sx={{ height: '100%', borderRadius: 2 }}>
              {/* ✅ OPTIMIZACIÓN: Usar LazyImage en vez de CardMedia */}
              <Box sx={{ height: 140, position: 'relative' }}>
                <LazyImage
                  src={product.image}
                  alt={product.name}
                  aspectRatio="1"
                  rootMargin="100px"
                  objectFit="cover"
                  borderRadius={0}
                />
              </Box>
              <CardContent>
                <Typography variant="h6" noWrap sx={{ mb: 1 }}>
                  {product.name}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Rating
                    value={product.rating}
                    precision={0.1}
                    size="small"
                    readOnly
                  />
                  <Typography variant="caption" sx={{ ml: 1 }}>
                    ({product.reviews})
                  </Typography>
                </Box>

                <Typography
                  variant="h6"
                  color="primary.main"
                  fontWeight="bold"
                  sx={{ mb: 1 }}
                >
                  {formatPrice(product.price)}
                </Typography>

                <Chip
                  label={product.supplier}
                  size="small"
                  variant="outlined"
                  sx={{ mb: 2 }}
                />

                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<ShoppingCartIcon />}
                    fullWidth
                  >
                    Agregar
                  </Button>
                  <Button size="small" variant="outlined" color="secondary">
                    <FavoriteIcon />
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>  )
})

// ✅ OPTIMIZACIÓN: DisplayName para debugging
RecommendedProducts.displayName = 'RecommendedProducts'

export default RecommendedProducts
