/**
 * 🔐 Componente de Configuración 2FA
 * 
 * Permite a los administradores configurar la autenticación de dos factores
 * usando Google Authenticator o aplicaciones compatibles con TOTP.
 * 
 * @author Panel Administrativo Sellsi
 * @date 17 de Julio de 2025
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Security,
  PhoneAndroid,
  QrCode,
  VpnKey,
  CheckCircle,
  ContentCopy,
  Warning,
  Download
} from '@mui/icons-material';
import QRCode from 'react-qr-code';

import { PrimaryButton } from '../../ui';
import { generate2FASecret, verify2FA, disable2FA } from '../../../domains/admin';

// ✅ CONSTANTS
const STEPS = [
  'Instalar Aplicación',
  'Escanear QR Code',
  'Verificar Código',
  'Finalizar Configuración'
];

const AUTHENTICATOR_APPS = [
  { name: 'Google Authenticator', icon: '🔐', platform: 'iOS/Android' },
  { name: 'Microsoft Authenticator', icon: '🔑', platform: 'iOS/Android' },
  { name: 'Authy', icon: '🛡️', platform: 'iOS/Android/Desktop' },
  { name: 'LastPass Authenticator', icon: '🔒', platform: 'iOS/Android' }
];

// ✅ COMMON STYLES
const commonStyles = {
  stepperContainer: {
    maxWidth: 600,
    margin: '0 auto'
  },
  qrContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 3,
    backgroundColor: '#f5f5f5',
    borderRadius: 2,
    margin: 2
  },
  secretContainer: {
    backgroundColor: '#e3f2fd',
    padding: 2,
    borderRadius: 1,
    marginTop: 2,
    fontFamily: 'monospace',
    fontSize: '0.9rem',
    wordBreak: 'break-all'
  },
  verificationField: {
    '& input': {
      textAlign: 'center',
      fontSize: '1.2rem',
      letterSpacing: '0.3rem'
    }
  }
};

// ✅ SETUP 2FA COMPONENT
const Setup2FA = ({ open, onClose, adminData, onSuccess }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [secretCopied, setSecretCopied] = useState(false);

  // ========================================
  // 🔧 HANDLERS
  // ========================================

  const handleGenerateSecret = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await generate2FASecret(adminData.id, adminData.email);
      
      if (result.success) {
        setSecret(result.secret);
        setQrCode(result.qrCode);
        setActiveStep(1);
      } else {
        setError(result.error || 'Error generando código 2FA');
      }
    } catch (error) {
      console.error('Error generando secret:', error);
      setError('Error interno del servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setSecretCopied(true);
    setTimeout(() => setSecretCopied(false), 2000);
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await verify2FA(adminData.id, verificationCode);
      
      if (result.success) {
        setActiveStep(3);
        setTimeout(() => {
          onSuccess && onSuccess();
          onClose();
        }, 2000);
      } else {
        setError(result.error || 'Código 2FA inválido');
      }
    } catch (error) {
      console.error('Error verificando código:', error);
      setError('Error interno del servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setQrCode('');
    setSecret('');
    setVerificationCode('');
    setError('');
    setSecretCopied(false);
    onClose();
  };

  // ========================================
  // 🎨 RENDER FUNCTIONS
  // ========================================

  const renderStep0 = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        <PhoneAndroid sx={{ mr: 1, verticalAlign: 'middle' }} />
        Instalar Aplicación de Autenticación
      </Typography>
      
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Necesitarás una aplicación compatible con TOTP en tu dispositivo móvil:
      </Typography>

      <List>
        {AUTHENTICATOR_APPS.map((app, index) => (
          <ListItem key={index}>
            <ListItemIcon>
              <Box sx={{ fontSize: '1.5rem' }}>{app.icon}</Box>
            </ListItemIcon>
            <ListItemText
              primary={app.name}
              secondary={app.platform}
            />
          </ListItem>
        ))}
      </List>

      <Alert severity="info" sx={{ mt: 2 }}>
        <strong>Recomendación:</strong> Google Authenticator es la opción más compatible y segura.
      </Alert>
    </Box>
  );

  const renderStep1 = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        <QrCode sx={{ mr: 1, verticalAlign: 'middle' }} />
        Escanear Código QR
      </Typography>
      
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Escanea este código QR con tu aplicación de autenticación:
      </Typography>

      <Paper sx={commonStyles.qrContainer}>
        {qrCode && (
          <QRCode
            value={qrCode}
            size={200}
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
          />
        )}
      </Paper>

      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
        <strong>¿No puedes escanear? Ingresa manualmente:</strong>
      </Typography>

      <Paper sx={commonStyles.secretContainer}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ flex: 1 }}>
            {secret}
          </Typography>
          <Tooltip title={secretCopied ? 'Copiado!' : 'Copiar secret'}>
            <IconButton onClick={handleCopySecret} size="small">
              <ContentCopy fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      <Alert severity="warning" sx={{ mt: 2 }}>
        <strong>Importante:</strong> Guarda este código en un lugar seguro. Lo necesitarás si cambias de dispositivo.
      </Alert>
    </Box>
  );

  const renderStep2 = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        <VpnKey sx={{ mr: 1, verticalAlign: 'middle' }} />
        Verificar Código
      </Typography>
      
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Ingresa el código de 6 dígitos que aparece en tu aplicación:
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        label="Código de verificación"
        value={verificationCode}
        onChange={(e) => {
          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
          setVerificationCode(value);
          setError('');
        }}
        placeholder="000000"
        inputProps={{ maxLength: 6 }}
        sx={commonStyles.verificationField}
      />

      <Alert severity="info" sx={{ mt: 2 }}>
        El código cambia cada 30 segundos. Asegúrate de usar el código actual.
      </Alert>
    </Box>
  );

  const renderStep3 = () => (
    <Box sx={{ textAlign: 'center' }}>
      <CheckCircle sx={{ fontSize: 60, color: '#4caf50', mb: 2 }} />
      <Typography variant="h6" sx={{ color: '#4caf50', mb: 2 }}>
        2FA Configurado Exitosamente
      </Typography>
      <Typography variant="body2" color="textSecondary">
        Tu cuenta ahora está protegida con autenticación de dos factores.
      </Typography>
    </Box>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderStep0();
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return renderStep0();
    }
  };

  const renderStepActions = () => {
    switch (activeStep) {
      case 0:
        return (
          <PrimaryButton
            onClick={handleGenerateSecret}
            loading={loading}
            startIcon={<Security />}
          >
            Generar Código QR
          </PrimaryButton>
        );
      case 1:
        return (
          <PrimaryButton
            onClick={() => setActiveStep(2)}
            startIcon={<QrCode />}
          >
            Continuar
          </PrimaryButton>
        );
      case 2:
        return (
          <PrimaryButton
            onClick={handleVerifyCode}
            loading={loading}
            disabled={verificationCode.length !== 6}
            startIcon={<VpnKey />}
          >
            Verificar Código
          </PrimaryButton>
        );
      case 3:
        return null;
      default:
        return null;
    }
  };

  // ========================================
  // 🎨 MAIN RENDER
  // ========================================

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Security color="primary" />
          <Typography variant="h6">
            Configurar Autenticación de Dos Factores
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={commonStyles.stepperContainer}>
          <Stepper activeStep={activeStep} orientation="vertical">
            {STEPS.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
                <StepContent>
                  {index === activeStep && renderStepContent()}
                  <Box sx={{ mt: 2 }}>
                    {renderStepActions()}
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </Box>
      </DialogContent>

      <DialogActions>
        <PrimaryButton onClick={handleClose}>
          {activeStep === 3 ? 'Cerrar' : 'Cancelar'}
        </PrimaryButton>
      </DialogActions>
    </Dialog>
  );
};

export default Setup2FA;
