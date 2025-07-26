import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Alert,
  Chip
} from '@mui/material';
import { 
  CloudUpload as UploadIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon 
} from '@mui/icons-material';

/**
 * ============================================================================
 * IMAGE UPLOAD ERROR BOUNDARY
 * ============================================================================
 * 
 * Error Boundary específico para errores de subida de imágenes en el dominio Supplier.
 * Maneja errores relacionados con:
 * - Fallos en la subida de archivos
 * - Problemas de formato/tamaño de imagen
 * - Errores de red durante uploads
 * - Validaciones de imágenes
 */

class ImageUploadErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Actualizar el estado para mostrar la UI de error
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const errorId = `img_upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Logging del error
    console.group('🖼️ ImageUploadErrorBoundary - Error Capturado');
    console.error('Error ID:', errorId);
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Props:', this.props);
    console.groupEnd();

    // Guardar en estado para mostrar información de debugging
    this.setState({
      error,
      errorInfo,
      errorId,
    });

    // En producción, enviar a servicio de logging
    if (process.env.NODE_ENV === 'production') {
      // Integración con Sentry u otro servicio
      // this.logToErrorService(error, errorInfo, errorId);
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: prevState.retryCount + 1
    }));

    // Llamar callback de retry si existe
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  getErrorType = (error) => {
    const message = error?.message?.toLowerCase() || '';
    
    if (message.includes('file') || message.includes('upload')) {
      return 'upload';
    }
    if (message.includes('size') || message.includes('large')) {
      return 'size';
    }
    if (message.includes('format') || message.includes('type')) {
      return 'format';
    }
    if (message.includes('network') || message.includes('connection')) {
      return 'network';
    }
    
    return 'unknown';
  };

  getErrorMessage = (errorType) => {
    const messages = {
      upload: {
        title: 'Error en la Subida de Imagen',
        description: 'No se pudo subir la imagen al servidor. Verifica tu conexión e intenta nuevamente.'
      },
      size: {
        title: 'Imagen Demasiado Grande',
        description: 'La imagen seleccionada excede el tamaño máximo permitido. Intenta con una imagen más pequeña.'
      },
      format: {
        title: 'Formato de Imagen No Válido',
        description: 'El formato de la imagen no es compatible. Usa archivos JPG, PNG o WebP.'
      },
      network: {
        title: 'Error de Conexión',
        description: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
      },
      unknown: {
        title: 'Error Inesperado',
        description: 'Ocurrió un error inesperado durante la gestión de imágenes.'
      }
    };

    return messages[errorType] || messages.unknown;
  };

  render() {
    if (this.state.hasError) {
      const errorType = this.getErrorType(this.state.error);
      const errorMessage = this.getErrorMessage(errorType);

      return (
        <Box sx={{ p: 2 }}>
          <Card 
            elevation={3}
            sx={{ 
              border: '2px solid #f44336',
              backgroundColor: '#ffeaa7'
            }}
          >
            <CardContent>
              {/* Header del Error */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ErrorIcon sx={{ color: '#f44336', mr: 1, fontSize: 28 }} />
                <Typography variant="h6" color="error" fontWeight="bold">
                  {errorMessage.title}
                </Typography>
                <Chip 
                  label={`Tipo: ${errorType}`}
                  size="small"
                  color="error"
                  sx={{ ml: 'auto' }}
                />
              </Box>

              {/* Descripción del Error */}
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  {errorMessage.description}
                </Typography>
              </Alert>

              {/* Sugerencias específicas por tipo de error */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  💡 Sugerencias:
                </Typography>
                {errorType === 'size' && (
                  <Typography variant="body2" color="text.secondary">
                    • Reduce el tamaño de la imagen antes de subirla<br/>
                    • Usa herramientas de compresión online<br/>
                    • Límite recomendado: 5MB máximo
                  </Typography>
                )}
                {errorType === 'format' && (
                  <Typography variant="body2" color="text.secondary">
                    • Formatos aceptados: JPG, PNG, WebP<br/>
                    • Convierte tu imagen a un formato compatible<br/>
                    • Evita formatos como BMP, TIFF o GIF
                  </Typography>
                )}
                {errorType === 'network' && (
                  <Typography variant="body2" color="text.secondary">
                    • Verifica tu conexión a internet<br/>
                    • Intenta nuevamente en unos momentos<br/>
                    • Si persiste, contacta al soporte técnico
                  </Typography>
                )}
                {(errorType === 'upload' || errorType === 'unknown') && (
                  <Typography variant="body2" color="text.secondary">
                    • Intenta subir la imagen nuevamente<br/>
                    • Verifica que el archivo no esté corrupto<br/>
                    • Si el problema persiste, contacta al soporte
                  </Typography>
                )}
              </Box>

              {/* Botones de Acción */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleRetry}
                  sx={{ minWidth: 120 }}
                >
                  Intentar de Nuevo
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  onClick={() => {
                    // Resetear el input de archivo si existe
                    const fileInputs = document.querySelectorAll('input[type="file"]');
                    fileInputs.forEach(input => input.value = '');
                    this.handleRetry();
                  }}
                >
                  Seleccionar Otra Imagen
                </Button>
              </Box>

              {/* Información de Debug (solo en desarrollo) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">
                    🔧 Debug Info (ID: {this.state.errorId})
                  </Typography>
                  <Typography variant="caption" component="pre" sx={{ fontSize: '11px', mt: 1 }}>
                    {this.state.error.toString()}
                  </Typography>
                </Box>
              )}

              {/* Contador de reintentos */}
              {this.state.retryCount > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Intentos realizados: {this.state.retryCount}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      );
    }

    // Renderizar hijos normalmente si no hay error
    return this.props.children;
  }
}

export default ImageUploadErrorBoundary;
