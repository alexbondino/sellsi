/**
 * 🚀 Componente de Primera Configuración Administrativa
 * 
 * Asistente para crear la primera cuenta administrativa del sistema.
 * Solo se muestra en modo desarrollo y cuando no hay admins existentes.
 * 
 * @author Panel Administrativo Sellsi
 * @date 16 de Julio de 2025
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  TextField,
  Grid,
  Step,
  Stepper,
  StepLabel,
  StepContent,
  InputAdornment,
  IconButton,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button
} from '@mui/material';
import {
  AdminPanelSettings,
  Person,
  Security,
  CheckCircle,
  Warning,
  Visibility,
  VisibilityOff,
  Build,
  Shield,
  Lock,
  Email,
  AccountCircle
} from '@mui/icons-material';

import { PrimaryButton } from '../../../shared/components/forms';
import { createAdminAccount } from '../../../domains/admin';
import { 
  FIRST_ADMIN_CONFIG, 
  isDevelopment, 
  setProductionMode 
} from '../config/devConfig';

const FirstAdminSetup = ({ onComplete }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    usuario: FIRST_ADMIN_CONFIG.DEFAULT_USERNAME,
    email: FIRST_ADMIN_CONFIG.DEFAULT_EMAIL,
    password: FIRST_ADMIN_CONFIG.DEFAULT_PASSWORD,
    confirmPassword: FIRST_ADMIN_CONFIG.DEFAULT_PASSWORD,
    full_name: FIRST_ADMIN_CONFIG.DEFAULT_FULL_NAME
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const steps = [
    {
      label: 'Configuración Inicial',
      description: 'Información sobre el primer administrador'
    },
    {
      label: 'Datos del Administrador',
      description: 'Crear cuenta administrativa principal'
    },
    {
      label: 'Configuración de Seguridad',
      description: 'Configurar modo producción'
    }
  ];

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
    setError('');
  };

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleCreateFirstAdmin = async () => {
    setLoading(true);
    setError('');

    try {
      if (formData.password !== formData.confirmPassword) {
        setError('Las contraseñas no coinciden');
        return;
      }

      const result = await createAdminAccount({
        ...formData,
        role: 'admin',
        enable_2fa: false,
        notes: 'Primera cuenta administrativa creada en modo desarrollo'
      });

      if (result.success) {
        handleNext();
      } else {
        setError(result.error || 'Error al crear la cuenta');
      }
    } catch (error) {
      console.error('Error creating first admin:', error);
      setError('Error interno del servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleFinishSetup = () => {
    // En un entorno real, aquí habilitarías las protecciones
    console.log('🔒 Configuración completada - Considera habilitar protecciones');
    onComplete && onComplete();
  };

  const renderStep0 = () => (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🚀 Primera Configuración del Sistema
        </Typography>
        <Typography variant="body2">
          Estás configurando el panel administrativo por primera vez. 
          Necesitas crear la primera cuenta administrativa para gestionar el sistema.
        </Typography>
      </Alert>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <Build sx={{ mr: 1, verticalAlign: 'middle' }} />
            Modo Desarrollo Activo
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" />
              </ListItemIcon>
              <ListItemText 
                primary="Verificaciones de seguridad simplificadas"
                secondary="Puedes crear la primera cuenta sin restricciones"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Warning color="warning" />
              </ListItemIcon>
              <ListItemText 
                primary="Recuerda cambiar a modo producción"
                secondary="Una vez creada la cuenta, habilita las protecciones"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <PrimaryButton onClick={handleNext}>
          Comenzar Configuración
        </PrimaryButton>
      </Box>
    </Box>
  );

  const renderStep1 = () => (
    <Box>
      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>⚠️ IMPORTANTE:</strong> Cambia estas credenciales por defecto antes de usar en producción.
        </Typography>
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Usuario"
            value={formData.usuario}
            onChange={handleInputChange('usuario')}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AccountCircle />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleInputChange('email')}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Nombre Completo"
            value={formData.full_name}
            onChange={handleInputChange('full_name')}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Contraseña"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleInputChange('password')}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Confirmar Contraseña"
            type={showPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleInputChange('confirmPassword')}
            required
            error={formData.confirmPassword && formData.password !== formData.confirmPassword}
            helperText={
              formData.confirmPassword && formData.password !== formData.confirmPassword
                ? 'Las contraseñas no coinciden'
                : ''
            }
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button onClick={handleBack} variant="outlined">
          Atrás
        </Button>
        <PrimaryButton 
          onClick={handleCreateFirstAdmin}
          loading={loading}
          disabled={!formData.usuario || !formData.email || !formData.password || !formData.confirmPassword}
        >
          Crear Cuenta Administrativa
        </PrimaryButton>
      </Box>
    </Box>
  );

  const renderStep2 = () => (
    <Box>
      <Alert severity="success" sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          ✅ Cuenta Administrativa Creada
        </Typography>
        <Typography variant="body2">
          Tu primera cuenta administrativa ha sido creada exitosamente.
        </Typography>
      </Alert>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <Shield sx={{ mr: 1, verticalAlign: 'middle' }} />
            Próximos Pasos de Seguridad
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Cambia las credenciales por defecto"
                secondary="Usa contraseñas seguras y únicas"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Ejecuta el script SQL en producción"
                secondary="Crea las tablas necesarias en tu base de datos"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Deshabilita el modo desarrollo"
                secondary="Cambia DEV_MODE a false en devConfig.js"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={handleBack} variant="outlined">
          Atrás
        </Button>
        <PrimaryButton onClick={handleFinishSetup}>
          Finalizar Configuración
        </PrimaryButton>
      </Box>
    </Box>
  );

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return renderStep0();
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      default:
        return null;
    }
  };

  if (!isDevelopment()) {
    return null;
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AdminPanelSettings color="primary" />
          Primera Configuración Administrativa
        </Typography>
        
        <Divider sx={{ mb: 3 }} />

        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel>
                <Typography variant="h6">{step.label}</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  {step.description}
                </Typography>
                {renderStepContent(index)}
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Paper>
    </Box>
  );
};

export default FirstAdminSetup;
