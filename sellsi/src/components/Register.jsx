import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useLocation } from 'react-router-dom';

import {
  ProgressStepper,
  CustomButton,
  Wizard,
  useWizard,
} from '../hooks/shared';
import Step1Account from './register/Step1Account';
import Step2AccountType from './register/Step2AccountType';
import Step3Profile from './register/Step3Profile';
import Step4Verification from './register/Step4Verification';
import { useBanner } from '../contexts/BannerContext';

export default function Register({ open, onClose }) {
  const theme = useTheme();
  const { showBanner } = useBanner();

  const [formData, setFormData] = useState({
    correo: '',
    contrasena: '',
    confirmarContrasena: '',
    aceptaTerminos: false,
    aceptaComunicaciones: false,
    tipoCuenta: '',
    nombreEmpresa: '',
    nombrePersonal: '',
    telefonoContacto: '',
    codigoPais: '',
    logoEmpresa: null,
  });

  const [codigo, setCodigo] = useState(['', '', '', '', '']);
  const [timer, setTimer] = useState(300);
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [logoError, setLogoError] = useState('');
  const [showCodigoEnviado, setShowCodigoEnviado] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);

  const timerRef = useRef();
  const fadeTimeout = useRef();

  const steps = [
    'Creación de Cuenta',
    'Tipo de Cuenta',
    'Completar Información',
    'Verificación',
  ];

  const {
    currentStep,
    nextStep,
    prevStep,
    goToStep,
    resetWizard,
    isFirst,
    isLast,
  } = useWizard(steps, { initialStep: 0 });

  useEffect(() => {
    const handleCloseAllModals = () => {
      if (open) {
        onClose();
      }
    };

    window.addEventListener('closeAllModals', handleCloseAllModals);
    return () => {
      window.removeEventListener('closeAllModals', handleCloseAllModals);
    };
  }, [open, onClose]);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    resetWizard();
    setFormData({
      correo: '',
      contrasena: '',
      confirmarContrasena: '',
      aceptaTerminos: false,
      aceptaComunicaciones: false,
      tipoCuenta: '',
      nombreEmpresa: '',
      nombrePersonal: '',
      telefonoContacto: '',
      codigoPais: 'Chile',
      logoEmpresa: null,
    });
    setCodigo(['', '', '', '', '']);
    setTimer(300);
    setShowPassword(false);
    setShowRepeatPassword(false);
    setLogoError('');
    setShowCodigoEnviado(false);
    setFadeIn(false);
    clearInterval(timerRef.current);
    clearTimeout(fadeTimeout.current);
  };

  useEffect(() => {
    if (currentStep === 3) {
      setTimer(300);
      timerRef.current = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [currentStep]);

  useEffect(() => {
    if (timer === 0) clearInterval(timerRef.current);
  }, [timer]);

  useEffect(() => {
    if (showCodigoEnviado) {
      setFadeIn(true);
      fadeTimeout.current = setTimeout(() => {
        setFadeIn(false);
        setTimeout(() => setShowCodigoEnviado(false), 400);
      }, 15000);
    }
    return () => clearTimeout(fadeTimeout.current);
  }, [showCodigoEnviado]);

  const handleLogoChange = file => {
    if (file.size > 300 * 1024) {
      setLogoError('El tamaño del archivo excede los 300 KB.');
      updateFormData('logoEmpresa', null);
      return;
    }
    setLogoError('');
    const reader = new FileReader();
    reader.onload = ev => updateFormData('logoEmpresa', ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleResendCode = () => {
    setShowCodigoEnviado(false);
    setTimeout(() => setShowCodigoEnviado(true), 10);
    setTimer(300);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(prev => prev - 1);
    }, 1000);
  };

  const handleSuccessfulVerification = () => {
    onClose();
    showBanner({
      message: 'Registro completado correctamente. Bienvenido a Sellsi.',
      severity: 'success',
      duration: 6000,
    });
  };

  const handleDialogClose = (event, reason) => {
    if (
      (currentStep === 1 ||
        currentStep === 2 ||
        currentStep === 3 ||
        currentStep === 4) &&
      reason === 'backdropClick'
    ) {
      return;
    }
    onClose(event, reason);
  };

  const handleExited = () => {
    resetForm();
    setDialogKey(k => k + 1);
  };

  const renderStep = (stepIndex, stepData, wizardControls) => {
    switch (stepIndex) {
      case 0:
        return (
          <Step1Account
            formData={formData}
            onFieldChange={updateFormData}
            onNext={wizardControls.nextStep}
            onCancel={onClose}
            showPassword={showPassword}
            showRepeatPassword={showRepeatPassword}
            onTogglePasswordVisibility={() => setShowPassword(prev => !prev)}
            onToggleRepeatPasswordVisibility={() =>
              setShowRepeatPassword(prev => !prev)
            }
          />
        );
      case 1:
        return (
          <Step2AccountType
            selectedType={formData.tipoCuenta}
            onTypeSelect={type => updateFormData('tipoCuenta', type)}
            onNext={wizardControls.nextStep}
            onBack={wizardControls.prevStep}
          />
        );
      case 2:
        return (
          <Step3Profile
            accountType={formData.tipoCuenta}
            formData={formData}
            onFieldChange={updateFormData}
            onLogoChange={handleLogoChange}
            logoError={logoError}
            onNext={wizardControls.nextStep}
            onBack={wizardControls.prevStep}
          />
        );
      case 3:
        return (
          <Step4Verification
            email={formData.correo}
            codigo={codigo}
            setCodigo={setCodigo}
            timer={timer}
            onVerify={handleSuccessfulVerification}
            onResendCode={handleResendCode}
            onBack={() => wizardControls.goToStep(2)}
            showCodigoEnviado={showCodigoEnviado}
            fadeIn={fadeIn}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Dialog
        key={dialogKey}
        open={open}
        onClose={handleDialogClose}
        TransitionProps={{
          onExited: handleExited,
        }}
        maxWidth="md"
        fullWidth
        disableScrollLock={true}
        disableRestoreFocus={true}
        PaperProps={{
          sx: {
            width: '90vw',
            maxWidth: 1050,
            height: '85vh',
            maxHeight: '800px',
            overflowX: 'hidden',
            position: 'fixed',
          },
        }}
      >
        <DialogTitle sx={{ p: 0, pb: 1 }}>
          <Box
            component="button"
            onClick={onClose}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              fontSize: 16,
              textTransform: 'uppercase',
              minWidth: 'auto',
              padding: '4px 8px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#41B6E6',
              fontWeight: 700,
              cursor: 'pointer',
              borderRadius: 1,
              fontFamily: 'inherit',
              '&:hover': {
                backgroundColor: 'rgba(65, 182, 230, 0.08)',
              },
            }}
          >
            CERRAR
          </Box>
        </DialogTitle>
        <DialogContent
          sx={{ overflowX: 'hidden', px: { xs: 2, sm: 3 }, pt: 1 }}
        >
          <ProgressStepper activeStep={currentStep + 1} steps={steps} />
          <Box sx={{ mt: 2 }}>
            {renderStep(currentStep, steps[currentStep], {
              nextStep,
              prevStep,
              goToStep,
            })}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
