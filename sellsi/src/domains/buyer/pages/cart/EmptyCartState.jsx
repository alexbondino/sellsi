import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
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
  Favorite as FavoriteIcon,
  Home as HomeIcon,
} from '@mui/icons-material'
import { ThemeProvider } from '@mui/material/styles';
import { dashboardThemeCore } from '../../../../styles/dashboardThemeCore';
import { useRole } from '../../../../infrastructure/providers/RoleProvider';

// Mensajes aleatorios para el carrito vacío
const EMPTY_CART_MESSAGES = [
  'Tu carrito está vacío. ¡Descubre productos increíbles en el marketplace!',
  'Tu carrito está vacío. ¡Sigue explorando productos increíbles en el marketplace!',
]

// Mensaje específico para suppliers
const SUPPLIER_CART_MESSAGE = 'Tu carrito está vacío. Debes cambiar a Vista Comprador, para poder seguir comprando productos en el Marketplace'

/**
 * Componente para mostrar el estado cuando el carrito está vacío
 * @param {Object} props
 */
const EmptyCartState = () => {
  const navigate = useNavigate()
  const { currentAppRole } = useRole()
  const isSupplier = currentAppRole === 'supplier'
  
  // Seleccionar mensaje apropiado según el rol
  const displayMessage = useMemo(() => {
    if (isSupplier) {
      return SUPPLIER_CART_MESSAGE
    }
    // Para buyers, usar mensaje aleatorio
    const randomIndex = Math.floor(Math.random() * EMPTY_CART_MESSAGES.length)
    return EMPTY_CART_MESSAGES[randomIndex]
  }, [isSupplier]) // Depende del rol

  // Función para navegar según el contexto del usuario
  const handlePrimaryAction = () => {
    if (isSupplier) {
      // Si es supplier, llevar a supplier/home
      navigate('/supplier/home')
    } else {
      // Si es buyer, llevar al marketplace correspondiente
      const currentRole = window.currentAppRole || 'buyer'
      if (currentRole === 'supplier') {
        navigate('/supplier/marketplace')
      } else {
        navigate('/buyer/marketplace')
      }
    }
  }
  return (
    <>
      <Container
        maxWidth="lg"
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          // Agrega margen izquierdo solo en desktop (md+) para alinear con SideBar
          ml: { xs: 0, md: 2, lg: 3, xl: 34 },
          transition: 'margin-left 0.3s',
        }}
      >      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography
          variant="h4"
          fontWeight={600}
          color="primary.main"
          gutterBottom
          sx={{ mb: 4, textAlign: 'center' }}
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
          <motion.div            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              repeatDelay: 0.5, // reducido a la mitad
            }}
          >
            <ShoppingCartIcon
              sx={{
                fontSize: 120,
                color: 'primary.main',
                mb: 3,
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
              }}
            />{' '}
          </motion.div>{' '}
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ mb: 4, fontStyle: 'italic' }}
          >
            {displayMessage}
          </Typography>
          
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              startIcon={isSupplier ? <HomeIcon /> : <ShoppingCartIcon />}
              onClick={handlePrimaryAction}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 3,
                background: isSupplier ? '#1565c0' : '#1565c0',
                boxShadow: isSupplier 
                  ? '0 8px 16px rgba(46, 125, 50, 0.3)' 
                  : '0 8px 16px rgba(102, 126, 234, 0.3)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: isSupplier 
                    ? '0 12px 20px rgba(46, 125, 50, 0.4)' 
                    : '0 12px 20px rgba(102, 126, 234, 0.4)',
                },
              }}
            >
              {isSupplier ? 'Volver a Inicio' : 'Explorar Marketplace'}
            </Button>

          </Stack>
        </Paper>
      </motion.div>
    </Container>
    </>
  )
}

export default EmptyCartState
