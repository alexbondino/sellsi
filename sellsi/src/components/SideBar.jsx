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
  { text: 'Inicio', path: '/provider' },
  { text: 'Mis Productos', path: '/provider/products' },
  { text: 'Mis Pedidos', path: '/provider/orders' },
  { text: 'Mi Performance', path: '/provider/performance' },
  { text: 'El Mercado', path: '/provider/market' },
];

const SidebarProvider = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        position: 'fixed',
        top: '64px', // solo topbar
        left: 0,
        width: '250px',
        height: 'calc(100vh)', // ya no restamos el bottombar
        backgroundColor: '#2b2b2d',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        overflowY: 'auto',
      }}
    >
      <List>
        {menuItems.map(item => (
          <ListItem disablePadding key={item.text}>
            <ListItemButton
              onClick={() => navigate(item.path)}
              sx={{
                backgroundColor:
                  location.pathname === item.path ? '#a3a3a3' : 'transparent',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#757575',
                },
                px: 3,
                py: 1.5,
              }}
            >
              <ListItemText primary={item.text} sx={{ pl: 1 }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default SidebarProvider;
