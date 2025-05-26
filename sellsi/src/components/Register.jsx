import React, { useState, useRef, useEffect } from 'react'
import { Dialog, DialogTitle, DialogContent, Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useLocation } from 'react-router-dom'

import { ProgressStepper, CustomButton } from './shared'
import Step1Account from './register/Step1Account'
import Step2AccountType from './register/Step2AccountType'
import Step3Profile from './register/Step3Profile'
import Step4Verification from './register/Step4Verification'
import Step5Success from './register/Step5Success'

export default function Register({ open, onClose }) {
  const theme = useTheme()

  // ✅ ESTADOS PRINCIPALES
  const [paso, setPaso] = useState(1)
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
  const siguientePaso = () => setPaso((prev) => prev + 1)
  const anteriorPaso = () => setPaso((prev) => prev - 1)
  const irAPaso = (numeroPaso) => setPaso(numeroPaso)

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setPaso(1)
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
    if (paso === 4) {
      setTimer(300)
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [paso])

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
  }

  const handleDialogClose = (event, reason) => {
    if (
      (paso === 2 || paso === 3 || paso === 4 || paso === 5) &&
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

  const steps = [
    'Creación de Cuenta',
    'Tipo de Cuenta',
    'Completar Información',
    'Verificación',
    'Cuenta Creada',
  ]

  return (
    <Dialog
      key={dialogKey}
      open={open}
      onClose={handleDialogClose}
      onExited={handleExited}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          width: '90vw',
          maxWidth: 1050,
          height: '85vh',
          maxHeight: '800px',
          overflowX: 'hidden',
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
      </DialogTitle>

      <DialogContent sx={{ overflowX: 'hidden', px: { xs: 2, sm: 3 }, pt: 1 }}>
        <ProgressStepper activeStep={paso} steps={steps} />

        {paso === 1 && (
          <Step1Account
            formData={formData}
            onFieldChange={updateFormData}
            onNext={siguientePaso}
            onCancel={onClose}
            showPassword={showPassword}
            showRepeatPassword={showRepeatPassword}
            onTogglePasswordVisibility={() => setShowPassword((prev) => !prev)}
            onToggleRepeatPasswordVisibility={() =>
              setShowRepeatPassword((prev) => !prev)
            }
          />
        )}

        {paso === 2 && (
          <Step2AccountType
            selectedType={formData.tipoCuenta}
            onTypeSelect={(type) => updateFormData('tipoCuenta', type)}
            onNext={siguientePaso}
            onBack={anteriorPaso}
          />
        )}

        {paso === 3 && (
          <Step3Profile
            accountType={formData.tipoCuenta}
            formData={formData}
            onFieldChange={updateFormData}
            onLogoChange={handleLogoChange}
            logoError={logoError}
            onNext={siguientePaso}
            onBack={anteriorPaso}
          />
        )}

        {paso === 4 && (
          <Step4Verification
            email={formData.correo}
            codigo={codigo}
            setCodigo={setCodigo}
            timer={timer}
            onVerify={siguientePaso}
            onResendCode={handleResendCode}
            onBack={() => irAPaso(3)}
            showCodigoEnviado={showCodigoEnviado}
            fadeIn={fadeIn}
          />
        )}

        {paso === 5 && <Step5Success onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}
