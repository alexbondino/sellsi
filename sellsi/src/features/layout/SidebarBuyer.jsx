// 📁 components/SidebarBuyer.jsx
import React from 'react'
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'

const menuItems = [
  { text: 'Marketplace', path: '/buyer/marketplace' },
  { text: 'Mis Pedidos', path: '/buyer/orders' },
  { text: 'Mi Performance', path: '/buyer/performance' },
]

const SidebarBuyer = () => {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <Box
      sx={{
        position: 'fixed',
        top: '64px',
        left: 0,
        width: '250px',
        height: '100vh',
        backgroundColor: '#a3a3a3', // ✅ Cambiado de negro a gris
        color: 'black',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        overflowY: 'auto',
      }}
    >
      {' '}
      <List sx={{ pt: 0 }}>
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path
          const isFirstItem = index === 0

          return (
            <ListItem
              disablePadding
              key={item.text}
              sx={{
                mt: isFirstItem ? 14 : 0, // Margin top solo para el primer elemento
              }}
            >
              {' '}
              <ListItemButton
                onClick={() => {
                  if (!isActive) {
                    navigate(item.path)
                    // Scroll al inicio de la página después de navegar
                    setTimeout(() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }, 100)
                  }
                }}
                disabled={isActive}
                sx={{
                  backgroundColor: isActive
                    ? 'rgba(0, 0, 0, 0.15)'
                    : 'transparent',
                  color: 'black',
                  border: isActive
                    ? '2px solid rgba(0, 0, 0, 0.3)'
                    : '2px solid transparent',
                  borderRadius: '8px',
                  margin: '4px 12px',
                  width: '96%',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: isActive
                      ? 'rgba(0, 0, 0, 0.15)'
                      : 'rgba(0, 0, 0, 0.08)',
                    border: '2px solid rgba(0, 0, 0, 0.2)',
                    transform: 'translateX(4px)',
                  },
                  px: 3,
                  py: 1.5,
                  cursor: isActive ? 'default' : 'pointer',
                  '&.Mui-disabled': {
                    opacity: 1,
                    color: 'black',
                    fontWeight: 'bold',
                  },
                }}
              >
                {' '}
                <ListItemText
                  primary={item.text}
                  sx={{
                    pl: 1,
                    color: 'black',
                    '& .MuiTypography-root': {
                      color: 'black !important',
                      fontWeight: 'bold',
                      fontSize: '1.05rem',
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>
    </Box>
  )
}

export default SidebarBuyer
