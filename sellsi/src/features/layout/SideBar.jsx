// 📁 components/SideBar.jsx
import React, { useState } from 'react';
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
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

// Define los ítems de menú para cada rol directamente en este archivo con iconos
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
        position: 'fixed', // La barra lateral es fija
        top: '64px', // Comienza justo debajo de la TopBar
        left: 0,
        width: currentWidth, // Ancho dinámico basado en el estado de colapso
        height: 'calc(100vh - 64px)', // Se extiende desde top:64px hasta el final de la ventana
        backgroundColor: sidebarBackgroundColor,
        color: '#FFFFFF', // Main text color is WHITE!
        display: { xs: 'none', md: 'flex' }, // Ocultar en móviles, mostrar en desktop
        flexDirection: 'column',
        zIndex: 100, // Asegura que la BottomBar (zIndex: 200) esté por encima
        overflowY: 'hidden', // La barra lateral no se scrollea
        overflowX: 'hidden', // Evita scroll horizontal durante animaciones
        borderRight: 'none', // Asegura que no haya borde derecho
        transition: 'width 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Animación más suave y lenta

        // Estilos para los ListItemButton generales (incluyendo hover, disabled/activo)
        '& .MuiListItemButton-root': {
          color: '#FFFFFF !important',
          fontWeight: 'normal',
          fontSize: '1.15rem !important',
          borderRadius: '4px !important',
          paddingLeft: isCollapsed ? '12px !important' : '6px !important',
          paddingRight: isCollapsed ? '12px !important' : '6px !important',
          paddingTop: '10px !important', // Padding fijo para evitar movimiento vertical
          paddingBottom: '10px !important', // Padding fijo para evitar movimiento vertical
          minHeight: '48px !important', // Altura fija para evitar movimiento vertical
          height: '48px !important', // Altura fija
          margin: '4px 8px', // Margin fijo
          width: 'calc(100% - 16px)', // Adjust width for 8px margin on each side
          opacity: 1,
          transition: 'padding-left 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), padding-right 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), background-color 0.2s ease',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          alignItems: 'center', // Centrar verticalmente
          display: 'flex', // Asegurar flexbox

          '&:hover': {
            backgroundColor: hoverBackgroundColor,
            color: '#FFFFFF !important',
            transform: 'none',
          },
          // Estilos para el botón cuando está activo/deshabilitado (misma ruta)
          '&.Mui-disabled': {
            backgroundColor: activeBackgroundColor,
            color: '#FFFFFF !important',
            fontWeight: 'normal',
            opacity: 1,
            cursor: 'default',
          },
          // Combinación de activo y hover (mantiene el color activo)
          '&.Mui-disabled:hover': {
            backgroundColor: activeHoverBackgroundColor,
          },
        },
        // Estilos para el texto dentro del ListItemText
        '& .MuiTypography-root': {
          color: '#FFFFFF !important',
          fontWeight: 'normal',
          fontSize: '1.1rem !important',
          letterSpacing: '0px',
          opacity: isCollapsed ? 0 : 1,
          transition: 'opacity 0.4s ease-in-out',
          transform: isCollapsed ? 'translateX(-10px)' : 'translateX(0)',
        },
        // Estilos para los iconos
        '& .MuiListItemIcon-root': {
          color: '#FFFFFF !important',
          minWidth: isCollapsed ? 'auto' : '40px',
          transition: 'min-width 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          '& .MuiSvgIcon-root': {
            fontSize: '2.3rem',
            transition: 'none', // Sin transición para el ícono mismo
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
          height: '56px', // Altura fija para evitar saltos
          alignItems: 'center',
          transition: 'justify-content 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        <Tooltip 
          title={isCollapsed ? "Expandir menú" : "Contraer menú"} 
          placement="right"
          arrow
          componentsProps={{
            tooltip: {
              sx: {
                fontSize: '1.2rem', // 15% más grande que el tamaño por defecto (0.7rem)
                padding: '8px 12px', // Más padding
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

      <List sx={{ pt: 0, flex: 1 }}>
        {menuItemsToDisplay.map((item, index) => {
          const isActive = location.pathname === item.path;
          const isFirstItem = index === 0;

          return (
            <ListItem
              disablePadding
              key={item.text}
              sx={{
                mt: isFirstItem ? '8px' : 0,
                mb: '2px', // Espaciado fijo entre elementos
                display: 'block',
                height: '56px', // Altura fija para cada item
              }}
            >
              <Tooltip 
                title={isCollapsed ? item.text : ""} 
                placement="right"
                arrow
                disableHoverListener={!isCollapsed}
                componentsProps={{
                  tooltip: {
                    sx: {
                      fontSize: '1.2rem', // 15% más grande que el tamaño por defecto
                      padding: '8px 12px', // Más padding para mejor legibilidad
                      maxWidth: 'none', // Sin límite de ancho para textos largos
                      whiteSpace: 'nowrap', // Evita que se corte el texto
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
                    height: '48px', // Altura fija para el botón
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
                        ml: 1, // Margen izquierdo fijo
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
