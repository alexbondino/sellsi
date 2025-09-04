import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  useMediaQuery,
  Card,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Inventory2 as Inventory2Icon,
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
  MobileExpandableBottomBar,
} from './components';

// Servicio para regiones de entrega
import { fetchProductRegions, saveProductRegions } from '../../../../services/marketplace';
import { convertDbRegionsToForm, convertFormRegionsToDb } from '../../../../utils/shippingRegionsUtils';

// Hooks y utilidades
import { useProductForm } from '../../hooks/useProductForm';
import { useProductValidation } from './hooks/useProductValidation';
import { useProductPricingLogic } from './hooks/useProductPricingLogic';
import { useThumbnailStatus } from '../../hooks/useThumbnailStatus'; // 🔥 NUEVO: Status tracking para thumbnails
import { calculateProductEarnings } from '../../utils/centralizedCalculations'; // 🔧 USANDO NOMBRE CORRECTO
import { ProductValidator } from '../../validators/ProductValidator';
import { dashboardThemeCore } from '../../../../styles/dashboardThemeCore';
import { SPACING_BOTTOM_MAIN } from '../../../../styles/layoutSpacing';
import { formatPrice } from '../../../../shared/utils/formatters';

// 📱 Mobile Form Layout Component - Separado para evitar re-renders
const MobileFormLayout = ({ 
  formData, 
  errors, 
  localErrors, 
  touched, 
  triedSubmit, 
  handleInputChange, 
  handleFieldBlur, 
  handlePricingTypeChangeUI, 
  handleTramoChange, 
  handleTramoBlur, 
  addTramo, 
  removeTramo, 
  handleRegionChange, 
  imageError, 
  handleImagesChange, 
  handleImageError,
  freezeDisplay = false,
}) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      gap: 0, // 🔧 Gap 0 para unir visualmente
  px: 0, // 🔧 Sin padding horizontal en móvil para full-bleed
      pb: 16,
      width: '100%',
      mx: 0,
    }}
  >
    {/* Container Unificado - Todas las secciones en una sola tarjeta */}
    <Card 
      elevation={2} 
      sx={{ 
        width: '100%', 
        mx: 0, 
        borderRadius: 3,
        overflow: 'hidden', // Para que los divisores internos se vean bien
        background: 'linear-gradient(135deg, #fafafa 0%, #ffffff 100%)',
      }}
    >
      {/* Información Básica */}
  <Box sx={{ p: { xs: 1.5, md: 3 }, borderBottom: '1px solid #f0f0f0' }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 700, mb: 2 }}>
          📝 Información Básica
        </Typography>
        <ProductBasicInfo
          formData={formData}
          errors={{ ...errors, ...localErrors }}
          touched={touched}
          triedSubmit={triedSubmit}
          onInputChange={handleInputChange}
          onFieldBlur={handleFieldBlur}
          isMobile={true}
        />
      </Box>
      
      {/* Inventario y Condiciones */}
  <Box sx={{ p: { xs: 1.5, md: 3 }, borderBottom: '1px solid #f0f0f0' }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 700, mb: 2 }}>
          📦 Inventario y Condiciones
        </Typography>
        <ProductInventory
          formData={formData}
          errors={errors}
          localErrors={localErrors}
          touched={touched}
          triedSubmit={triedSubmit}
          onInputChange={handleInputChange}
          onFieldBlur={handleFieldBlur}
          onPricingTypeChange={handlePricingTypeChangeUI}
          isMobile={true}
        />
      </Box>
      
      {/* Configuración de Precios */}
  <Box sx={{ p: { xs: 1.5, md: 3 }, borderBottom: '1px solid #f0f0f0' }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 700, mb: 2 }}>
          💰 Configuración de Precios
        </Typography>
        {formData.pricingType === 'Unidad' ? (
          <ProductPricing
            formData={formData}
            errors={errors}
            localErrors={localErrors}
            touched={touched}
            triedSubmit={triedSubmit}
            onInputChange={handleInputChange}
            onFieldBlur={handleFieldBlur}
            isMobile={true}
          />
        ) : (
          <PriceTiers
            tramos={formData.tramos}
            onTramoChange={handleTramoChange}
            onTramoBlur={handleTramoBlur}
            onAddTramo={addTramo}
            onRemoveTramo={removeTramo}
            errors={localErrors.tramos}
            stockDisponible={formData.stock}
            isMobile={true}
          />
        )}
      </Box>
      
      {/* Regiones de Despacho */}
  <Box sx={{ p: { xs: 1.5, md: 3 }, borderBottom: '1px solid #f0f0f0' }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 700, mb: 2 }}>
          🚚 Regiones de Despacho
        </Typography>
        <ProductRegions
          formData={formData}
          onRegionChange={handleRegionChange}
          errors={errors}
          localErrors={localErrors}
          triedSubmit={triedSubmit}
          freezeDisplay={freezeDisplay}
          isMobile={true}
        />
      </Box>
      
      {/* Imágenes del Producto */}
  <Box sx={{ p: { xs: 1.5, md: 3 } }}> {/* Sin border-bottom en la última sección */}
        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 700, mb: 2 }}>
          📸 Imágenes del Producto
        </Typography>
        <ProductImages
          formData={formData}
          errors={errors}
          localErrors={localErrors}
          touched={touched}
          triedSubmit={triedSubmit}
          imageError={imageError}
          onImagesChange={handleImagesChange}
          onImageError={handleImageError}
          isMobile={true}
        />
      </Box>
    </Card>
  </Box>
);

// 🖥️ Desktop Form Layout Component - Separado para evitar re-renders
const DesktopFormLayout = ({ 
  formData, 
  errors, 
  localErrors, 
  touched, 
  triedSubmit, 
  handleInputChange, 
  handleFieldBlur, 
  handlePricingTypeChangeUI, 
  handleTramoChange, 
  handleTramoBlur, 
  addTramo, 
  removeTramo, 
  handleRegionChange, 
  imageError, 
  handleImagesChange, 
  handleImageError,
  freezeDisplay = false,
}) => (
  <Grid container spacing={3}>
    <Grid size={{ xs: 12, lg: 8 }}>
      <Paper
        sx={{
          p: 3,
          minWidth: '980px',
          maxWidth: '100%',
          width: '100%',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: 'auto auto auto auto auto',
            gap: 3,
            '& .full-width': {
              gridColumn: '1 / -1',
            },
          }}
        >
          {/* Información Básica - Permite que ocupe naturalmente las posiciones del grid */}
          <ProductBasicInfo
            formData={formData}
            errors={{ ...errors, ...localErrors }}
            touched={touched}
            triedSubmit={triedSubmit}
            onInputChange={handleInputChange}
            onFieldBlur={handleFieldBlur}
          />

          {/* Inventario y Precios - Columna 1, Fila 3 */}
          <Box sx={{ gridColumn: 1, gridRow: 3 }}>
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
          </Box>

          {/* Regiones - Columna 2, Fila 3 (al lado de Condiciones de Venta) */}
          <Box sx={{ gridColumn: 2, gridRow: 3 }}>
            <ProductRegions
              formData={formData}
              onRegionChange={handleRegionChange}
              errors={errors}
              localErrors={localErrors}
              triedSubmit={triedSubmit}
              freezeDisplay={freezeDisplay}
            />
          </Box>

          {/* Configuración de Precios */}
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
        </Box>
      </Paper>
    </Grid>
    
    {/* Panel de resultados desktop */}
    <Grid size={{ xs: 12, lg: 4 }}>
      {/* Panel renderizado como portal */}
    </Grid>
  </Grid>
);

const AddProduct = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useTheme();

  // 🔧 Hook para responsividad móvil - SOLO xs y sm
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
    hasActualChanges, // 🔧 FIX EDIT: Para detectar cambios reales en modo edición
    updateField,
    handleFieldBlur,
    handlePricingTypeChange,
    submitForm,
    resetForm,
  markImagesTouched,
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

  // 🔧 FIX 2: Estado para prevenir múltiples clicks del botón submit
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 🔧 FIX 2C: Estado adicional para indicar éxito y navegación pendiente
  const [isNavigating, setIsNavigating] = useState(false);

  // 🔥 NUEVO: Status tracking para thumbnails
  const [createdProductId, setCreatedProductId] = useState(null);
  const thumbnailStatus = useThumbnailStatus(createdProductId);

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


  // (Eliminado) Carga duplicada de productos que causaba rerenders con estado antiguo

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

  // Cargar regiones de entrega si editando (una sola vez, sin sobreescribir ediciones locales)
  const hasLoadedRegionsRef = useRef(false);
  useEffect(() => {
    if (!isEditMode || !editProductId) return;
    if (hasLoadedRegionsRef.current) return;

    fetchProductRegions(editProductId)
      .then(regions => {
        const formattedRegions = convertDbRegionsToForm(regions);

        // Solo hidratar si aún no hay regiones definidas localmente
        setShippingRegions(prev => (prev && prev.length > 0 ? prev : formattedRegions));
        if (!formData?.shippingRegions || formData.shippingRegions.length === 0) {
          updateField('shippingRegions', formattedRegions); // Sincroniza con formData solo si estaba vacío
        }
        hasLoadedRegionsRef.current = true;
      })
      .catch(error => {
        console.error('[AddProduct] useEffect - Error cargando regiones:', error);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, editProductId]);

  // 🔥 NUEVO: Warm-up de Edge Function para reducir cold starts
  useEffect(() => {
    if (!isEditMode && location.pathname === '/supplier/addproduct') {
      // Warm-up call silencioso para preparar Edge Function
      import('../../../../shared/services/supabase').then(({ default: supabase }) => {
        fetch(`${supabase.supabaseUrl}/functions/v1/generate-thumbnail`, {
          method: 'HEAD',
          headers: { 'Authorization': `Bearer ${supabase.supabaseKey}` }
        }).catch(() => {}) // Silent fail - solo para warm-up
      }).catch(() => {})
    }
  }, [location.pathname, isEditMode]);

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
    // Marcar que el usuario interactuó manualmente con las imágenes antes de actualizar
    markImagesTouched?.();
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

    // 🔧 FIX 2C: Prevenir múltiples clicks - considerar tanto isSubmitting como isNavigating
    if (isSubmitting || isNavigating) {
      console.log('⚠️ [AddProduct.handleSubmit] Submit ya en progreso o navegando, ignorando...')
      return;
    }

    setIsSubmitting(true);
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
      
      // Liberar el estado de submit
      setIsSubmitting(false);
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
        
        // 🔥 NUEVO: Configurar tracking de thumbnails para productos nuevos
        if (productId && formData.imagenes?.length > 0) {
          setCreatedProductId(productId);
          thumbnailStatus.markAsProcessing();
          console.info('🔄 [AddProduct] Iniciando tracking de thumbnails para producto:', productId);
        }
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
      const successMessage = isEditMode
        ? 'Producto actualizado exitosamente!'
        : 'Producto creado exitosamente!';

      replaceLoadingWithSuccess('product-save', successMessage, '🎉');

      // 🔧 FIX 2C: Marcar que estamos navegando (esto deshabilitará el botón permanentemente)
      setIsNavigating(true);

      // 4. Navegar después de un breve delay
      setTimeout(() => {
        navigate('/supplier/myproducts');
        // No es necesario liberar estados aquí porque el componente se desmontará
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
      
      // 🔧 FIX 2C: Solo liberar el estado en caso de error (no tocamos isNavigating)
      setIsSubmitting(false);
    }
    // 🔧 FIX 2C: No hay finally - en caso de éxito, isNavigating permanece true hasta que el componente se desmonte
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
          pt: { xs: 4, md: 10 },
          px: { xs: 0, md: 3 }, // ✅ Correcto: sin padding horizontal en móvil
          pb: SPACING_BOTTOM_MAIN,
          ml: { xs: 0, md: 10, lg: 14, xl: 24 },
          width: { xs: '100%', md: 'auto' }, // 🔧 Forzar 100% width en móvil
        }}
      >
        <Container maxWidth={isMobile ? false : "xl"} disableGutters={isMobile ? true : false}>
          {/* Header */}
          <Box sx={{ 
            mb: { xs: 2, md: 4 },
            px: { xs: 0, md: 0 }, // 🔧 Sin padding horizontal en móvil
          }}>
            {isMobile ? (
              // 📱 Header Móvil - Botón volver separado encima
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Fila 1: Solo botón Volver */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <Tooltip title="Volver" arrow>
                    <IconButton
                      onClick={handleBack}
                      sx={{ 
                        p: 1,
                        '&:hover': {
                          backgroundColor: 'action.hover'
                        }
                      }}
                    >
                      <ArrowBackIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
                
                {/* Fila 2: Título centrado */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  {!isEditMode && (
                    <Inventory2Icon sx={{ color: 'primary.main', fontSize: 28 }} />
                  )}
                  <Typography variant="h5" fontWeight="600" color="primary.main">
                    {isEditMode ? 'Editar Producto' : 'Agregar Producto'}
                  </Typography>
                </Box>
              </Box>
            ) : (
              // 🖥️ Header Desktop - Mantener actual
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Tooltip title="Volver" arrow>
                  <IconButton
                    onClick={handleBack}
                    sx={{ 
                      p: 1,
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                  >
                    <ArrowBackIcon />
                  </IconButton>
                </Tooltip>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {!isEditMode && (
                    <Inventory2Icon sx={{ color: 'primary.main', fontSize: 36 }} />
                  )}
                  <Typography variant="h4" fontWeight="600" color="primary.main">
                    {isEditMode ? 'Editar Producto' : 'Agregar Producto'}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>

          {/* 🔥 NUEVO: Status de Thumbnails */}
          {!isEditMode && createdProductId && (
            <Box sx={{ mb: 2 }}>
              {thumbnailStatus.isProcessing && (
                <Paper sx={{ p: 2, backgroundColor: '#fff3cd', border: '1px solid #ffeaa7' }}>
                  <Typography variant="body2" color="text.secondary">
                    📸 Procesando thumbnails... Esto puede tomar unos segundos.
                  </Typography>
                </Paper>
              )}
              {thumbnailStatus.isReady && (
                <Paper sx={{ p: 2, backgroundColor: '#d4edda', border: '1px solid #c3e6cb' }}>
                  <Typography variant="body2" color="success.main">
                    ✅ Thumbnails generados exitosamente
                  </Typography>
                </Paper>
              )}
              {thumbnailStatus.hasError && (
                <Paper sx={{ p: 2, backgroundColor: '#f8d7da', border: '1px solid #f5c6cb' }}>
                  <Typography variant="body2" color="error.main">
                    ⚠️ Error generando thumbnails: {thumbnailStatus.error}
                  </Typography>
                </Paper>
              )}
            </Box>
          )}

          {/* Form container condicional */}
          {isMobile ? (
            <Box sx={{ px: 0, width: '100%' }}> {/* 🔧 Eliminado px: '1%' */}
              <MobileFormLayout 
                formData={formData}
                errors={errors}
                localErrors={localErrors}
                touched={touched}
                triedSubmit={triedSubmit}
                handleInputChange={handleInputChange}
                handleFieldBlur={handleFieldBlur}
                handlePricingTypeChangeUI={handlePricingTypeChangeUI}
                handleTramoChange={handleTramoChange}
                handleTramoBlur={handleTramoBlur}
                addTramo={addTramo}
                removeTramo={removeTramo}
                handleRegionChange={handleRegionChange}
                imageError={imageError}
                handleImagesChange={handleImagesChange}
                handleImageError={handleImageError}
                freezeDisplay={isLoading || isSubmitting || isNavigating}
              />
            </Box>
          ) : (
            <DesktopFormLayout 
              formData={formData}
              errors={errors}
              localErrors={localErrors}
              touched={touched}
              triedSubmit={triedSubmit}
              handleInputChange={handleInputChange}
              handleFieldBlur={handleFieldBlur}
              handlePricingTypeChangeUI={handlePricingTypeChangeUI}
              handleTramoChange={handleTramoChange}
              handleTramoBlur={handleTramoBlur}
              addTramo={addTramo}
              removeTramo={removeTramo}
              handleRegionChange={handleRegionChange}
              imageError={imageError}
              handleImagesChange={handleImagesChange}
              handleImageError={handleImageError}
              freezeDisplay={isLoading || isSubmitting || isNavigating}
            />
          )}
        </Container>
      </Box>
        </ProductFormErrorBoundary>
    </ThemeProvider>
    
    {/* Portal del panel de resultados - SOLO DESKTOP */}
    {!isMobile && (
      <ResultsPanelPortal>
        <ProductResultsPanel
          calculations={calculations}
          isValid={isValid}
          hasActualChanges={hasActualChanges} // 🔧 FIX EDIT: Pasar hasActualChanges
          isLoading={isLoading || isSubmitting || isNavigating}
          isEditMode={isEditMode}
          onBack={handleBack}
          onSubmit={handleSubmit}
        />
      </ResultsPanelPortal>
    )}
    
    {/* Bottom Bar Expandible - SOLO MÓVIL */}
    {isMobile && (
      <MobileExpandableBottomBar
        calculations={calculations}
        formData={formData}
        isValid={isValid}
        hasActualChanges={hasActualChanges} // 🔧 FIX EDIT: Pasar hasActualChanges
        isLoading={isLoading || isSubmitting || isNavigating}
        isEditMode={isEditMode}
        onSubmit={handleSubmit}
      />
    )}
    </SupplierErrorBoundary>
  );
};

export default AddProduct;
