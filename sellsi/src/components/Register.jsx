import React, { useState, useRef, useEffect } from 'react'
import { Dialog, DialogTitle, DialogContent, Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useLocation, useNavigate } from 'react-router-dom' // 🔄 AGREGADO: useNavigate para redirección automática de proveedores

import {
  ProgressStepper,
  CustomButton,
  Wizard,
  useWizard,
} from '../hooks/shared'
import Step1Account from './register/Step1Account' // Componente para el primer paso del registro
import Step2AccountType from './register/Step2AccountType' // Componente para seleccionar tipo de cuenta
import Step3Profile from './register/Step3Profile' // Componente para completar información del perfil
import Step4Verification from './register/Step4Verification' // Componente para la verificación del registro
import { useBanner } from '../contexts/BannerContext' // Contexto para mostrar banners de notificación

export default function Register({ open, onClose }) {
  const theme = useTheme()
  const { showBanner } = useBanner()
  const navigate = useNavigate() // 🔄 AGREGADO: Hook para navegación automática de proveedores
  // ✅ ESTADOS PRINCIPALES - Formulario de registro
  const [formData, setFormData] = useState({
    correo: '',
    contrasena: '',
    confirmarContrasena: '',
    aceptaTerminos: false,
    aceptaComunicaciones: false,
    tipoCuenta: '', // 📍 PUNTO DE CONEXIÓN BACKEND: Este campo almacena 'proveedor' o 'comprador'
    nombreEmpresa: '',
    nombrePersonal: '',
    telefonoContacto: '',
    codigoPais: 'Chile',
    logoEmpresa: null,
  })
  const [codigo, setCodigo] = useState(['', '', '', '', ''])
  const [timer, setTimer] = useState(300)
  const [showPassword, setShowPassword] = useState(false)
  const [showRepeatPassword, setShowRepeatPassword] = useState(false)
  const [logoError, setLogoError] = useState('')
  const [showCodigoEnviado, setShowCodigoEnviado] = useState(false)
  const [fadeIn, setFadeIn] = useState(false)
  const [dialogKey, setDialogKey] = useState(0)

  const timerRef = useRef()
  const fadeTimeout = useRef()

  // ✅ CONFIGURACIÓN DEL WIZARD - Solo 4 pasos ahora
  const steps = [
    'Creación de Cuenta',
    'Tipo de Cuenta',
    'Completar Información',
    'Verificación',
  ]
  // Usar el hook de wizard para la navegación
  const wizardControls = useWizard(steps, { initialStep: 0 })
  const {
    currentStep,
    nextStep,
    prevStep,
    goToStep,
    resetWizard,
    isFirst,
    isLast,
  } = wizardControls

  // Enhanced prevStep function that resets logo error when navigating back
  const handlePrevStep = () => {
    // Reset logo error when going back from Step3Profile (step 2)
    if (currentStep === 2) {
      setLogoError('')
    }
    prevStep()
  }
  // ✅ CERRAR MODAL EN NAVEGACIÓN
  useEffect(() => {
    const handleCloseAllModals = () => {
      if (open) {
        onClose()
      }
    }

    window.addEventListener('closeAllModals', handleCloseAllModals)

    return () => {
      window.removeEventListener('closeAllModals', handleCloseAllModals)
    }
  }, [open, onClose])

  // ✅ MÉTODOS
  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    resetWizard() // Usar el método del wizard
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
    })
    setCodigo(['', '', '', '', ''])
    setTimer(300)
    setShowPassword(false)
    setShowRepeatPassword(false)
    setLogoError('')
    setShowCodigoEnviado(false)
    setFadeIn(false)
    clearInterval(timerRef.current)
    clearTimeout(fadeTimeout.current)
  }
  // ✅ EFFECTS
  useEffect(() => {
    if (currentStep === 3) {
      // paso 4 en el wizard (0-based)
      setTimer(300)
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [currentStep])

  useEffect(() => {
    if (timer === 0) clearInterval(timerRef.current)
  }, [timer])

  useEffect(() => {
    if (showCodigoEnviado) {
      setFadeIn(true)
      fadeTimeout.current = setTimeout(() => {
        setFadeIn(false)
        setTimeout(() => setShowCodigoEnviado(false), 400)
      }, 15000)
    }
    return () => clearTimeout(fadeTimeout.current)
  }, [showCodigoEnviado])

  // ✅ HANDLERS
  const handleLogoChange = (file) => {
    if (file.size > 300 * 1024) {
      setLogoError('El tamaño del archivo excede los 300 KB.')
      updateFormData('logoEmpresa', null)
      return
    }
    setLogoError('')
    const reader = new FileReader()
    reader.onload = (ev) => updateFormData('logoEmpresa', ev.target.result)
    reader.readAsDataURL(file)
  }
  const handleResendCode = () => {
    setShowCodigoEnviado(false)
    setTimeout(() => setShowCodigoEnviado(true), 10)
    setTimer(300)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimer((prev) => prev - 1)
    }, 1000)
  } // ✅ NUEVA FUNCIÓN - Manejar verificación exitosa
  const handleSuccessfulVerification = () => {
    // Cerrar el modal
    onClose()

    // Mostrar banner de éxito usando el contexto
    showBanner({
      message: 'Registro completado correctamente. Bienvenido a Sellsi.',
      severity: 'success',
      duration: 6000,
    })

    // 🔄 NUEVA LÓGICA: Redirección automática para cuentas de proveedor
    // 📍 PUNTO DE CONEXIÓN BACKEND: Aquí es donde verificas el tipo de cuenta desde la respuesta del servidor
    // En lugar de usar formData.tipoCuenta, podrías usar algo como: responseData.accountType o user.userType
    if (formData.tipoCuenta === 'proveedor') {
      // 🔄 AGREGADO: Redirección con delay para mostrar el banner de éxito
      // 📍 PUNTO DE CONEXIÓN BACKEND: Aquí también podrías almacenar datos del usuario en localStorage
      // Ejemplo: localStorage.setItem('userType', 'provider'); localStorage.setItem('supplierId', responseData.id);
      setTimeout(() => {
        navigate('/supplier/home') // 🔄 Redirige a dashboard de proveedor
      }, 1000) // Esperar 1 segundo para que el usuario vea el banner
    }
    // 📍 NOTA: Las cuentas de comprador mantienen el comportamiento actual (solo banner, sin redirección)
  }
  const handleDialogClose = (event, reason) => {
    if (
      (currentStep === 1 ||
        currentStep === 2 ||
        currentStep === 3 ||
        currentStep === 4) &&
      reason === 'backdropClick'
    ) {
      return
    }
    onClose(event, reason)
  }
  const handleExited = () => {
    resetForm()
    setDialogKey((k) => k + 1)
  }

  // Función para renderizar cada paso del wizard
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
            onTogglePasswordVisibility={() => setShowPassword((prev) => !prev)}
            onToggleRepeatPasswordVisibility={() =>
              setShowRepeatPassword((prev) => !prev)
            }
          />
        )
      case 1:
        return (
          <Step2AccountType
            selectedType={formData.tipoCuenta}
            onTypeSelect={(type) => updateFormData('tipoCuenta', type)}
            onNext={wizardControls.nextStep}
            onBack={handlePrevStep}
          />
        )
      case 2:
        return (
          <Step3Profile
            accountType={formData.tipoCuenta}
            formData={formData}
            onFieldChange={updateFormData}
            onLogoChange={handleLogoChange}
            logoError={logoError}
            onNext={wizardControls.nextStep}
            onBack={handlePrevStep}
          />
        )
      case 3:
        return (
          <Step4Verification
            email={formData.correo}
            codigo={codigo}
            setCodigo={setCodigo}
            timer={timer}
            onVerify={handleSuccessfulVerification}
            onResendCode={handleResendCode}
            onBack={handlePrevStep}
            showCodigoEnviado={showCodigoEnviado}
            fadeIn={fadeIn}
          />
        )
      default:
        return null
    }
  }
  return (
    <>
      {' '}
      <Dialog
        key={dialogKey}
        open={open}
        onClose={handleDialogClose}
        onExited={handleExited}
        maxWidth="md"
        fullWidth
        disableScrollLock={true}
        disableRestoreFocus={true}
        PaperProps={{
          sx: {
            width: {
              xs: '95vw', // 95% del ancho en móviles muy pequeños
              sm: '90vw', // 90% del ancho en móviles
              md: '85vw', // 85% del ancho en tablets
              lg: '90vw', // Mantener tamaño original en desktop
            },
            maxWidth: {
              xs: '400px', // Máximo 400px en móviles muy pequeños
              sm: '600px', // Máximo 600px en móviles
              md: '800px', // Máximo 800px en tablets
              lg: 1050, // Tamaño original en desktop
            },
            height: {
              xs: '90vh', // 90% de altura en móviles muy pequeños
              sm: '85vh', // 85% de altura en móviles
              md: '100vh', // 80% de altura en tablets
              lg: '85vh', // Altura original en desktop
            },
            maxHeight: {
              xs: '600px', // Máximo 600px de altura en móviles muy pequeños
              sm: '700px', // Máximo 700px de altura en móviles
              md: '750px', // Máximo 750px de altura en tablets
              lg: '800px', // Altura original en desktop
            },
            overflowX: 'hidden',
            position: 'fixed',
            margin: { xs: 1, sm: 2, md: 2, lg: 3 }, // Márgenes responsivos
          },
        }}
      >
        <DialogTitle sx={{ p: 0, pb: 1 }}>
          {/* ✅ BOTÓN CERRAR */}
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
        </DialogTitle>{' '}
        <DialogContent
          sx={{
            overflowX: 'hidden',
            px: { xs: 1.5, sm: 2, md: 3 }, // Padding horizontal más pequeño en móviles
            py: { xs: 1, sm: 1.5, md: 2 }, // Padding vertical más pequeño en móviles
            pt: 1,
          }}
        >
          {' '}
          <ProgressStepper activeStep={currentStep + 1} steps={steps} />
          {/* Renderizar el paso actual directamente */}
          <Box
            sx={{
              mt: { xs: 0, sm: 0, md: 1 }, // Margen superior más pequeño en móviles
            }}
          >
            {renderStep(currentStep, steps[currentStep], {
              nextStep,
              prevStep,
              goToStep,
            })}
          </Box>{' '}
        </DialogContent>
      </Dialog>{' '}
    </>
  )
}

/*
🔄 RESUMEN DE CAMBIOS PARA REDIRECCIÓN AUTOMÁTICA DE PROVEEDORES:

📍 PUNTOS DE CONEXIÓN CON BACKEND:

1. IMPORTS (Línea 4):
   - Agregado useNavigate para redirección automática

2. HOOK NAVEGACIÓN (Línea 21):
   - const navigate = useNavigate() - Para redireccionar programáticamente

3. CAMPO TIPO DE CUENTA (Línea 30):
   - formData.tipoCuenta - Almacena 'proveedor' o 'comprador'
   - BACKEND: Envía este valor al servidor durante el registro

4. FUNCIÓN VERIFICACIÓN EXITOSA (Líneas 171-192):
   - handleSuccessfulVerification() - Se ejecuta después de verificar código
   - BACKEND: Aquí recibes la respuesta del servidor tras la verificación
   - LÓGICA: Si tipoCuenta === 'proveedor' → redirige a /supplier/home
   - BACKEND: Puedes almacenar datos del usuario en localStorage aquí

FLUJO COMPLETO:
1. Usuario selecciona tipo "proveedor" en Step2 → formData.tipoCuenta = 'proveedor'
2. Usuario completa registro y verifica código en Step4
3. handleSuccessfulVerification() se ejecuta
4. Si es proveedor → Muestra banner + Redirige a dashboard proveedor
5. Si es comprador → Solo muestra banner (comportamiento actual)

RUTAS:
- Dashboard Proveedor: /supplier/home → src/pages/provider/ProviderHome.jsx
*/
