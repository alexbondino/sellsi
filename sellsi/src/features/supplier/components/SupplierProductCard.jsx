import React from 'react'
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Chip,
  alpha,
} from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  TrendingUp as TrendingUpIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material'
import { formatPrice } from '../../marketplace/utils/formatters'
import { getProductImageUrl } from '../../../utils/getProductImageUrl'
import {
  ActionMenu,
  ProductBadges,
  StatusChip,
  STOCK_STATUS_CONFIG,
} from '../../ui'
import { LazyImage } from '../../layout'
import { generateProductUrl } from '../../marketplace/marketplace/productUrl'
import { useNavigate } from 'react-router-dom'

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
  onProductClick, // Nuevo prop opcional
}) => {
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

  // Configurar acciones del menú
  const menuActions = [
    {
      icon: <EditIcon />,
      label: 'Editar producto',
      onClick: () => onEdit?.(product),
      disabled: isUpdating,
    },
    {
      icon: <VisibilityIcon />,
      label: 'Ver estadísticas',
      onClick: () => onViewStats?.(product),
    },
    {
      icon: <DeleteIcon />,
      label: 'Eliminar producto',
      onClick: () => onDelete?.(product),
      disabled: isDeleting,
      color: 'error',
    },
  ]

  // Configurar badges del producto
  const productBadges = []

  // Badge de producto nuevo
  const isNew = () => {
    if (!updatedAt) return false
    const daysDiff = (new Date() - new Date(updatedAt)) / (1000 * 60 * 60 * 24)
    return daysDiff < 7
  }

  if (isNew()) {
    productBadges.push({
      label: 'Nuevo',
      color: 'primary',
      condition: true,
    })
  }

  if (descuento > 0) {
    productBadges.push({
      label: `-${descuento}%`,
      color: 'error',
      condition: true,
    })
  }

  const navigate = useNavigate()

  return (
    <Card
      sx={{
        height: 650, // Cambiado a 650
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
      onClick={() => {
        if (onProductClick) {
          onProductClick(product)
        } else {
          const url = generateProductUrl(product)
          navigate(url, { state: { from: '/supplier/myproducts' } })
        }
      }}
      style={{ cursor: 'pointer' }}
    >
      {/* Badges del producto */}
      <ProductBadges badges={productBadges} position="top-left" />
      {/* Menú de acciones */}
      <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
        <ActionMenu
          actions={menuActions}
          disabled={isDeleting || isUpdating}
          tooltip="Opciones del producto"
          sx={{
            border: '2px solid',
            borderColor: 'primary.main',
            borderRadius: '12px',
          }}
        />      </Box>{' '}
      {/* ✅ OPTIMIZACIÓN: Imagen del producto con lazy loading */}
      <Box
        sx={{
          width: {
            xs: 80,
            sm: 100,
            md: 120,
            lg: 224,
            xl: 280, // Cambiado a 280
          },
          height: {
            xs: 100,
            sm: 125,
            md: 150,
            lg: 280,
            xl: 350, // Cambiado a 350
          },
          maxWidth: '100%',
          maxHeight: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto',
          bgcolor: '#fafafa',
          p: 1,
        }}
      >
        <LazyImage
          src={getProductImageUrl(imagen, product) || '/placeholder-product.jpg'}
          alt={nombre}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </Box>
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
          {/* {negociable && (
            <Chip
              label="Precio negociable"
              size="small"
              color="info"
              variant="outlined"
              sx={{ fontSize: '0.7rem', height: 20 }}
            />
          )} */}
        </Box>{' '}
        {/* Estados y métricas */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {/* Stock */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InventoryIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              Stock:
            </Typography>
            <StatusChip
              value={stock}
              statusConfig={[
                {
                  condition: (stock) => stock === 0,
                  label: 'Agotado',
                  color: 'error',
                },
                {
                  condition: (stock) => stock > 0 && stock < 10,
                  label: `${stock} unidades`,
                  color: 'warning',
                },
                {
                  condition: (stock) => stock >= 10,
                  label: `${stock} unidades`,
                  color: 'success',
                },
              ]}
              size="small"
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
    </Card>
  )
}

export default SupplierProductCard
