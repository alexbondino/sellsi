/**
 * 🔐 Guard de Protección para Admin Panel
 * 
 * Protege rutas administrativas verificando autenticación
 * y permisos de administrador antes de permitir acceso.
 * 
 * @author Panel Administrativo Sellsi
 * @date 16 de Julio de 2025
 */

import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography, Paper, Alert } from '@mui/material';
import { Shield, Warning, Build } from '@mui/icons-material';

import { verifyAdminSession } from '../../../services/adminPanelService';
import { isDevelopment, canCreateAdminInDev, DEV_CONFIG } from '../config/devConfig';

const AdminGuard = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      // 🚧 MODO DESARROLLO: Permitir acceso sin autenticación
      if (canCreateAdminInDev()) {
        console.log('🚧 MODO DESARROLLO: Saltando verificación de autenticación');
        setIsAuthenticated(true);
        setLoading(false);
        return;
      }

      // Verificar si hay sesión en localStorage
      const adminUser = localStorage.getItem('adminUser');
      const sessionStart = localStorage.getItem('adminSessionStart');
      
      if (!adminUser || !sessionStart) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      // Verificar si la sesión no ha expirado (24 horas)
      const sessionAge = Date.now() - new Date(sessionStart).getTime();
      const maxSessionAge = 24 * 60 * 60 * 1000; // 24 horas
      
      if (sessionAge > maxSessionAge) {
        // Sesión expirada
        localStorage.removeItem('adminUser');
        localStorage.removeItem('adminSessionStart');
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      // Verificar sesión en servidor (opcional)
      const user = JSON.parse(adminUser);
      const result = await verifyAdminSession(user.id);
      
      if (result.success) {
        setIsAuthenticated(true);
      } else {
        // Sesión inválida en servidor
        localStorage.removeItem('adminUser');
        localStorage.removeItem('adminSessionStart');
        setIsAuthenticated(false);
        setError('Sesión administrativa inválida');
      }
    } catch (error) {
      console.error('Error verificando autenticación admin:', error);
      setError('Error verificando autenticación');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={60} />
        <Typography variant="h6" color="textSecondary">
          Verificando permisos administrativos...
        </Typography>
      </Box>
    );
  }

  // Not authenticated - redirect to admin login
  if (!isAuthenticated) {
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  // Authenticated - render protected content
  return (
    <Box>
      {/* Alerta de modo desarrollo */}
      {isDevelopment() && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Build />
            <Typography variant="body2">
              <strong>MODO DESARROLLO:</strong> Autenticación administrativa simplificada
            </Typography>
          </Box>
        </Alert>
      )}

      {/* Header de seguridad */}
      <Paper sx={{ 
        mb: 2, 
        p: 2, 
        backgroundColor: canCreateAdminInDev() ? '#fff3cd' : '#f5f5f5',
        borderLeft: `4px solid ${canCreateAdminInDev() ? '#ffc107' : '#2196f3'}`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Shield color={canCreateAdminInDev() ? 'warning' : 'primary'} />
          <Typography variant="body2" color="textSecondary">
            {canCreateAdminInDev() 
              ? 'Modo desarrollo - Acceso administrativo sin restricciones'
              : 'Sesión administrativa activa - Acceso autorizado'
            }
          </Typography>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Warning sx={{ mr: 1 }} />
          {error}
        </Alert>
      )}

      {children}
    </Box>
  );
};

export default AdminGuard;
