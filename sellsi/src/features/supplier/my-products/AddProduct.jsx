import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Grid,
  Chip,
  useTheme,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Inventory2 as Inventory2Icon
} from '@mui/icons-material';
import { ThemeProvider } from '@mui/material/styles';
import { toast } from 'react-hot-toast';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';

// Components
import SideBarProvider from '../../layout/SideBar';
import PriceTiers from '../../ui/PriceTiers';

// Subcomponentes modularizados
import {
  ProductBasicInfo,
  ProductInventory,
  ProductImages,
  ProductRegions,
  ProductResultsPanel,
} from './components';

// Servicio para regiones de entrega
import { fetchProductRegions, saveProductRegions } from '../../../services/marketplace';
import { convertDbRegionsToForm, convertFormRegionsToDb } from '../../../utils/shippingRegionsUtils';

// Hooks y utilidades
import { useSupplierProducts } from '../hooks/useSupplierProducts';
import { useProductForm } from '../hooks/useProductForm';
import { useProductValidation } from './hooks/useProductValidation';
import { calculateEarnings } from './utils/productCalculations';
import { dashboardThemeCore } from '../../../styles/dashboardThemeCore';
import { SPACING_BOTTOM_MAIN } from '../../../styles/layoutSpacing';

const AddProduct = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const { createProduct, loadProducts } = useSupplierProducts();

  // Detectar modo de edición
  const editProductId = searchParams.get('edit');
  const isEditMode = Boolean(editProductId);
  const supplierId = localStorage.getItem('user_id');

  // Hooks modularizados
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

  const {
    localErrors,
    triedSubmit,
    validateForm,
    resetErrors,
    markSubmitAttempt,
  } = useProductValidation();


  // Estado local para errores de imágenes
  const [imageError, setImageError] = useState('');

  // Estado shippingRegions para mapeo con Supabase
  const [shippingRegions, setShippingRegions] = useState([]);

  // Cálculos dinámicos
  const [calculations, setCalculations] = useState({
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


  // Cargar productos al montar el componente
  useEffect(() => {
    if (supplierId) {
      loadProducts(supplierId);
    }
  }, [supplierId, loadProducts]);

  // Cargar regiones de entrega si editando
  useEffect(() => {
    if (isEditMode && editProductId) {
      console.log('[AddProduct] useEffect - Cargando regiones para producto:', editProductId);
      fetchProductRegions(editProductId)
        .then(regions => {
          console.log('[AddProduct] useEffect - Regiones cargadas desde BD:', regions);
          const formattedRegions = convertDbRegionsToForm(regions);
          console.log('[AddProduct] useEffect - Regiones convertidas al formato formulario:', formattedRegions);
          setShippingRegions(formattedRegions);
          updateField('shippingRegions', formattedRegions); // Sincroniza con formData
          console.log('[AddProduct] useEffect - shippingRegions state actualizado:', formattedRegions);
        })
        .catch(error => {
          console.error('[AddProduct] useEffect - Error cargando regiones:', error);
        });
    }
  }, [isEditMode, editProductId, updateField]);

  // Validación en tiempo real solo si el campo fue tocado o tras submit
  useEffect(() => {
    if (triedSubmit) {
      validateForm(formData);
    }
  }, [formData, triedSubmit, validateForm]);

  // Efecto para calcular dinámicamente
  useEffect(() => {
    const newCalculations = calculateEarnings(formData);
    setCalculations(newCalculations);
  }, [
    formData.stock,
    formData.precioUnidad,
    formData.tramos,
    formData.pricingType,
  ]);  // Handlers
  const handleInputChange = field => event => {
    const value = event.target.value;
    updateField(field, value);
  };


  // Actualiza shippingRegions en formData y estado local
  const handleRegionChange = (regions) => {
    console.log('[AddProduct] handleRegionChange - Regiones recibidas:', regions);
    setShippingRegions(regions);
    updateField('shippingRegions', regions);
    console.log('[AddProduct] handleRegionChange - shippingRegions state actualizado:', regions);
    console.log('[AddProduct] handleRegionChange - formData.shippingRegions será:', regions);
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
    setImageError('');
    updateField('imagenes', images);
  };

  const handleImageError = errorMessage => {
    setImageError(errorMessage);
  };

  const handleDocumentsChange = documents => {
    updateField('documentos', documents);
  };

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
    markSubmitAttempt();

    const validationErrors = validateForm(formData);
    
    if (validationErrors && Object.keys(validationErrors).length > 0) {
      toast.error('Por favor, completa todos los campos requeridos');
      return;
    }

    // LOG: Estado de formData y shippingRegions antes de guardar
    console.log('[AddProduct] handleSubmit - formData:', formData);
    console.log('[AddProduct] handleSubmit - formData.shippingRegions:', formData.shippingRegions);
    console.log('[AddProduct] handleSubmit - shippingRegions state:', shippingRegions);

    try {
      // 1. Guardar producto principal
      const result = await submitForm();
      console.log('[AddProduct] handleSubmit - resultado submitForm:', result);

      if (!result.success) {
        console.error('❌ Backend errors:', result.errors);
        if (result.errors && typeof result.errors === 'object') {
          Object.entries(result.errors).forEach(([key, value]) => {
            if (value) toast.error(`${key}: ${value}`);
          });
        }
        throw new Error(result.error || 'No se pudo procesar el producto');
      }

      // 2. Guardar regiones de entrega en Supabase
      let productId;
      
      if (isEditMode) {
        productId = editProductId;
      } else {
        // Para productos nuevos, usar el ID del producto creado
        productId = result.product?.productid || result.productId;
      }

      console.log('[AddProduct] handleSubmit - productId usado para regiones:', productId);
      console.log('[AddProduct] handleSubmit - result completo:', result);
      
      if (productId && shippingRegions.length > 0) {
        console.log('[AddProduct] handleSubmit - Guardando shippingRegions:', shippingRegions);
        // Convertir formato de display a formato BD antes de guardar
        const dbRegions = convertFormRegionsToDb(shippingRegions);
        console.log('[AddProduct] handleSubmit - Regiones convertidas para BD:', dbRegions);
        
        try {
          await saveProductRegions(productId, dbRegions);
          console.log('[AddProduct] handleSubmit - Regiones guardadas exitosamente');
        } catch (regionError) {
          console.error('[AddProduct] handleSubmit - Error guardando regiones:', regionError);
          // No lanzar error aquí para que el producto se guarde aunque falle las regiones
          toast.error('Producto guardado, pero hubo un error al guardar las regiones de entrega');
        }
      } else {
        console.warn('[AddProduct] handleSubmit - No se guardaron shippingRegions. productId:', productId, 'shippingRegions:', shippingRegions);
        if (!productId) {
          console.error('[AddProduct] handleSubmit - ERROR: productId no disponible para guardar regiones');
          console.error('[AddProduct] handleSubmit - Estructura del result:', JSON.stringify(result, null, 2));
        }
      }

      toast.success(
        isEditMode
          ? 'Producto actualizado exitosamente'
          : 'Producto creado exitosamente!'
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
  };

  const handleBack = () => {
    // Si venimos de /supplier/home, volver ahí; si no, a MyProducts
    if (location.state && location.state.fromHome) {
      navigate('/supplier/home');
    } else {
      navigate('/supplier/myproducts');
    }
  };
  return (
    <ThemeProvider theme={dashboardThemeCore}>
      <SideBarProvider />

      <Box
        sx={{
          backgroundColor: 'background.default',
          minHeight: '100vh',
          pt: { xs: 9, md: 10 },
          px: 3,
          pb: SPACING_BOTTOM_MAIN,
          ml: { xs: 0, md: 10, lg: 14, xl: 24 },
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {!isEditMode && (
                <Inventory2Icon sx={{ color: 'primary.main', fontSize: 36 }} />
              )}
              <Typography variant="h4" fontWeight="600" color="primary.main">
                {isEditMode ? 'Editar Producto' : 'Agregar Producto'}
              </Typography>
            </Box>
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
                  {/* Información Básica y Categoría */}
                  <ProductBasicInfo
                    formData={formData}
                    errors={{ ...errors, ...localErrors }}
                    touched={touched}
                    triedSubmit={triedSubmit}
                    onInputChange={handleInputChange}
                    onFieldBlur={handleFieldBlur}
                  />

                  {/* Inventario y Precios */}
                  <ProductInventory
                    formData={formData}
                    errors={errors}
                    localErrors={localErrors}
                    touched={touched}
                    triedSubmit={triedSubmit}
                    onInputChange={handleInputChange}
                    onFieldBlur={handleFieldBlur}
                    onPricingTypeChange={handlePricingTypeChange}
                  />


                  {/* Región de Despacho: ocupa toda la columna, alineada al inicio */}
                  <Box
                    sx={{
                      gridRow: 3,
                      gridColumn: 2,
                      width: '100%',
                      justifySelf: 'start',
                    }}
                  >
                    <ProductRegions
                      formData={formData}
                      onRegionChange={handleRegionChange}
                    />
                  </Box>

                  {/* Configuración de Tramos de Precio (condicional) */}
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
                      <PriceTiers
                        tramos={formData.tramos}
                        onTramoChange={handleTramoChange}
                        onAddTramo={addTramo}
                        onRemoveTramo={removeTramo}
                        errors={localErrors.tramos}
                      />
                    </Box>
                  )}

                  {/* Imágenes del Producto */}
                  <ProductImages
                    formData={formData}
                    errors={errors}
                    localErrors={localErrors}
                    touched={touched}
                    triedSubmit={triedSubmit}
                    imageError={imageError}
                    onImagesChange={handleImagesChange}
                    onImageError={handleImageError}
                  />

                  {/* Especificaciones Técnicas y Documentación Técnica deshabilitadas temporalmente */}
                </Box>
              </Paper>
            </Grid>{' '}
            {/* Panel de resultados */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <ProductResultsPanel
                calculations={calculations}
                isValid={isValid}
                isLoading={isLoading}
                isEditMode={isEditMode}
                onBack={handleBack}
                onSubmit={handleSubmit}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default AddProduct;
