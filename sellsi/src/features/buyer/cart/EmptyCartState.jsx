import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Stack,
  Card,
  CardContent,
} from '@mui/material'
import {
  ShoppingCart as ShoppingCartIcon,
  Refresh as RefreshIcon,
  Favorite as FavoriteIcon,
} from '@mui/icons-material'

// Mensajes aleatorios para el carrito vacío
const EMPTY_CART_MESSAGES = [
  'Tu carrito está vacío. ¡Descubre productos increíbles en el marketplace!',
  'Tu carrito está vacío. ¡Sigue explorando productos increíbles en el marketplace!',
]

/**
 * Componente para mostrar el estado cuando el carrito está vacío
 * @param {Object} props
 * @param {Array} props.wishlist - Array de productos en wishlist
 * @param {function} props.resetDemoCart - Función para restaurar el demo
 * @param {function} props.setShowWishlist - Función para mostrar wishlist
 */
const EmptyCartState = ({ wishlist, resetDemoCart, setShowWishlist }) => {
  // Seleccionar mensaje aleatorio usando useMemo para que no cambie en cada re-render
  const randomMessage = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * EMPTY_CART_MESSAGES.length)
    return EMPTY_CART_MESSAGES[randomIndex]
  }, []) // Sin dependencias para que solo se calcule una vez
  return (
    <Container
      maxWidth="lg"
      sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{
            mb: 4,
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textAlign: 'center',
          }}
        >
          Mi Carrito
        </Typography>

        <Paper
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 3,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          }}
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          >
            <ShoppingCartIcon
              sx={{
                fontSize: 120,
                color: 'primary.main',
                mb: 3,
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
              }}
            />
          </motion.div>{' '}
          <Typography
            variant="h4"
            sx={{
              mb: 2,
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Tu carrito te está esperando
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ mb: 4, fontStyle: 'italic' }}
          >
            {randomMessage}
          </Typography>
          {/* Info del demo */}
          <Box sx={{ mb: 4, p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
            <Typography variant="body2" color="info.dark" sx={{ mb: 1 }}>
              🎭 <strong>Modo Demo:</strong> Este carrito se reinicia
              automáticamente
            </Typography>
            <Typography variant="caption" color="info.dark">
              Después de realizar una compra, los productos de muestra se
              restauran automáticamente para que puedas seguir explorando las
              funcionalidades.
            </Typography>
          </Box>
          {/* Wishlist preview */}
          {wishlist.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card sx={{ mb: 4, borderRadius: 2 }}>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <FavoriteIcon sx={{ color: 'error.main', mr: 1 }} />
                    <Typography variant="h6">
                      Tienes {wishlist.length} productos guardados
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    onClick={() => setShowWishlist(true)}
                    sx={{ mr: 2 }}
                  >
                    Ver Wishlist
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              startIcon={<ShoppingCartIcon />}
              onClick={() => window.history.back()}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 3,
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 20px rgba(102, 126, 234, 0.4)',
                },
              }}
            >
              Explorar Marketplace
            </Button>

            {/* Botón para restaurar demo manualmente */}
            <Button
              variant="outlined"
              size="large"
              startIcon={<RefreshIcon />}
              onClick={resetDemoCart}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 3,
                borderColor: 'success.main',
                color: 'success.main',
                '&:hover': {
                  borderColor: 'success.dark',
                  backgroundColor: 'success.light',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              🎭 Restaurar Demo
            </Button>

            {wishlist.length > 0 && (
              <Button
                variant="outlined"
                size="large"
                startIcon={<FavoriteIcon />}
                onClick={() => setShowWishlist(true)}
                sx={{ px: 4, py: 1.5, borderRadius: 3 }}
              >
                Ver Favoritos ({wishlist.length})
              </Button>
            )}
          </Stack>
        </Paper>
      </motion.div>
    </Container>
  )
}

export default EmptyCartState
