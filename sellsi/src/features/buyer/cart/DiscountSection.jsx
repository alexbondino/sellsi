import React from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import {
  Discount as DiscountIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  LocalOffer as OfferIcon,
} from '@mui/icons-material'

const DiscountSection = ({
  couponInput,
  setCouponInput,
  onApplyCoupon,
  appliedCoupons,
  onRemoveCoupon,
  availableCodes,
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
        <DiscountIcon sx={{ mr: 1, color: 'warning.main' }} />
        Códigos de Descuento
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          size="small"
          placeholder="Ingresa tu código"
          value={couponInput}
          onChange={(e) => setCouponInput(e.target.value)}
          sx={{ flexGrow: 1 }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              onApplyCoupon()
            }
          }}
        />
        <Button
          variant="contained"
          onClick={onApplyCoupon}
          disabled={!couponInput.trim()}
          sx={{ minWidth: 100 }}
        >
          Aplicar
        </Button>
      </Box>

      {/* Cupones aplicados */}
      {appliedCoupons.length > 0 && (
        <Box sx={{ mb: 2 }}>
          {appliedCoupons.map((coupon) => (
            <Chip
              key={coupon.code}
              label={`${coupon.code} - ${coupon.description}`}
              onDelete={() => onRemoveCoupon(coupon.code)}
              color="success"
              sx={{ mb: 1, mr: 1 }}
              icon={<CheckCircleIcon />}
            />
          ))}
        </Box>
      )}

      {/* Códigos disponibles */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="body2">Ver códigos disponibles</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List dense>
            {Object.entries(availableCodes).map(([code, details]) => (
              <ListItem key={code} disablePadding>
                <ListItemButton
                  onClick={() => {
                    setCouponInput(code)
                    onApplyCoupon()
                  }}
                >
                  <ListItemIcon>
                    <OfferIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={code}
                    secondary={details.description}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>
    </Box>
  )
}

export default DiscountSection
