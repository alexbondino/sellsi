import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tooltip, Badge } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PersonIcon from '@mui/icons-material/Person';
import BaseTopBar from './BaseTopBar';
import useCartStore from '../buyer/hooks/cartStore';

/**
 * MarketplaceTopBar - Configuración específica para la página Marketplace
 * - Sin botones de navegación (Quiénes Somos, Servicios, etc.)
 * - "Iniciar Sesión" → "Mi Carro"
 * - "Registrarse" → Icono de perfil con tooltip "Ir a mi perfil"
 */
export default function MarketplaceTopBar() {
  const navigate = useNavigate();

  // Suscribirse a los items del carrito para que se actualice automáticamente
  const items = useCartStore(state => state.items);
  const totalItems = items.length;

  // Handlers específicos para Marketplace
  const handleGoToCart = () => {
    console.log('Navegando a Mi Carro');
    navigate('/buyer/cart');
  };

  const handleGoToProfile = () => {
    console.log('Navegando a perfil');
    // TODO: Implementar navegación al perfil
    // navigate('/profile')
  };

  // Sin botones de navegación para Marketplace
  const navigationButtons = [];
  // Configuración custom para botones de autenticación
  const authButtons = {
    loginButton: {
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
      // Estilos personalizados para el botón Mi Carro con efectos glassmorphism
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
    registerButton: {
      label: (
        <Tooltip title="Ir a mi perfil" arrow>
          <PersonIcon fontSize="large" />
        </Tooltip>
      ),
      onClick: handleGoToProfile,
      // Estilos personalizados para el botón de perfil con efectos glassmorphism
      customStyles: {
        minWidth: '50px', // Botón más compacto para el icono
        width: '50px',
        height: '50px', // Altura igual al ancho para hacer un círculo perfecto
        borderRadius: '50%', // Hace el marco completamente circular
        border: '2px solid rgb(253, 253, 253)', // Borde azul semi-transparente
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
  };
  return (
    <BaseTopBar
      navigationButtons={navigationButtons}
      authButtons={authButtons}
      onNavigate={null} // No hay navegación interna
      showContactModal={false} // No mostrar modal de contacto en Marketplace
      logoMarginLeft={{
        xs: 0,
        sm: 0,
        md: -8, // Más hacia la izquierda
        lg: -28, // Más hacia la izquierda
        xl: -65, // Más hacia la izquierda
      }}
    />
  );
}
