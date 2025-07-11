/**
 * 🛒 Tabla de Productos Marketplace
 * 
 * Componente que permite a los administradores gestionar productos del marketplace:
 * - Ver productos disponibles (Stock >= Compra Mínima)
 * - Eliminar productos del marketplace
 * - Filtrar y buscar productos
 * - Ver estadísticas de productos
 * 
 * @author Panel Administrativo Sellsi
 * @date 10 de Julio de 2025
 */

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Alert,
  Fab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Store as StoreIcon,
  Inventory as InventoryIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  ShoppingCart as ShoppingCartIcon
} from '@mui/icons-material';

// Importar componentes UI existentes
import AdminStatCard from './AdminStatCard';
import { getMarketplaceProducts, deleteProduct, getProductStats } from '../../../services/adminPanelService';
import { useBanner } from '../../ui';

// ✅ CONSTANTS
const PRODUCT_STATUS = {
  available: { color: 'success', icon: '✅', label: 'Disponible' },
  lowStock: { color: 'warning', icon: '⚠️', label: 'Stock Bajo' },
  outOfStock: { color: 'error', icon: '❌', label: 'Sin Stock' }
};

const PRODUCT_FILTERS = [
  { value: 'all', label: 'Todos los productos' },
  { value: 'available', label: 'Productos disponibles' },
  { value: 'lowStock', label: 'Stock bajo' }
];

// ✅ COMMON STYLES
const commonStyles = {
  container: {
    p: 3,
    overflowX: 'hidden' // Previene scroll horizontal
  },
  headerSection: {
    mb: 4
  },
  filtersSection: {
    mb: 3,
    p: 2,
    borderRadius: 2,
    backgroundColor: '#f8f9fa',
    overflowX: 'hidden' // Previene scroll horizontal en filtros
  },
  tableContainer: {
    mb: 3
  },
  tableHeader: {
    backgroundColor: '#1976d2',
    color: 'white',
    fontWeight: 'bold'
  },
  tableRow: {
    '&:hover': {
      backgroundColor: '#f5f5f5'
    }
  },
  actionButton: {
    m: 0.5,
    minWidth: 'auto'
  },
  statusChip: {
    fontWeight: 'bold',
    minWidth: 100
  },
  refreshFab: {
    position: 'fixed',
    bottom: 16,
    right: 16
  },
  productImage: {
    width: 40,
    height: 40,
    borderRadius: 1
  }
};

// ✅ PRODUCT MARKETPLACE TABLE COMPONENT
const ProductMarketplaceTable = memo(() => {
  // ========================================
  // 🔧 ESTADO
  // ========================================
  
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Filtros
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    supplier: 'all'
  });

  // Estado para búsqueda con debounce
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce para el campo de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 150); // 150ms de delay para mejor responsividad

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Actualizar el filtro cuando cambie el término de búsqueda con debounce
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      search: debouncedSearchTerm
    }));
  }, [debouncedSearchTerm]);

  // Estado de selección múltiple
  const [selectedProducts, setSelectedProducts] = useState(new Set());

  // Modal de confirmación para eliminar
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    product: null
  });

  const { showBanner } = useBanner();

  // ========================================
  // 🔧 EFECTOS
  // ========================================

  // Cargar datos solo una vez al iniciar
  useEffect(() => {
    loadData();
  }, []);

  // ========================================
  // 🔧 HELPER FUNCTIONS
  // ========================================

  const getProductStatus = (product) => {
    // Determinar estado basado en stock vs compra mínima
    const stock = product.stock || 0;
    const minPurchase = product.min_purchase || 1;
    
    if (stock >= minPurchase) {
      return stock <= minPurchase * 1.5 ? 'lowStock' : 'available';
    }
    return 'outOfStock';
  };

  // ========================================
  // 🔧 MEMOIZED VALUES - FILTRADO LOCAL
  // ========================================

  // Filtrado en memoria - no hace consultas a la API
  const filteredProducts = useMemo(() => {
    if (!products.length) return [];

    return products.filter(product => {
      // Filtro por estado
      if (filters.status !== 'all') {
        const productStatus = getProductStatus(product);
        if (productStatus !== filters.status) return false;
      }

      // Filtro por búsqueda - busca en nombre, ID, proveedor
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        return (
          product.product_name?.toLowerCase().includes(searchTerm) ||
          product.product_id?.toLowerCase().includes(searchTerm) ||
          product.supplier_name?.toLowerCase().includes(searchTerm) ||
          product.user_id?.toLowerCase().includes(searchTerm)
        );
      }

      return true;
    });
  }, [products, filters]);

  // ========================================
  // 🔧 HANDLERS
  // ========================================

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      // Cargar todos los productos sin filtros (filtrado local)
      const [productsResult, statsResult] = await Promise.all([
        getMarketplaceProducts({}), // Sin filtros - cargar todos los productos disponibles
        getProductStats()
      ]);

      if (productsResult.success) {
        setProducts(productsResult.data || []);
        setInitialLoadComplete(true);
      } else {
        setError(productsResult.error || 'Error cargando productos');
      }

      if (statsResult.success) {
        setStats(statsResult.stats || {});
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error interno del servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = useCallback((field, value) => {
    if (field === 'search') {
      setSearchTerm(value);
    } else {
      setFilters(prev => ({
        ...prev,
        [field]: value
      }));
    }
  }, []);

  const handleProductSelect = useCallback((productId, isSelected) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(productId);
      } else {
        newSet.delete(productId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((isSelected) => {
    if (isSelected) {
      setSelectedProducts(new Set(filteredProducts.map(product => product.product_id)));
    } else {
      setSelectedProducts(new Set());
    }
  }, [filteredProducts]);

  const openDeleteModal = (product) => {
    setDeleteModal({
      open: true,
      product
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      open: false,
      product: null
    });
  };

  const handleDeleteConfirm = async () => {
    const { product } = deleteModal;
    try {
      const result = await deleteProduct(product.product_id);
      if (result.success) {
        await loadData();
        closeDeleteModal();
        showBanner({
          message: `El producto "${product.product_name}" fue eliminado correctamente`,
          severity: 'success',
        });
      } else {
        setError(result.error || 'Error al eliminar producto');
      }
    } catch (error) {
      console.error('Error eliminando producto:', error);
      setError('Error interno del servidor');
    }
  };

  // ========================================
  // 🎨 RENDER COMPONENTS
  // ========================================

  const MemoAdminStatCard = memo(AdminStatCard);
  const renderStatsCards = useCallback(() => (
    <Grid container spacing={3} sx={commonStyles.headerSection}>
      <Grid item xs={12} sm={6} md={3}>
        <MemoAdminStatCard
          title="Total Productos"
          value={stats.totalProducts || 0}
          icon={InventoryIcon}
          color="primary"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MemoAdminStatCard
          title="Productos Disponibles"
          value={stats.availableProducts || 0}
          icon={ShoppingCartIcon}
          color="success"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MemoAdminStatCard
          title="Stock Bajo"
          value={stats.lowStockProducts || 0}
          icon={InventoryIcon}
          color="warning"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MemoAdminStatCard
          title="Proveedores Activos"
          value={stats.activeSuppliers || 0}
          icon={StoreIcon}
          color="info"
        />
      </Grid>
    </Grid>
  ), [stats]);

  const menuPropsEstado = useMemo(() => ({
    disableScrollLock: true,
    PaperProps: {
      style: {
        maxHeight: 300,
        minWidth: 200
      }
    },
    anchorOrigin: {
      vertical: 'bottom',
      horizontal: 'left'
    },
    transformOrigin: {
      vertical: 'top',
      horizontal: 'left'
    }
  }), []);
  const menuPropsProveedor = menuPropsEstado;
  const sxEstado = useMemo(() => ({ '& .MuiSelect-select': { minHeight: 'auto' }, maxWidth: '100%' }), []);
  const sxProveedor = useMemo(() => ({ minWidth: 200, maxWidth: 260, width: '260px', '& .MuiSelect-select': { minHeight: 'auto' } }), []);

  const renderFilters = useCallback(() => (
    <Paper sx={commonStyles.filtersSection}>
      <Grid container spacing={3} alignItems="center">
        <Grid item xs={12} sm={6} md={3}>
          <FormControl 
            fullWidth 
            size="medium" 
            sx={sxEstado}
          >
            <InputLabel>Estado</InputLabel>
            <Select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              label="Estado"
              MenuProps={menuPropsEstado}
            >
              {PRODUCT_FILTERS.map(filter => (
                <MenuItem key={filter.value} value={filter.value}>
                  {filter.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl 
            fullWidth 
            size="medium" 
            sx={sxProveedor}
          >
            <InputLabel>Proveedor</InputLabel>
            <Select
              value={filters.supplier}
              onChange={(e) => handleFilterChange('supplier', e.target.value)}
              label="Proveedor"
              MenuProps={menuPropsProveedor}
            >
              <MenuItem value="all">Todos los proveedores</MenuItem>
              {/* TODO: Agregar lista de proveedores dinámicamente */}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              fullWidth
              size="medium"
              placeholder="Buscar por nombre, ID, proveedor..."
              value={searchTerm}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              sx={{ minWidth: 320, maxWidth: 600, width: '100%' }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap', minWidth: 120 }}>
              {
                !initialLoadComplete 
                  ? "Cargando..." 
                  : searchTerm && debouncedSearchTerm !== searchTerm 
                    ? "Filtrando..." 
                    : `Mostrando ${filteredProducts.length} de ${products.length}`
              }
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  ), [filters, handleFilterChange, searchTerm, debouncedSearchTerm, initialLoadComplete, filteredProducts.length, products.length]);

  const renderProductsTable = () => (
    <TableContainer component={Paper} sx={commonStyles.tableContainer}>
      <Table>
        <TableHead>
          <TableRow sx={commonStyles.tableHeader}>
            <TableCell padding="checkbox">
              <Checkbox
                indeterminate={selectedProducts.size > 0 && selectedProducts.size < filteredProducts.length}
                checked={filteredProducts.length > 0 && selectedProducts.size === filteredProducts.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
                sx={{ color: 'white' }}
              />
            </TableCell>
            <TableCell sx={{ color: 'white' }}>Producto</TableCell>
            <TableCell sx={{ color: 'white' }}>ID Producto</TableCell>
            <TableCell sx={{ color: 'white' }}>Proveedor</TableCell>
            <TableCell sx={{ color: 'white' }}>User ID</TableCell>
            <TableCell sx={{ color: 'white' }}>Stock</TableCell>
            <TableCell sx={{ color: 'white' }}>Estado</TableCell>
            <TableCell align="center" sx={{ color: 'white' }}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredProducts.map((product) => {
            const productStatus = getProductStatus(product);
            const isSelected = selectedProducts.has(product.product_id);

            return (
              <TableRow 
                key={product.product_id} 
                sx={commonStyles.tableRow}
                selected={isSelected}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={isSelected}
                    onChange={(e) => handleProductSelect(product.product_id, e.target.checked)}
                  />
                </TableCell>

                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar 
                      src={product.product_image} 
                      sx={commonStyles.productImage}
                      variant="rounded"
                    >
                      <InventoryIcon />
                    </Avatar>
                    <Box>
                      <Typography component="span" variant="body2" fontWeight="medium">
                        {product.product_name || 'N/A'}
                      </Typography>
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        ${product.price || 0}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>

                <TableCell>
                  <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                    {product.product_id?.slice(0, 8)}...
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {product.supplier_name || 'N/A'}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                    {product.user_id?.slice(0, 8)}...
                  </Typography>
                </TableCell>

                <TableCell>
                  <Chip
                    label={`${product.stock || 0} / ${product.min_purchase || 1}`}
                    size="small"
                    color={productStatus === 'available' ? 'success' : productStatus === 'lowStock' ? 'warning' : 'error'}
                    variant="outlined"
                  />
                </TableCell>

                <TableCell>
                  <Chip
                    label={PRODUCT_STATUS[productStatus].label}
                    size="small"
                    color={PRODUCT_STATUS[productStatus].color}
                    sx={commonStyles.statusChip}
                  />
                </TableCell>

                <TableCell align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                    <Tooltip title="Ver detalles">
                      <IconButton size="small" sx={commonStyles.actionButton}>
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Eliminar producto">
                      <IconButton 
                        size="small" 
                        sx={commonStyles.actionButton}
                        color="error"
                        onClick={() => openDeleteModal(product)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {filteredProducts.length === 0 && !loading && (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No se encontraron productos
          </Typography>
        </Box>
      )}
    </TableContainer>
  );

  const renderDeleteModal = () => (
    <Dialog
      open={deleteModal.open}
      onClose={closeDeleteModal}
      aria-labelledby="delete-product-dialog-title"
      aria-describedby="delete-product-dialog-description"
      maxWidth="xs"
      PaperProps={{
        sx: { minWidth: 400, maxWidth: 480 }
      }}
    >
      <DialogTitle id="delete-product-dialog-title" sx={{ textAlign: 'center' }}>
        Eliminar producto del marketplace
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="delete-product-dialog-description" sx={{ textAlign: 'center' }}>
          ¿Estás seguro de que deseas eliminar el producto <b style={{fontWeight:'bold'}}>{deleteModal.product?.product_name}</b> del marketplace?<br/>
          Esta acción no se puede deshacer.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', gap: 3 }}>
        <Button onClick={closeDeleteModal} color="inherit">
          Cancelar
        </Button>
        <Button onClick={handleDeleteConfirm} color="error" variant="contained">
          Eliminar
        </Button>
      </DialogActions>
    </Dialog>
  );

  // ========================================
  // 🎨 RENDER PRINCIPAL
  // ========================================

  if (loading) {
    return (
      <Box sx={commonStyles.container}>
        <Typography>Cargando productos...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={commonStyles.container}>
      {/* Header con estadísticas */}
      {renderStatsCards()}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filtros */}
      {renderFilters()}

      {/* Tabla de productos */}
      {renderProductsTable()}

      {/* Botón de refrescar con hover y tooltip */}
      <Tooltip title="Refrescar página" arrow>
        <Fab
          color="primary"
          sx={{
            ...commonStyles.refreshFab,
            transition: 'box-shadow 0.2s, background 0.2s',
            boxShadow: 3,
            '&:hover': {
              background: '#1976d2',
              boxShadow: 8,
            },
          }}
          onClick={loadData}
          disabled={loading}
        >
          <RefreshIcon />
        </Fab>
      </Tooltip>

      {/* Modal de confirmación de eliminación */}
      {renderDeleteModal()}
    </Box>
  );
});

ProductMarketplaceTable.displayName = 'ProductMarketplaceTable';

export default ProductMarketplaceTable;
