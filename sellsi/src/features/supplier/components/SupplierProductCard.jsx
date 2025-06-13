import React, { useState } from 'react'
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Badge,
  alpha,
} from '@mui/material'
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  TrendingUp as TrendingUpIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material'
import { formatPrice } from '../../marketplace/utils/formatters'
import { getProductImageUrl } from '../../../utils/getProductImageUrl'

/**
 * SupplierProductCard - Tarjeta de producto para la vista del proveedor
 * Incluye opciones de editar, eliminar y ver estadísticas
 */
const SupplierProductCard = ({
  product,
  onEdit,
  onDelete,
  onViewStats,
  isDeleting = false,
  isUpdating = false,
}) => {
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)

  if (!product) {
    return null
  }

  const {
    id,
    nombre,
    imagen,
    precio,
    precioOriginal,
    descuento,
    categoria,
    stock,
    ventas = 0,
    rating = 0,
    tipo,
    updatedAt,
    negociable,
    tramoMin,
    tramoMax,
    tramoPrecioMin,
    tramoPrecioMax,
    priceTiers = [],
  } = product

  const handleMenuOpen = (event) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleEdit = () => {
    handleMenuClose()
    if (onEdit) {
      onEdit(product)
    }
  }

  const handleDelete = () => {
    handleMenuClose()
    if (onDelete) {
      onDelete(product)
    }
  }

  const handleViewStats = () => {
    handleMenuClose()
    if (onViewStats) {
      onViewStats(product)
    }
  }

  // Determinar estado del stock
  const getStockStatus = () => {
    if (stock === 0) return { label: 'Agotado', color: 'error' }
    if (stock < 10) return { label: 'Stock bajo', color: 'warning' }
    return { label: 'En stock', color: 'success' }
  }

  const stockStatus = getStockStatus()

  // Determinar si es producto nuevo (menos de 7 días)
  const isNew = () => {
    if (!updatedAt) return false
    const daysDiff = (new Date() - new Date(updatedAt)) / (1000 * 60 * 60 * 24)
    return daysDiff < 7
  }

  return (
    <Card
      sx={{
        height: 420, // altura fija como en ProductCard pero con la medida actual del supplier
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        opacity: isDeleting ? 0.5 : 1,
        transform: isDeleting ? 'scale(0.95)' : 'scale(1)',
        '&:hover': {
          transform: isDeleting ? 'scale(0.95)' : 'translateY(-4px)',
          boxShadow: (theme) =>
            `0 8px 25px ${alpha(theme.palette.primary.main, 0.15)}`,
          borderColor: 'primary.main',
        },
      }}
    >
      {/* Badges superpuestos */}
      <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}>
        {isNew() && (
          <Chip
            label="Nuevo"
            size="small"
            color="primary"
            sx={{
              fontWeight: 600,
              fontSize: '0.7rem',
              height: 20,
              mb: 0.5,
              display: 'block',
            }}
          />
        )}
        {descuento > 0 && (
          <Chip
            label={`-${descuento}%`}
            size="small"
            color="error"
            sx={{
              fontWeight: 600,
              fontSize: '0.7rem',
              height: 20,
            }}
          />
        )}
      </Box>
      {/* Menú de acciones */}
      <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
        <Tooltip title="Más opciones">
          <IconButton
            onClick={handleMenuOpen}
            disabled={isDeleting || isUpdating}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(8px)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 1)',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <MoreVertIcon />
          </IconButton>
        </Tooltip>
      </Box>{' '}
      {/* Imagen del producto */}
      <CardMedia
        component="img"
        image={
          getProductImageUrl(imagen, product) || '/placeholder-product.jpg'
        }
        alt={nombre}
        sx={{
          height: '140px',
          width: '140px',
          maxWidth: '100%',
          objectFit: 'contain',
          bgcolor: '#fafafa',
          p: 1,
          display: 'block',
          mx: 'auto',
        }}
        onError={(e) => {
          e.target.onerror = null
          e.target.src = '/placeholder-product.jpg'
        }}
      />
      {/* Contenido principal */}
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        {/* Categoría */}
        <Chip
          label={categoria}
          size="small"
          variant="outlined"
          sx={{
            mb: 1,
            fontSize: '0.7rem',
            height: 20,
          }}
        />

        {/* Nombre del producto */}
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            mb: 1,
            fontSize: '0.95rem',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '2.6rem',
          }}
        >
          {nombre}
        </Typography>

        {/* Precios */}
        <Box sx={{ mb: 2 }}>
          {/* Mostrar tramos si existen */}
          {priceTiers && priceTiers.length > 0 ? (
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontWeight: 500 }}
              >
                Tramo: {tramoMin} - {tramoMax || '∞'} unidades
              </Typography>
              <Typography
                variant="h6"
                color="primary.main"
                sx={{ fontWeight: 700, fontSize: '1.1rem' }}
              >
                {tramoPrecioMin === tramoPrecioMax || !tramoPrecioMax
                  ? formatPrice(tramoPrecioMin)
                  : `${formatPrice(tramoPrecioMin)} - ${formatPrice(
                      tramoPrecioMax
                    )}`}
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
            >
              <Typography
                variant="h6"
                color="primary.main"
                sx={{ fontWeight: 700, fontSize: '1.1rem' }}
              >
                {formatPrice(precio)}
              </Typography>
              {precioOriginal && precioOriginal > precio && (
                <Typography
                  variant="body2"
                  sx={{
                    textDecoration: 'line-through',
                    color: 'text.secondary',
                    fontSize: '0.85rem',
                  }}
                >
                  {formatPrice(precioOriginal)}
                </Typography>
              )}
            </Box>
          )}
          {negociable && (
            <Chip
              label="Precio negociable"
              size="small"
              color="info"
              variant="outlined"
              sx={{ fontSize: '0.7rem', height: 20 }}
            />
          )}
        </Box>

        {/* Estados y métricas */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {/* Stock */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InventoryIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              Stock:
            </Typography>
            <Chip
              label={`${stock} unidades`}
              size="small"
              color={stockStatus.color}
              variant="filled"
              sx={{ fontSize: '0.7rem', height: 18 }}
            />
          </Box>

          {/* Ventas */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              Ventas: {ventas} unidades
            </Typography>
          </Box>

          {/* Última actualización */}
          <Typography variant="caption" color="text.secondary">
            Actualizado: {new Date(updatedAt).toLocaleDateString()}
          </Typography>
        </Box>
      </CardContent>
      {/* Menú contextual */}{' '}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        disableScrollLock={true}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          elevation: 8,
          sx: {
            mt: 1,
            borderRadius: 2,
            minWidth: 180,
          },
        }}
      >
        <MenuItem onClick={handleViewStats}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ver estadísticas</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleEdit} disabled={isUpdating}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {isUpdating ? 'Actualizando...' : 'Editar producto'}
          </ListItemText>
        </MenuItem>

        <MenuItem
          onClick={handleDelete}
          disabled={isDeleting}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>
            {isDeleting ? 'Eliminando...' : 'Eliminar producto'}
          </ListItemText>
        </MenuItem>
      </Menu>
    </Card>
  )
}

export default SupplierProductCard
