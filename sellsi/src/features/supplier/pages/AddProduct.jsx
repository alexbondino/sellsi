import React, { useState, useEffect, useCallback } from 'react';
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
  Tooltip,
  FormControlLabel,
  Radio,
  RadioGroup,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  Image as ImageIcon,
  Info as InfoIcon, // <-- Importar InfoIcon
} from '@mui/icons-material';
import { ThemeProvider } from '@mui/material/styles';
import { toast } from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../../services/supabase';
import { UploadService } from '../../../services/uploadService';

// Components
import SideBarProvider from '../../layout/SideBar';
import { ImageUploader, FileUploader } from '../../ui';
import TramosSection from '../components/TramosSection'; // Importar el nuevo componente

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
  const theme = useTheme(); // Usar los nuevos hooks modularizados
  const { createProduct, loadProducts } = useSupplierProducts();

  // Detectar modo de edición
  const editProductId = searchParams.get('edit');
  const isEditMode = Boolean(editProductId);
  const supplierId = localStorage.getItem('user_id'); // Usar el hook de formulario especializado
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
  } = useProductForm(editProductId); // Estado local para errores de validación
  const [localErrors, setLocalErrors] = useState({});
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [imageError, setImageError] = useState('');

  // Validación
  const validateForm = useCallback(() => {
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
      if (!formData.precioUnidad || isNaN(Number(formData.precioUnidad))) {
        newErrors.precioUnidad = 'El precio es requerido';
      } else if (parseFloat(formData.precioUnidad) < 1) {
        newErrors.precioUnidad = 'El precio mínimo es 1';
      }
    } else {
      // Si es Por Tramos, NO agregar error de precioUnidad
      const validTramos = formData.tramos.filter(
        t =>
          t.cantidad !== '' &&
          t.precio !== '' &&
          !isNaN(Number(t.cantidad)) &&
          !isNaN(Number(t.precio))
      );
      if (validTramos.length < 2) {
        newErrors.tramos =
          'Debe agregar al menos dos tramos válidos (cantidad y precio definidos)';
      } else {
        // Validar que ningún precio de tramo supere los 8 dígitos
        const tramosConPrecioAlto = validTramos.filter(
          t => parseFloat(t.precio) > 99999999
        );
        if (tramosConPrecioAlto.length > 0) {
          newErrors.tramos =
            'Los precios de los tramos no pueden superar los 8 dígitos (99,999,999)';
        } else {
          // Validar que las cantidades de los tramos no excedan el stock
          const stockNumber = parseInt(formData.stock || 0);
          const invalidTramos = validTramos.filter(
            tramo => parseInt(tramo.cantidad) > stockNumber
          );
          if (invalidTramos.length > 0) {
            newErrors.tramos =
              'Las cantidades de los tramos no pueden ser mayores al stock disponible';
          } else {
            // Validar que ningún precio de tramo sea menor a 1
            const tramosConPrecioBajo = validTramos.filter(t => parseFloat(t.precio) < 1);
            if (tramosConPrecioBajo.length > 0) {
              newErrors.tramos = 'El precio mínimo por tramo es 1';
            }
          }
        }
      }
    }
    if (formData.imagenes.length === 0) {
      newErrors.imagenes = 'Debe agregar al menos una imagen';
    } else if (formData.imagenes.length > 5) {
      newErrors.imagenes = 'Máximo 5 imágenes permitidas';
    } else {
      // Validar tamaño de cada imagen
      const oversizedImages = formData.imagenes.filter(
        img => img.file && img.file.size > 2 * 1024 * 1024
      );
      if (oversizedImages.length > 0) {
        newErrors.imagenes = 'Algunas imágenes exceden el límite de 2MB';
      }
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
    setLocalErrors(newErrors);
    return newErrors; // <-- SIEMPRE retorna un objeto
  }, [formData]); // Cerrar useCallback con dependencias

  // Cargar productos al montar el componente
  useEffect(() => {
    if (supplierId) {
      loadProducts(supplierId);
    }
  }, [supplierId, loadProducts]);

  // Validación en tiempo real solo si el campo fue tocado o tras submit
  useEffect(() => {
    if (triedSubmit) validateForm();
  }, [formData, triedSubmit, validateForm]);
  // Cálculos dinámicos
  const [calculations, setCalculations] = useState({
    ingresoPorVentas: 0,
    tarifaServicio: 0,
    total: 0,
    // Para rangos cuando es "Por Tramo"
    isRange: false,
    rangos: {
      ingresoPorVentas: { min: 0, max: 0 },
      tarifaServicio: { min: 0, max: 0 },
      total: { min: 0, max: 0 },
    },
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
    const serviceRate = 0.02; // 5% de tarifa
    console.log('[DEBUG] calculateEarnings called:', { pricingType: formData.pricingType, precioUnidad: formData.precioUnidad, stock: formData.stock, tramos: formData.tramos });
    if (
      formData.pricingType === 'Por Unidad' &&
      formData.precioUnidad &&
      formData.stock
    ) {
      // Cálculo simple para precio por unidad
      const totalIncome =
        parseFloat(formData.precioUnidad) * parseInt(formData.stock);
      const serviceFee = totalIncome * serviceRate;
      const finalTotal = totalIncome - serviceFee;

      setCalculations({
        ingresoPorVentas: totalIncome,
        tarifaServicio: serviceFee,
        total: finalTotal,
        isRange: false,
        rangos: {
          ingresoPorVentas: { min: 0, max: 0 },
          tarifaServicio: { min: 0, max: 0 },
          total: { min: 0, max: 0 },
        },
      });
    } else if (
      formData.pricingType === 'Por Tramo' &&
      formData.tramos.length > 0
    ) {
      // Cálculo de rangos para precios por tramo
      const validTramos = formData.tramos.filter(
        t =>
          t.cantidad &&
          t.precio &&
          !isNaN(Number(t.cantidad)) &&
          !isNaN(Number(t.precio))
      );

      if (validTramos.length > 0 && formData.stock) {
        const stock = parseInt(formData.stock);

        // Calcular valor mínimo (peor escenario)
        const minIncome = calculateMinimumIncome(validTramos, stock);

        // Calcular valor máximo (mejor escenario)
        const maxIncome = calculateMaximumIncome(validTramos, stock);

        // Calcular tarifas de servicio
        const minServiceFee = minIncome * serviceRate;
        const maxServiceFee = maxIncome * serviceRate;

        // Calcular totales
        const minTotal = minIncome - minServiceFee;
        const maxTotal = maxIncome - maxServiceFee;

        setCalculations({
          ingresoPorVentas: 0, // No se usa en modo rango
          tarifaServicio: 0, // No se usa en modo rango
          total: 0, // No se usa en modo rango
          isRange: true,
          rangos: {
            ingresoPorVentas: { min: minIncome, max: maxIncome },
            tarifaServicio: { min: minServiceFee, max: maxServiceFee },
            total: { min: minTotal, max: maxTotal },
          },
        });
      } else {
        // Sin tramos válidos, resetear
        setCalculations({
          ingresoPorVentas: 0,
          tarifaServicio: 0,
          total: 0,
          isRange: false,
          rangos: {
            ingresoPorVentas: { min: 0, max: 0 },
            tarifaServicio: { min: 0, max: 0 },
            total: { min: 0, max: 0 },
          },
        });
      }
    } else {
      // Sin datos válidos, resetear
      setCalculations({
        ingresoPorVentas: 0,
        tarifaServicio: 0,
        total: 0,
        isRange: false,
        rangos: {
          ingresoPorVentas: { min: 0, max: 0 },
          tarifaServicio: { min: 0, max: 0 },
          total: { min: 0, max: 0 },
        },
      });
    }
  };

  // Función para calcular el valor mínimo (peor escenario)
  const calculateMinimumIncome = (tramos, stock) => {
    // Ordenar tramos de mayor a menor cantidad (más barato a más caro)
    const sortedTramos = [...tramos].sort(
      (a, b) => parseInt(b.cantidad) - parseInt(a.cantidad)
    );

    let remainingStock = stock;
    let totalIncome = 0;

    for (const tramo of sortedTramos) {
      if (remainingStock <= 0) break;

      const tramoCantidad = parseInt(tramo.cantidad);
      const tramoPrecio = parseFloat(tramo.precio);

      // Usar división entera
      const tramosCompletos = Math.floor(remainingStock / tramoCantidad);

      if (tramosCompletos > 0) {
        totalIncome += tramosCompletos * tramoPrecio;
        remainingStock -= tramosCompletos * tramoCantidad;
      }
    }

    return totalIncome;
  };

  // Función para calcular el valor máximo (mejor escenario)
  const calculateMaximumIncome = (tramos, stock) => {
    // Encontrar el tramo con menor cantidad (más caro)
    const smallestTramo = tramos.reduce((min, current) =>
      parseInt(current.cantidad) < parseInt(min.cantidad) ? current : min
    );

    const tramoCantidad = parseInt(smallestTramo.cantidad);
    const tramoPrecio = parseFloat(smallestTramo.precio);

    // Usar división entera
    const tramosCompletos = Math.floor(stock / tramoCantidad);

    return tramosCompletos * tramoPrecio;
  }; // Handlers
  const handleInputChange = field => event => {
    const value = event.target.value;
    updateField(field, value);
  };
  const handlePricingTypeChange = (event, newValue) => {
    console.log('[DEBUG] handlePricingTypeChange:', { newValue, prevPricingType: formData.pricingType });
    if (newValue !== null) {
      updateField('pricingType', newValue);
      if (newValue === 'Por Tramo') {
        updateField('precioUnidad', '');
      } else {
        updateField('tramos', [{ cantidad: '', precio: '' }]);
      }
    }
    setTimeout(() => {
      console.log('[DEBUG] formData after pricingType change:', formData);
    }, 0);
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
    setImageError(''); // Limpiar errores previos al cambiar imágenes
    updateField('imagenes', images);
  };

  const handleImageError = errorMessage => {
    setImageError(errorMessage);
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
  // Handler para el submit
  const handleSubmit = async e => {
    e.preventDefault();
    setTriedSubmit(true);
    console.log('--- SUBMIT DEBUG ---');
    console.log('formData:', JSON.stringify(formData, null, 2));
    const errors = validateForm();
    console.log('validateForm() errors:', errors);
    if (
      errors &&
      typeof errors === 'object' &&
      Object.keys(errors).length > 0
    ) {
      console.log('❌ Validación fallida:', errors);
      toast.error('Por favor, completa todos los campos requeridos');
      return;
    }
    try {
      const result = await submitForm();
      console.log('submitForm() result:', result);
      if (!result.success) {
        console.error('❌ Backend errors:', result.errors);
        if (result.errors && typeof result.errors === 'object') {
          Object.entries(result.errors).forEach(([key, value]) => {
            if (value) toast.error(`${key}: ${value}`);
          });
        }
        throw new Error(result.error || 'No se pudo procesar el producto');
      }
      console.log('✅ Producto procesado exitosamente');
      toast.success(
        isEditMode
          ? 'Producto actualizado exitosamente'
          : 'Producto agregado exitosamente'
      );
      navigate('/supplier/myproducts');
    } catch (error) {
      console.error('❌ Error en handleSubmit:', error);

      // Manejar error específico de overflow numérico
      if (error.message && error.message.includes('numeric field overflow')) {
        toast.error(
          'Error: Uno o más precios superan el límite permitido (máximo 8 dígitos). Por favor, reduce los valores.'
        );
      } else {
        toast.error(
          error.message || 'Error inesperado al procesar el producto'
        );
      }
    }
    console.log('--- END SUBMIT DEBUG ---');
  };

  const handleBack = () => {
    navigate('/supplier/myproducts');
  };
  useEffect(() => {
    // Logs de debugging - comentados para producción
    // console.log('isValid:', isValid)
    // console.log('formData:', formData)
    // console.log('errors:', errors)
  }, [isValid, formData, errors]);

  return (
    <ThemeProvider theme={dashboardTheme}>
      <SideBarProvider />

      <Box
        sx={{
          marginLeft: '210px',
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
                      sx={{ fontWeight: 600, color: 'black', mb: 2 }}
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
                      error={
                        !!(touched.nombre || triedSubmit) && !!errors.nombre
                      }
                      helperText={
                        touched.nombre || triedSubmit
                          ? errors.nombre ||
                            `${formData.nombre.length}/40 caracteres`
                          : ''
                      }
                      inputProps={{ maxLength: 40 }}
                    />
                  </Box>
                  <Box>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ fontWeight: 600, color: 'black', mb: 2 }}
                    >
                      Categoría
                    </Typography>
                    <FormControl
                      fullWidth
                      error={
                        !!(touched.categoria || triedSubmit) &&
                        !!errors.categoria
                      }
                    >
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
                      {(touched.categoria || triedSubmit) &&
                        errors.categoria && (
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
                      error={
                        !!(touched.descripcion || triedSubmit) &&
                        !!errors.descripcion
                      }
                      helperText={
                        touched.descripcion || triedSubmit
                          ? errors.descripcion ||
                            `${formData.descripcion.length}/600 caracteres`
                          : ''
                      }
                      inputProps={{ maxLength: 600 }}
                    />
                  </Box>{' '}
                  {/* FILA 3: Inventario y Disponibilidad */}
                  <Box>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ fontWeight: 600, color: 'black', mb: 2 }}
                    >
                      Inventario y Disponibilidad
                    </Typography>
                    <Box
                      sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                    >
                      {/* Primera fila: Stock y Compra Mínima */}
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                          sx={{ width: '35%' }}
                          label="Stock Disponible:"
                          placeholder="Ingrese un número entre 1 y 15.000"
                          value={formData.stock}
                          onChange={handleInputChange('stock')}
                          onBlur={() => handleFieldBlur('stock')}
                          error={
                            !!(touched.stock || triedSubmit) &&
                            !!(errors.stock || localErrors.stock)
                          }
                          helperText={
                            touched.stock || triedSubmit
                              ? errors.stock || localErrors.stock
                              : ''
                          }
                          type="number"
                          inputProps={{ min: 1, max: 15000 }}
                        />
                        <TextField
                          sx={{ width: '35%' }}
                          label="Compra Mínima:"
                          placeholder="Seleccione un número entre 1 y 15.000"
                          value={formData.compraMinima}
                          onChange={handleInputChange('compraMinima')}
                          onBlur={() => handleFieldBlur('compraMinima')}
                          error={
                            !!(touched.compraMinima || triedSubmit) &&
                            !!(errors.compraMinima || localErrors.compraMinima)
                          }
                          helperText={
                            touched.compraMinima || triedSubmit
                              ? errors.compraMinima || localErrors.compraMinima
                              : ''
                          }
                          type="number"
                          inputProps={{ min: 1, max: 15000 }}
                        />
                      </Box>
                      {/* Segunda fila: Precio de Venta */}
                      <Box>
                        <TextField
                          sx={{ width: '73.51%' }}
                          label="Precio de Venta:"
                          placeholder="Campo de entrada"
                          value={formData.precioUnidad}
                          onChange={handleInputChange('precioUnidad')}
                          onBlur={() => handleFieldBlur('precioUnidad')}
                          disabled={formData.pricingType === 'Por Tramo'}
                          error={
                            formData.pricingType === 'Por Unidad' &&
                            !!(touched.precioUnidad || triedSubmit) &&
                            !!(errors.precioUnidad || localErrors.precioUnidad)
                          }
                          helperText={
                            formData.pricingType === 'Por Unidad'
                              ? touched.precioUnidad || triedSubmit
                                ? errors.precioUnidad ||
                                  localErrors.precioUnidad
                                : ''
                              : ''
                          }
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                $
                              </InputAdornment>
                            ),
                            inputProps: { min: 1 }, // Cambiar mínimo a 1
                          }}
                          type="number"
                        />
                      </Box>
                      {/* Tercera fila: Configuración de Precios y ToggleButtonGroup */}
                      <Box>
                        <Typography
                          variant="h6"
                          gutterBottom
                          sx={{ fontWeight: 600, color: 'black', mb: 2 }}
                        >
                          Configuración de Precios
                        </Typography>
                        <Typography
                          variant="subtitle2"
                          gutterBottom
                          sx={{ fontWeight: 600 , mb: 2 }}
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
                          <Tooltip
                            title={
                              <>
                                <b>¿Qué son los tramos?</b>
                                <br />
                                Permite asignar hasta 5 precios según la
                                cantidad que te compren. Por ejemplo: si te
                                compran entre 1 y 9 unidades, pagan $100 por
                                unidad; si te compran 10 o más, pagan $90.
                              </>
                            }
                            placement="right"
                            arrow
                          >
                            <IconButton
                              size="small"
                              sx={{
                                ml: 1,
                                boxShadow: 'none',
                                outline: 'none',
                                border: 'none',
                                '&:focus': {
                                  outline: 'none',
                                  border: 'none',
                                  boxShadow: 'none',
                                },
                                '&:active': {
                                  outline: 'none',
                                  border: 'none',
                                  boxShadow: 'none',
                                },
                              }}
                              disableFocusRipple
                              disableRipple
                            >
                              <InfoIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </ToggleButtonGroup>
                      </Box>
                    </Box>
                  </Box>
                  {/* FILA 4: Región de Despacho */}
                  <Box>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ fontWeight: 600, color: 'black', mb: 2 }}
                    >
                      Región de Despacho
                    </Typography>{' '}
                    <FormControl component="fieldset">
                      <RadioGroup
                        value={formData.regionDespacho || ''}
                        onChange={handleInputChange('regionDespacho')}
                        sx={{
                          display: 'flex',
                          flexDirection: 'row',
                          flexWrap: 'wrap',
                          gap: 2,
                        }}
                      >
                        {/* Columna 1: 5 filas */}
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: '30%',
                          }}
                        >
                          <FormControlLabel
                            value="todo-chile"
                            control={<Radio />}
                            label="Todo Chile"
                            sx={{ mb: 1 }}
                          />
                          <FormControlLabel
                            value="region-metropolitana"
                            control={<Radio />}
                            label="Región Metropolitana"
                            sx={{ mb: 1 }}
                          />
                          <FormControlLabel
                            value="i-region"
                            control={<Radio />}
                            label="I Región"
                            sx={{ mb: 1 }}
                          />
                          <FormControlLabel
                            value="ii-region"
                            control={<Radio />}
                            label="II Región"
                            sx={{ mb: 1 }}
                          />
                          <FormControlLabel
                            value="iii-region"
                            control={<Radio />}
                            label="III Región"
                            sx={{ mb: 1 }}
                          />
                        </Box>
                        {/* Columna 2: 6 filas */}
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: '30%',
                          }}
                        >
                          <FormControlLabel
                            value="iv-region"
                            control={<Radio />}
                            label="IV Región"
                            sx={{ mb: 1 }}
                          />
                          <FormControlLabel
                            value="v-region"
                            control={<Radio />}
                            label="V Región"
                            sx={{ mb: 1 }}
                          />
                          <FormControlLabel
                            value="vi-region"
                            control={<Radio />}
                            label="VI Región"
                            sx={{ mb: 1 }}
                          />
                          <FormControlLabel
                            value="vii-region"
                            control={<Radio />}
                            label="VII Región"
                            sx={{ mb: 1 }}
                          />
                          <FormControlLabel
                            value="viii-region"
                            control={<Radio />}
                            label="VIII Región"
                            sx={{ mb: 1 }}
                          />
                          <FormControlLabel
                            value="ix-region"
                            control={<Radio />}
                            label="IX Región"
                            sx={{ mb: 1 }}
                          />
                        </Box>
                        {/* Columna 3: 6 filas */}
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: '30%',
                          }}
                        >
                          <FormControlLabel
                            value="x-region"
                            control={<Radio />}
                            label="X Región"
                            sx={{ mb: 1 }}
                          />
                          <FormControlLabel
                            value="xi-region"
                            control={<Radio />}
                            label="XI Región"
                            sx={{ mb: 1 }}
                          />
                          <FormControlLabel
                            value="xii-region"
                            control={<Radio />}
                            label="XII Región"
                            sx={{ mb: 1 }}
                          />
                          <FormControlLabel
                            value="xiv-region"
                            control={<Radio />}
                            label="XIV Región"
                            sx={{ mb: 1 }}
                          />
                          <FormControlLabel
                            value="xv-region"
                            control={<Radio />}
                            label="XV Región"
                            sx={{ mb: 1 }}
                          />
                          <FormControlLabel
                            value="xvi-region"
                            control={<Radio />}
                            label="XVI Región"
                            sx={{ mb: 1 }}
                          />
                        </Box>
                      </RadioGroup>
                    </FormControl>
                  </Box>
                  {/* FILA 5: Configuración de Precios */}
                  {/* <Box>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ fontWeight: 600, color: 'black', mb: 2 }}
                    >
                      Configuración de Precios
                    </Typography>
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
                      <Tooltip
                        title={
                          <>
                            <b>¿Qué son los tramos?</b><br />
                            Permite asignar hasta 5 precios según la cantidad que te compren. Por ejemplo: si te compran entre 1 y 9 unidades, pagan $100 por unidad; si te compran 10 o más, pagan $90.
                          </>
                        }
                        placement="right"
                        arrow
                      >
                        <IconButton size="small" sx={{ ml: 1, boxShadow: 'none', outline: 'none', border: 'none', '&:focus': { outline: 'none', border: 'none', boxShadow: 'none' }, '&:active': { outline: 'none', border: 'none', boxShadow: 'none' } }} disableFocusRipple disableRipple>
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </ToggleButtonGroup>                  </Box> */}
                  {/* FILA TRAMOS: Configuración de Tramos de Precio (condicional) */}
                  {formData.pricingType === 'Por Tramo' && (
                    <Box
                      className="full-width"
                      sx={{
                        p: 0,
                        m: 0,
                        boxShadow: 'none',
                        bgcolor: 'transparent',
                        overflow: 'visible',
                        mb: 3,
                      }}
                    >
                      <TramosSection
                        tramos={formData.tramos}
                        onTramoChange={handleTramoChange}
                        onAddTramo={addTramo}
                        onRemoveTramo={removeTramo}
                        errors={localErrors.tramos}
                      />
                    </Box>
                  )}
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
                      sx={{ fontWeight: 600, color: 'black', mb: 2 }}
                    >
                      Imágenes del Producto
                    </Typography>{' '}
                    <ImageUploader
                      images={formData.imagenes}
                      onImagesChange={handleImagesChange}
                      maxImages={5}
                      onError={handleImageError}
                      error={
                        (touched.imagenes || triedSubmit) &&
                        (errors.imagenes || localErrors.imagenes || imageError)
                      }
                    />
                  </Box>{' '}
                  {/* FILA 7: Especificaciones Técnicas */}
                  <Box className="full-width">
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ fontWeight: 600, color: 'black', mb: 2 }}
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
                          sx={{ mt: 1, textTransform: 'none' }}
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
                      sx={{ fontWeight: 600, color: 'black', mb: 2 }}
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
                </Typography>{' '}
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
                      {calculations.isRange
                        ? `${formatPrice(
                            calculations.rangos.ingresoPorVentas.min
                          )} - ${formatPrice(
                            calculations.rangos.ingresoPorVentas.max
                          )}`
                        : formatPrice(calculations.ingresoPorVentas)}
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
                      Tarifa por Servicio (2%)
                    </Typography>
                    <Typography variant="body2" fontWeight="600">
                      {calculations.isRange
                        ? `${formatPrice(
                            calculations.rangos.tarifaServicio.min
                          )} - ${formatPrice(
                            calculations.rangos.tarifaServicio.max
                          )}`
                        : formatPrice(calculations.tarifaServicio)}
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
                      {calculations.isRange
                        ? `${formatPrice(
                            calculations.rangos.total.min
                          )} - ${formatPrice(calculations.rangos.total.max)}`
                        : formatPrice(calculations.total)}
                    </Typography>
                  </Box>{' '}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                  >
                    <InfoIcon fontSize="small" color="primary" />
                    {calculations.isRange
                      ? 'Estos son los rangos de montos que podrás recibir según cómo se distribuyan las ventas entre los tramos de precio'
                      : 'Este es el monto que recibirás en tu cuenta una vez concretada la venta. El valor no considera los costos de despacho.'}
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
              </Paper>{' '}
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default AddProduct;
