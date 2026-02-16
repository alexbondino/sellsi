// 📁 shared/components/navigation/MobileBar/ProfileDrawer.jsx
import React from 'react';
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Typography,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  ShoppingBag as OrdersIcon,
  LocalOffer as OffersIcon,
  Inventory as ProductsIcon,
  Help as HelpIcon,
  AttachMoney as FinancingIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useBodyScrollLock } from '../../../hooks/useBodyScrollLock';
import { useFeatureFlag } from '../../../hooks/useFeatureFlag';
import { supabase } from '../../../../services/supabase';

/**
 * ProfileDrawer - Drawer lateral que se abre al hacer clic en "Mi Perfil" en MobileBar
 * Inspirado en el patrón de MercadoLibre
 * 
 * @param {object} props
 * @param {boolean} props.open - Estado de apertura del drawer
 * @param {function} props.onClose - Callback para cerrar el drawer
 * @param {string} props.userName - Nombre del usuario
 * @param {string} props.logoUrl - URL del logo/avatar del usuario
 * @param {boolean} props.isBuyer - Si el usuario es comprador
 * @param {boolean} props.isSupplier - Si el usuario es proveedor
 * @param {boolean} props.mainSupplier - Si main_supplier es true
 */
const ProfileDrawer = ({
  open,
  onClose,
  userName = 'Usuario',
  logoUrl,
  isBuyer = false,
  isSupplier = false,
  mainSupplier = false,
}) => {
  const navigate = useNavigate();

  // Obtener iniciales del nombre
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Manejar navegación
  const handleNavigate = (path) => {
    onClose();
    navigate(path);
  };

  // Bloquear scroll del body mientras el drawer está abierto
  useBodyScrollLock(open);

  // Manejar logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      // Silenciar error
    }
    onClose();
    navigate('/');
  };

  // Feature flag para financiamientos
  const { enabled: financingEnabled } = useFeatureFlag({
    workspace: 'my-financing',
    key: 'financing_enabled',
    defaultValue: false,
  });

  // Menú de opciones según el rol
  const buyerMenuItems = [
    { icon: <PersonIcon />, text: 'Mi Perfil', path: '/buyer/profile' },
    { icon: <OrdersIcon />, text: 'Mis Pedidos', path: '/buyer/orders' },
    { icon: <OffersIcon />, text: 'Mis Ofertas', path: '/buyer/offers' },
    ...(financingEnabled ? [{ icon: <FinancingIcon />, text: 'Mis Financiamientos', path: '/buyer/my-financing' }] : []),
  ];

  const supplierMenuItems = [
    { icon: <PersonIcon />, text: 'Mi Perfil', path: '/supplier/profile' },
    { icon: <ProductsIcon />, text: 'Mis Productos', path: '/supplier/myproducts' },
    { icon: <OrdersIcon />, text: 'Mis Pedidos', path: '/supplier/my-orders' },
    { icon: <OffersIcon />, text: 'Mis Ofertas', path: '/supplier/offers' },
    ...(financingEnabled ? [{ icon: <FinancingIcon />, text: 'Mis Financiamientos', path: '/supplier/my-financing' }] : []),
  ];

  // Determinar ruta de configuración según el rol
  const profilePath = isBuyer ? '/buyer/profile' : '/supplier/profile';
  
  const commonMenuItems = [
    { icon: <SettingsIcon />, text: 'Configuración', path: profilePath },
    { icon: <HelpIcon />, text: 'Ayuda', path: '/faq' },
  ];

  const menuItems = isBuyer ? buyerMenuItems : isSupplier ? supplierMenuItems : [];

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: (theme) => `clamp(240px, 70vw, 360px)`,
          backgroundColor: '#fff',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          right: 0,
          left: 'auto',
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1401, // Justo encima de MobileBar (1400)
          },
        },
      }}
      PaperProps={{
        sx: {
          zIndex: 1402, // Drawer panel encima del backdrop
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
        },
      }}
    >
      {/* Header con Perfil */}
      <Box
        sx={{
          background: (theme) => `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
          padding: '16px',
          borderBottom: 'solid 1px rgba(255, 255, 255, 0.1)',
          position: 'relative',
        }}
      >
        {/* Botón cerrar */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: 'rgba(255, 255, 255, 0.9)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>

        {/* Perfil de usuario (left aligned content) */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            mt: { xs: 0.8, sm: 1 },
            justifyContent: 'flex-start',
          }}
          onClick={() => handleNavigate(isBuyer ? '/buyer/profile' : '/supplier/profile')}
        >
          <Avatar
            src={logoUrl && typeof logoUrl === 'string' && logoUrl.trim() !== '' ? logoUrl : undefined}
            sx={{
              width: 56,
              height: 56,
              background: logoUrl && typeof logoUrl === 'string' && logoUrl.trim() !== '' 
                ? 'transparent' 
                : '#fff',
              color: '#667eea',
              fontWeight: 600,
              fontSize: '1.2rem',
            }}
          >
            {!logoUrl && getInitials(userName)}
          </Avatar>
          <Box ml={2} flex={1} sx={{ textAlign: 'left' }}>
            <Typography
              variant="body1"
              sx={{
                color: '#fff',
                fontWeight: 600,
                fontSize: '1.1rem',
              }}
            >
              {userName}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              Rol Principal: {mainSupplier ? 'Proveedor' : 'Comprador'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Lista de Menú */}
      <List
        sx={{
          padding: '8px 0',
          flex: 1,
          overflowY: 'auto',
          pb: (theme) => `calc(${theme.spacing(2)} + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        {menuItems.map((item, index) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => handleNavigate(item.path)}
              sx={{
                py: { xs: 1.3, sm: 1.5 },
                px: 2,
                '&:hover': {
                  backgroundColor: (theme) => `${theme.palette.primary.main}15`,
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: (theme) => theme.palette.primary.main,
                  mr: 2,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  color: '#333',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}

        <Divider sx={{ my: 1 }} />

        {/* Opciones comunes */}
        {commonMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => handleNavigate(item.path)}
              sx={{
                py: { xs: 1.3, sm: 1.5 },
                px: 2,
                '&:hover': {
                  backgroundColor: (theme) => `${theme.palette.primary.main}15`,
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: (theme) => theme.palette.primary.main,
                  mr: 2,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  color: '#333',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}

        <Divider sx={{ my: 1 }} />

        {/* Cerrar Sesión */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              py: { xs: 1.3, sm: 1.5 },
              px: 2,
              '&:hover': {
                backgroundColor: 'rgba(244, 67, 54, 0.08)',
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
                color: '#f44336',
                mr: 2,
              }}
            >
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText
              primary="Cerrar Sesión"
              primaryTypographyProps={{
                fontSize: '0.95rem',
                fontWeight: 500,
                color: '#f44336',
              }}
            />
          </ListItemButton>
        </ListItem>
      </List>

      {/* Footer con versión/info */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid #e0e0e0',
          backgroundColor: '#f5f5f5',
          paddingBottom: (theme) => `calc(${theme.spacing(2)} + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            display: 'block',
            textAlign: 'center',
          }}
        >
          Sellsi © {new Date().getFullYear()}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            display: 'block',
            textAlign: 'center',
            fontSize: '0.7rem',
          }}
        >
          {isBuyer ? 'Cuenta Comprador' : 'Cuenta Proveedor'}
        </Typography>
      </Box>
    </Drawer>
  );
};

export default ProfileDrawer;
