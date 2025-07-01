/**
 * 🔐 Componente de Login Administrativo
 * 
 * Login especializado para administradores del panel de control.
 * Reutiliza la estructura del login existente pero valida contra
 * la tabla control_panel_users y soporta autenticación 2FA.
 * 
 * @author Panel Administrativo Sellsi
 * @date 30 de Junio de 2025
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  Alert,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  AdminPanelSettings,
  Security,
  VpnKey
} from '@mui/icons-material';

import { PrimaryButton } from '../../ui';
import { useAdminLogin } from '../hooks';
import { loginAdmin, verify2FA } from '../../../services/adminPanelService';

// ✅ CONSTANTS
const CONSTANTS = {
  FORM_WIDTH: 400,
  STEPS: ['Credenciales', 'Verificación 2FA', 'Acceso Concedido']
};

// ✅ COMMON STYLES
const commonStyles = {
  adminContainer: {
    background: 'linear-gradient(135deg, #1a237e 0%, #3949ab 100%)',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2
  },
  adminPanel: {
    width: CONSTANTS.FORM_WIDTH,
    padding: 4,
    borderRadius: 3,
    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
    background: '#fff',
    position: 'relative'
  },
  adminHeader: {
    textAlign: 'center',
    mb: 3,
    color: '#1a237e'
  },
  securityBadge: {
    position: 'absolute',
    top: -15,
    right: 20,
    backgroundColor: '#f44336',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 'bold'
  },
  inputField: {
    mb: 2,
    '& .MuiOutlinedInput-root': {
      '&:hover fieldset': {
        borderColor: '#3949ab',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#1a237e',
      },
    }
  },
  adminButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#1a237e',
    '&:hover': {
      backgroundColor: '#3949ab'
    },
    mb: 2
  },
  stepperContainer: {
    mb: 3
  }
};

// ✅ ADMIN LOGIN COMPONENT
const AdminLogin = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Estados del formulario
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    usuario: '',
    password: '',
    code2FA: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tempUserId, setTempUserId] = useState(null);

  // Hook personalizado para manejo del estado
  const {
    handleInputChange,
    validateForm,
    resetForm
  } = useAdminLogin();

  // ========================================
  // 🔧 HANDLERS
  // ========================================

  const handleUsuarioChange = (e) => {
    setFormData(prev => ({ ...prev, usuario: e.target.value }));
    setError('');
  };

  const handlePasswordChange = (e) => {
    setFormData(prev => ({ ...prev, password: e.target.value }));
    setError('');
  };

  const handleCode2FAChange = (e) => {
    setFormData(prev => ({ ...prev, code2FA: e.target.value }));
    setError('');
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmitCredentials = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await loginAdmin(formData.usuario, formData.password);
      
      if (result.success) {
        // Si el usuario tiene 2FA habilitado, ir al siguiente paso
        if (result.user?.twofa_secret) {
          setTempUserId(result.user.id);
          setCurrentStep(1);
        } else {
          // Si no tiene 2FA, proceder directamente
          handleSuccessfulLogin(result.user);
        }
      } else {
        setError(result.error || 'Credenciales incorrectas');
      }
    } catch (error) {
      console.error('Error en login:', error);
      setError('Error interno del servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit2FA = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await verify2FA(tempUserId, formData.code2FA);
      
      if (result.success) {
        setCurrentStep(2);
        setTimeout(() => {
          handleSuccessfulLogin({ id: tempUserId });
        }, 1500);
      } else {
        setError(result.error || 'Código 2FA inválido');
      }
    } catch (error) {
      console.error('Error en 2FA:', error);
      setError('Error interno del servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessfulLogin = (user) => {
    // Guardar sesión administrativa
    localStorage.setItem('adminUser', JSON.stringify(user));
    localStorage.setItem('adminSessionStart', new Date().toISOString());
    
    // Navegar al panel principal
    navigate('/admin-panel/dashboard');
    
    if (onClose) onClose();
  };

  const handleClose = () => {
    resetForm();
    setCurrentStep(0);
    setError('');
    setTempUserId(null);
    if (onClose) onClose();
  };

  // ========================================
  // 🎨 RENDER FUNCTIONS
  // ========================================

  const renderCredentialsStep = () => (
    <Box component="form" onSubmit={handleSubmitCredentials}>
      <Typography variant="h5" sx={commonStyles.adminHeader}>
        <AdminPanelSettings sx={{ mr: 1, verticalAlign: 'middle' }} />
        Panel de Control
      </Typography>
      
      <Typography variant="body2" sx={{ textAlign: 'center', mb: 3, color: '#666' }}>
        Acceso restringido solo para administradores autorizados
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        label="Usuario Administrativo"
        variant="outlined"
        value={formData.usuario}
        onChange={handleUsuarioChange}
        sx={commonStyles.inputField}
        required
        autoFocus
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <AdminPanelSettings color="action" />
            </InputAdornment>
          ),
        }}
      />

      <TextField
        fullWidth
        label="Contraseña"
        type={showPassword ? 'text' : 'password'}
        variant="outlined"
        value={formData.password}
        onChange={handlePasswordChange}
        sx={commonStyles.inputField}
        required
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <VpnKey color="action" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                onClick={toggleShowPassword}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <PrimaryButton
        type="submit"
        loading={loading}
        sx={commonStyles.adminButton}
        disabled={!formData.usuario || !formData.password}
      >
        {loading ? 'Verificando...' : 'Iniciar Sesión'}
      </PrimaryButton>
    </Box>
  );

  const render2FAStep = () => (
    <Box component="form" onSubmit={handleSubmit2FA}>
      <Typography variant="h6" sx={{ ...commonStyles.adminHeader, mb: 2 }}>
        <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
        Verificación de Seguridad
      </Typography>
      
      <Typography variant="body2" sx={{ textAlign: 'center', mb: 3, color: '#666' }}>
        Ingresa el código de 6 dígitos de tu aplicación de autenticación
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        label="Código 2FA"
        variant="outlined"
        value={formData.code2FA}
        onChange={handleCode2FAChange}
        sx={commonStyles.inputField}
        required
        autoFocus
        inputProps={{
          maxLength: 6,
          pattern: '[0-9]{6}',
          style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }
        }}
        placeholder="000000"
      />

      <PrimaryButton
        type="submit"
        loading={loading}
        sx={commonStyles.adminButton}
        disabled={formData.code2FA.length !== 6}
      >
        {loading ? 'Verificando...' : 'Verificar Código'}
      </PrimaryButton>
    </Box>
  );

  const renderSuccessStep = () => (
    <Box sx={{ textAlign: 'center' }}>
      <Security sx={{ fontSize: 60, color: '#4caf50', mb: 2 }} />
      <Typography variant="h6" sx={{ color: '#4caf50', mb: 2 }}>
        Acceso Concedido
      </Typography>
      <Typography variant="body2" color="textSecondary">
        Redirigiendo al panel de control...
      </Typography>
    </Box>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderCredentialsStep();
      case 1:
        return render2FAStep();
      case 2:
        return renderSuccessStep();
      default:
        return renderCredentialsStep();
    }
  };

  // ========================================
  // 🎨 MAIN RENDER
  // ========================================

  // Si es una ruta directa (no modal), renderizar página completa
  if (location.pathname === '/admin-login') {
    return (
      <Box sx={commonStyles.adminContainer}>
        <Paper sx={commonStyles.adminPanel}>
          <Box sx={commonStyles.securityBadge}>
            ACCESO RESTRINGIDO
          </Box>
          
          <Box sx={commonStyles.stepperContainer}>
            <Stepper activeStep={currentStep} alternativeLabel>
              {CONSTANTS.STEPS.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          {renderCurrentStep()}
        </Paper>
      </Box>
    );
  }

  // Renderizar como modal
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ ...commonStyles.adminPanel, position: 'relative' }}>
          <Box sx={commonStyles.securityBadge}>
            ACCESO RESTRINGIDO
          </Box>
          
          <Box sx={commonStyles.stepperContainer}>
            <Stepper activeStep={currentStep} alternativeLabel>
              {CONSTANTS.STEPS.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          {renderCurrentStep()}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default AdminLogin;
