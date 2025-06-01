import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Tooltip } from '@mui/material'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import PersonIcon from '@mui/icons-material/Person'
import BaseTopBar from './shared/BaseTopBar'

/**
 * MarketplaceTopBar - Configuración específica para la página Marketplace
 * - Sin botones de navegación (Quiénes Somos, Servicios, etc.)
 * - "Iniciar Sesión" → "Mi Carro"
 * - "Registrarse" → Icono de perfil con tooltip "Ir a mi perfil"
 */
export default function MarketplaceTopBar() {
  const navigate = useNavigate()

  // Handlers específicos para Marketplace
  const handleGoToCart = () => {
    console.log('Navegando a Mi Carro')
    // TODO: Implementar navegación al carrito
    // navigate('/cart')
  }

  const handleGoToProfile = () => {
    console.log('Navegando a perfil')
    // TODO: Implementar navegación al perfil
    // navigate('/profile')
  }

  // Sin botones de navegación para Marketplace
  const navigationButtons = []
  // Configuración custom para botones de autenticación
  const authButtons = {
    loginButton: {
      label: (
        <React.Fragment>
          <ShoppingCartIcon sx={{ mr: 1 }} />
          Mi Carro
        </React.Fragment>
      ),
      onClick: handleGoToCart,
      // Estilos personalizados para el botón Mi Carro
      customStyles: {
        minWidth: '180px', // Ancho mínimo del botón
        minHeight: '40px', // Altura mínima del botón
        width: 'auto', // Permite que se ajuste al contenido
        // maxWidth: '200px', // Opcional: ancho máximo
        // px: 3, // Opcional: padding horizontal
      },
    },
    registerButton: {
      label: (
        <Tooltip title="Ir a mi perfil" arrow>
          <PersonIcon fontSize="large" />
        </Tooltip>
      ),
      onClick: handleGoToProfile,
      // Estilos personalizados para el botón de perfil
      customStyles: {
        minWidth: '50px', // Botón más compacto para el icono
        width: '50px',
        height: '40px',
        borderRadius: '8px',
      },
    },
  }

  return (
    <BaseTopBar
      navigationButtons={navigationButtons}
      authButtons={authButtons}
      onNavigate={null} // No hay navegación interna
      showContactModal={false} // No mostrar modal de contacto en Marketplace
    />
  )
}
