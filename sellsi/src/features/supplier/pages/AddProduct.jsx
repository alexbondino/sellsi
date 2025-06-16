import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Grid,
  Divider,
  Card,
  CardContent,
  Alert,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Chip,
  Stack,
  useTheme,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { ThemeProvider } from '@mui/material/styles';
import { toast } from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../../services/supabase';

// Components
import SidebarProvider from '../../layout/SideBar';
import { ImageUploader, FileUploader } from '../../ui';

// Hooks y stores
import { useSupplierProducts } from '../hooks/useSupplierProducts';
import { useProductForm } from '../hooks/useProductForm';
import { dashboardTheme } from '../../../styles/dashboardTheme';
import { formatPrice } from '../../marketplace/utils/formatters';

// Constantes
const CATEGORIES = [
  { value: '', label: 'Selecciona una categoría' },
  { value: 'Supermercado', label: 'Supermercado' },
  { value: 'Electrodomésticos', label: 'Electrodomésticos' },
  { value: 'Tecnología', label: 'Tecnología' },
  { value: 'Hogar', label: 'Hogar' },
  { value: 'Moda', label: 'Moda' },
];

const PRICING_TYPES = {
  UNIT: 'Por Unidad',
  TIER: 'Por Tramo',
};

const AddProduct = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  // Usar los nuevos hooks modularizados
  const { createProduct, updateProduct, getProductById, loadProducts } =
    useSupplierProducts();

  // Detectar modo de edición
  const editProductId = searchParams.get('edit');
  const isEditMode = Boolean(editProductId);
  const supplierId = localStorage.getItem('user_id');
  // Usar el hook de formulario especializado
  const {
    formData,
    errors,
    touched,
    isLoading,
    isValid,
    updateField,
    handleFieldBlur,
    submitForm,
    resetForm,
  } = useProductForm(editProductId);
  // Cargar productos al montar el componente
  useEffect(() => {
    if (supplierId) {
      loadProducts(supplierId);
    }
  }, [supplierId, loadProducts]);

  // Cálculos dinámicos
  const [calculations, setCalculations] = useState({
    ingresoPorVentas: 0,
    tarifaServicio: 0,
    total: 0,
  });

  // Efecto para calcular dinámicamente
  useEffect(() => {
    calculateEarnings();
  }, [
    formData.stock,
    formData.precioUnidad,
    formData.tramos,
    formData.pricingType,
  ]);

  const calculateEarnings = () => {
    let totalIncome = 0;
    const serviceRate = 0.05; // 5% de tarifa

    if (
      formData.pricingType === 'Por Unidad' &&
      formData.precioUnidad &&
      formData.stock
    ) {
      totalIncome =
        parseFloat(formData.precioUnidad) * parseInt(formData.stock);
    } else if (
      formData.pricingType === 'Por Tramo' &&
      formData.tramos.length > 0
    ) {
      // Calcular basado en el tramo más alto (asumiendo venta completa del stock)
      const highestTier = formData.tramos
        .filter(t => t.cantidad && t.precio)
        .sort((a, b) => parseInt(b.cantidad) - parseInt(a.cantidad))[0];

      if (highestTier && formData.stock) {
        const maxSales = Math.min(
          parseInt(formData.stock),
          parseInt(highestTier.cantidad)
        );
        totalIncome = parseFloat(highestTier.precio) * maxSales;
      }
    }

    const serviceFee = totalIncome * serviceRate;
    const finalTotal = totalIncome - serviceFee;

    setCalculations({
      ingresoPorVentas: totalIncome,
      tarifaServicio: serviceFee,
      total: finalTotal,
    });
  }; // Handlers
  const handleInputChange = field => event => {
    const value = event.target.value;
    updateField(field, value);
  };
  const handlePricingTypeChange = (event, newValue) => {
    if (newValue !== null) {
      updateField('pricingType', newValue);
      if (newValue === 'Por Tramo') {
        updateField('precioUnidad', '');
      } else {
        updateField('tramos', [{ cantidad: '', precio: '' }]);
      }
    }
  };

  const handleTramoChange = (index, field, value) => {
    const newTramos = [...formData.tramos];
    newTramos[index] = { ...newTramos[index], [field]: value };
    updateField('tramos', newTramos);
  };
  const addTramo = () => {
    const newTramos = [...formData.tramos, { cantidad: '', precio: '' }];
    updateField('tramos', newTramos);
  };

  const removeTramo = index => {
    if (formData.tramos.length > 1) {
      const newTramos = formData.tramos.filter((_, i) => i !== index);
      updateField('tramos', newTramos);
    }
  };

  const handleImagesChange = images => {
    updateField('imagenes', images);
  };

  const handleDocumentsChange = documents => {
    updateField('documentos', documents);
  };
  // Handler para especificaciones
  const handleSpecificationChange = (index, field, value) => {
    const newSpecs = [...formData.specifications];
    newSpecs[index][field] = value;
    updateField('specifications', newSpecs);
  };

  const addSpecification = () => {
    const newSpecs = [...formData.specifications, { key: '', value: '' }];
    updateField('specifications', newSpecs);
  };

  const removeSpecification = index => {
    if (formData.specifications.length > 1) {
      const newSpecs = formData.specifications.filter((_, i) => i !== index);
      updateField('specifications', newSpecs);
    }
  };

  // Validación
  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre del producto es requerido';
    } else if (formData.nombre.length > 40) {
      newErrors.nombre = 'Máximo 40 caracteres';
    }
    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es requerida';
    } else if (formData.descripcion.length > 600) {
      newErrors.descripcion = 'Máximo 600 caracteres';
    }

    if (!formData.categoria) {
      newErrors.categoria = 'Selecciona una categoría';
    }
    if (!formData.stock) {
      newErrors.stock = 'El stock es requerido';
    } else if (
      parseInt(formData.stock) < 1 ||
      parseInt(formData.stock) > 15000
    ) {
      newErrors.stock = 'Ingrese un número entre 1 y 15.000';
    }
    if (!formData.compraMinima) {
      newErrors.compraMinima = 'La compra mínima es requerida';
    } else if (
      parseInt(formData.compraMinima) < 1 ||
      parseInt(formData.compraMinima) > 15000
    ) {
      newErrors.compraMinima = 'Seleccione un número entre 1 y 15.000';
    } else if (
      parseInt(formData.compraMinima) > parseInt(formData.stock || 0)
    ) {
      newErrors.compraMinima =
        'La compra mínima no puede ser mayor al stock disponible';
    }

    if (formData.pricingType === 'Por Unidad') {
      if (!formData.precioUnidad) {
        newErrors.precioUnidad = 'El precio es requerido';
      }
    } else {
      const validTramos = formData.tramos.filter(t => t.cantidad && t.precio);
      if (validTramos.length === 0) {
        newErrors.tramos = 'Debe agregar al menos un tramo válido';
      } else {
        // Validar que las cantidades de los tramos no excedan el stock
        const stockNumber = parseInt(formData.stock || 0);
        const invalidTramos = validTramos.filter(
          tramo => parseInt(tramo.cantidad) > stockNumber
        );
        if (invalidTramos.length > 0) {
          newErrors.tramos =
            'Las cantidades de los tramos no pueden ser mayores al stock disponible';
        }
      }
    }
    if (formData.imagenes.length === 0) {
      newErrors.imagenes = 'Debe agregar al menos una imagen';
    }

    // Validación opcional para documentos PDF
    if (formData.documentos && formData.documentos.length > 0) {
      const validDocuments = formData.documentos.filter(
        doc =>
          doc.file &&
          doc.file.type === 'application/pdf' &&
          doc.file.size <= 5 * 1024 * 1024
      );
      if (validDocuments.length !== formData.documentos.length) {
        newErrors.documentos = 'Solo se permiten archivos PDF de máximo 5MB';
      }
    }

    // En validateForm, agregar validación básica de especificaciones
    if (formData.specifications.some(s => s.key && !s.value)) {
      newErrors.specifications =
        'Completa todos los valores de las especificaciones';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async () => {
    try {
      await submitForm();
      toast.success(
        isEditMode
          ? 'Producto actualizado exitosamente'
          : 'Producto agregado exitosamente'
      );
      navigate('/supplier/myproducts');
    } catch (error) {
      toast.error(error.message || 'Error inesperado al procesar el producto');
    }
  };

  const handleBack = () => {
    navigate('/supplier/myproducts');
  };

  return (
    <ThemeProvider theme={dashboardTheme}>
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={handleBack}
                variant="outlined"
                sx={{ textTransform: 'none' }}
              >
                Volver
              </Button>
              <Typography variant="h4" fontWeight="600" color="primary.main">
                Mis Productos &gt;{' '}
                {isEditMode ? 'Editar Producto' : 'Agregar Producto'}
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={3}>
            {/* Formulario principal */}
            <Grid size={{ xs: 12, lg: 8 }}>
              <Paper
                sx={{
                  p: 3,
                  minWidth: '980px', // Ancho mínimo fijo
                  maxWidth: '100%', // Máximo para mantener responsividad
                  width: '100%', // Usa todo el ancho disponible
                }}
              >
                {/* Tab de Producto */}
                <Box sx={{ mb: 3 }}>
                  <Chip
                    label="Producto"
                    color="primary"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>{' '}
                {/* Formulario con CSS Grid nativo */}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 3,
                    '& .full-width': {
                      gridColumn: '1 / -1',
                    },
                  }}
                >
                  {/* FILA 1: Información Básica (50%) | Categoría (50%) */}
                  <Box>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}
                    >
                      Información Básica
                    </Typography>{' '}
                    <TextField
                      fullWidth
                      label="Nombre Producto:"
                      placeholder="Máximo 40 caracteres"
                      value={formData.nombre}
                      onChange={handleInputChange('nombre')}
                      onBlur={() => handleFieldBlur('nombre')}
                      error={!!errors.nombre}
                      helperText={
                        errors.nombre ||
                        `${formData.nombre.length}/40 caracteres`
                      }
                      inputProps={{ maxLength: 40 }}
                    />
                  </Box>
                  <Box>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}
                    >
                      Categoría
                    </Typography>
                    <FormControl fullWidth error={!!errors.categoria}>
                      <InputLabel>Categoría:</InputLabel>
                      <Select
                        value={formData.categoria}
                        onChange={handleInputChange('categoria')}
                        onBlur={() => handleFieldBlur('categoria')}
                        label="Categoría:"
                        MenuProps={{
                          disableScrollLock: true,
                        }}
                      >
                        {CATEGORIES.map(category => (
                          <MenuItem key={category.value} value={category.value}>
                            {category.label}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.categoria && (
                        <Typography
                          variant="caption"
                          color="error"
                          sx={{ mt: 0.5, ml: 1.5 }}
                        >
                          {errors.categoria}
                        </Typography>
                      )}
                    </FormControl>
                  </Box>
                  {/* FILA 2: Descripción del Producto (100%) */}
                  <Box className="full-width">
                    {' '}
                    <TextField
                      fullWidth
                      label="Descripción Producto:"
                      placeholder="Máximo 600 caracteres"
                      multiline
                      rows={3}
                      value={formData.descripcion}
                      onChange={handleInputChange('descripcion')}
                      onBlur={() => handleFieldBlur('descripcion')}
                      error={!!errors.descripcion}
                      helperText={
                        errors.descripcion ||
                        `${formData.descripcion.length}/600 caracteres`
                      }
                      inputProps={{ maxLength: 600 }}
                    />
                  </Box>
                  {/* FILA 3: Inventario y Disponibilidad (50%) | Compra Mínima (50%) */}
                  <Box>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}
                    >
                      Inventario y Disponibilidad
                    </Typography>{' '}
                    <TextField
                      fullWidth
                      label="Stock Disponible:"
                      placeholder="Ingrese un número entre 1 y 15.000"
                      value={formData.stock}
                      onChange={handleInputChange('stock')}
                      onBlur={() => handleFieldBlur('stock')}
                      error={!!errors.stock}
                      helperText={errors.stock}
                      type="number"
                      inputProps={{ min: 1, max: 15000 }}
                    />
                  </Box>
                  <Box sx={{ mt: 6 }}>
                    {' '}
                    <TextField
                      fullWidth
                      label="Compra Mínima:"
                      placeholder="Seleccione un número entre 1 y 15.000"
                      value={formData.compraMinima}
                      onChange={handleInputChange('compraMinima')}
                      onBlur={() => handleFieldBlur('compraMinima')}
                      error={!!errors.compraMinima}
                      helperText={errors.compraMinima}
                      type="number"
                      inputProps={{ min: 1, max: 15000 }}
                    />
                  </Box>{' '}
                  {/* FILA 4: Configuración de Precios (50%) */}
                  <Box>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}
                    >
                      Configuración de Precios
                    </Typography>
                    <TextField
                      fullWidth
                      label="Precio de Venta:"
                      placeholder="Campo de entrada"
                      value={formData.precioUnidad}
                      onChange={handleInputChange('precioUnidad')}
                      onBlur={() => handleFieldBlur('precioUnidad')}
                      disabled={formData.pricingType === 'Por Tramo'}
                      error={!!errors.precioUnidad}
                      helperText={errors.precioUnidad}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">$</InputAdornment>
                        ),
                      }}
                      type="number"
                    />
                  </Box>
                  {/* FILA 5: Precio a cobrar según + Tramos */}
                  <Box className="full-width">
                    <Typography
                      variant="subtitle1"
                      gutterBottom
                      sx={{ fontWeight: 600 }}
                    >
                      Precio a cobrar según:
                    </Typography>
                    <ToggleButtonGroup
                      value={formData.pricingType}
                      exclusive
                      onChange={handlePricingTypeChange}
                      sx={{ mb: 3 }}
                    >
                      <ToggleButton
                        value="Por Unidad"
                        sx={{ textTransform: 'none' }}
                      >
                        Por Unidad
                      </ToggleButton>
                      <ToggleButton
                        value="Por Tramo"
                        sx={{ textTransform: 'none' }}
                      >
                        Por Tramo
                      </ToggleButton>
                    </ToggleButtonGroup>

                    {/* Tramos horizontales (si se selecciona Por Tramo) */}
                    {formData.pricingType === 'Por Tramo' && (
                      <Box>
                        <Typography
                          variant="subtitle2"
                          gutterBottom
                          sx={{ fontWeight: 600 }}
                        >
                          Configuración de Tramos de Precio:
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          sx={{ mb: 2 }}
                        >
                          Define diferentes precios según la cantidad comprada.{' '}
                        </Typography>{' '}
                        <Box
                          sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 2,
                            justifyContent: 'flex-start',
                          }}
                        >
                          {formData.tramos.map((tramo, index) => (
                            <Paper
                              key={index}
                              elevation={1}
                              sx={{
                                p: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 2,
                                height: '100%',
                                width: '180px',
                                minHeight: '162px',
                              }}
                            >
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  mb: 1,
                                }}
                              >
                                <Typography
                                  variant="subtitle2"
                                  fontWeight="600"
                                >
                                  Tramo {index + 1}
                                </Typography>
                                {formData.tramos.length > 1 && (
                                  <IconButton
                                    onClick={() => removeTramo(index)}
                                    color="error"
                                    size="small"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </Box>
                              <Stack spacing={2}>
                                <TextField
                                  fullWidth
                                  label="Cantidad"
                                  placeholder="Ej: 10"
                                  value={tramo.cantidad}
                                  onChange={e =>
                                    handleTramoChange(
                                      index,
                                      'cantidad',
                                      e.target.value
                                    )
                                  }
                                  type="number"
                                  size="small"
                                />
                                <TextField
                                  fullWidth
                                  label="Precio"
                                  placeholder="Ej: 1500"
                                  value={tramo.precio}
                                  onChange={e =>
                                    handleTramoChange(
                                      index,
                                      'precio',
                                      e.target.value
                                    )
                                  }
                                  type="number"
                                  size="small"
                                  InputProps={{
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        $
                                      </InputAdornment>
                                    ),
                                  }}
                                />{' '}
                              </Stack>
                            </Paper>
                          ))}{' '}
                          {/* Botón para agregar tramo */}
                          {formData.tramos.length < 5 && (
                            <Paper
                              elevation={0}
                              sx={{
                                p: 2,
                                border: '2px dashed',
                                borderColor: 'primary.main',
                                borderRadius: 2,
                                height: '100%',
                                width: '180px',
                                minHeight: '162px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                '&:hover': {
                                  bgcolor: 'primary.50',
                                },
                              }}
                              onClick={addTramo}
                            >
                              <Stack alignItems="center" spacing={1}>
                                <AddIcon color="primary" />
                                <Typography
                                  variant="body2"
                                  color="primary"
                                  fontWeight="600"
                                >
                                  Agregar Tramo
                                </Typography>{' '}
                              </Stack>
                            </Paper>
                          )}
                        </Box>
                        {errors.tramos && (
                          <Typography
                            variant="caption"
                            color="error"
                            display="block"
                            sx={{ mt: 1 }}
                          >
                            {errors.tramos}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                  {/* FILA 6: Imágenes del Producto */}
                  <Box
                    className="full-width"
                    sx={{
                      p: 0,
                      m: 0,
                      boxShadow: 'none',
                      bgcolor: 'transparent',
                      overflow: 'visible',
                    }}
                  >
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}
                    >
                      Imágenes del Producto
                    </Typography>
                    <ImageUploader
                      images={formData.imagenes}
                      onImagesChange={handleImagesChange}
                      maxImages={5}
                      error={errors.imagenes}
                    />
                  </Box>{' '}
                  {/* FILA 7: Especificaciones Técnicas */}
                  <Box className="full-width">
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}
                    >
                      Especificaciones Técnicas
                    </Typography>
                    <Grid container spacing={2}>
                      {formData.specifications.map((spec, index) => (
                        <React.Fragment key={index}>
                          <Grid size={5}>
                            <TextField
                              fullWidth
                              label="Clave"
                              placeholder="Ej: Color"
                              value={spec.key}
                              onChange={e =>
                                handleSpecificationChange(
                                  index,
                                  'key',
                                  e.target.value
                                )
                              }
                              size="small"
                            />{' '}
                          </Grid>
                          <Grid size={5}>
                            <TextField
                              fullWidth
                              label="Valor"
                              placeholder="Ej: Rojo"
                              value={spec.value}
                              onChange={e =>
                                handleSpecificationChange(
                                  index,
                                  'value',
                                  e.target.value
                                )
                              }
                              size="small"
                            />{' '}
                          </Grid>
                          <Grid size={2}>
                            {formData.specifications.length > 1 && (
                              <IconButton
                                color="error"
                                onClick={() => removeSpecification(index)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Grid>{' '}
                        </React.Fragment>
                      ))}
                      <Grid size={12}>
                        <Button
                          variant="outlined"
                          startIcon={<AddIcon />}
                          onClick={addSpecification}
                          sx={{ mt: 1 }}
                        >
                          Agregar Especificación
                        </Button>
                      </Grid>{' '}
                      {errors.specifications && (
                        <Grid size={12}>
                          <Typography variant="caption" color="error">
                            {errors.specifications}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                  {/* FILA 8: Documentación Técnica */}
                  <Box className="full-width">
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}
                    >
                      Documentación Técnica
                    </Typography>{' '}
                    <FileUploader
                      files={formData.documentos}
                      onFilesChange={handleDocumentsChange}
                      maxFiles={3}
                      acceptedTypes=".pdf,application/pdf"
                      title="Agregar documentos PDF"
                      description="Arrastra y suelta archivos PDF aquí o haz clic para seleccionar"
                      helpText="Solo archivos PDF • Máximo 5MB por archivo • Hasta 3 archivos"
                      error={errors.documentos}
                      showUploadButton={false}
                      allowPreview={true}
                    />
                  </Box>
                </Box>
              </Paper>
            </Grid>{' '}
            {/* Panel de resultados */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <Paper sx={{ p: 3, position: 'sticky', top: 100 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Resultado Venta
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2">Ingreso por Ventas</Typography>
                    <Typography variant="body2" fontWeight="600">
                      {formatPrice(calculations.ingresoPorVentas)}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2">
                      Tarifa por Servicio (5%)
                    </Typography>
                    <Typography variant="body2" fontWeight="600">
                      {formatPrice(calculations.tarifaServicio)}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6" fontWeight="600">
                      Total
                    </Typography>
                    <Typography
                      variant="h6"
                      fontWeight="600"
                      color="primary.main"
                    >
                      {formatPrice(calculations.total)}
                    </Typography>
                  </Box>

                  <Typography variant="caption" color="text.secondary">
                    Este es el monto que recibirás en tu cuenta una vez se
                    efectúe la venta
                  </Typography>
                </Box>

                {/* Botones de acción */}
                <Stack spacing={2}>
                  <Button
                    variant="outlined"
                    onClick={handleBack}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                    fullWidth
                  >
                    Atrás
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!isValid || isLoading}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                    fullWidth
                  >
                    {isLoading
                      ? 'Guardando...'
                      : isEditMode
                      ? 'Actualizar Producto'
                      : 'Publicar Producto'}
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default AddProduct;
