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
  // OCULTAR TODA LA SECCIÓN DE CÓDIGOS DE DESCUENTO
  return null;
}

export default DiscountSection
