import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
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
  replaceLoadingWithError,
} from '../../../../utils/toastHelpers';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';

// Error Boundaries
import {
  SupplierErrorBoundary,
  ProductFormErrorBoundary,
} from '../../error-boundary';

// Subcomponentes modularizados
import {
  ProductBasicInfo,
  ProductInventory,
  ProductImages,
  ProductRegions,
  ProductResultsPanel,
  ProductPricing,
  PriceTiers,
} from './form';

// Componente de barra móvil
import MobileExpandableBottomBar from './MobileExpandableBottomBar';

// Servicio para regiones de entrega
import {
  fetchProductRegions,
  saveProductRegions,
} from '../../../../workspaces/marketplace';
import {
  convertDbRegionsToForm,
  convertFormRegionsToDb,
} from '../../../../utils/shippingRegionsUtils';

// Hooks y utilidades
import { useProductForm } from '../hooks/useProductForm';
import { useProductValidation } from '../hooks/useProductValidation';
import { useProductPricingLogic } from '../hooks/useProductPricingLogic';
import { useThumbnailStatus } from '../hooks/useThumbnailStatus'; // 🔥 NUEVO: Status tracking para thumbnails
import { calculateProductEarnings } from '../../shared-utils/centralizedCalculations'; // 🔧 USANDO NOMBRE CORRECTO
import { ProductValidator } from '../utils/ProductValidator';
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
  handleFreeShippingChange,
  imageError,
  handleImagesChange,
  handleImageError,
  freezeDisplay = false,
  supplierId,
}) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
      px: 0,
      pb: 2,
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
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #fafafa 0%, #ffffff 100%)',
      }}
    >
      {/* Información Básica */}
      <Box sx={{ p: { xs: 1.5, md: 3 }, borderBottom: '1px solid #f0f0f0' }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ color: 'primary.main', fontWeight: 700, mb: 2 }}
        >
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
        <Typography
          variant="h6"
          gutterBottom
          sx={{ color: 'primary.main', fontWeight: 700, mb: 2 }}
        >
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
        <Typography
          variant="h6"
          gutterBottom
          sx={{ color: 'primary.main', fontWeight: 700, mb: 2 }}
        >
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
        <Typography
          variant="h6"
          gutterBottom
          sx={{ color: 'primary.main', fontWeight: 700, mb: 2 }}
        >
          🚚 Regiones de Despacho
        </Typography>
        <ProductRegions
          supplierId={supplierId}
          formData={formData}
          onRegionChange={handleRegionChange}
          onFreeShippingChange={handleFreeShippingChange}
          errors={errors}
          localErrors={localErrors}
          triedSubmit={triedSubmit}
          freezeDisplay={freezeDisplay}
          isMobile={true}
        />
      </Box>

      {/* Imágenes del Producto */}
      <Box sx={{ p: { xs: 1.5, md: 3 } }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ color: 'primary.main', fontWeight: 700, mb: 2 }}
        >
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
  handleFreeShippingChange,
  imageError,
  handleImagesChange,
  handleImageError,
  freezeDisplay = false,
  supplierId,
}) => (
  <Grid container spacing={3}>
    <Grid size={{ xs: 12, lg: 40 }}>
      <Paper
        sx={{
          p: 3,
          maxWidth: '100%',
          width: '100%',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'minmax(0, 1fr) minmax(0, 1fr)', // 2 columnas flexibles en desktop
            },
            gridTemplateRows: 'auto auto auto auto auto',
            gap: 3,
            '& > *': {
              minWidth: 0,
            },
            '& .full-width': {
              gridColumn: '1 / -1', // ocupa ambas columnas
            },
          }}
        >
          {/* Información Básica */}
          <ProductBasicInfo
            formData={formData}
            errors={{ ...errors, ...localErrors }}
            touched={touched}
            triedSubmit={triedSubmit}
            onInputChange={handleInputChange}
            onFieldBlur={handleFieldBlur}
          />

          {/* Inventario y Condiciones - FULL WIDTH */}
          <Box className="full-width">
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

          {/* Configuración de Precios - FULL WIDTH, ENTRE INVENTARIO Y DESPACHO */}
          <Box className="full-width">
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
          </Box>

          {/* Regiones de Despacho - DEBAJO, FULL WIDTH */}
          <Box className="full-width">
            <ProductRegions
              supplierId={supplierId}
              formData={formData}
              onRegionChange={handleRegionChange}
              onFreeShippingChange={handleFreeShippingChange}
              errors={errors}
              localErrors={localErrors}
              triedSubmit={triedSubmit}
              freezeDisplay={freezeDisplay}
            />
          </Box>

          {/* Imágenes del Producto */}
          <Box className="full-width">
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
        </Box>
      </Paper>
    </Grid>

    {/* Panel de resultados desktop */}
    <Grid size={{ xs: 12, lg: 4 }}>{/* Panel renderizado como portal */}</Grid>
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
    hasActualChanges,
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

  // Hook para lógica de manipulación de tramos
  const {
    handleTramoChange,
    handleTramoBlur,
    addTramo,
    removeTramo,
    validateStockConstraints,
  } = useProductPricingLogic(formData, updateField);

  // Estado local para errores de imágenes
  const [imageError, setImageError] = useState('');

  // Estado para prevenir múltiples clicks del botón submit
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado adicional para indicar éxito y navegación pendiente
  const [isNavigating, setIsNavigating] = useState(false);

  // Status tracking para thumbnails
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

  // Cargar regiones de entrega si editando (una sola vez, sin sobreescribir ediciones locales)
  const hasLoadedRegionsRef = useRef(false);
  useEffect(() => {
    if (!isEditMode || !editProductId) return;
    if (hasLoadedRegionsRef.current) return;

    fetchProductRegions(editProductId)
      .then(regions => {
        const formattedRegions = convertDbRegionsToForm(regions);

        // Solo hidratar si aún no hay regiones definidas localmente
        setShippingRegions(prev =>
          prev && prev.length > 0 ? prev : formattedRegions
        );
        if (
          !formData?.shippingRegions ||
          formData.shippingRegions.length === 0
        ) {
          updateField('shippingRegions', formattedRegions);
        }
        hasLoadedRegionsRef.current = true;
      })
      .catch(error => {
        console.error(
          '[AddProduct] useEffect - Error cargando regiones:',
          error
        );
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, editProductId]);

  // Warm-up de Edge Function para reducir cold starts
  useEffect(() => {
    if (!isEditMode && location.pathname === '/supplier/addproduct') {
      import('../../../../shared/services/supabase')
        .then(({ default: supabase }) => {
          fetch(`${supabase.supabaseUrl}/functions/v1/generate-thumbnail`, {
            method: 'HEAD',
            headers: { Authorization: `Bearer ${supabase.supabaseKey}` },
          }).catch(() => {});
        })
        .catch(() => {});
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

    // Validación de stock vs tramos
    if (field === 'stock') {
      validateStockConstraints(value);
    }
  };

  // Actualiza shippingRegions en formData y estado local
  const handleRegionChange = regions => {
    setShippingRegions(regions);
    updateField('shippingRegions', regions);
  };

  // Handler para cambios en campos de despacho gratuito
  const handleFreeShippingChange = (field, value) => {
    updateField(field, value);
  };

  // Manejar cambios en imágenes
  const handleImagesChange = images => {
    try {
      markImagesTouched();
    } catch (e) {
      /* noop */
    }
    updateField('imagenes', images);
    setImageError('');
  };

  // Handler cambio de pricing type (Unidad / Tramos)
  const handlePricingTypeChangeUI = (event, newValue) => {
    if (newValue === null) return;
    setImageError('');
    handlePricingTypeChange(newValue);
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
    if (isSubmitting || isNavigating) {
      return;
    }

    setIsSubmitting(true);
    markSubmitAttempt();

    try {
      // 1. Procesar y enviar formulario
      const result = await submitForm();

      if (!result.success) {
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
        productId =
          result.data?.productid ||
          result.product?.productid ||
          result.productId;

        if (productId && formData.imagenes?.length > 0) {
          setCreatedProductId(productId);
          thumbnailStatus.markAsProcessing();
        }
      }

      if (productId && shippingRegions.length > 0) {
        const dbRegions = convertFormRegionsToDb(shippingRegions);

        try {
          await saveProductRegions(productId, dbRegions);
        } catch (regionError) {
          console.error(
            '[AddProduct] handleSubmit - Error guardando regiones:',
            regionError
          );
          showErrorToast(
            'Producto guardado, pero hubo un error al guardar las regiones de entrega'
          );
        }
      } else {
        if (!productId) {
          console.error(
            '[AddProduct] handleSubmit - ERROR: productId no disponible para guardar regiones'
          );
          console.error(
            '[AddProduct] handleSubmit - Estructura del result:',
            JSON.stringify(result, null, 2)
          );
        }
      }

      // 3. Mostrar éxito y navegar
      const successMessage = isEditMode
        ? 'Producto actualizado exitosamente!'
        : 'Producto creado exitosamente!';

      replaceLoadingWithSuccess('product-save', successMessage, '🎉');

      setIsNavigating(true);

      // 4. Navegar después de un breve delay
      setTimeout(() => {
        navigate('/supplier/myproducts');
      }, 1500);
    } catch (error) {
      console.error('❌ Error en handleSubmit:', error);

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

      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (location.state && location.state.fromHome) {
      navigate('/supplier/home');
    } else {
      navigate('/supplier/myproducts');
    }
  };

  const handleRetry = () => {
    resetErrors();
    if (isEditMode && productId) {
      // Podrías recargar datos del producto aquí si quisieras
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
              px: { xs: 0, md: 3 },
              pb: SPACING_BOTTOM_MAIN,
              ml: { xs: 0, md: 10, lg: 14, xl: 24 },
              width: { xs: '100%', md: 'auto' },
            }}
          >
            <Container
              maxWidth={isMobile ? false : 'xl'}
              disableGutters={isMobile ? true : false}
            >
              {/* Header */}
              <Box
                sx={{
                  mb: { xs: 2, md: 4 },
                  px: { xs: 0, md: 0 },
                }}
              >
                {isMobile ? (
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <Tooltip title="Volver" arrow>
                        <IconButton
                          onClick={handleBack}
                          sx={{
                            p: 1,
                            '&:hover': {
                              backgroundColor: 'action.hover',
                            },
                          }}
                        >
                          <ArrowBackIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                      }}
                    >
                      {!isEditMode && (
                        <Inventory2Icon
                          sx={{ color: 'primary.main', fontSize: 28 }}
                        />
                      )}
                      <Typography
                        variant="h5"
                        fontWeight="600"
                        color="primary.main"
                      >
                        {isEditMode ? 'Editar Producto' : 'Agregar Producto'}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Tooltip title="Volver" arrow>
                      <IconButton
                        onClick={handleBack}
                        sx={{
                          p: 1,
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                      >
                        <ArrowBackIcon />
                      </IconButton>
                    </Tooltip>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {!isEditMode && (
                        <Inventory2Icon
                          sx={{ color: 'primary.main', fontSize: 36 }}
                        />
                      )}
                      <Typography
                        variant="h4"
                        fontWeight="600"
                        color="primary.main"
                      >
                        {isEditMode ? 'Editar Producto' : 'Agregar Producto'}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Form container condicional */}
              {isMobile ? (
                <Box sx={{ px: 0, width: '100%' }}>
                  <MobileFormLayout
                    supplierId={supplierId}
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
                    handleFreeShippingChange={handleFreeShippingChange}
                    imageError={imageError}
                    handleImagesChange={handleImagesChange}
                    handleImageError={handleImageError}
                    freezeDisplay={isLoading || isSubmitting || isNavigating}
                  />
                </Box>
              ) : (
                <DesktopFormLayout
                  supplierId={supplierId}
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
                  handleFreeShippingChange={handleFreeShippingChange}
                  imageError={imageError}
                  handleImagesChange={handleImagesChange}
                  handleImageError={handleImageError}
                  freezeDisplay={isLoading || isSubmitting || isNavigating}
                />
              )}

              {/* Panel de resultados de venta: ahora siempre al final */}
              <Box sx={{ mt: { xs: 1, md: 4 } }}>
                <ProductResultsPanel
                  calculations={calculations}
                  isValid={isValid}
                  hasActualChanges={hasActualChanges}
                  isLoading={isLoading || isSubmitting || isNavigating}
                  isEditMode={isEditMode}
                  onBack={handleBack}
                  onSubmit={handleSubmit}
                />
              </Box>

              {/* Bottom Bar Expandible - SOLO MÓVIL */}
              {isMobile && (
                <MobileExpandableBottomBar
                  calculations={calculations}
                  formData={formData}
                  isValid={isValid}
                  hasActualChanges={hasActualChanges}
                  isLoading={isLoading || isSubmitting || isNavigating}
                  isEditMode={isEditMode}
                  onSubmit={handleSubmit}
                />
              )}
            </Container>
          </Box>
        </ProductFormErrorBoundary>
      </ThemeProvider>
    </SupplierErrorBoundary>
  );
};

export default AddProduct;
