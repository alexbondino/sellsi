import React from 'react'
import { Box, Paper, Typography, LinearProgress } from '@mui/material'
import { LocalShipping as ShippingIcon } from '@mui/icons-material'
import { motion } from 'framer-motion'

const ShippingProgressBar = ({ subtotal, formatPrice, itemVariants }) => {
  const FREE_SHIPPING_THRESHOLD = 100000
  const remaining = FREE_SHIPPING_THRESHOLD - subtotal
  const progress = (subtotal / FREE_SHIPPING_THRESHOLD) * 100

  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    return null // No mostrar si ya tiene envío gratis
  }

  return (
    <motion.div variants={itemVariants}>
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <ShippingIcon sx={{ mr: 1, color: 'success.main' }} />
          <Typography variant="h6" color="success.main">
            ¡Envío GRATIS en {formatPrice(remaining)} más!
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 8,
            borderRadius: 4,
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              background: 'linear-gradient(45deg, #4caf50, #8bc34a)',
            },
          }}
        />
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 1, display: 'block' }}
        >
          {progress.toFixed(1)}% completado
        </Typography>
      </Paper>
    </motion.div>
  )
}

export default ShippingProgressBar
