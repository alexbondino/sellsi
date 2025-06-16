import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useLocation, useNavigate } from 'react-router-dom';

import {
  ProgressStepper,
  CustomButton,
  Wizard,
  useWizard,
} from '../landing_page/hooks';
import {
  Step1Account,
  // Step2AccountType, // Removed
  // Step3Profile,     // Removed
  Step4Verification,
} from './wizard';
import { useBanner } from '../ui/BannerContext';

export default function Register({ open, onClose }) {
  const theme = useTheme();
  const { showBanner } = useBanner();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    correo: '',
    contrasena: '',
    confirmarContrasena: '',
    aceptaTerminos: false,
    aceptaComunicaciones: false,
    // tipoCuenta: '',       // No longer needed for initial creation
    // nombreEmpresa: '',    // No longer needed for initial creation
    // nombrePersonal: '',   // No longer needed for initial creation
    // telefonoContacto: '', // No longer needed for initial creation
    // codigoPais: '',       // No longer needed for initial creation
    // logoEmpresa: null,    // No longer needed for initial creation
  });

  const [codigo, setCodigo] = useState(['', '', '', '', '']);
  const [timer, setTimer] = useState(300);
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  // const [logoError, setLogoError] = useState(''); // No longer needed
  const [showCodigoEnviado, setShowCodigoEnviado] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);

  const timerRef = useRef();
  const fadeTimeout = useRef();

  // 🎯 MODIFICADO: Solo dos pasos para la creación de cuenta y verificación
  const steps = ['Creación de Cuenta', 'Verificación'];

  const {
    currentStep,
    nextStep,
    // prevStep, // Not directly used in the new flow for prev
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
      // tipoCuenta: '', // Reset if it were still part of formData structure
      // nombreEmpresa: '',
      // nombrePersonal: '',
      // telefonoContacto: '',
      // codigoPais: 'Chile',
      // logoEmpresa: null,
    });
    setCodigo(['', '', '', '', '']);
    setTimer(300);
    setShowPassword(false);
    setShowRepeatPassword(false);
    // setLogoError(''); // No longer needed
    setShowCodigoEnviado(false);
    setFadeIn(false);
    clearInterval(timerRef.current);
    clearTimeout(fadeTimeout.current);
  };

  useEffect(() => {
    // 🎯 MODIFICADO: El paso de verificación ahora es el segundo paso (índice 1)
    if (currentStep === 1) {
      // Changed from 3 to 1
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

  // const handleLogoChange = file => { ... } // No longer needed for initial registration

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

    // 🎯 NOTA: La redirección a '/supplier/home' basada en 'formData.tipoCuenta'
    // ya no tendrá el tipo de cuenta definido en este flujo inicial,
    // ya que la selección de tipo de cuenta se movió para después de la verificación.
    // Necesitarías una forma diferente de determinar el tipo de usuario aquí,
    // quizás después de que el usuario haya completado su perfil post-verificación.
    // Por ahora, mantendremos la redirección condicional, pero ten en cuenta la implicación.
    if (formData.tipoCuenta === 'proveedor') {
      // This will likely be undefined now
      setTimeout(() => {
        navigate('/supplier/home');
      }, 1000);
    }
  };

  const handleDialogClose = (event, reason) => {
    if (
      // 🎯 MODIFICADO: Ajustar los pasos para evitar cerrar en backdropClick
      (currentStep === 0 || // Now only step 0 and 1 are relevant
        currentStep === 1) &&
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
            onNext={wizardControls.nextStep} // 🎯 Llamará a nextStep después de la creación y envío de correo
            onCancel={onClose}
            showPassword={showPassword}
            showRepeatPassword={showRepeatPassword}
            onTogglePasswordVisibility={() => setShowPassword(prev => !prev)}
            onToggleRepeatPasswordVisibility={() =>
              setShowRepeatPassword(prev => !prev)
            }
          />
        );
      // 🎯 ELIMINADOS: Step 1 and Step 2 from original structure
      // case 1:
      //   return (
      //     <Step2AccountType
      //       selectedType={formData.tipoCuenta}
      //       onTypeSelect={type => updateFormData('tipoCuenta', type)}
      //       onNext={wizardControls.nextStep}
      //       onBack={wizardControls.prevStep}
      //     />
      //   );
      // case 2:
      //   return (
      //     <Step3Profile
      //       accountType={formData.tipoCuenta}
      //       formData={formData}
      //       onFieldChange={updateFormData}
      //       onLogoChange={handleLogoChange}
      //       logoError={logoError}
      //       onNext={wizardControls.nextStep}
      //       onBack={wizardControls.prevStep}
      //     />
      //   );
      case 1: // 🎯 MODIFICADO: Step4Verification ahora es el paso 1 (segundo en la secuencia)
        return (
          <Step4Verification
            email={formData.correo}
            codigo={codigo}
            setCodigo={setCodigo}
            timer={timer}
            onVerify={handleSuccessfulVerification}
            onResendCode={handleResendCode}
            onBack={() => wizardControls.goToStep(0)} // Permite volver al primer paso
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
              // prevStep, // Not exposed to renderStep, goToStep is preferred for specific navigation
              goToStep,
            })}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
