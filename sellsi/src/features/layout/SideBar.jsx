// 📁 components/SideBar.jsx
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
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

// Define los ítems de menú para cada rol directamente en este archivo con iconos
const buyerMenuItems = [
  { text: 'Marketplace', path: '/buyer/marketplace', icon: <MarketplaceIcon /> },
  { text: 'Mis Pedidos', path: '/buyer/orders', icon: <OrdersIcon /> },
  // { text: 'Mi Performance', path: '/buyer/performance', icon: <PerformanceIcon /> }, // Eliminado
];

const providerMenuItems = [
  { text: 'Inicio', path: '/supplier/home', icon: <HomeIcon /> },
  { text: 'Mis Productos', path: '/supplier/myproducts', icon: <ProductsIcon /> },
  { text: 'Mis Pedidos', path: '/supplier/my-orders', icon: <OrdersIcon /> },
  // { text: 'Mi Performance', path: '/supplier/myperformance', icon: <PerformanceIcon /> }, // Eliminado
  { text: 'Marketplace', path: '/supplier/marketplace', icon: <MarketplaceIcon /> },
];

/**
 * Componente de SideBar unificado que muestra ítems de menú según el rol.
 * Incluye toda la lógica y estilos.
 * @param {object} props - Las props del componente.
 * @param {'buyer' | 'supplier' | null} props.role - El rol actual del usuario ('buyer' o 'supplier').
 * @param {string} [props.width='210px'] - Ancho opcional de la SideBar. (¡Ancho predeterminado a 210px!)
 * @param {function} [props.onWidthChange] - Callback opcional que se llama cuando cambia el ancho de la sidebar.
 */
const SideBar = ({ role, width = '210px', onWidthChange }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);

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
  // Define el color de hover para el elemento activo (aún más oscuro)
  const activeHoverBackgroundColor = '#555555'; // A slightly darker grey for active item on hover

  let menuItemsToDisplay = [];

  if (role === 'buyer') {
    menuItemsToDisplay = buyerMenuItems;
  } else if (role === 'supplier') {
    menuItemsToDisplay = providerMenuItems;
  } else {
    // Si el rol no está definido o es nulo (ej. no logueado), no se mostrarán ítems de menú.
  }

  // Si no hay elementos para mostrar, no renderizamos la SideBar
  if (!role || menuItemsToDisplay.length === 0) {
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
            backgroundColor: activeBackgroundColor,
            color: '#FFFFFF !important',
            fontWeight: 'normal',
            opacity: 1,
            cursor: 'default',
          },
          '&.Mui-disabled:hover': {
            backgroundColor: activeHoverBackgroundColor,
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
        {typeof window !== 'undefined' && !isCollapsed && createPortal(
          <Box
            sx={{
              position: 'fixed',
              left: 0,
              bottom: 24, // 24px sobre el borde inferior de la ventana
              width: currentWidth,
              zIndex: 1000, // Menor que la BottomBar
              textAlign: 'center',
              fontSize: '0.85rem',
              color: '#FFFFFF',
              letterSpacing: '0.5px',
              fontWeight: 400,
              userSelect: 'none',
              pointerEvents: 'none',
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.2,
            }}
          >
            <InfoIcon sx={{ fontSize: '1em', mr: 0.5, color: '#90caf9', verticalAlign: 'middle' }} />
            Versión 1.0.0
          </Box>,
          document.body
        )}
      </Box>
    </Box>
  );
};

/**
 * Componente Provider que automáticamente determina el rol basado en la ruta actual
 * y renderiza la SideBar correspondiente.
 */
const SideBarProvider = ({ width, onWidthChange }) => {
  const location = useLocation();
  
  // Determinar el rol basado en la ruta actual
  const getCurrentRole = () => {
    const pathname = location.pathname;
    if (pathname.startsWith('/buyer')) return 'buyer';
    if (pathname.startsWith('/supplier')) return 'supplier';
    return null;
  };

  const role = getCurrentRole();

  // Solo renderizar si hay un rol válido
  if (!role) return null;

  return <SideBar role={role} width={width} onWidthChange={onWidthChange} />;
};

export default SideBar;
export { SideBarProvider };
