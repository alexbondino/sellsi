import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Stack,
} from '@mui/material'
import {
  Favorite as FavoriteIcon,
  ShoppingCart as ShoppingCartIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import { LazyImage } from '../../../components/shared'

/**
 * Componente para mostrar la sección de wishlist/favoritos
 * @param {Object} props
 * @param {boolean} props.showWishlist - Si mostrar o no la wishlist
 * @param {Array} props.wishlist - Array de productos en wishlist
 * @param {function} props.formatPrice - Función para formatear precios
 * @param {function} props.moveToCart - Función para mover item a carrito
 * @param {function} props.removeFromWishlist - Función para remover de wishlist
 */
const WishlistSection = ({
  showWishlist,
  wishlist,
  formatPrice,
  moveToCart,
  removeFromWishlist,
}) => {
  return (
    <AnimatePresence>
      {showWishlist && wishlist.length > 0 && (        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Box sx={{ mt: 4 }}>
            <Typography
              variant="h5"
              sx={{ mb: 3, display: 'flex', alignItems: 'center' }}
            >
              <FavoriteIcon sx={{ mr: 1, color: 'error.main' }} />
              Tus Favoritos ({wishlist.length})
            </Typography>

            <Grid container spacing={2}>
              {wishlist.map((item) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>                  <Card sx={{ borderRadius: 2 }}>
                    {/* ✅ OPTIMIZACIÓN: Usar LazyImage en vez de CardMedia */}
                    <Box sx={{ height: 140, position: 'relative' }}>
                      <LazyImage
                        src={item.image}
                        alt={item.name}
                        aspectRatio="1"
                        rootMargin="100px"
                        objectFit="cover"
                        borderRadius={0}
                      />
                    </Box>
                    <CardContent>
                      <Typography variant="h6" noWrap>
                        {item.name}
                      </Typography>
                      <Typography
                        variant="h6"
                        color="primary.main"
                        fontWeight="bold"
                      >
                        {formatPrice(item.price)}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => moveToCart(item.id)}
                          startIcon={<ShoppingCartIcon />}
                        >
                          Agregar
                        </Button>
                        <IconButton
                          size="small"
                          onClick={() => removeFromWishlist(item.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default WishlistSection
