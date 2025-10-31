// 📁 shared/components/navigation/SideBar/SideBar.jsx
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  MenuOpen as MenuOpenIcon,
  Menu as MenuIcon,
  Store as MarketplaceIcon,
  ShoppingBag as OrdersIcon,
  TrendingUp as PerformanceIcon,
  Home as HomeIcon,
  Inventory as ProductsIcon,
  InfoOutlined as InfoIcon,
  LocalOffer as OffersIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { prefetchOnHover, prefetchForPath } from '../../../../infrastructure/prefetch/prefetch';
import { useRole } from '../../../../infrastructure/providers';
import { useAuth } from '../../../../infrastructure/providers';

// Define los ítems de menú para cada rol directamente en este archivo con iconos
const buyerMenuItems = [
  { text: 'Marketplace', path: '/buyer/marketplace', icon: <MarketplaceIcon /> },
  { text: 'Mis Ofertas', path: '/buyer/offers', icon: <OffersIcon /> },
  { text: 'Mis Pedidos', path: '/buyer/orders', icon: <OrdersIcon /> },
  // { text: 'Mi Performance', path: '/buyer/performance', icon: <PerformanceIcon /> }, // Eliminado
];

const providerMenuItems = [
  { text: 'Inicio', path: '/supplier/home', icon: <HomeIcon /> },
  { text: 'Mis Ofertas', path: '/supplier/offers', icon: <OffersIcon /> },
  { text: 'Mis Productos', path: '/supplier/myproducts', icon: <ProductsIcon /> },
  { text: 'Mis Pedidos', path: '/supplier/my-orders', icon: <OrdersIcon /> },
  // { text: 'Mi Performance', path: '/supplier/myperformance', icon: <PerformanceIcon /> }, // Eliminado
  // Marketplace oculto para supplier
];

/**
 * Componente de SideBar unificado que se adapta automáticamente a la página actual.
 * Determina el rol basándose en la ruta actual, similar al comportamiento del switch.
 * @param {object} props - Las props del componente.
 * @param {'buyer' | 'supplier' | null} props.role - El rol del perfil del usuario (usado como fallback para rutas neutrales).
 * @param {string} [props.width='210px'] - Ancho opcional de la SideBar.
 * @param {function} [props.onWidthChange] - Callback opcional que se llama cuando cambia el ancho de la sidebar.
 */
const SideBar = ({ role, width = '210px', onWidthChange }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { userProfile, session } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Never render sidebar if user is not authenticated
  if (!session) return null;

  // Determine role with a clear precedence to avoid unintended switches when
  // navigating to neutral pages like product detail. Precedence:
  // 1. `role` prop (AppShell/currentAppRole) - authoritative when provided
  // 2. `location.state.from` - preserve sidebar based on navigation origin
  // 3. Route-based detection (buyer/supplier/provider paths)
  // 4. userProfile fallback
  const determineEffectiveRole = () => {
    // 1) prop from AppShell (most authoritative)
    if (role === 'buyer' || role === 'supplier') return role;

    // 2) preserve origin if navigator passed it (ProductCard/ProductPageWrapper set location.state.from)
    try {
      const fromState = location.state && location.state.from;
      if (typeof fromState === 'string') {
        if (fromState.startsWith('/supplier')) return 'supplier';
        if (fromState.startsWith('/buyer')) return 'buyer';
        if (fromState.startsWith('/provider')) return 'supplier';
      }
    } catch (e) {
      // ignore malformed state
    }

    // 3) route-based detection (includes /provider and marketplace product paths)
    const p = location.pathname;
    if (p.startsWith('/supplier/') || p.startsWith('/provider/')) return 'supplier';
    if (p.startsWith('/buyer/')) return 'buyer';
    // product detail under marketplace should keep current profile role if available
    if (p.startsWith('/marketplace/product')) {
      // fallback to userProfile (below)
    }

    // 4) user profile fallback
    if (userProfile) return userProfile.main_supplier ? 'supplier' : 'buyer';

    return null;
  };

  const effectiveRole = determineEffectiveRole();

  // Calcular el ancho colapsado (40% del ancho original)
  const expandedWidth = width;
  const collapsedWidth = `${Math.round(parseInt(width.replace('px', '')) * 0.4)}px`;
  const currentWidth = isCollapsed ? collapsedWidth : expandedWidth;

  // Notificar cambios de ancho al componente padre si el callback está disponible
  React.useEffect(() => {
    if (onWidthChange) {
      onWidthChange(currentWidth, isCollapsed);
    }
  }, [currentWidth, isCollapsed, onWidthChange]);

  // Handler para toggle del colapso
  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Define el color exacto del fondo de la sidebar
  const sidebarBackgroundColor = '#2C2C2C'; // Dark grey background
  // Define un color de hover para los elementos no activos (un blanco transparente sobre el fondo)
  const hoverBackgroundColor = 'rgba(255, 255, 255, 0.15)'; // White with 15% opacity for hover
  // Define el color de fondo para el elemento activo (un tono ligeramente más claro o distinto que el fondo general)
  const activeBackgroundColor = '#4d4d4d'; // A slightly lighter grey for the active item


  let menuItemsToDisplay = [];

  // ✅ CAMBIO: Usar rol efectivo (adaptativo) en lugar del rol prop
  if (effectiveRole === 'buyer') {
    menuItemsToDisplay = buyerMenuItems;
  } else if (effectiveRole === 'supplier') {
    menuItemsToDisplay = providerMenuItems;
  } else {
    // Si el rol no está definido o es nulo (ej. no logueado), no se mostrarán ítems de menú.
  }

  // Asegurarse que en desktop el botón "Mis Ofertas" se muestre al final de la lista
  try {
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
    if (isDesktop && menuItemsToDisplay && menuItemsToDisplay.length > 0) {
      const offersItems = menuItemsToDisplay.filter(item => item.path && item.path.includes('/offers'));
      if (offersItems.length > 0) {
        // Filtrar los items que no son ofertas y luego anexar las ofertas al final
        menuItemsToDisplay = menuItemsToDisplay.filter(item => !(item.path && item.path.includes('/offers')));
        menuItemsToDisplay = [...menuItemsToDisplay, ...offersItems];
      }
    }
  } catch (e) {
    // useMediaQuery puede fallar durante SSR; en ese caso no reordenamos y dejamos la lista como está.
  }

  // ✅ CAMBIO: Verificar rol efectivo en lugar del prop role
  if (!effectiveRole || menuItemsToDisplay.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: '64px',
        left: 0,
        width: currentWidth,
        height: '100vh',
        backgroundColor: sidebarBackgroundColor,
        color: '#FFFFFF',
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        zIndex: 900,
        overflowY: 'hidden',
        overflowX: 'hidden',
        borderRight: 'none',
        transition: 'width 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        // ...estilos existentes...
        '& .MuiListItemButton-root': {
          color: '#FFFFFF !important',
          fontWeight: 'normal',
          fontSize: '1.15rem !important',
          borderRadius: '4px !important',
          paddingLeft: isCollapsed ? '12px !important' : '6px !important',
          paddingRight: isCollapsed ? '12px !important' : '6px !important',
          paddingTop: '10px !important',
          paddingBottom: '10px !important',
          minHeight: '48px !important',
          height: '48px !important',
          margin: '4px 8px',
          width: 'calc(100% - 16px)',
          opacity: 1,
          transition: 'padding-left 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), padding-right 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), background-color 0.2s ease',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          alignItems: 'center',
          display: 'flex',
          '&:hover': {
            backgroundColor: hoverBackgroundColor,
            color: '#FFFFFF !important',
            transform: 'none',
          },
          '&.Mui-disabled': {
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText + ' !important',
            fontWeight: 'normal',
            opacity: 1,
            cursor: 'default',
            transition: 'background-color 0.2s, color 0.2s',
          },
          '&.Mui-disabled:hover': {
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText + ' !important',
          },
        },
        '& .MuiTypography-root': {
          color: '#FFFFFF !important',
          fontWeight: 'normal',
          fontSize: '1.1rem !important',
          letterSpacing: '0px',
          opacity: isCollapsed ? 0 : 1,
          transition: 'opacity 0.4s ease-in-out',
          transform: isCollapsed ? 'translateX(-10px)' : 'translateX(0)',
        },
        '& .MuiListItemIcon-root': {
          color: '#FFFFFF !important',
          minWidth: isCollapsed ? 'auto' : '40px',
          transition: 'min-width 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          '& .MuiSvgIcon-root': {
            fontSize: '2.3rem',
            transition: 'none',
          },
        },
      }}
    >
      {/* Botón de toggle en la parte superior */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: isCollapsed ? 'center' : 'flex-end',
          padding: '16px 12px 12px 12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '12px',
          height: '56px',
          alignItems: 'center',
          transition: 'justify-content 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        <Tooltip
          key={isCollapsed ? 'collapsed' : 'expanded'}
          title={isCollapsed ? "Expandir menú" : "Contraer menú"}
          placement="right"
          arrow
          componentsProps={{
            tooltip: {
              sx: {
                fontSize: '1.2rem',
                padding: '8px 12px',
                maxWidth: 'none',
              }
            }
          }}
        >
          <IconButton
            onClick={handleToggleCollapse}
            aria-label={isCollapsed ? "Expandir menú" : "Contraer menú"}
            sx={{
              color: '#FFFFFF',
              width: '40px',
              height: '40px',
              '&:hover': {
                backgroundColor: hoverBackgroundColor,
              },
              transition: 'background-color 0.2s ease',
            }}
          >
            {isCollapsed ? <MenuIcon /> : <MenuOpenIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <List sx={{ pt: 0 }}>
          {menuItemsToDisplay.map((item, index) => {
            const isActive = location.pathname === item.path;
            const isFirstItem = index === 0;
            // attach hover prefetch for known heavy routes (use mapping to concrete imports)
            const hoverHandlers = prefetchOnHover(() => prefetchForPath(item.path), item.path);

            return (
              <ListItem
                disablePadding
                key={item.text}
                sx={{
                  mt: isFirstItem ? '8px' : 0,
                  mb: '2px',
                  display: 'block',
                  height: '56px',
                }}
              >
                <Tooltip
                  key={isCollapsed ? `collapsed-${item.text}` : `expanded-${item.text}`}
                  title={isCollapsed ? item.text : ""}
                  placement="right"
                  arrow
                  disableHoverListener={!isCollapsed}
                  componentsProps={{
                    tooltip: {
                      sx: {
                        fontSize: '1.2rem',
                        padding: '8px 12px',
                        maxWidth: 'none',
                        whiteSpace: 'nowrap',
                      }
                    }
                  }}
                >
                  <ListItemButton
                    onClick={() => {
                      if (!isActive) {
                        navigate(item.path);
                        setTimeout(() => {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }, 100);
                      }
                    }}
                    onMouseEnter={(e) => { hoverHandlers.onMouseEnter(e); }}
                    onMouseLeave={(e) => hoverHandlers.onMouseLeave(e)}
                    onFocus={(e) => hoverHandlers.onFocus(e)}
                    disabled={isActive}
                    sx={{
                      height: '48px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        justifyContent: 'center',
                        alignItems: 'center',
                        display: 'flex',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {!isCollapsed && (
                      <ListItemText
                        primary={item.text}
                        sx={{
                          ml: 1,
                          '& .MuiTypography-root': {
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }
                        }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            );
          })}
        </List>
        <Box sx={{ flex: 1 }} />
        {/* Versión eliminada */}
      </Box>
    </Box>
  );
};

// ============================================================================
// 🎯 REFACTORIZACIÓN COMPLETA: ARQUITECTURA PROFESIONAL
// ============================================================================
// 
// ✅ ELIMINADO: SideBarProvider redundante
// ✅ CENTRALIZADO: Control único desde AppShell
// ✅ OPTIMIZADO: Sin duplicaciones de renderizado
// 
// El AppShell es ahora el único responsable de renderizar la SideBar,
// eliminando todas las instancias redundantes en componentes individuales.
// ============================================================================

export default SideBar;
