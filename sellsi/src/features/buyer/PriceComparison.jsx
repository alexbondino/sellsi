/**
 * ============================================================================
 * COMPONENTE PRICECOMPARISON - COMPARACIÓN DE PRECIOS
 * ============================================================================
 *
 * ESTADO: POTENCIALMENTE OBSOLETO
 *
 * Este componente fue diseñado para mostrar comparación de precios entre
 * diferentes proveedores. Actualmente se importa en BuyerCart.jsx pero no
 * se utiliza en el renderizado.
 *
 * TODO: Revisar si este componente debe:
 * 1. Implementarse en el carrito como funcionalidad adicional
 * 2. Eliminarse si no se va a usar
 * 3. Mover a una sección de comparación de productos independiente
 *
 * @param {string} productName - Nombre del producto a comparar
 */

import React from 'react'
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
} from '@mui/material'
import {
  TrendingDown as TrendingDownIcon,
  Star as StarIcon,
} from '@mui/icons-material'

const PRICE_COMPARISON = [
  {
    supplier: 'IKEA',
    price: 89900,
    rating: 4.5,
    shipping: 5990,
    availability: 'En stock',
    badge: 'Mejor precio',
  },
  {
    supplier: 'Falabella',
    price: 95900,
    rating: 4.2,
    shipping: 7990,
    availability: 'En stock',
    badge: null,
  },
  {
    supplier: 'Paris',
    price: 92900,
    rating: 4.3,
    shipping: 6990,
    availability: 'Pocas unidades',
    badge: null,
  },
]

const PriceComparison = ({ productName = 'Silla Ergonómica Premium' }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <Box>
      <Typography
        variant="h6"
        sx={{ mb: 2, display: 'flex', alignItems: 'center' }}
      >
        <TrendingDownIcon sx={{ mr: 1 }} />
        Comparación de precios - {productName}
      </Typography>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Proveedor</TableCell>
              <TableCell align="right">Precio</TableCell>
              <TableCell align="center">Rating</TableCell>
              <TableCell align="right">Envío</TableCell>
              <TableCell align="center">Disponibilidad</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {PRICE_COMPARISON.map((row) => (
              <TableRow key={row.supplier}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar
                      sx={{ width: 32, height: 32, mr: 1, fontSize: '0.75rem' }}
                    >
                      {row.supplier.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {row.supplier}
                      </Typography>
                      {row.badge && (
                        <Chip
                          label={row.badge}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body1" fontWeight="bold">
                    {formatPrice(row.price)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <StarIcon sx={{ fontSize: 16, color: 'orange', mr: 0.5 }} />
                    <Typography variant="body2">{row.rating}</Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {row.shipping === 0 ? 'Gratis' : formatPrice(row.shipping)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={row.availability}
                    size="small"
                    color={
                      row.availability === 'En stock' ? 'success' : 'warning'
                    }
                    variant="outlined"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default PriceComparison
