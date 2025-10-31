import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f5f5f5',
            p: 3,
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              maxWidth: 800,
              width: '100%',
            }}
          >
            <Typography variant="h4" color="error" gutterBottom>
              🚨 Error en el Componente
            </Typography>
            
            <Typography variant="body1" paragraph>
              El componente AdminLogin encontró un error:
            </Typography>
            
            <Paper
              sx={{
                p: 2,
                bgcolor: '#ffebee',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                overflow: 'auto',
                maxHeight: 400,
              }}
            >
              <strong>Error:</strong>
              <pre>{this.state.error && this.state.error.toString()}</pre>
              
              <strong>Stack:</strong>
              <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
            </Paper>
            
            <Button
              variant="contained"
              onClick={() => window.location.reload()}
              sx={{ mt: 3 }}
            >
              Recargar Página
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
