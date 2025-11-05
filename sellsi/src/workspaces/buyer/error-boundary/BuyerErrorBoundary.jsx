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
  ShoppingCart as BuyerIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon
} from '@mui/icons-material';

/**
 * ============================================================================
 * BUYER ERROR BOUNDARY
 * ============================================================================
 * 
 * Error Boundary específico para el dominio Buyer.
 * Maneja errores generales relacionados con:
 * - Operaciones de comprador
 * - Gestión de carrito
 * - Pedidos y ofertas
 * - Navegación del marketplace
 */

class BuyerErrorBoundary extends React.Component {
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
    const errorId = `buyer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Logging del error
    console.group('🛒 BuyerErrorBoundary - Error Capturado');
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

  getErrorContext = (error) => {
    const message = error?.message?.toLowerCase() || '';
    const stack = error?.stack?.toLowerCase() || '';
    
    if (message.includes('cart') || stack.includes('cart')) {
      return 'cart';
    }
    if (message.includes('order') || stack.includes('order')) {
      return 'order';
    }
    if (message.includes('offer') || stack.includes('offer')) {
      return 'offer';
    }
    if (message.includes('auth') || message.includes('login')) {
      return 'auth';
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }
    if (message.includes('store') || message.includes('zustand')) {
      return 'store';
    }
    
    return 'general';
  };

  getContextualMessage = (context) => {
    const messages = {
      cart: {
        title: 'Error en el Carrito',
        description: 'Ocurrió un problema al gestionar tu carrito de compras. Algunos productos podrían no estar actualizados.',
        suggestions: [
          'Recarga la página para ver el carrito actualizado',
          'Verifica tu conexión a internet',
          'Si persiste, intenta agregar los productos nuevamente'
        ]
      },
      order: {
        title: 'Error en Pedidos',
        description: 'Hay un problema al cargar tus pedidos. La información podría no estar completa.',
        suggestions: [
          'Recarga la página para ver los pedidos actualizados',
          'Verifica tu conexión a internet',
          'Si persiste, contacta al soporte técnico'
        ]
      },
      offer: {
        title: 'Error en Ofertas',
        description: 'No se pudieron cargar tus ofertas correctamente. Algunos datos podrían estar desactualizados.',
        suggestions: [
          'Intenta recargar la página',
          'Verifica tu conexión a internet',
          'Contacta al proveedor si la oferta es urgente'
        ]
      },
      auth: {
        title: 'Error de Autenticación',
        description: 'Hay un problema con tu sesión de comprador. Es posible que necesites volver a iniciar sesión.',
        suggestions: [
          'Verifica que tu sesión siga activa',
          'Intenta cerrar sesión y volver a entrar',
          'Limpia la caché de tu navegador'
        ]
      },
      network: {
        title: 'Error de Conexión',
        description: 'No se pudo conectar con nuestros servidores. Verifica tu conexión a internet.',
        suggestions: [
          'Verifica tu conexión a internet',
          'Intenta recargar la página',
          'Si el problema persiste, podría ser temporal'
        ]
      },
      store: {
        title: 'Error en el Estado de la Aplicación',
        description: 'Ocurrió un problema con el estado interno de la aplicación.',
        suggestions: [
          'Recarga la página para resetear el estado',
          'Cierra y vuelve a abrir la pestaña',
          'Si persiste, contacta al soporte'
        ]
      },
      general: {
        title: 'Error Inesperado del Comprador',
        description: 'Ocurrió un error inesperado en el área de compradores.',
        suggestions: [
          'Intenta la acción nuevamente',
          'Recarga la página si el problema persiste',
          'Contacta al soporte si continúa fallando'
        ]
      }
    };

    return messages[context] || messages.general;
  };

  render() {
    if (this.state.hasError) {
      const context = this.getErrorContext(this.state.error);
      const contextMessage = this.getContextualMessage(context);

      return (
        <Box sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
          <Card 
            elevation={4}
            sx={{ 
              border: '2px solid #f44336',
              backgroundColor: '#fff3e0'
            }}
          >
            <CardContent>
              {/* Header del Error */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <ErrorIcon sx={{ color: '#f44336', mr: 2, fontSize: 32 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" color="error" fontWeight="bold">
                    {contextMessage.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Panel de Comprador
                  </Typography>
                </Box>
                <Chip 
                  icon={<BuyerIcon />}
                  label={context.toUpperCase()}
                  size="small"
                  color="error"
                  variant="outlined"
                />
              </Box>

              {/* Descripción del Error */}
              <Alert severity="error" sx={{ mb: 3 }}>
                <Typography variant="body1">
                  {contextMessage.description}
                </Typography>
              </Alert>

              {/* Sugerencias */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  💡 Qué puedes hacer:
                </Typography>
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  {contextMessage.suggestions.map((suggestion, index) => (
                    <Typography
                      component="li"
                      key={index}
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      {suggestion}
                    </Typography>
                  ))}
                </Box>
              </Box>

              {/* Botones de Acción */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleRetry}
                  sx={{ minWidth: 140 }}
                >
                  Intentar de Nuevo
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<HomeIcon />}
                  onClick={() => window.location.href = '/buyer/marketplace'}
                >
                  Ir al Marketplace
                </Button>
              </Box>

              {/* Información adicional para el carrito */}
              {context === 'cart' && (
                <Box sx={{ mt: 2, p: 2, backgroundColor: '#e3f2fd', borderRadius: 1 }}>
                  <Typography variant="body2" color="primary">
                    <strong>Tip:</strong> Tu carrito se guarda automáticamente. 
                    Si recargas la página, tus productos deberían seguir ahí.
                  </Typography>
                </Box>
              )}

              {/* Información de Debug (solo en desarrollo) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">
                    🔧 Debug Info (ID: {this.state.errorId})
                  </Typography>
                  <Typography variant="caption" component="pre" sx={{ fontSize: '11px', mt: 1, display: 'block' }}>
                    {this.state.error.toString()}
                  </Typography>
                  {this.state.errorInfo?.componentStack && (
                    <Typography variant="caption" component="pre" sx={{ fontSize: '10px', mt: 1, display: 'block' }}>
                      Component Stack: {this.state.errorInfo.componentStack}
                    </Typography>
                  )}
                </Box>
              )}

              {/* Contador de reintentos */}
              {this.state.retryCount > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
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

export default BuyerErrorBoundary;
