// 📁 components/MobileBar.jsx
import React from 'react';
import {
  Box,
  IconButton,
  Typography,
  Badge,
  useTheme,
  useMediaQuery,
  Avatar,
} from '@mui/material';
import {
  Store as MarketplaceIcon,
  ShoppingBag as OrdersIcon,
  TrendingUp as PerformanceIcon,
  Home as HomeIcon,
  Inventory as ProductsIcon,
  ShoppingCart as CartIcon,
  Person as ProfileIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import useCartStore from '../buyer/hooks/cartStore';

// Define los ítems de menú para cada rol
const buyerMenuItems = [
  { text: 'Marketplace', path: '/buyer/marketplace', icon: <MarketplaceIcon /> },
  { text: 'Mis Pedidos', path: '/buyer/orders', icon: <OrdersIcon /> },
  { text: 'Mi Performance', path: '/buyer/performance', icon: <PerformanceIcon /> },
];

const providerMenuItems = [
  { text: 'Inicio', path: '/supplier/home', icon: <HomeIcon /> },
  { text: 'Mis Productos', path: '/supplier/myproducts', icon: <ProductsIcon /> },
  { text: 'Mis Pedidos', path: '/supplier/my-orders', icon: <OrdersIcon /> },
  { text: 'Mi Performance', path: '/supplier/myperformance', icon: <PerformanceIcon /> },
  { text: 'Marketplace', path: '/supplier/marketplace', icon: <MarketplaceIcon /> },
];

/**
 * Componente de MobileBar que muestra navegación inferior en móviles
 * Incluye los elementos de navegación principales + carrito y perfil
 * @param {object} props - Las props del componente.
 * @param {'buyer' | 'supplier' | null} props.role - El rol actual del usuario ('buyer' o 'supplier').
 * @param {boolean} props.session - Si hay sesión activa
 * @param {boolean} props.isBuyer - Si el usuario es comprador
 */
const MobileBar = ({ role, session, isBuyer, logoUrl }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const itemsInCart = useCartStore(state => state.items).length;

  // Solo mostrar en móviles y si hay sesión
  if (!isMobile || !session || !role) {
    return null;
  }

  let menuItemsToDisplay = [];
  
  if (role === 'buyer') {
    menuItemsToDisplay = buyerMenuItems;
  } else if (role === 'supplier') {
    menuItemsToDisplay = providerMenuItems;
  }

  // Agregar carrito solo para buyers
  const extraItems = [];
  if (role === 'buyer') {
    extraItems.push({
      text: 'Carrito',
      path: '/buyer/cart',
      icon: (
        <Badge badgeContent={itemsInCart} color="error">
          <CartIcon sx={{ color: '#fff' }} />
        </Badge>
      ),
    });
  }

  // Agregar perfil para todos
  const profilePath = isBuyer ? '/buyer/profile' : '/supplier/profile';
  extraItems.push({
    text: 'Mi Perfil',
    path: profilePath,
    icon: logoUrl ? (
      <Avatar
        src={logoUrl}
        alt="Avatar"
        sx={{ width: 24, height: 24, bgcolor: 'primary.main', color: '#fff', fontSize: 18 }}
      />
    ) : (
      <ProfileIcon />
    ),
  });

  const allItems = [...menuItemsToDisplay, ...extraItems];

  const handleItemClick = (path) => {
    navigate(path);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#2C2C2C',
        color: '#FFFFFF',
        display: { xs: 'flex', md: 'none' },
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '8px 4px',
        zIndex: 1000,
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
      }}
    >
      {allItems.map((item, index) => {
        const isActive = location.pathname === item.path;
        
        return (
          <Box
            key={item.text}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              cursor: 'pointer',
              py: 1,
              px: 0.5,
              borderRadius: 2,
              transition: 'all 0.2s ease',
              backgroundColor: isActive ? theme.palette.primary.main : 'transparent',
              '&:hover': {
                backgroundColor: isActive ? theme.palette.primary.dark : 'rgba(255, 255, 255, 0.05)',
                '& .MuiIconButton-root': {
                  color: '#FFFFFF',
                },
                '& .MuiTypography-root': {
                  color: '#FFFFFF',
                },
              },
            }}
            onClick={() => handleItemClick(item.path)}
          >
            <IconButton
              sx={{
                color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
                padding: '6px',
                '&:hover': {
                  backgroundColor: 'transparent',
                  color: '#FFFFFF',
                },
                '& .MuiSvgIcon-root': {
                  fontSize: '1.5rem',
                },
              }}
              disabled={isActive}
            >
              {item.icon}
            </IconButton>
            <Typography
              variant="caption"
              sx={{
                color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
                fontWeight: isActive ? 600 : 400,
                fontSize: '0.7rem',
                textAlign: 'center',
                lineHeight: 1,
                mt: 0.5,
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                transition: 'color 0.2s ease',
              }}
            >
              {item.text}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

export default MobileBar;
