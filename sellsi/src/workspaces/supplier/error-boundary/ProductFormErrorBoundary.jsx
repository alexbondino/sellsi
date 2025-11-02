import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Alert,
  Chip,
  LinearProgress
} from '@mui/material';
import { 
  Assignment as FormIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Restore as RestoreIcon
} from '@mui/icons-material';

/**
 * ============================================================================
 * PRODUCT FORM ERROR BOUNDARY
 * ============================================================================
 * 
 * Error Boundary específico para formularios de productos en el dominio Supplier.
 * Características especiales:
 * - Auto-guardado de datos del formulario
 * - Restauración de datos después del error
 * - Validación de campos críticos
 * - Manejo de errores de validación
 */

class ProductFormErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      savedFormData: null,
      autoSaveEnabled: true
    };

    // Auto-save del formulario cada 30 segundos
    this.autoSaveInterval = null;
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const errorId = `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Auto-guardar datos del formulario antes de mostrar error
    this.saveFormData();
    
    // Logging del error
    console.group('📝 ProductFormErrorBoundary - Error Capturado');
    console.error('Error ID:', errorId);
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Form Data:', this.props.formData);
    console.groupEnd();

    this.setState({
      error,
      errorInfo,
      errorId,
    });

    // En producción, enviar a servicio de logging
    if (process.env.NODE_ENV === 'production') {
      // this.logToErrorService(error, errorInfo, errorId);
    }
  }

  componentDidMount() {
    // Iniciar auto-save si hay datos de formulario
    if (this.props.formData && this.state.autoSaveEnabled) {
      this.startAutoSave();
    }
  }

  componentWillUnmount() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
  }

  startAutoSave = () => {
    this.autoSaveInterval = setInterval(() => {
      if (this.props.formData && !this.state.hasError) {
        this.saveFormData(false); // Save silently
      }
    }, 30000); // Every 30 seconds
  };

  saveFormData = (showNotification = true) => {
    try {
      const formData = this.props.formData || {};
      const saveKey = `supplier_product_form_backup_${Date.now()}`;
      
      localStorage.setItem(saveKey, JSON.stringify({
        data: formData,
        timestamp: Date.now(),
        errorId: this.state.errorId
      }));

      this.setState({ savedFormData: formData });
      
      if (showNotification) {
        console.log('📋 Datos del formulario guardados automáticamente');
      }
    } catch (saveError) {
      console.error('Error al guardar datos del formulario:', saveError);
    }
  };

  restoreFormData = () => {
    try {
      // Buscar backups recientes (últimas 24 horas)
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      const backups = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('supplier_product_form_backup_')) {
          const data = JSON.parse(localStorage.getItem(key));
          if (data.timestamp > oneDayAgo) {
            backups.push({ key, ...data });
          }
        }
      }

      // Usar el backup más reciente
      if (backups.length > 0) {
        const latestBackup = backups.sort((a, b) => b.timestamp - a.timestamp)[0];
        
        // Callback para restaurar datos
        if (this.props.onRestoreData) {
          this.props.onRestoreData(latestBackup.data);
        }

        return latestBackup.data;
      }
    } catch (restoreError) {
      console.error('Error al restaurar datos del formulario:', restoreError);
    }
    
    return null;
  };

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: prevState.retryCount + 1
    }));

    // Reiniciar auto-save
    if (this.state.autoSaveEnabled) {
      this.startAutoSave();
    }

    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleRetryWithRestore = () => {
    const restoredData = this.restoreFormData();
    if (restoredData) {
      console.log('📋 Datos del formulario restaurados');
    }
    this.handleRetry();
  };

  getFormErrorType = (error) => {
    const message = error?.message?.toLowerCase() || '';
    
    if (message.includes('validation') || message.includes('required')) {
      return 'validation';
    }
    if (message.includes('save') || message.includes('submit')) {
      return 'submit';
    }
    if (message.includes('image') || message.includes('file')) {
      return 'upload';
    }
    if (message.includes('network') || message.includes('server')) {
      return 'network';
    }
    
    return 'form';
  };

  getErrorMessage = (errorType) => {
    const messages = {
      validation: {
        title: 'Error de Validación del Formulario',
        description: 'Algunos campos del formulario contienen información incorrecta o están incompletos.'
      },
      submit: {
        title: 'Error al Guardar Producto',
        description: 'No se pudo guardar la información del producto. Tus datos se han guardado temporalmente.'
      },
      upload: {
        title: 'Error en Carga de Archivos',
        description: 'Hubo un problema al subir imágenes o archivos del producto.'
      },
      network: {
        title: 'Error de Conexión',
        description: 'No se pudo conectar con el servidor para guardar el producto.'
      },
      form: {
        title: 'Error en el Formulario',
        description: 'Ocurrió un error inesperado en el formulario del producto.'
      }
    };

    return messages[errorType] || messages.form;
  };

  render() {
    if (this.state.hasError) {
      const errorType = this.getFormErrorType(this.state.error);
      const errorMessage = this.getErrorMessage(errorType);
      const hasBackupData = this.state.savedFormData || this.restoreFormData();

      return (
        <Box sx={{ p: 2 }}>
          <Card 
            elevation={4}
            sx={{ 
              border: '2px solid #ff9800',
              backgroundColor: '#fff8e1'
            }}
          >
            <CardContent>
              {/* Header del Error */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ErrorIcon sx={{ color: '#ff9800', mr: 1, fontSize: 28 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" color="error" fontWeight="bold">
                    {errorMessage.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Formulario de Producto
                  </Typography>
                </Box>
                <Chip 
                  icon={<FormIcon />}
                  label={errorType.toUpperCase()}
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              </Box>

              {/* Indicador de Auto-Save */}
              {hasBackupData && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <SaveIcon sx={{ mr: 1, fontSize: 20 }} />
                    <Typography variant="body2" fontWeight="bold">
                      Datos Guardados Automáticamente
                    </Typography>
                  </Box>
                  <Typography variant="body2">
                    Tus datos se han guardado automáticamente y pueden ser restaurados.
                  </Typography>
                </Alert>
              )}

              {/* Descripción del Error */}
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  {errorMessage.description}
                </Typography>
              </Alert>

              {/* Progress bar para mostrar que el auto-save está activo */}
              {this.state.autoSaveEnabled && !this.state.hasError && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Auto-guardado activo
                  </Typography>
                  <LinearProgress variant="indeterminate" sx={{ height: 2, mt: 0.5 }} />
                </Box>
              )}

              {/* Botones de Acción */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleRetry}
                  sx={{ minWidth: 120 }}
                >
                  Reintentar
                </Button>

                {hasBackupData && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<RestoreIcon />}
                    onClick={this.handleRetryWithRestore}
                  >
                    Restaurar y Reintentar
                  </Button>
                )}
              </Box>

              {/* Información sobre los datos guardados */}
              {hasBackupData && (
                <Box sx={{ mt: 2, p: 2, backgroundColor: '#e8f5e8', borderRadius: 1 }}>
                  <Typography variant="body2" color="success.main">
                    <strong>✓ Datos Protegidos:</strong> La información de tu producto 
                    está guardada y no se perderá. Puedes continuar donde lo dejaste.
                  </Typography>
                </Box>
              )}

              {/* Consejos específicos por tipo de error */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  💡 Consejos:
                </Typography>
                {errorType === 'validation' && (
                  <Typography variant="body2" color="text.secondary">
                    • Revisa que todos los campos obligatorios estén completos<br/>
                    • Verifica el formato de precios y cantidades<br/>
                    • Asegúrate de que las imágenes sean válidas
                  </Typography>
                )}
                {errorType === 'submit' && (
                  <Typography variant="body2" color="text.secondary">
                    • Verifica tu conexión a internet<br/>
                    • Intenta guardar nuevamente en unos momentos<br/>
                    • Tus datos están protegidos y no se perderán
                  </Typography>
                )}
                {(errorType === 'network' || errorType === 'form') && (
                  <Typography variant="body2" color="text.secondary">
                    • Verifica tu conexión a internet<br/>
                    • Recarga la página si el problema persiste<br/>
                    • Usa "Restaurar" para recuperar tus datos
                  </Typography>
                )}
              </Box>

              {/* Debug Info */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">
                    🔧 Debug Info (ID: {this.state.errorId})
                  </Typography>
                  <Typography variant="caption" component="pre" sx={{ fontSize: '11px', mt: 1 }}>
                    {this.state.error.toString()}
                  </Typography>
                  {this.props.formData && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                      Form Data Keys: {Object.keys(this.props.formData).join(', ')}
                    </Typography>
                  )}
                </Box>
              )}

              {/* Contador de reintentos */}
              {this.state.retryCount > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                  Intentos: {this.state.retryCount} | Auto-save: {this.state.autoSaveEnabled ? 'Activo' : 'Inactivo'}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ProductFormErrorBoundary;
