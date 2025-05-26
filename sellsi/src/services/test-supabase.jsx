// src/services/test-supabase.jsx
import React, { useState, useEffect } from 'react'
import { Box, Typography, Button, Paper, Alert } from '@mui/material'
import { testConnection, testAuth, supabase } from './supabase'

const TestSupabase = () => {
  const [connectionStatus, setConnectionStatus] = useState('testing')
  const [authStatus, setAuthStatus] = useState('testing')
  const [results, setResults] = useState({})

  useEffect(() => {
    runTests()
  }, [])

  const runTests = async () => {
    console.log('🚀 Running Supabase tests...')

    // Test 1: Connection
    setConnectionStatus('testing')
    const connResult = await testConnection()
    setConnectionStatus(connResult.success ? 'success' : 'error')

    // Test 2: Auth
    setAuthStatus('testing')
    const authResult = await testAuth()
    setAuthStatus(authResult.success ? 'success' : 'warning')

    // Store results
    setResults({
      connection: connResult,
      auth: authResult,
      url: import.meta.env.VITE_SUPABASE_URL,
      hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'success'
      case 'error':
        return 'error'
      case 'warning':
        return 'warning'
      default:
        return 'info'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'success':
        return '✅ Conectado'
      case 'error':
        return '❌ Error'
      case 'warning':
        return '⚠️ Advertencia'
      default:
        return '🔄 Probando...'
    }
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 2, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
        🧪 Supabase Connection Test
      </Typography>

      {/* URL y Key Status */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>URL:</strong> {results.url || 'No configurada'}
        </Typography>
        <Typography variant="body2">
          <strong>API Key:</strong>{' '}
          {results.hasKey ? '✅ Configurada' : '❌ Faltante'}
        </Typography>
      </Box>

      {/* Connection Test */}
      <Alert severity={getStatusColor(connectionStatus)} sx={{ mb: 1 }}>
        <strong>Database Connection:</strong> {getStatusText(connectionStatus)}
        {results.connection?.error && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Error: {results.connection.error}
          </Typography>
        )}
      </Alert>

      {/* Auth Test */}
      <Alert severity={getStatusColor(authStatus)} sx={{ mb: 2 }}>
        <strong>Authentication:</strong> {getStatusText(authStatus)}
        {results.auth?.user && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Usuario: {results.auth.user.email || 'Sin email'}
          </Typography>
        )}
      </Alert>

      {/* Retry Button */}
      <Button variant="outlined" onClick={runTests} sx={{ width: '100%' }}>
        🔄 Volver a probar
      </Button>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
            <strong>Debug Info:</strong>
            <br />
            Environment: {import.meta.env.MODE}
            <br />
            Supabase URL: {import.meta.env.VITE_SUPABASE_URL?.substring(0, 30)}
            ...
            <br />
            Has Key: {!!import.meta.env.VITE_SUPABASE_ANON_KEY}
          </Typography>
        </Box>
      )}
    </Paper>
  )
}

export default TestSupabase
