import React from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  Rating,
  Stack,
} from '@mui/material'
import {
  ShoppingCart as ShoppingCartIcon,
  Favorite as FavoriteIcon,
} from '@mui/icons-material'

const RECOMMENDED_PRODUCTS = [
  {
    id: 101,
    name: 'Mouse Gaming RGB',
    price: 29990,
    image: '/Marketplace productos/silla.jpg',
    supplier: 'PC Factory',
    rating: 4.3,
    reviews: 45,
    discount: 20,
  },
  {
    id: 102,
    name: 'Teclado Mecánico',
    price: 79990,
    image: "/Marketplace productos/monitor4k240hz32''.jpg",
    supplier: 'PC Factory',
    rating: 4.7,
    reviews: 78,
    discount: 15,
  },
  {
    id: 103,
    name: 'Webcam HD 1080p',
    price: 45990,
    image: '/Marketplace productos/notebookasustuf.jpg',
    supplier: 'Tech Store',
    rating: 4.4,
    reviews: 23,
  },
]

const RecommendedProducts = () => {
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
      </Typography>

      <Grid container spacing={2}>
        {RECOMMENDED_PRODUCTS.map((product) => (
          <Grid item xs={12} sm={6} md={4} key={product.id}>
            <Card sx={{ height: '100%', borderRadius: 2 }}>
              <CardMedia
                component="img"
                height="140"
                image={product.image}
                alt={product.name}
              />
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
    </Box>
  )
}

export default RecommendedProducts
