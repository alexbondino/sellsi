// 📁 components/Sidebar.jsx
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
  { text: 'Mis Pedidos', path: '/supplier/myorders' },
  { text: 'Mi Performance', path: '/supplier/myperformance' },
  { text: 'Marketplace', path: '/buyer/marketplace' }, // Proveedor también necesita acceso al marketplace
];

/**
 * Componente de Sidebar unificado que muestra ítems de menú según el rol.
 * Incluye toda la lógica y estilos.
 * @param {object} props - Las props del componente.
 * @param {'buyer' | 'supplier' | null} props.role - El rol actual del usuario ('buyer' o 'supplier').
 * @param {string} [props.width='210px'] - Ancho opcional de la sidebar.
 */
const Sidebar = ({ role, width = '210px' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();

  let menuItemsToDisplay = [];

  if (role === 'buyer') {
    menuItemsToDisplay = buyerMenuItems;
  } else if (role === 'supplier') {
    menuItemsToDisplay = providerMenuItems;
  } else {
    // Si el rol no está definido o es nulo (ej. no logueado), no se mostrarán ítems de menú.
    // Esto es consistente con la lógica de App.jsx de no mostrar la sidebar si no hay sesión.
    // console.warn(`Rol desconocido o nulo: ${role}. La Sidebar no mostrará elementos.`); // Puedes descomentar para depurar
  }

  // Si no hay elementos para mostrar, no renderizamos la sidebar
  // La condición de display en el Box de App.jsx ya debería manejar esto,
  // pero esta es una capa de seguridad para evitar renderizar una sidebar vacía.
  if (!role || menuItemsToDisplay.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: '64px', // Comienza justo debajo de la TopBar
        left: 0,
        width: width,
        height: 'calc(100vh - 64px)', // Se extiende desde top:64px hasta el final de la ventana
        backgroundColor: '#a3a3a3', // Color de fondo gris
        color: 'black',
        display: { xs: 'none', md: 'flex' }, // Ocultar en móviles, mostrar en desktop
        flexDirection: 'column',
        zIndex: theme.zIndex.appBar - 1, // Justo debajo de la TopBar (appBar por defecto es 1100)
        overflowY: 'auto',
        borderRight: 'none', // Asegúrate de que no haya un borde visible por defecto

        // Estilos para los ListItemButton generales (incluyendo hover, disabled/activo)
        '& .MuiListItemButton-root': {
          color: '#000 !important',
          fontWeight: 'bold !important',
          fontSize: '1.15rem !important',
          borderRadius: '4px !important',
          paddingLeft: '6px !important',
          paddingRight: '6px !important',
          paddingTop: '7px !important',
          paddingBottom: '7px !important',
          minHeight: '36px !important',
          margin: '2px 8px', // Margen alrededor de cada botón
          width: 'calc(100% - 16px)', // Ajusta el ancho para el margen
          opacity: 1, // Asegura que no haya opacidad por defecto en disabled
          transition: 'all 0.2s ease',

          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.08)', // Color para hover (cuando no está activo)
            color: '#000 !important',
            transform: 'none',
          },
          // Estilos para el botón cuando está activo/deshabilitado (misma ruta)
          '&.Mui-disabled': {
            backgroundColor: 'rgba(0, 0, 0, 0.12)',
            color: '#000 !important',
            opacity: 1, // Asegura que el texto sea completamente visible
            cursor: 'default', // Cambia el cursor para indicar que no es clickeable
          },
          // Combinación de activo y hover (mantiene el color activo)
          '&.Mui-disabled:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.12)',
          },
        },
        // Estilos para el texto dentro del ListItemText
        '& .MuiTypography-root': {
          color: '#000 !important',
          fontWeight: 'bold !important',
          fontSize: '1.15rem !important',
          letterSpacing: '0px', // Asegura no espaciado extra
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
                // Ajusta el margen superior del primer item para dejar espacio visible desde la topbar
                // Si la topbar es 64px y quieres un espacio adicional, usa un valor mayor.
                // 80px es 64px + 16px de espacio, o puedes ajustarlo para que el primer ítem no esté tan abajo.
                mt: isFirstItem ? '80px' : 0,
                display: 'block', // Asegura que el ListItem ocupe todo el ancho disponible
              }}
            >
              <ListItemButton
                onClick={() => {
                  if (!isActive) {
                    navigate(item.path);
                    // Scroll al inicio de la página después de navegar
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

export default Sidebar;
