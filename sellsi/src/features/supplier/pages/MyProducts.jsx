import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  InputAdornment,
  Alert,
  Skeleton,
  Fab,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  Inventory as InventoryIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material'
import { ThemeProvider } from '@mui/material/styles'
import { toast } from 'react-hot-toast'

// Components
import SidebarProvider from '../../layout/SideBar'
import ProviderTopBar from '../../layout/ProviderTopBar'
import SupplierProductCard from '../components/SupplierProductCard'
import ConfirmationModal, { MODAL_TYPES } from '../../ui/ConfirmationModal'

// Hooks y stores
import useSupplierProductsStore from '../hooks/useSupplierProductsStore'
import { dashboardTheme } from '../../../styles/dashboardTheme'
import { formatPrice } from '../../marketplace/utils/formatters'

// Constantes
const CATEGORIES = [
  { value: 'all', label: 'Todas las categorías' },
  { value: 'Supermercado', label: 'Supermercado' },
  { value: 'Electrodomésticos', label: 'Electrodomésticos' },
  { value: 'Tecnología', label: 'Tecnología' },
  { value: 'Hogar', label: 'Hogar' },
  { value: 'Moda', label: 'Moda' },
]

const SORT_OPTIONS = [
  { value: 'updatedAt', label: 'Más recientes' },
  { value: 'createdAt', label: 'Más antiguos' },
  { value: 'nombre', label: 'Nombre A-Z' },
  { value: 'precio', label: 'Precio: menor a mayor' },
  { value: 'stock', label: 'Stock disponible' },
  { value: 'ventas', label: 'Más vendidos' },
]

const MyProducts = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const navigate = useNavigate()
  // Obtener el user_id real del usuario autenticado
  const supplierId = localStorage.getItem('user_id')

  // Store state
  const {
    products,
    filteredProducts,
    searchTerm,
    categoryFilter,
    sortBy,
    sortOrder,
    loading,
    error,
    deleting,
    updating,
    loadProducts,
    setSearchTerm,
    setCategoryFilter,
    setSorting,
    clearFilters,
    deleteProduct,
    clearError,
  } = useSupplierProductsStore()

  // Local state
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    product: null,
    loading: false,
  })

  // Cargar productos al montar el componente
  useEffect(() => {
    if (supplierId) {
      loadProducts(supplierId)
    }
  }, [supplierId, loadProducts])

  // Obtener productos mapeados para la UI
  const uiProducts = useSupplierProductsStore.getState().getUiProducts()

  // Estadísticas calculadas
  const stats = {
    total: uiProducts.length,
    inStock: uiProducts.filter((p) => p.stock > 0).length,
    outOfStock: uiProducts.filter((p) => p.stock === 0).length,
    totalValue: uiProducts.reduce(
      (sum, p) => sum + (p.precio || 0) * (p.stock || 0),
      0
    ),
  }

  // Handlers
  const handleAddProduct = () => {
    navigate('/supplier/addproduct')
  }
  const handleEditProduct = (product) => {
    // Navegar a la página de edición con el ID del producto
    navigate(`/supplier/addproduct?edit=${product.id}`)
  }

  const handleDeleteProduct = (product) => {
    setDeleteModal({
      open: true,
      product,
      loading: false,
    })
  }

  const confirmDelete = async () => {
    if (!deleteModal.product) return

    setDeleteModal((prev) => ({ ...prev, loading: true }))

    try {
      const result = await deleteProduct(deleteModal.product.id)

      if (result.success) {
        toast.success(`${deleteModal.product.nombre} eliminado correctamente`)
        setDeleteModal({ open: false, product: null, loading: false })
      } else {
        toast.error(result.error || 'Error al eliminar el producto')
      }
    } catch (error) {
      toast.error('Error inesperado al eliminar el producto')
    } finally {
      setDeleteModal((prev) => ({ ...prev, loading: false }))
    }
  }
  const handleViewStats = (product) => {
    // TODO: Implementar vista de estadísticas detalladas
    toast.success(`Próximamente: Estadísticas de ${product.nombre}`)
  }
  const handleSortChange = (event) => {
    const newSortBy = event.target.value
    setSorting(newSortBy, sortOrder)
  }

  const handleClearFilters = () => {
    clearFilters()
    toast.success('Filtros limpiados')
  }

  // Renderizado condicional de loading
  const renderProductSkeleton = () => (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
            <Skeleton variant="text" height={30} sx={{ mb: 1 }} />
            <Skeleton variant="text" height={20} sx={{ mb: 1 }} />
            <Skeleton variant="text" height={20} />
          </Paper>
        </Grid>
      ))}
    </>
  )

  return (
    <ThemeProvider theme={dashboardTheme}>
      <ProviderTopBar />
      <SidebarProvider />

      <Box
        sx={{
          marginLeft: '250px',
          backgroundColor: 'background.default',
          minHeight: '100vh',
          pt: { xs: 9, md: 10 },
          px: 3,
          pb: 3,
        }}
      >
        <Container maxWidth="xl" disableGutters>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                mb: 3,
              }}
            >
              <Box>
                <Typography
                  variant="h4"
                  fontWeight="600"
                  color="primary.main"
                  gutterBottom
                >
                  Mis Productos
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Gestiona tu catálogo de productos de manera eficiente
                </Typography>
              </Box>

              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={handleAddProduct}
                sx={{
                  minWidth: { xs: '100%', sm: 'auto' },
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                }}
              >
                Agregar Producto
              </Button>
            </Box>{' '}
            {/* Estadísticas del inventario */}
            <Box sx={{ mb: 3 }}>
              <Paper
                sx={{ overflow: 'hidden', width: '40%', minWidth: '400px' }}
              >
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'grey.50',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: 'text.primary' }}
                  >
                    Resumen del Inventario
                  </Typography>
                </Box>

                <Box sx={{ p: 0 }}>
                  <Grid container>
                    <Grid item xs={12} sm={4}>
                      <Box
                        sx={{
                          p: 2,
                          borderRight: { sm: '1px solid' },
                          borderColor: { sm: 'divider' },
                          borderBottom: { xs: '1px solid', sm: 'none' },
                          borderBottomColor: { xs: 'divider' },
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                          }}
                        >
                          <InventoryIcon
                            color="primary"
                            sx={{ fontSize: 20 }}
                          />
                          <Box>
                            <Typography
                              variant="h6"
                              sx={{ fontWeight: 600, lineHeight: 1.2 }}
                            >
                              {stats.total}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Total de productos
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <Box
                        sx={{
                          p: 2,
                          borderRight: { sm: '1px solid' },
                          borderColor: { sm: 'divider' },
                          borderBottom: { xs: '1px solid', sm: 'none' },
                          borderBottomColor: { xs: 'divider' },
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                          }}
                        >
                          <Box
                            sx={{
                              color: 'success.main',
                              fontSize: 20,
                              fontWeight: 'bold',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            ✓
                          </Box>
                          <Box>
                            <Typography
                              variant="h6"
                              sx={{ fontWeight: 600, lineHeight: 1.2 }}
                            >
                              {stats.inStock}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Productos en stock
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <Box sx={{ p: 2 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                          }}
                        >
                          <AttachMoneyIcon
                            color="success"
                            sx={{ fontSize: 20 }}
                          />
                          <Box>
                            <Typography
                              variant="h6"
                              sx={{ fontWeight: 600, lineHeight: 1.2 }}
                            >
                              {formatPrice(stats.totalValue)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Valor del inventario
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            </Box>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" onClose={clearError} sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Filtros y búsqueda */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              {/* Búsqueda */}
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>{' '}
              {/* Filtro por categoría */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Categoría</InputLabel>{' '}
                  <Select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    label="Categoría"
                    sx={{
                      borderRadius: 2,
                      minWidth: '200px',
                      '& .MuiSelect-select': {
                        minWidth: '150px',
                      },
                    }}
                    MenuProps={{
                      disableScrollLock: true,
                    }}
                  >
                    {CATEGORIES.map((category) => (
                      <MenuItem key={category.value} value={category.value}>
                        {category.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>{' '}
              {/* Ordenamiento */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Ordenar por</InputLabel>{' '}
                  <Select
                    value={sortBy}
                    onChange={handleSortChange}
                    label="Ordenar por"
                    sx={{
                      borderRadius: 2,
                      minWidth: '200px',
                      '& .MuiSelect-select': {
                        minWidth: '150px',
                      },
                    }}
                    MenuProps={{
                      disableScrollLock: true,
                    }}
                  >
                    {SORT_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>{' '}
              {/* Acciones */}
              <Grid item xs={12} sm={6} md={2}>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    onClick={handleClearFilters}
                    sx={{ borderRadius: 2, minWidth: 'auto', px: 2 }}
                  >
                    <ClearIcon />
                  </Button>
                </Stack>
              </Grid>
            </Grid>

            {/* Filtros activos */}
            {(searchTerm || categoryFilter !== 'all') && (
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {searchTerm && (
                  <Chip
                    label={`Búsqueda: "${searchTerm}"`}
                    onDelete={() => setSearchTerm('')}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
                {categoryFilter !== 'all' && (
                  <Chip
                    label={`Categoría: ${
                      CATEGORIES.find((c) => c.value === categoryFilter)?.label
                    }`}
                    onDelete={() => setCategoryFilter('all')}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Box>
            )}
          </Paper>

          {/* Grid de productos */}
          <Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="h6" color="text.secondary">
                {loading
                  ? 'Cargando...'
                  : `${filteredProducts.length} productos encontrados`}
              </Typography>

              <Chip
                label={`Orden: ${sortOrder === 'asc' ? '↑' : '↓'} ${
                  SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label ||
                  'Fecha'
                }`}
                size="small"
                variant="outlined"
              />
            </Box>{' '}
            <Grid container spacing={3}>
              {loading ? (
                renderProductSkeleton()
              ) : uiProducts.length === 0 ? (
                <Grid item xs={12} sx={{ width: '100%' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      minHeight: '400px',
                      width: '100%',
                      px: 0,
                      mx: 0,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        width: '100%',
                      }}
                    >
                      <Paper
                        sx={{
                          p: 6,
                          textAlign: 'center',
                          maxWidth: 500,
                          width: 'auto',
                        }}
                      >
                        <InventoryIcon
                          sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}
                        />
                        <Typography
                          variant="h6"
                          color="text.secondary"
                          gutterBottom
                        >
                          {searchTerm || categoryFilter !== 'all'
                            ? 'No se encontraron productos con los filtros aplicados'
                            : 'Aún no tienes productos publicados'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {searchTerm || categoryFilter !== 'all'
                            ? 'Intenta modificar los filtros de búsqueda'
                            : 'Comienza agregando tu primer producto para mostrar tu catálogo'}
                        </Typography>
                      </Paper>
                    </Box>
                  </Box>
                </Grid>
              ) : (
                uiProducts.map((product) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                    <SupplierProductCard
                      product={product}
                      onEdit={handleEditProduct}
                      onDelete={handleDeleteProduct}
                      onViewStats={handleViewStats}
                      isDeleting={deleting[product.id]}
                      isUpdating={updating[product.id]}
                    />
                  </Grid>
                ))
              )}
            </Grid>
          </Box>

          {/* FAB para móvil */}
          {isMobile && (
            <Fab
              color="primary"
              onClick={handleAddProduct}
              sx={{
                position: 'fixed',
                bottom: 16,
                right: 16,
                zIndex: 1000,
              }}
            >
              <AddIcon />
            </Fab>
          )}
        </Container>
      </Box>

      {/* Modal de confirmación de eliminación */}
      <ConfirmationModal
        open={deleteModal.open}
        onClose={() =>
          setDeleteModal({ open: false, product: null, loading: false })
        }
        onConfirm={confirmDelete}
        type={MODAL_TYPES.DELETE}
        title="Eliminar producto"
        message={
          deleteModal.product
            ? `¿Estás seguro de que deseas eliminar "${deleteModal.product.nombre}"? Esta acción no se puede deshacer.`
            : ''
        }
        loading={deleteModal.loading}
      />
    </ThemeProvider>
  )
}

export default MyProducts
