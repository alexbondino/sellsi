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

import { PrimaryButton } from '../../../shared/components/forms';
import { useAdminLogin } from '../hooks';
import { loginAdmin, verify2FA, mark2FAAsConfigured, generate2FASecret, checkTrustedDevice } from '../../../domains/admin';
import { getOrCreateDeviceFingerprint } from '../utils/deviceFingerprint';
import Setup2FA from './Setup2FA';
import QRCode from 'react-qr-code';

// ✅ CONSTANTS
const CONSTANTS = {
  FORM_WIDTH: 400,
  STEPS: ['Credenciales', 'Verificación 2FA', 'Acceso Concedido', 'Configuración 2FA']
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
  const [twofaStatus, setTwofaStatus] = useState(null);
  const [tempAdminData, setTempAdminData] = useState(null); // ✅ NUEVO ESTADO
  
  // Estados para configuración 2FA embebida
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [setupStep, setSetupStep] = useState(0);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [deviceFingerprint, setDeviceFingerprint] = useState(null);
  const [trustToken, setTrustToken] = useState(() => localStorage.getItem('admin_trust_token'));

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
        const { user, twofaStatus } = result.data || {};
        if (!user || !user.id) {
          setError('Error en la respuesta del servidor');
          return;
        }
        setTempUserId(user.id);
        setTwofaStatus(twofaStatus);
        setTempAdminData(user); // ✅ GUARDAR DATOS ADMIN
        // Fingerprint y trusted device
        let fp = deviceFingerprint;
        if (!fp) {
          fp = await getOrCreateDeviceFingerprint();
          setDeviceFingerprint(fp);
        }
        if (twofaStatus.configured && fp && trustToken) {
          try {
            const trustRes = await checkTrustedDevice(user.id, fp, trustToken);
            if (trustRes.trusted) {
              handleSuccessfulLogin(user);
              setCurrentStep(2);
              return;
            }
          } catch (_) {/* ignorar */}
        }
        if (twofaStatus.required && !twofaStatus.configured) {
          setCurrentStep(3);
        } else if (twofaStatus.configured && twofaStatus.hasSecret) {
          setCurrentStep(1);
        } else {
          handleSuccessfulLogin(user);
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
      const result = await verify2FA(tempUserId, formData.code2FA, { remember: rememberDevice, deviceFingerprint });
      if (result.success) {
        if (result.data?.trustToken) {
          localStorage.setItem('admin_trust_token', result.data.trustToken);
          setTrustToken(result.data.trustToken);
        }
        setCurrentStep(2);
        setTimeout(() => {
          handleSuccessfulLogin(tempAdminData || { id: tempUserId });
        }, 800);
      } else setError(result.error || 'Código 2FA inválido');
    } catch (error) {
      console.error('Error en 2FA:', error);
      setError('Error interno del servidor');
    } finally {
      setLoading(false);
    }
  };

  // ✅ NUEVO: Manejar configuración 2FA obligatoria
  const handleForced2FASetup = async (secret, code) => {
    setLoading(true);
    setError('');

    try {
      // Verificar que el código funciona con el secreto generado
      const verifyResult = await verify2FA(tempUserId, code);
      
      if (verifyResult.success) {
        // Marcar 2FA como configurado
        const markResult = await mark2FAAsConfigured(tempUserId);
        
        if (markResult.success) {
          setCurrentStep(2); // Mostrar éxito
          setTimeout(() => {
            handleSuccessfulLogin({ id: tempUserId });
          }, 1500);
        } else {
          setError('Error al confirmar configuración 2FA');
        }
      } else {
        setError('Código 2FA incorrecto. Verifica tu aplicación.');
      }
    } catch (error) {
      console.error('Error en configuración 2FA:', error);
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

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <input
          id="rememberDevice"
          type="checkbox"
          checked={rememberDevice}
          onChange={(e) => setRememberDevice(e.target.checked)}
          style={{ marginRight: 8 }}
        />
        <label htmlFor="rememberDevice" style={{ fontSize: '0.8rem', color: '#555' }}>
          Recordar este dispositivo por 30 días
        </label>
      </Box>

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

  // ✅ NUEVO: Renderizar paso de configuración 2FA obligatoria
  const renderSetup2FAStep = () => {
    const handleGenerateSecret = async () => {
      setSetupLoading(true);
      setSetupError('');
      
      try {
        const result = await generate2FASecret(tempUserId, tempAdminData?.email || 'admin@sellsi.com');
        
        if (result.success) {
          const { secret, qrCode } = result;
          if (!secret || !qrCode) {
            setSetupError('Respuesta inválida del servidor');
            return;
          }
          setSecret(secret);
          setQrCode(qrCode);
          setSetupStep(1);
        } else {
          setSetupError(result.error || 'Error generando código QR');
        }
      } catch (error) {
        console.error('Error generando secret:', error);
        setSetupError('Error interno del servidor');
      } finally {
        setSetupLoading(false);
      }
    };

    const handleVerifySetup = async () => {
      setSetupLoading(true);
      setSetupError('');

      try {
        const verifyResult = await verify2FA(tempUserId, verificationCode);
        
        if (verifyResult.success) {
          const markResult = await mark2FAAsConfigured(tempUserId);
          
          if (markResult.success) {
            setCurrentStep(2); // Ir a success
            setTimeout(() => {
              handleSuccessfulLogin(tempAdminData);
            }, 1500);
          } else {
            setSetupError('Error al confirmar configuración 2FA');
          }
        } else {
          setSetupError('Código 2FA incorrecto. Verifica tu aplicación.');
        }
      } catch (error) {
        console.error('Error en configuración 2FA:', error);
        setSetupError('Error interno del servidor');
      } finally {
        setSetupLoading(false);
      }
    };

    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
          🔐 Configuración 2FA Obligatoria
        </Typography>
        
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Primer acceso detectado.</strong><br/>
            Por seguridad, debes configurar la autenticación de dos factores antes de continuar.
          </Typography>
        </Alert>

        {setupStep === 0 && (
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              📱 Necesitarás una aplicación de autenticación como:
            </Typography>
            <ul>
              <li>Google Authenticator</li>
              <li>Microsoft Authenticator</li>
              <li>Authy</li>
            </ul>
            
            <PrimaryButton
              onClick={handleGenerateSecret}
              loading={setupLoading}
              fullWidth
              sx={{ mt: 2 }}
            >
              Generar Código QR
            </PrimaryButton>
          </Box>
        )}

        {setupStep === 1 && (
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              📷 Escanea este código QR con tu aplicación:
            </Typography>
            
            {qrCode && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1 }}>
                  <QRCode value={qrCode} size={200} />
                </Box>
              </Box>
            )}

            <TextField
              fullWidth
              label="Código de verificación (6 dígitos)"
              value={verificationCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setVerificationCode(value);
                setSetupError('');
              }}
              placeholder="000000"
              inputProps={{ maxLength: 6 }}
              sx={{ mb: 2 }}
            />

            <PrimaryButton
              onClick={handleVerifySetup}
              loading={setupLoading}
              disabled={verificationCode.length !== 6}
              fullWidth
            >
              Verificar y Completar Configuración
            </PrimaryButton>
          </Box>
        )}
        
        {setupError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {setupError}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Box>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderCredentialsStep();
      case 1:
        return render2FAStep();
      case 2:
        return renderSuccessStep();
      case 3:
        return renderSetup2FAStep();
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
