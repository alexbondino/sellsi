// AccountTypeCard.jsx
import React from 'react'
import { Paper, Typography, Box } from '@mui/material'

const AccountTypeCard = ({
  title,
  description,
  features,
  isSelected,
  onSelect,
  buttonText = 'Elegir',
  icon,
  color = '#41B6E6',
}) => {
  return (
    <Paper
      elevation={3}
      onClick={onSelect}
      sx={{
        p: 3,
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        border: isSelected ? `3px solid ${color}` : '3px solid transparent',
        bgcolor: isSelected ? `${color}10` : 'background.paper',
        transform: isSelected ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isSelected
          ? `0 8px 25px ${color}40`
          : '0 2px 8px rgba(0,0,0,0.1)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 6px 20px ${color}30`,
        },
        width: 280,
        height: 200,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 2,
      }}
    >
      {/* Icono */}
      {icon && (
        <Box sx={{ fontSize: 48, color: isSelected ? color : '#666' }}>
          {icon}
        </Box>
      )}

      <Box sx={{ flexGrow: 1 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: isSelected ? color : '#333',
            fontSize: 18,
            mb: 1,
          }}
        >
          {title}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: isSelected ? color : '#666',
            fontSize: 14,
            lineHeight: 1.4,
            mb: 1,
          }}
        >
          {description}
        </Typography>

        {features && (
          <ul
            style={{
              margin: 0,
              paddingLeft: 16,
              color: isSelected ? color : '#444',
              fontSize: 13,
              textAlign: 'left',
            }}
          >
            {features.map((feature, index) => (
              <li key={index} style={{ marginBottom: '3px' }}>
                {feature}
              </li>
            ))}
          </ul>
        )}
      </Box>

      <Typography
        sx={{
          width: '100%',
          backgroundColor: isSelected ? color : '#b0c4cc',
          color: '#fff',
          fontWeight: 700,
          textAlign: 'center',
          py: 1,
          borderRadius: 1,
          fontSize: 14,
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: isSelected ? `${color}dd` : '#9bb4bb',
          },
        }}
      >
        {buttonText}
      </Typography>
    </Paper>
  )
}

export default AccountTypeCard
