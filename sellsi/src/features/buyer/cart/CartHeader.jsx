import React from 'react'
import {
  Box,
  Typography,
  Grid,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Badge,
  Button,
  Checkbox,
} from '@mui/material'
import {
  Inventory2 as InventoryIcon,
  MonetizationOn as MonetizationOnIcon,
  TrendingUp as TrendingUpIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Favorite as FavoriteIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  CheckBox as CheckBoxIcon,
  SelectAll as SelectAllIcon,
} from '@mui/icons-material'
import { motion } from 'framer-motion'

const CartHeader = ({
  cartStats,
  formatPrice,
  discount,
  wishlistLength,
  onUndo,
  onRedo,
  onClearCart,
  onResetDemo,
  onToggleWishlist,
  showWishlist,
  undoInfo,
  redoInfo,
  historyInfo,
  // Nueva funcionalidad de selección múltiple
  isSelectionMode,
  selectedItems,
  onToggleSelectionMode,
  onSelectAll,
  onDeleteSelected,
  totalItems,
}) => {
  return (
    <Box sx={{ mb: 4, width: '100%' }}>
      {' '}
      <Grid container spacing={3} alignItems="center" justifyContent="left">
        {' '}
        {/* Grid Item 1: Title and Chips */}
        <Grid item xs={12} sm={8}>
          <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
            {' '}
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontWeight: 'bold',
                background: isSelectionMode
                  ? 'linear-gradient(45deg, #ff6b6b, #ee5a24)'
                  : '#000000',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
                transition: 'all 0.3s ease',
              }}
            >
              {isSelectionMode ? 'Seleccionar Items' : 'Mi Carrito'}
            </Typography>{' '}
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                flexWrap: 'wrap',
                justifyContent: { xs: 'center', md: 'flex-start' },
              }}
            >
              {isSelectionMode ? (
                /* Chips para modo selección */
                <>
                  <Chip
                    icon={<CheckBoxIcon />}
                    label={`${selectedItems.length} de ${totalItems} seleccionados`}
                    color="primary"
                    variant="filled"
                  />
                  {selectedItems.length > 0 && (
                    <Chip
                      icon={<DeleteIcon />}
                      label={`Eliminar ${selectedItems.length}`}
                      color="error"
                      variant="outlined"
                      clickable
                      onClick={onDeleteSelected}
                    />
                  )}
                </>
              ) : (
                /* Chips normales */
                <>
                  <Chip
                    icon={<InventoryIcon />}
                    label={`${cartStats.totalItems} productos`}
                    color="primary"
                    variant="filled"
                  />
                  <Chip
                    icon={<MonetizationOnIcon />}
                    label={formatPrice(cartStats.totalValue)}
                    color="success"
                    variant="filled"
                  />
                  <Chip
                    icon={<TrendingUpIcon />}
                    label={`${
                      discount > 0
                        ? 'Ahorrando ' + formatPrice(discount)
                        : 'Sin descuentos'
                    }`}
                    color={discount > 0 ? 'warning' : 'default'}
                    variant="filled"
                  />
                </>
              )}
            </Box>
          </Box>{' '}
        </Grid>{' '}
        {/* Grid Item 2: Controls */}
        <Grid item xs={12} sm={4} sx={{ ml: { md: 50 } }}>
          <Stack
            direction="row"
            spacing={1}
            justifyContent={{ xs: 'center', sm: 'flex-end' }}
            sx={{ mt: { xs: 2, sm: 0 } }}
          >
            {' '}
            <Tooltip
              title={
                undoInfo?.canUndo
                  ? `Deshacer: ${
                      undoInfo.action?.description || 'Última acción'
                    }`
                  : 'No hay acciones para deshacer'
              }
            >
              <span>
                <Badge
                  badgeContent={historyInfo?.currentIndex || 0}
                  color="primary"
                  invisible={!undoInfo?.canUndo}
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.7rem',
                      height: '16px',
                      minWidth: '16px',
                    },
                  }}
                >
                  <IconButton
                    onClick={onUndo}
                    color="primary"
                    disabled={!undoInfo?.canUndo}
                    sx={{
                      opacity: undoInfo?.canUndo ? 1 : 0.5,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: undoInfo?.canUndo ? 'scale(1.1)' : 'none',
                      },
                    }}
                  >
                    <UndoIcon />
                  </IconButton>
                </Badge>
              </span>
            </Tooltip>
            <Tooltip
              title={
                redoInfo?.canRedo
                  ? `Rehacer: ${
                      redoInfo.action?.description || 'Próxima acción'
                    }`
                  : 'No hay acciones para rehacer'
              }
            >
              <span>
                <Badge
                  badgeContent={
                    historyInfo
                      ? historyInfo.totalStates - historyInfo.currentIndex - 1
                      : 0
                  }
                  color="secondary"
                  invisible={!redoInfo?.canRedo}
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.7rem',
                      height: '16px',
                      minWidth: '16px',
                    },
                  }}
                >
                  <IconButton
                    onClick={onRedo}
                    color="primary"
                    disabled={!redoInfo?.canRedo}
                    sx={{
                      opacity: redoInfo?.canRedo ? 1 : 0.5,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: redoInfo?.canRedo ? 'scale(1.1)' : 'none',
                      },
                    }}
                  >
                    <RedoIcon />
                  </IconButton>
                </Badge>
              </span>{' '}
            </Tooltip>
            {/* Sistema de selección múltiple */}
            {isSelectionMode ? (
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.3 }}
                style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
              >
                {/* Botón para seleccionar todo */}
                <Tooltip
                  title={
                    selectedItems.length === totalItems
                      ? 'Deseleccionar todo'
                      : 'Seleccionar todo'
                  }
                >
                  <IconButton
                    onClick={onSelectAll}
                    color="primary"
                    sx={{
                      background:
                        selectedItems.length === totalItems
                          ? 'rgba(25, 118, 210, 0.1)'
                          : 'transparent',
                      '&:hover': {
                        background: 'rgba(25, 118, 210, 0.2)',
                        transform: 'scale(1.1)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {selectedItems.length === totalItems ? (
                      <CheckBoxIcon />
                    ) : (
                      <CheckBoxOutlineBlankIcon />
                    )}
                  </IconButton>
                </Tooltip>

                {/* Botón de eliminar seleccionados */}
                <Tooltip
                  title={
                    selectedItems.length === 0
                      ? 'Selecciona items para eliminar'
                      : `Eliminar ${selectedItems.length} seleccionados`
                  }
                >
                  <span>
                    <IconButton
                      onClick={onDeleteSelected}
                      color="error"
                      disabled={selectedItems.length === 0}
                      sx={{
                        opacity: selectedItems.length === 0 ? 0.5 : 1,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform:
                            selectedItems.length > 0 ? 'scale(1.1)' : 'none',
                          background:
                            selectedItems.length > 0
                              ? 'rgba(244, 67, 54, 0.1)'
                              : 'transparent',
                        },
                      }}
                    >
                      <Badge
                        badgeContent={selectedItems.length}
                        color="error"
                        invisible={selectedItems.length === 0}
                      >
                        <DeleteIcon />
                      </Badge>
                    </IconButton>
                  </span>
                </Tooltip>

                {/* Botón para salir del modo selección */}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={onToggleSelectionMode}
                  sx={{
                    minWidth: 'auto',
                    px: 2,
                    borderColor: 'grey.400',
                    color: 'grey.600',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      borderColor: 'grey.600',
                      background: 'rgba(0, 0, 0, 0.04)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  Cancelar
                </Button>
              </motion.div>
            ) : (
              /* Botón normal de eliminar que activa modo selección */
              <Tooltip title="Eliminar productos">
                <IconButton
                  onClick={onToggleSelectionMode}
                  color="error"
                  sx={{
                    '&:hover': {
                      transform: 'scale(1.1)',
                      background: 'rgba(244, 67, 54, 0.1)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="🎭 Reiniciar Demo (Volver a mostrar productos)">
              <IconButton
                onClick={onResetDemo}
                color="success"
                sx={{
                  background: 'linear-gradient(45deg, #4caf50, #8bc34a)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #45a049, #7cb342)',
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>{' '}
            <Tooltip title="Favoritos (Próximamente disponible)">
              <span>
                <IconButton
                  onClick={() => {
                    // Funcionalidad deshabilitada temporalmente
                    console.log(
                      'Funcionalidad de favoritos deshabilitada temporalmente'
                    )
                  }}
                  color="secondary"
                  disabled={true}
                  sx={{
                    opacity: 0.5,
                    '&:hover': {
                      opacity: 0.7,
                    },
                  }}
                >
                  <Badge badgeContent={0} color="error">
                    <FavoriteIcon />
                  </Badge>
                </IconButton>
              </span>{' '}
            </Tooltip>
          </Stack>{' '}
        </Grid>
      </Grid>
    </Box>
  )
}

export default CartHeader
