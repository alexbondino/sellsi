// 📁 components/UnifiedSidebar.jsx
import React from 'react'
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import './UnifiedSidebar.override.css'

const UnifiedSidebar = ({ menuItems, width = '210px' }) => {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <Box
      className="unified-sidebar"
      sx={{
        position: 'fixed',
        top: '64px',
        left: 0,
        width: width,
        height: '100vh',
        backgroundColor: '#a3a3a3',
        color: 'black',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        overflowY: 'auto',
      }}
    >
      <List sx={{ pt: 0 }}>
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path
          const isFirstItem = index === 0

          return (            <ListItem
              disablePadding
              key={item.text}
              sx={{
                mt: isFirstItem ? 12 : 0,
              }}
            >
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
                    ? 'rgba(0, 0, 0, 0.12)'
                    : 'transparent',
                  color: 'black !important',
                  border: 'none',
                  borderRadius: '4px !important', // Más cuadrado
                  margin: '2px 8px',
                  width: 'calc(100% - 16px)',
                  fontWeight: 'bold',
                  fontSize: '1.15rem',
                  opacity: 1,
                  transition: 'all 0.2s ease',
                  paddingLeft: '8px !important',
                  paddingRight: '8px !important',
                  paddingTop: '9px !important',
                  paddingBottom: '9px !important',
                  minHeight: '40px',
                  '&:hover': {
                    backgroundColor: isActive
                      ? 'rgba(0, 0, 0, 0.12)'
                      : 'rgba(0, 0, 0, 0.08)',
                    color: 'black !important',
                    transform: 'none',
                  },
                  cursor: isActive ? 'default' : 'pointer',
                  '&.Mui-disabled': {
                    opacity: 1,
                    color: 'black !important',
                    fontWeight: 'bold',
                  },
                }}
              >
                <ListItemText
                  primary={item.text}
                  sx={{
                    pl: 1,
                    '& .MuiTypography-root': {
                      color: 'black !important',
                      fontWeight: 'bold !important',
                      fontSize: '1.15rem !important',
                      letterSpacing: '0px',
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

export default UnifiedSidebar
