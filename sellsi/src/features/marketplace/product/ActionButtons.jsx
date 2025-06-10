import React from 'react'
import { Stack, Button, IconButton, Tooltip, Badge } from '@mui/material'
import {
  ShoppingCart as ShoppingCartIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Share as ShareIcon,
  Compare as CompareIcon,
} from '@mui/icons-material'

/**
 * Componente compartido para botones de acción de productos
 * @param {Object} props
 * @param {function} props.onAddToCart - Función para agregar al carrito
 * @param {function} props.onToggleWishlist - Función para toggle wishlist
 * @param {function} props.onShare - Función para compartir (opcional)
 * @param {function} props.onCompare - Función para comparar (opcional)
 * @param {boolean} props.isInWishlist - Si está en wishlist
 * @param {boolean} props.isInCart - Si está en carrito
 * @param {boolean} props.disabled - Si están deshabilitados
 * @param {string} props.layout - Layout ('horizontal', 'vertical', 'compact')
 * @param {string} props.variant - Variante de botones ('contained', 'outlined', 'text')
 */
const ActionButtons = ({
  onAddToCart,
  onToggleWishlist,
  onShare,
  onCompare,
  isInWishlist = false,
  isInCart = false,
  disabled = false,
  layout = 'horizontal',
  variant = 'contained',
}) => {
  const buttonProps = {
    disabled,
    variant: variant === 'contained' ? 'contained' : 'outlined',
    size: layout === 'compact' ? 'small' : 'medium',
  }

  const iconButtonProps = {
    disabled,
    size: layout === 'compact' ? 'small' : 'medium',
  }

  if (layout === 'compact') {
    return (
      <Stack direction="row" spacing={1}>
        <Tooltip title={isInCart ? 'En carrito' : 'Agregar al carrito'}>
          <span>
            <IconButton
              onClick={onAddToCart}
              color={isInCart ? 'success' : 'primary'}
              {...iconButtonProps}
            >
              <Badge
                variant="dot"
                color="success"
                invisible={!isInCart}
                overlap="circular"
              >
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip
          title={isInWishlist ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          <span>
            <IconButton
              onClick={onToggleWishlist}
              color={isInWishlist ? 'error' : 'default'}
              {...iconButtonProps}
            >
              {isInWishlist ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </IconButton>
          </span>
        </Tooltip>

        {onShare && (
          <Tooltip title="Compartir">
            <span>
              <IconButton onClick={onShare} {...iconButtonProps}>
                <ShareIcon />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Stack>
    )
  }

  const stackDirection = layout === 'vertical' ? 'column' : 'row'
  const buttonFullWidth = layout === 'vertical'

  return (
    <Stack direction={stackDirection} spacing={2}>
      <Button
        onClick={onAddToCart}
        startIcon={<ShoppingCartIcon />}
        color={isInCart ? 'success' : 'primary'}
        fullWidth={buttonFullWidth}
        {...buttonProps}
      >
        {isInCart ? 'En Carrito' : 'Agregar al Carrito'}
      </Button>

      <Stack
        direction="row"
        spacing={1}
        justifyContent={buttonFullWidth ? 'center' : 'flex-start'}
      >
        <Tooltip
          title={isInWishlist ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          <span>
            <IconButton
              onClick={onToggleWishlist}
              color={isInWishlist ? 'error' : 'default'}
              {...iconButtonProps}
            >
              {isInWishlist ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </IconButton>
          </span>
        </Tooltip>

        {onShare && (
          <Tooltip title="Compartir">
            <span>
              <IconButton onClick={onShare} {...iconButtonProps}>
                <ShareIcon />
              </IconButton>
            </span>
          </Tooltip>
        )}

        {onCompare && (
          <Tooltip title="Comparar">
            <span>
              <IconButton onClick={onCompare} {...iconButtonProps}>
                <CompareIcon />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Stack>
    </Stack>
  )
}

export default ActionButtons
