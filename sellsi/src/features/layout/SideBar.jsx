import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useTheme,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

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
  { text: 'Marketplace', path: '/buyer/marketplace' },
];

const SideBar = ({ role, width = '250px' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();

  const sidebarBackgroundColor = '#2C2C2C';
  const hoverBackgroundColor = 'rgba(255, 255, 255, 0.15)';
  const activeBackgroundColor = '#4d4d4d';
  const activeHoverBackgroundColor = '#555555';

  let menuItemsToDisplay = [];
  if (role === 'buyer') {
    menuItemsToDisplay = buyerMenuItems;
  } else if (role === 'supplier') {
    menuItemsToDisplay = providerMenuItems;
  }

  if (!role || menuItemsToDisplay.length === 0) {
    return null;
  }

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        display: { xs: 'none', md: 'flex' },
        width: width,
        flexShrink: 0,
        zIndex: theme => theme.zIndex.drawer,

        '& .MuiDrawer-paper': {
          width: width,
          boxSizing: 'border-box',
          top: '64px',
          height: 'calc(100vh - 64px)',
          backgroundColor: sidebarBackgroundColor,
          color: '#FFFFFF',
          borderRight: 'none',
          overflowY: 'hidden',
        },

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
          margin: '2px 8px',
          width: 'calc(100% - 16px)',
          opacity: 1,
          transition: 'all 0.2s ease',
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
              sx={{ mt: isFirstItem ? '80px' : 0, display: 'block' }}
            >
              <ListItemButton
                onClick={() => {
                  if (!isActive) {
                    navigate(item.path);
                    setTimeout(
                      () => window.scrollTo({ top: 0, behavior: 'smooth' }),
                      100
                    );
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
    </Drawer>
  );
};

export default SideBar;
