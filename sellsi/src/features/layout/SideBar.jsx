// 📁 components/SideBar.jsx
import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useTheme,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

// Define los ítems de menú para cada rol directamente en este archivo
const buyerMenuItems = [
  { text: 'Marketplace', path: '/buyer/marketplace' },
  { text: 'Mis Pedidos', path: '/buyer/orders' },
  { text: 'Mi Performance', path: '/buyer/performance' },
];

const providerMenuItems = [
  { text: 'Inicio', path: '/supplier/home' },
  { text: 'Mis Productos', path: '/supplier/myproducts' },
  { text: 'Mis Pedidos', path: '/supplier/my-orders' },
  { text: 'Mi Performance', path: '/supplier/myperformance' },
  { text: 'Marketplace', path: '/supplier/marketplace' }, // Cambiado a la nueva ruta
];

/**
 * Componente de SideBar unificado que muestra ítems de menú según el rol.
 * Incluye toda la lógica y estilos.
 * @param {object} props - Las props del componente.
 * @param {'buyer' | 'supplier' | null} props.role - El rol actual del usuario ('buyer' o 'supplier').
 * @param {string} [props.width='375px'] - Ancho opcional de la SideBar. (¡Ancho predeterminado a 375px!)
 */
const SideBar = ({ role, width = '375px' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();

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
        width: width, // <--- El ancho se toma de la prop, o del valor predeterminado si no se pasa.
        height: 'calc(100vh - 64px)', // Se extiende desde top:64px hasta el final de la ventana
        backgroundColor: sidebarBackgroundColor,
        color: '#FFFFFF', // Main text color is WHITE!
        display: { xs: 'none', md: 'flex' }, // Ocultar en móviles, mostrar en desktop
        flexDirection: 'column',
        zIndex: 100, // Asegura que la BottomBar (zIndex: 200) esté por encima
        overflowY: 'hidden', // La barra lateral no se scrollea
        borderRight: 'none', // Asegura que no haya borde derecho

        // Estilos para los ListItemButton generales (incluyendo hover, disabled/activo)
        '& .MuiListItemButton-root': {
          color: '#FFFFFF !important',
          fontWeight: 'normal',
          fontSize: '1.15rem !important',
          borderRadius: '4px !important',
          paddingLeft: '6px !important',
          paddingRight: '6px !important',
          paddingTop: '7px !important',
          paddingBottom: '7px !important',
          minHeight: '36px !important',
          margin: '2px 8px', // Margin around each button
          width: 'calc(100% - 16px)', // Adjust width for 8px margin on each side
          opacity: 1,
          transition: 'all 0.2s ease',

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
          fontSize: '1rem !important',
          letterSpacing: '0px',
        },
      }}
    >
      <List sx={{ pt: 0 }}>
        {menuItemsToDisplay.map((item, index) => {
          const isActive = location.pathname === item.path;
          const isFirstItem = index === 0;

          return (
            <ListItem
              disablePadding
              key={item.text}
              sx={{
                mt: isFirstItem ? '80px' : 0,
                display: 'block',
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
              >
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};

export default SideBar;
