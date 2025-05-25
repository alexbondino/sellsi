// 📁 components/SidebarProvider.jsx
import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

const menuItems = [
  { text: 'Inicio', path: '/supplier/home' },
  { text: 'Mis Productos', path: '/supplier/myproducts' },
  { text: 'Mis Pedidos', path: '/supplier/myorders' },
  { text: 'Mi Performance', path: '/supplier/myperformance' },
  { text: 'El Mercado', path: '/supplier/market' },
];

const SidebarProvider = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        position: 'fixed',
        top: '64px',
        left: 0,
        width: '250px',
        height: '100vh',
        backgroundColor: '#2b2b2d',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        overflowY: 'auto',
      }}
    >
      <List>
        {menuItems.map(item => {
          const isActive = location.pathname === item.path;

          return (
            <ListItem disablePadding key={item.text}>
              <ListItemButton
                onClick={() => {
                  if (!isActive) navigate(item.path);
                }}
                disabled={isActive}
                sx={{
                  backgroundColor: isActive ? '#a3a3a3' : 'transparent',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: isActive ? '#a3a3a3' : '#757575',
                  },
                  px: 3,
                  py: 1.5,
                  cursor: isActive ? 'default' : 'pointer',
                  '&.Mui-disabled': {
                    opacity: 1, // evita que se vea apagado
                    color: 'white', // fuerza color blanco incluso deshabilitado
                  },
                }}
              >
                <ListItemText
                  primary={item.text}
                  sx={{
                    pl: 1,
                    color: 'white',
                    '& .MuiTypography-root': {
                      color: 'white !important',
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};

export default SidebarProvider;
