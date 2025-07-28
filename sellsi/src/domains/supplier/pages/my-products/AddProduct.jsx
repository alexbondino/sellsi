import React, { useState, useEffect, useCallback } from 'react';
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
import { calculateProductEarnings } from '../../utils/centralizedCalculations'; // 🔧 USANDO NOMBRE CORRECTO
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

  // Efecto para calcular dinámicamente
  useEffect(() => {
    const newCalculations = calculateProductEarnings(formData); // 🔧 USANDO LÓGICA CENTRALIZADA
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
    
    // Lógica de validación por Stock Disponible (solo aplica para rangos 3, 4 y 5)
    if (field === 'stock' && formData.pricingType === 'Volumen' && formData.tramos.length >= 3) {
      const newStock = parseInt(value) || 0;
      
      if (newStock > 0) {
        // Filtrar rangos que superen el nuevo stock disponible
        const validatedTramos = formData.tramos.filter((tramo, index) => {
          // Rango 1 y 2 siempre se mantienen
          if (index < 2) return true;
          
          // Para rangos 3+, verificar si el MIN supera el stock
          const min = parseInt(tramo.min) || 0;
          return min <= newStock;
        });
        
        // Si se eliminaron rangos, actualizar
        if (validatedTramos.length !== formData.tramos.length) {
          updateField('tramos', validatedTramos);
        }
      }
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

  const handleTramoChange = (index, field, value) => {
    const newTramos = [...formData.tramos];
    newTramos[index] = { ...newTramos[index], [field]: value };
    
    // Lógica para rangos 2+: MIN = MAX del rango anterior + 1
    if (index > 0) {
      if (field === 'max' && index > 0) {
        // Cuando se actualiza MAX de un rango 2+, actualizar MIN del siguiente si existe
        if (newTramos[index + 1]) {
          const newMax = parseInt(value) || 0;
          const nextMin = newMax + 1;
          newTramos[index + 1] = { ...newTramos[index + 1], min: nextMin.toString() };
        }
      }
      
      // Actualizar MIN del rango actual basado en el MAX del rango anterior
      if (index > 0 && newTramos[index - 1]?.max) {
        const prevMax = parseInt(newTramos[index - 1].max) || 0;
        const autoMin = prevMax + 1;
        newTramos[index] = { ...newTramos[index], min: autoMin.toString() };
      } else if (index === 1 && newTramos[0]?.max) {
        // Caso especial para rango 2: MIN = MAX del rango 1 + 1
        const rango1Max = parseInt(newTramos[0].max) || 0;
        const rango2Min = rango1Max + 1;
        newTramos[1] = { ...newTramos[1], min: rango2Min.toString() };
      }
    }
    
    updateField('tramos', newTramos);

    // ✅ REMOVIDO: La sincronización ahora se maneja automáticamente en el hook useProductForm
  };

  const addTramo = () => {
    // Cuando se agrega un nuevo tramo:
    // 1. El tramo anterior (que era el último) ahora debe tener su MAX habilitado y vacío
    // 2. El nuevo tramo será el último con MAX = stock disponible
    
    const lastTramo = formData.tramos[formData.tramos.length - 1];
    const newTramos = [...formData.tramos];
    
    // Si hay un tramo anterior y es del rango 2+, limpiar su MAX para que se habilite
    if (newTramos.length > 1) {
      const previousTramoIndex = newTramos.length - 1;
      newTramos[previousTramoIndex] = { 
        ...newTramos[previousTramoIndex], 
        max: '' // Limpiar MAX para habilitarlo y resaltarlo en rojo
      };
    }
    
    // Calcular MIN para el nuevo tramo
    let newMin = '';
    if (lastTramo && lastTramo.max && lastTramo.max !== '') {
      newMin = (parseInt(lastTramo.max) + 1).toString();
    } else if (lastTramo && lastTramo.min) {
      // Si el tramo anterior no tiene MAX definido, usar MIN + 2
      newMin = (parseInt(lastTramo.min) + 2).toString();
    }
    
    // Agregar el nuevo tramo
    newTramos.push({ 
      min: newMin, 
      max: '', // El último tramo tendrá MAX oculto = stock disponible 
      precio: '' 
    });
    
    updateField('tramos', newTramos);
  };

  const removeTramo = index => {
    // Solo permitir eliminar si hay más de 2 tramos (mínimo debe haber Tramo 1 y Tramo 2)
    if (formData.tramos.length > 2) {
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
  /**
   * 🎯 GENERADOR DE MENSAJES DE ERROR CONTEXTUALES
   * Analiza los errores y genera mensajes específicos para el usuario
   */
  const generateContextualErrorMessage = (validationErrors) => {
    console.log('🔍 [generateContextualErrorMessage] Procesando errores:', validationErrors)
    
    if (!validationErrors || Object.keys(validationErrors).length === 0) {
      return null;
    }

    const errorKeys = Object.keys(validationErrors);
    console.log('🔑 [generateContextualErrorMessage] Error keys:', errorKeys)
    
    const hasTramoErrors = errorKeys.includes('tramos');
    const hasBasicFieldErrors = errorKeys.some(key => 
      ['nombre', 'descripcion', 'categoria', 'stock', 'compraMinima', 'precioUnidad'].includes(key)
    );
    const hasImageErrors = errorKeys.includes('imagenes');
    const hasRegionErrors = errorKeys.includes('shippingRegions');

    console.log('🔍 [generateContextualErrorMessage] Tipos de errores detectados:', {
      hasTramoErrors,
      hasBasicFieldErrors,
      hasImageErrors,
      hasRegionErrors
    })

    // Construir mensaje específico
    const messages = [];

    if (hasTramoErrors) {
      const tramoError = validationErrors.tramos;
      
      // Detectar tipo específico de error en tramos
      if (tramoError.includes('ascendentes')) {
        messages.push('🔢 Las cantidades de los tramos deben ser ascendentes (ej: 50, 100, 200)');
      } else if (tramoError.includes('descendentes') || tramoError.includes('compran más')) {
        messages.push('💰 Los precios deben ser descendentes: compran más, pagan menos por unidad');
      } else if (tramoError.includes('Tramo')) {
        messages.push('📊 Revisa la configuración de los tramos de precio');
      } else if (tramoError.includes('al menos')) {
        messages.push('📈 Debes configurar al menos 2 tramos de precios válidos');
      } else if (tramoError.includes('stock')) {
        messages.push('⚠️ Las cantidades de los tramos no pueden superar el stock disponible');
      } else if (tramoError.includes('enteros positivos')) {
        messages.push('🔢 Las cantidades y precios deben ser números enteros positivos');
      } else {
        messages.push('📈 Revisa la configuración de los tramos de precios');
      }
    }

    if (hasBasicFieldErrors) {
      const basicErrors = [];
      if (validationErrors.nombre) basicErrors.push('nombre');
      if (validationErrors.descripcion) basicErrors.push('descripción');
      if (validationErrors.categoria) basicErrors.push('categoría');
      if (validationErrors.stock) basicErrors.push('stock');
      if (validationErrors.compraMinima) basicErrors.push('compra mínima');
      if (validationErrors.precioUnidad) basicErrors.push('precio');
      
      if (basicErrors.length > 0) {
        messages.push(`📝 Completa: ${basicErrors.join(', ')}`);
      } else {
        messages.push('📝 Completa la información básica del producto');
      }
    }

    if (hasImageErrors) {
      messages.push('🖼️ Agrega al menos una imagen del producto');
    }

    if (hasRegionErrors) {
      messages.push('🚛 Configura las regiones de despacho');
    }

    // Formatear mensaje final
    if (messages.length > 1) {
      const finalMessage = `${messages.join(' • ')}`;
      console.log('📝 [generateContextualErrorMessage] Mensaje múltiple:', finalMessage)
      return finalMessage;
    } else if (messages.length === 1) {
      console.log('📝 [generateContextualErrorMessage] Mensaje único:', messages[0])
      return messages[0];
    } else {
      const defaultMessage = 'Por favor, completa todos los campos requeridos';
      console.log('📝 [generateContextualErrorMessage] Mensaje por defecto:', defaultMessage)
      return defaultMessage;
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
      
      // 🎯 Generar mensaje contextual específico
      const contextualMessage = generateContextualErrorMessage(validationErrors);
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
