import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tooltip, Badge, Menu, MenuItem, IconButton } from '@mui/material'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import PersonIcon from '@mui/icons-material/Person'
import BaseTopBar from './BaseTopBar'
import useCartStore from '../buyer/hooks/cartStore'
import { supabase } from '../../services/supabase'

/**
 * MarketplaceTopBar - Configuración específica para la página Marketplace
 * - Sin botones de navegación (Quiénes Somos, Servicios, etc.)
 * - "Iniciar Sesión" → "Mi Carro"
 * - "Registrarse" → Icono de perfil con tooltip "Ir a mi perfil"
 */
export default function MarketplaceTopBar() {
  const navigate = useNavigate()

  // Suscribirse a los items del carrito para que se actualice automáticamente
  const items = useCartStore((state) => state.items)
  const totalItems = items.length

  // Estado para el menú de perfil
  const [profileAnchor, setProfileAnchor] = useState(null)
  const openProfileMenu = (e) => setProfileAnchor(e.currentTarget)
  const closeProfileMenu = () => setProfileAnchor(null)
  // Handler de logout igual que en BaseTopBar
  const handleLogout = async () => {
    try {
      localStorage.removeItem('user_id')
      localStorage.removeItem('account_type')
      localStorage.removeItem('supplierid')
      localStorage.removeItem('sellerid')
      
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error during logout:', error)
      }
      
      closeProfileMenu()
      navigate('/')
    } catch (error) {
      console.error('Logout error:', error)
      closeProfileMenu()
      navigate('/')
    }
  }

  const handleGoToCart = () => {
    navigate('/buyer/cart')
  }
  // El botón de perfil ahora abre el menú
  const profileButton = (
    <Tooltip title="Ir a mi perfil" arrow>
      <IconButton
        onClick={openProfileMenu}
        sx={{
          minWidth: '50px',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          border: '2px solid rgb(253, 253, 253)',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(12px)',
          boxShadow:
            '0 0 0 1px rgba(25, 118, 210, 0.2), 0 4px 12px rgba(25, 118, 210, 0.15), 0 0 20px rgba(25, 118, 210, 0.1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            border: '2px solid rgba(25, 118, 210, 0.7)',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            boxShadow:
              '0 0 0 2px rgba(25, 118, 210, 0.3), 0 6px 16px rgba(25, 118, 210, 0.25), 0 0 30px rgba(25, 118, 210, 0.2)',
            transform: 'scale(1.05)',
          },
          '&:active': {
            transform: 'scale(0.98)',
            boxShadow:
              '0 0 0 1px rgba(25, 118, 210, 0.4), 0 2px 8px rgba(25, 118, 210, 0.2)',
          },
        }}
      >
        <PersonIcon fontSize="large" />
      </IconButton>
    </Tooltip>
  )
  const navigationButtons = []
  const authButtons = {
    login: {
      label: (
        <Tooltip title="Carrito" arrow>
          <Badge
            badgeContent={totalItems}
            color="error"
            sx={{
              '& .MuiBadge-badge': {
                right: -3,
                top: 3,
                fontSize: '0.75rem',
                fontWeight: 'bold',
                backgroundColor: '#f44336',
                color: 'white',
                minWidth: '18px',
                height: '18px',
                borderRadius: '9px',
              },
            }}
          >
            <ShoppingCartIcon sx={{ margin: 0 }} />
          </Badge>
        </Tooltip>
      ),
      onClick: handleGoToCart,
      customStyles: {
        minWidth: '60px', // Ancho mínimo del botón para mantener simetría con el perfil
        minHeight: '50px', // Altura mínima del botón
        width: '60px', // Ancho fijo para mantener simetría con el botón de perfil
        height: '50px', // Altura fija igual al botón de perfil
        display: 'flex', // Para centrar el contenido
        alignItems: 'center', // Centrar verticalmente
        justifyContent: 'center', // Centrar horizontalmente
        padding: 0, // Eliminar padding para centrado perfecto
        borderRadius: '12px', // Esquinas redondeadas elegantes
        border: '2px solid rgb(255, 255, 255)', // Borde azul semi-transparente
        backgroundColor: 'rgba(255, 255, 255, 0.08)', // Fondo glassmorphism
        backdropFilter: 'blur(12px)', // Efecto de desenfoque
        boxShadow:
          '0 0 0 1px rgba(25, 118, 210, 0.2), 0 4px 12px rgba(25, 118, 210, 0.15), 0 0 20px rgba(25, 118, 210, 0.1)', // Triple sombra con glow
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', // Transición suave
        '&:hover': {
          border: '2px solid rgba(25, 118, 210, 0.7)', // Borde más intenso en hover
          backgroundColor: 'rgba(255, 255, 255, 0.12)', // Fondo más visible en hover
          boxShadow:
            '0 0 0 2px rgba(25, 118, 210, 0.3), 0 6px 16px rgba(25, 118, 210, 0.25), 0 0 30px rgba(25, 118, 210, 0.2)', // Sombra más intensa en hover
          transform: 'scale(1.05)', // Ligero aumento de tamaño en hover
        },
        '&:active': {
          transform: 'scale(0.98)', // Ligera reducción al hacer clic
          boxShadow:
            '0 0 0 1px rgba(25, 118, 210, 0.4), 0 2px 8px rgba(25, 118, 210, 0.2)', // Sombra reducida al hacer clic
        },
      },
    },
  }

  return (
    <>
      {' '}
      <BaseTopBar
        navigationButtons={navigationButtons}
        authButtons={authButtons}
        customRightElement={profileButton} // Pasar el botón de perfil como elemento especial
        onNavigate={null} // No hay navegación interna
        showContactModal={false} // No mostrar modal de contacto en Marketplace
        logoMarginLeft={{
          xs: 0,
          sm: 0,
          md: -8, // Más hacia la izquierda
          lg: -28, // Más hacia la izquierda
          xl: -65, // Más hacia la izquierda
        }}
        sx={{
          backgroundColor: 'red',
          border: '6px solid yellow',
          zIndex: 9999,
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: 80,
        }}
      />
      <Menu
        anchorEl={profileAnchor}
        open={Boolean(profileAnchor)}
        onClose={closeProfileMenu}
        sx={{ '& .MuiPaper-root': { minWidth: 150 } }}
      >
        <MenuItem onClick={handleLogout}>Cerrar sesión</MenuItem>
      </Menu>
    </>
  )
}
