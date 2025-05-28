import React from 'react'
import { Box } from '@mui/material'
import AccessTimeIcon from '@mui/icons-material/AccessTime'

const Timer = ({ timer, size = 'medium' }) => {
  const isLarge = size === 'large'

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        background: timer > 0 ? '#e3f4fd' : '#fde3e3',
        color: timer > 0 ? '#1976d2' : '#d32f2f',
        borderRadius: isLarge ? '24px' : '20px',
        px: isLarge ? 2 : 1.5,
        py: isLarge ? 1 : 0.5,
        fontWeight: 700,
        fontSize: isLarge ? 18 : 14,
        boxShadow: timer > 0 ? '0 2px 8px #b6e0fa55' : '0 2px 8px #fbbbbb55',
        gap: isLarge ? 1 : 0.5,
        minWidth: isLarge ? 170 : 150,
        justifyContent: 'center', // ✅ SOLO UNA VEZ
      }}
    >
      <AccessTimeIcon
        sx={{
          fontSize: isLarge ? 22 : 18,
          mr: isLarge ? 1 : 0.5,
          color: 'inherit',
        }}
      />
      {timer > 0 ? (
        <>
          Tiempo restante:&nbsp;
          <span
            style={{
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: isLarge ? 1 : 0.5,
              fontSize: isLarge ? 18 : 12,
            }}
          >
            {Math.floor(timer / 60)
              .toString()
              .padStart(2, '0')}
            :{(timer % 60).toString().padStart(2, '0')}
          </span>
        </>
      ) : (
        <span style={{ fontSize: isLarge ? 18 : 12 }}>
          El código ha expirado
        </span>
      )}
    </Box>
  )
}

export default Timer
