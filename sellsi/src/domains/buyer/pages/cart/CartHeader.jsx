import React, { useState } from 'react'
import {
  Box,
  Typography,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Badge,
  Button,
  Checkbox,
} from '@mui/material'
import Grid from '@mui/material/Grid'
import {
  Inventory2 as InventoryIcon,
  MonetizationOn as MonetizationOnIcon,
  TrendingUp as TrendingUpIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Delete as DeleteIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  CheckBox as CheckBoxIcon,
  SelectAll as SelectAllIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { Modal, MODAL_TYPES } from '../../../../shared/components/feedback' // Asegúrate de importar tu componente Modal correctamente

/**
 * ============================================================================
 * COMPONENTE CARTHEADER - ENCABEZADO DEL CARRITO DE COMPRAS
 * ============================================================================
 *
 * Componente que muestra las estadísticas del carrito y controles principales
 * Incluye: estadísticas de productos, descuentos, acciones de deshacer/rehacer
 *
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.cartStats - Estadísticas del carrito (totalItems, totalValue, etc.)
 * @param {Function} props.formatPrice - Función para formatear precios * @param {number} props.discount - Descuento total aplicado
 * @param {Function} props.onUndo - Función para deshacer última acción
 * @param {Function} props.onRedo - Función para rehacer acción
 * @param {Function} props.onClearCart - Función para limpiar carrito
 * @param {Object} props.undoInfo - Información de estado de undo/redo
 * @param {Object} props.redoInfo - Información de estado de redo
 */

const CartHeader = ({
  cartStats,
  formatPrice,
  discount,
  onClearCart,
  // Nueva funcionalidad de selección múltiple
  isSelectionMode,
  selectedItems,
  onToggleSelectionMode,
  onSelectAll,
  onDeleteSelected,
  totalItems,
}) => {
  const [openDeleteModal, setOpenDeleteModal] = useState(false)

  return (
    <Box sx={{ mb: 4, width: '100%' }}>
      {' '}
      <Grid
        container
        columns={12}
        spacing={3}
        alignItems="center"
        justifyContent="left"
      >
        {/* Grid Item 1: Title and Chips */}
        <Grid
          xs={12}
          sm={8}
          sx={
            {
              // ...otros estilos...
            }
          }
        >
          <Box sx={{ textAlign: { xs: 'center', md: 'left' }, position: 'relative' }}>
            {' '}
            <Typography
              variant="h4"
              component="h1"
              fontWeight={600}
              color="primary.main"
              gutterBottom
              sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              {!isSelectionMode && (
                <ShoppingCartIcon sx={{ fontSize: 40, color: '#1976d2', mr: 1 }} />
              )}
              {isSelectionMode ? 'Seleccionar Items' : 'Mi Carrito'}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                flexWrap: 'wrap',
                position: 'relative',
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
                  {/*
                  <Chip
                    icon={<MonetizationOnIcon />}
                    label={formatPrice(cartStats.totalValue)}
                    color="success"
                    variant="filled"
                  />
                  */}
                </>
              )}
            </Box>
          </Box>{' '}
        </Grid>{' '}
        {/* Grid Item 2: Controls */}
        <Grid
          xs={12}
          sm={4}
          sx={{
            // ml eliminado para unificar layout con supplier, ahora lo maneja App.jsx
            // ...otros estilos...
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            justifyContent={{ xs: 'center', sm: 'flex-end' }}
            sx={{ mt: { xs: 2, sm: 0 } }}
          >
            {' '}
            {/* Botones de deshacer/rehacer eliminados */}
            {/* Sistema de selección múltiple */}
            {isSelectionMode ? (
              <motion.div
                initial={{ opacity: 0, x: 50 }}                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
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
                          : 'transparent',                      '&:hover': {
                        background: 'rgba(25, 118, 210, 0.2)',
                        transform: 'scale(1.1)',
                      },
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
                <Button
                  onClick={() => selectedItems.length > 0 && setOpenDeleteModal(true)}
                  color="inherit"
                  startIcon={
                    <Badge
                      badgeContent={selectedItems.length}
                      color="error"
                      invisible={selectedItems.length === 0}
                    >
                      <DeleteIcon sx={{ color: 'grey.600' }} />
                    </Badge>
                  }
                  disabled={selectedItems.length === 0}
                  sx={{
                    fontWeight: 500,
                    color: selectedItems.length === 0 ? 'grey.400' : 'text.secondary',
                    textTransform: 'none',
                    background: 'transparent',
                    opacity: selectedItems.length === 0 ? 0.5 : 1,
                    '&:hover': {
                      background: selectedItems.length > 0 ? 'rgba(158, 158, 158, 0.1)' : 'transparent',
                      transform: selectedItems.length > 0 ? 'scale(1.05)' : 'none',
                    },
                    pl: 1,
                    pr: 2,
                    borderRadius: 2,
                  }}
                >
                  {selectedItems.length === 0
                    ? 'Selecciona items para eliminar'
                    : `Eliminar ${selectedItems.length} seleccionados`}
                </Button>

                {/* Botón para salir del modo selección */}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={onToggleSelectionMode}
                  sx={{
                    minWidth: 'auto',
                    px: 2,
                    borderColor: 'grey.400',
                    color: 'grey.600',                    '&:hover': {
                      transform: 'scale(1.05)',
                      borderColor: 'grey.600',
                      background: 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  Cancelar
                </Button>
              </motion.div>
            ) : (
              /* Botón normal de eliminar que activa modo selección */
              <Button
                onClick={onToggleSelectionMode}
                color="inherit"
                startIcon={<DeleteIcon sx={{ color: 'grey.600' }} />}
                sx={{
                  fontWeight: 500,
                  color: 'text.secondary',
                  textTransform: 'none',
                  background: 'transparent',
                  '&:hover': {
                    background: 'rgba(158, 158, 158, 0.1)',
                    transform: 'scale(1.05)',
                  },
                  pl: 1,
                  pr: 2,
                  borderRadius: 2,
                }}
              >
                Eliminar productos
              </Button>
            )}
          </Stack>{' '}
        </Grid>
      </Grid>
      <Modal
        isOpen={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        onSubmit={onDeleteSelected}
        type={MODAL_TYPES.DELETE}
        title="Eliminar productos seleccionados"
        submitButtonText="Eliminar"
        cancelButtonText="Cancelar"
        showCancelButton
      >
        ¿Estás seguro que deseas eliminar los productos seleccionados del carrito?
      </Modal>
    </Box>
  )
}

export default CartHeader
