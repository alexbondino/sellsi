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
  useMediaQuery,
  Card,
  Stack,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Inventory2 as Inventory2Icon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon
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
  handleImageError 
}) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      gap: 0, // 🔧 Gap 0 para unir visualmente
      px: 0.5, // 🔧 Padding ultra mínimo para llegar al 95%
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
      <Box sx={{ p: 3, borderBottom: '1px solid #f0f0f0' }}>
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
      <Box sx={{ p: 3, borderBottom: '1px solid #f0f0f0' }}>
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
      <Box sx={{ p: 3, borderBottom: '1px solid #f0f0f0' }}>
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
      <Box sx={{ p: 3, borderBottom: '1px solid #f0f0f0' }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 700, mb: 2 }}>
          🚚 Regiones de Despacho
        </Typography>
        <ProductRegions
          formData={formData}
          onRegionChange={handleRegionChange}
          errors={errors}
          localErrors={localErrors}
          triedSubmit={triedSubmit}
          isMobile={true}
        />
      </Box>
      
      {/* Imágenes del Producto */}
      <Box sx={{ p: 3 }}> {/* Sin border-bottom en la última sección */}
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
  handleImageError 
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
  const { createProduct, loadProducts } = useSupplierProducts();

  // 🔧 Hook para responsividad móvil - SOLO xs y sm
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // 📊 Estado para panel expandible móvil
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);

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

  // 📱 Mobile Expandable Bottom Actions Bar - Rediseñado
  const MobileExpandableBottomBar = () => {
    console.log('🔍 MobileExpandableBottomBar renderizándose', { isMobile });
    return (
    <>
      {/* Barra Principal Compacta - JUSTO ENCIMA de MobileBar */}
      <Paper
        elevation={24}
        sx={{
          position: 'fixed',
          bottom: 80, // 🔧 80px desde abajo para estar encima de MobileBar (que mide ~70px)
          left: 0,
          right: 0,
          zIndex: 1450, // 🔧 Mayor que MobileBar (1400) pero no excesivo
          borderRadius: '16px 16px 0 0',
          background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
          borderTop: '2px solid #1976d2',
          p: 2,
          boxShadow: '0 -8px 32px rgba(0,0,0,0.25)',
        }}
      >
        {/* Una sola fila con Total a la izquierda y botones a la derecha */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          gap: 2,
        }}>
          {/* Total Estimado - Izquierda */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Total estimado
            </Typography>
            <Typography variant="h6" fontWeight="700" color="primary.main" sx={{ lineHeight: 1 }}>
              {calculations.isRange 
                ? `${formatPrice(
                    calculations.rangos.total?.min || 0
                  )} - ${formatPrice(
                    calculations.rangos.total?.max || 0
                  )}`
                : `${formatPrice(calculations.total || 0)}`
              }
            </Typography>
          </Box>
          
          {/* Botones de Acción - Derecha */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* Botón Ver Detalles - 50% más chico */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<VisibilityIcon sx={{ fontSize: '0.9rem' }} />}
              onClick={() => setIsPanelExpanded(true)}
              sx={{
                py: 0.5, // 🔧 Reducido de 1 a 0.5
                px: 1, // 🔧 Reducido de 2 a 1
                fontSize: '0.75rem', // 🔧 Texto más pequeño
                textTransform: 'none',
                borderRadius: 2,
                fontWeight: 600,
                minWidth: 'auto',
              }}
            >
              Ver Detalles
            </Button>
            
            {/* Botón Publicar Producto - 50% más chico */}
            <Button
              variant="contained"
              size="small"
              onClick={handleSubmit}
              disabled={!isValid || isLoading}
              sx={{
                py: 0.5, // 🔧 Reducido de 1 a 0.5
                px: 1.5, // 🔧 Reducido de 3 a 1.5
                fontSize: '0.75rem', // 🔧 Reducido de 0.95rem a 0.75rem
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                minWidth: 'auto',
              }}
            >
              {isLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography sx={{ fontSize: '0.7rem' }}>
                    {isEditMode ? 'Actualizando...' : 'Publicando...'}
                  </Typography>
                </Box>
              ) : (
                isEditMode ? 'Actualizar' : 'Publicar'
              )}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Panel de Detalles Expandido */}
      {isPanelExpanded && (
        <Paper
          elevation={24}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10000, // 🔧 Z-index máximo para estar por encima de todo
            background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header del Panel Expandido */}
          <Box sx={{ 
            p: 3, 
            borderBottom: '2px solid #e0e0e0',
            background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" fontWeight="700" color="primary.main">
                Detalles de Venta
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<CloseIcon />}
                onClick={() => setIsPanelExpanded(false)}
                sx={{
                  textTransform: 'none',
                  borderRadius: 2,
                  fontWeight: 600,
                }}
              >
                Cerrar
              </Button>
            </Box>
            
            {/* Total destacado */}
            <Box sx={{ 
              textAlign: 'center', 
              p: 2, 
              borderRadius: 3,
              background: 'linear-gradient(135deg, #e3f2fd 0%, #f1f8e9 100%)',
              border: '2px solid #1976d2',
            }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Total Estimado de Ganancia
              </Typography>
              <Typography variant="h4" fontWeight="800" color="primary.main">
                {calculations.isRange 
                  ? `${formatPrice(
                      calculations.rangos.total?.min || 0
                    )} - ${formatPrice(
                      calculations.rangos.total?.max || 0
                    )}`
                  : `${formatPrice(calculations.total || 0)}`
                }
              </Typography>
            </Box>
          </Box>

          {/* Contenido Scrolleable */}
          <Box sx={{ 
            flex: 1, 
            overflow: 'auto', 
            p: 3,
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'grey.200',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'primary.main',
              borderRadius: '3px',
            },
          }}>
            <Stack spacing={3}>
              {calculations.isRange ? (
                // Mostrar detalles de rangos
                <>
                  <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>
                    💰 Ganancias por Volumen
                  </Typography>
                  {calculations.rangos.details?.map((detail, index) => (
                    <Card key={index} elevation={2} sx={{ 
                      p: 3, 
                      borderRadius: 3,
                      background: `linear-gradient(135deg, ${index % 2 === 0 ? '#f3e5f5' : '#e8f5e8'} 0%, #ffffff 100%)`,
                      border: `2px solid ${index % 2 === 0 ? '#9c27b0' : '#4caf50'}`,
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" fontWeight="600" color="primary.main">
                          📊 Rango {index + 1}
                        </Typography>
                        <Chip 
                          label={`${detail.min}-${detail.max} unidades`}
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">
                            Precio por unidad:
                          </Typography>
                          <Typography variant="body1" fontWeight="600">
                            {formatPrice(detail.precio)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">
                            Ganancia por unidad:
                          </Typography>
                          <Typography variant="body1" fontWeight="600" color="success.main">
                            {formatPrice(detail.ganancia)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: '1px solid #e0e0e0' }}>
                          <Typography variant="body1" fontWeight="600">
                            Total rango:
                          </Typography>
                          <Typography variant="h6" fontWeight="700" color="primary.main">
                            {formatPrice(detail.total)}
                          </Typography>
                        </Box>
                      </Stack>
                    </Card>
                  ))}
                </>
              ) : (
                // Mostrar detalles precio fijo
                <Card elevation={2} sx={{ 
                  p: 3, 
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)',
                  border: '2px solid #1976d2',
                }}>
                  <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>
                    💵 Precio Fijo por Unidad
                  </Typography>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Precio de venta:
                      </Typography>
                      <Typography variant="h6" fontWeight="600">
                        {formatPrice(formData.precio)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Ganancia por unidad:
                      </Typography>
                      <Typography variant="h6" fontWeight="600" color="success.main">
                        {formatPrice(calculations.ganancia)}
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      pt: 2, 
                      borderTop: '2px solid #1976d2',
                      background: 'rgba(25, 118, 210, 0.1)',
                      p: 2,
                      borderRadius: 2,
                      mt: 2,
                    }}>
                      <Typography variant="h6" fontWeight="700">
                        Total estimado:
                      </Typography>
                      <Typography variant="h5" fontWeight="800" color="primary.main">
                        {formatPrice(calculations.total)}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              )}
              
              {/* Información adicional */}
              <Card elevation={1} sx={{ 
                p: 3, 
                borderRadius: 3,
                background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)',
                border: '1px solid #e0e0e0',
              }}>
                <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>
                  📦 Información del Producto
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Stock disponible:
                    </Typography>
                    <Typography variant="body1" fontWeight="600">
                      {formData.stock} unidades
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Compra mínima:
                    </Typography>
                    <Typography variant="body1" fontWeight="600">
                      {formData.compraMinima} unidades
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Tipo de precio:
                    </Typography>
                    <Chip 
                      label={formData.pricingType}
                      color="primary"
                      size="small"
                    />
                  </Box>
                </Stack>
              </Card>
            </Stack>
          </Box>
        </Paper>
      )}
    </>
    );
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
            px: { xs: 0.5, md: 0 }, // 🔧 Reducido aún más para maximizar width
          }}>
            {isMobile ? (
              // 📱 Header Móvil - Botón volver separado encima
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Fila 1: Solo botón Volver */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={handleBack}
                    variant="outlined"
                    size="small"
                    sx={{ 
                      textTransform: 'none',
                    }}
                  >
                    Volver
                  </Button>
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
            )}
          </Box>

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
          isLoading={isLoading}
          isEditMode={isEditMode}
          onBack={handleBack}
          onSubmit={handleSubmit}
        />
      </ResultsPanelPortal>
    )}
    
    {/* Bottom Bar Expandible - SOLO MÓVIL */}
    {isMobile && <MobileExpandableBottomBar />}
    </SupplierErrorBoundary>
  );
};

export default AddProduct;
