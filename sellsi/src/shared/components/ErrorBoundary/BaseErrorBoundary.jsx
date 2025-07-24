/**
 * ============================================================================
 * BASE ERROR BOUNDARY - COMPONENTE FUNDAMENTAL
 * ============================================================================
 *
 * Error Boundary base reutilizable con logging automático y UI profesional.
 * Implementa las mejores prácticas para manejo de errores en React.
 */

import React from 'react'
import { Box, Typography, Button, Alert, AlertTitle } from '@mui/material'
import { ErrorOutline, Refresh, BugReport } from '@mui/icons-material'

class BaseErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    }
  }

  static getDerivedStateFromError(error) {
    // Actualizar el estado para mostrar la UI de error
    return {
      hasError: true,
      errorId: `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
  }

  componentDidCatch(error, errorInfo) {
    // Capturar detalles del error para logging
    this.setState({
      error,
      errorInfo,
    })

    // 🔧 Logging automático del error
    console.group('🚨 Error Boundary Activated')
    console.error('Error:', error)
    console.error('Error Info:', errorInfo)
    console.error('Component Stack:', errorInfo.componentStack)
    console.error('Error ID:', this.state.errorId)
    console.groupEnd()

    // 🔗 Aquí podrías integrar con servicios de logging como Sentry
    this.reportErrorToService(error, errorInfo)
  }

  reportErrorToService = (error, errorInfo) => {
    // 📊 Integración futura con Sentry/DataDog
    try {
      // Simular reporte a servicio de logging
      const errorReport = {
        errorId: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        context: this.props.context || 'Unknown',
        userId: localStorage.getItem('user_id'),
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      }

      console.log('📤 Error Report Generated:', errorReport)
      
      // TODO: Enviar a servicio real
      // Sentry.captureException(error, { extra: errorReport })
    } catch (loggingError) {
      console.error('❌ Failed to report error:', loggingError)
    }
  }

  handleRetry = () => {
    // Reset del error boundary
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    })

    // Callback personalizado si se proporciona
    if (this.props.onRetry) {
      this.props.onRetry()
    }
  }

  handleReportIssue = () => {
    // Copiar información del error al clipboard
    const errorDetails = `
Error ID: ${this.state.errorId}
Error: ${this.state.error?.message}
Context: ${this.props.context}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
    `.trim()

    navigator.clipboard.writeText(errorDetails).then(() => {
      alert('Información del error copiada al portapapeles')
    })
  }

  render() {
    if (this.state.hasError) {
      // Renderizar UI de error personalizada
      const { fallback: CustomFallback, context = 'Aplicación' } = this.props

      // Si hay un componente fallback personalizado, usarlo
      if (CustomFallback) {
        return (
          <CustomFallback
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            onRetry={this.handleRetry}
            errorId={this.state.errorId}
          />
        )
      }

      // UI por defecto
      return (
        <Box
          sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            minHeight: '200px',
            justifyContent: 'center',
          }}
        >
          <Alert severity="error" sx={{ mb: 3, width: '100%', maxWidth: 600 }}>
            <AlertTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ErrorOutline />
              Oops! Algo salió mal en {context}
            </AlertTitle>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Ocurrió un error inesperado. Puedes intentar nuevamente o reportar el problema.
            </Typography>
            {this.state.errorId && (
              <Typography
                variant="caption"
                sx={{ mt: 1, display: 'block', opacity: 0.7, fontFamily: 'monospace' }}
              >
                ID del Error: {this.state.errorId}
              </Typography>
            )}
          </Alert>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={this.handleRetry}
              color="primary"
            >
              Intentar nuevamente
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<BugReport />}
              onClick={this.handleReportIssue}
              color="secondary"
            >
              Reportar problema
            </Button>
          </Box>

          {/* Información de debugging en desarrollo */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <Box
              sx={{
                mt: 3,
                p: 2,
                bgcolor: 'grey.100',
                borderRadius: 1,
                width: '100%',
                maxWidth: 600,
                textAlign: 'left',
              }}
            >
              <Typography variant="subtitle2" color="error" gutterBottom>
                Detalles del Error (Solo en desarrollo):
              </Typography>
              <Typography
                variant="caption"
                component="pre"
                sx={{ 
                  fontSize: '0.75rem', 
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack}
              </Typography>
            </Box>
          )}
        </Box>
      )
    }

    // Si no hay error, renderizar los children normalmente
    return this.props.children
  }
}

export default BaseErrorBoundary
