import React from 'react'
import {
  Box,
  Typography,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material'
import {
  LocalShipping as ShippingIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material'

const ShippingOptions = ({
  selectedShipping,
  onShippingChange,
  shippingOptions,
  formatPrice,
  deliveryDate,
  formatDate,
}) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="h6"
        sx={{
          mb: 2,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <ShippingIcon sx={{ mr: 1, color: 'info.main' }} />
        Opciones de Envío
      </Typography>

      <FormControl component="fieldset">
        <RadioGroup value={selectedShipping} onChange={onShippingChange}>
          {shippingOptions.map((option) => (
            <FormControlLabel
              key={option.id}
              value={option.id}
              control={<Radio />}
              label={
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                  }}
                >
                  <Box sx={{ mr: 1, fontSize: '1.2rem' }}>{option.icon}</Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {option.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.days}
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight="bold">
                    {option.price === 0 ? 'Gratis' : formatPrice(option.price)}
                  </Typography>
                </Box>
              }
              sx={{
                mb: 1,
                p: 1,
                borderRadius: 2,
                border: '1px solid',
                borderColor:
                  selectedShipping === option.id ? 'primary.main' : 'divider',
                backgroundColor:
                  selectedShipping === option.id
                    ? 'action.selected'
                    : 'transparent',
              }}
            />
          ))}
        </RadioGroup>
      </FormControl>

      {/* Estimación de entrega */}
      {deliveryDate && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            bgcolor: 'success.light',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'success.main',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 1,
            }}
          >
            <ScheduleIcon sx={{ mr: 1, color: 'success.dark' }} />
            <Typography variant="body2" fontWeight="bold" color="success.dark">
              Fecha estimada de entrega
            </Typography>
          </Box>
          <Typography variant="h6" color="success.dark">
            {formatDate(deliveryDate)}
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default ShippingOptions
