import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Grid,
  Chip,
  TextField,
  InputAdornment,
  useTheme,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Inventory2 as Inventory2Icon
} from '@mui/icons-material';
import { ThemeProvider } from '@mui/material/styles';
import { 
  showValidationError, 
  showSaveLoading, 
  showSaveSuccess, 
  showSaveError,
  showErrorToast,
  replaceLoadingWithSuccess,
  replaceLoadingWithError
} from '../../../../utils/toastHelpers';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';

// Components
import { PriceTiers } from './components';

// Error Boundaries
import { SupplierErrorBoundary, ProductFormErrorBoundary } from '../../components/ErrorBoundary';

// Subcomponentes modularizados
import {
  ProductBasicInfo,
  ProductInventory,
  ProductImages,
  ProductRegions,
  ProductResultsPanel,
  ProductPricing,
} from './components';

// Servicio para regiones de entrega
import { fetchProductRegions, saveProductRegions } from '../../../../services/marketplace';
import { convertDbRegionsToForm, convertFormRegionsToDb } from '../../../../utils/shippingRegionsUtils';

// Hooks y utilidades
import { useSupplierProducts } from '../../hooks/useSupplierProducts';
import { useProductForm } from '../../hooks/useProductForm';
import { useProductValidation } from './hooks/useProductValidation';
import { useProductPricingLogic } from './hooks/useProductPricingLogic';
import { calculateProductEarnings } from '../../utils/centralizedCalculations'; // 🔧 USANDO NOMBRE CORRECTO
import { ProductValidator } from '../../validators/ProductValidator';
import { dashboardThemeCore } from '../../../../styles/dashboardThemeCore';
import { SPACING_BOTTOM_MAIN } from '../../../../styles/layoutSpacing';

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
    handlePricingTypeChange,
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

  // Hook para lógica de manipulación de tramos (NUEVO)
  const {
    handleTramoChange,
    handleTramoBlur,
    addTramo,
    removeTramo,
    validateStockConstraints
  } = useProductPricingLogic(formData, updateField);

  // Estado local para errores de imágenes
  const [imageError, setImageError] = useState('');

  // Estado shippingRegions para mapeo con Supabase
  const [shippingRegions, setShippingRegions] = useState([]);

  // Cálculos dinámicos optimizados con useMemo
  const calculations = useMemo(() => {
    return calculateProductEarnings(formData);
  }, [
    formData.stock,
    formData.precioUnidad,
    formData.tramos,
    formData.pricingType,
  ]);


  // Cargar productos al montar el componente
  useEffect(() => {
    if (supplierId) {
      loadProducts(supplierId);
    }
  }, [supplierId, loadProducts]);

  // Componente Portal para el panel de resultados
  const ResultsPanelPortal = ({ children }) => {
    return createPortal(
      <Box
        sx={{
          position: 'fixed',
          top: {
            xs: 80,   // top menor en mobile
            sm: 120,  // sm
            md: 180,  // md
            lg: 242,  // lg
            xl: 242   // xl
          },
          right: {
            xs: 20,   // mobile
            sm: 40,   // sm
            md: 80,   // md: volvemos a 80 porque el portal evita el problema
            lg: 80,   // lg: volvemos a 80 porque el portal evita el problema
            xl: 80    // xl
          },
          zIndex: 1200,
          width: {
            xs: 'calc(100vw - 40px)', // mobile con padding
            sm: 360,     // sm: 360px
            md: 420,     // md: 420px
            lg: 480,     // lg: 480px
            xl: 560      // xl: 560px
          }
        }}
      >
        {children}
      </Box>,
      document.body
    );
  };

  // Cargar regiones de entrega si editando
  useEffect(() => {
    if (isEditMode && editProductId) {

      fetchProductRegions(editProductId)
        .then(regions => {

          const formattedRegions = convertDbRegionsToForm(regions);

          setShippingRegions(formattedRegions);
          updateField('shippingRegions', formattedRegions); // Sincroniza con formData

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

  // Handlers
  const handleInputChange = field => event => {
    const value = event.target.value;
    updateField(field, value);
    
    // Usar lógica centralizada para validación de stock vs tramos
    if (field === 'stock') {
      validateStockConstraints(value);
    }
  };


  // Actualiza shippingRegions en formData y estado local
  const handleRegionChange = (regions) => {

    setShippingRegions(regions);
    updateField('shippingRegions', regions);


  };

  // ========================================================================
  // HANDLER ROBUSTO PARA CAMBIO DE PRICING TYPE
  // ========================================================================
  const handlePricingTypeChangeUI = (event, newValue) => {
    if (newValue === null) return
    
    console.log(`🔄 [AddProduct] Cambiando pricing type de "${formData.pricingType}" a "${newValue}"`)
    
    // Usar el método del hook que maneja todo el estado correctamente
    handlePricingTypeChange(newValue)
  }

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
    console.log('🔥 [AddProduct.handleSubmit] Iniciando submit')
    e.preventDefault();
    markSubmitAttempt();

    console.log('🔍 [AddProduct.handleSubmit] Validando formulario...')
    const validationErrors = validateForm(formData);
    console.log('📊 [AddProduct.handleSubmit] Errores de validación:', validationErrors)
    console.log('🧪 [AddProduct.handleSubmit] Nombre del producto:', formData.nombre)
    
    if (validationErrors && Object.keys(validationErrors).length > 0) {
      console.log('❌ [AddProduct.handleSubmit] Validación falló, no continuando')
      
      // 🎯 Usar mensaje contextual centralizado desde ProductValidator
      const contextualMessage = ProductValidator.generateContextualMessage(validationErrors);
      console.log('📝 [AddProduct.handleSubmit] Mensaje contextual:', contextualMessage)
      
      showValidationError(contextualMessage);
      
      return;
    }

    console.log('✅ [AddProduct.handleSubmit] Validación pasó, continuando...')

    // LOG: Estado de formData y shippingRegions antes de guardar



    // Mostrar toast informativo
    showSaveLoading(
      isEditMode 
        ? 'Actualizando producto...'
        : 'Creando producto...',
      'product-save'
    );

    try {
      console.log('💾 [AddProduct.handleSubmit] Llamando submitForm()...')
      // 1. Guardar producto principal
      const result = await submitForm();
      console.log('📋 [AddProduct.handleSubmit] Resultado de submitForm:', result)

      if (!result.success) {
        console.error('❌ Backend errors:', result.errors);
        if (result.errors && typeof result.errors === 'object') {
          Object.entries(result.errors).forEach(([key, value]) => {
            if (value) showErrorToast(`${key}: ${value}`);
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
        productId = result.data?.productid || result.product?.productid || result.productId;
      }

      if (productId && shippingRegions.length > 0) {
        // Convertir formato de display a formato BD antes de guardar
        const dbRegions = convertFormRegionsToDb(shippingRegions);

        try {
          await saveProductRegions(productId, dbRegions);
        } catch (regionError) {
          console.error('[AddProduct] handleSubmit - Error guardando regiones:', regionError);
          // No lanzar error aquí para que el producto se guarde aunque falle las regiones
          showErrorToast('Producto guardado, pero hubo un error al guardar las regiones de entrega');
        }
      } else {
        console.warn('[AddProduct] handleSubmit - No se guardaron shippingRegions. productId:', productId, 'shippingRegions:', shippingRegions);
        if (!productId) {
          console.error('[AddProduct] handleSubmit - ERROR: productId no disponible para guardar regiones');
          console.error('[AddProduct] handleSubmit - Estructura del result:', JSON.stringify(result, null, 2));
        }
      }

      // 3. Mostrar éxito y navegar
      replaceLoadingWithSuccess(
        'product-save',
        isEditMode
          ? 'Producto actualizado exitosamente!'
          : 'Producto creado exitosamente!',
        '🎉'
      );

      // 4. Navegar después de un breve delay
      setTimeout(() => {
        navigate('/supplier/myproducts');
      }, 1500);

    } catch (error) {
      console.error('❌ Error en handleSubmit:', error);

      // Manejar error específico de overflow numérico
      if (error.message && error.message.includes('numeric field overflow')) {
        replaceLoadingWithError(
          'product-save',
          'Error: Uno o más precios superan el límite permitido (máximo 8 dígitos). Por favor, reduce los valores.'
        );
      } else {
        replaceLoadingWithError(
          'product-save',
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

  const handleRetry = () => {
    // Reset form errors and reload if needed
    resetErrors();
    if (isEditMode && productId) {
      // Could reload product data here if needed
      console.log('Retrying product edit form...');
    }
  };

  return (
    <SupplierErrorBoundary onRetry={handleRetry}>
      <ThemeProvider theme={dashboardThemeCore}>
        <ProductFormErrorBoundary formData={formData} onRetry={handleRetry}>
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
                    onPricingTypeChange={handlePricingTypeChangeUI}
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
                      errors={errors}
                      localErrors={localErrors}
                      triedSubmit={triedSubmit}
                    />
                  </Box>

                  {/* Configuración de Precio: Campo Precio de Venta O Tramos (condicional) */}
                  {formData.pricingType === 'Unidad' ? (
                    <ProductPricing
                      formData={formData}
                      errors={errors}
                      localErrors={localErrors}
                      touched={touched}
                      triedSubmit={triedSubmit}
                      onInputChange={handleInputChange}
                      onFieldBlur={handleFieldBlur}
                    />
                  ) : (
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
                        onTramoBlur={handleTramoBlur}
                        onAddTramo={addTramo}
                        onRemoveTramo={removeTramo}
                        errors={localErrors.tramos}
                        stockDisponible={formData.stock}
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
              {/* Panel renderizado como portal */}
            </Grid>
          </Grid>
        </Container>
      </Box>
        </ProductFormErrorBoundary>
    </ThemeProvider>
    
    {/* Portal del panel de resultados */}
    <ResultsPanelPortal>
      <ProductResultsPanel
        calculations={calculations}
        isValid={isValid}
        isLoading={isLoading}
        isEditMode={isEditMode}
        onBack={handleBack}
        onSubmit={handleSubmit}
      />
    </ResultsPanelPortal>
    </SupplierErrorBoundary>
  );
};

export default AddProduct;
