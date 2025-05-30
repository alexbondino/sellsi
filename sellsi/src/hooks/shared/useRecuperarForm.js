import { useState, useRef, useEffect } from 'react'

export const useRecuperarForm = () => {
  // Estados principales
  const [paso, setPaso] = useState('correo')
  const [correo, setCorreo] = useState('')
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  // Código de verificación
  const [codigo, setCodigo] = useState(['', '', '', '', ''])
  const [timer, setTimer] = useState(300)
  const timerRef = useRef()

  // Restablecer contraseña
  const [nuevaContrasena, setNuevaContrasena] = useState('')
  const [repiteContrasena, setRepiteContrasena] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showRepeatPassword, setShowRepeatPassword] = useState(false)
  const [cambioExitoso, setCambioExitoso] = useState(false)

  // Mensaje reenviado
  const [showCodigoEnviado, setShowCodigoEnviado] = useState(false)
  const [fadeIn, setFadeIn] = useState(false)
  const fadeTimeout = useRef()

  // Timer para código
  useEffect(() => {
    if (paso === 'codigo') {
      setTimer(300)
      setCodigo(['', '', '', '', ''])
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [paso])

  useEffect(() => {
    if (timer === 0) {
      clearInterval(timerRef.current)
    }
  }, [timer])

  // Fade para mensaje reenviado
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

  // Reset total de todos los estados
  const resetAllStates = () => {
    setCorreo('')
    setError('')
    setCodigo(['', '', '', '', ''])
    setMensaje('')
    setTimer(300)
    setPaso('correo')
    setNuevaContrasena('')
    setRepiteContrasena('')
    setShowPassword(false)
    setShowRepeatPassword(false)
    setCambioExitoso(false)
    setShowCodigoEnviado(false)
    setFadeIn(false)
    clearInterval(timerRef.current)
  }

  // Validación simple de correo
  const correoValido = /^[^@]+@[^@]+\.[^@]+$/

  // Handlers de pasos
  const handleBuscar = (e) => {
    e.preventDefault()
    if (!correo) {
      setError('Por favor, rellena este campo.')
      return
    }
    if (!correoValido.test(correo)) {
      setError('Correo inválido. Ejemplo: usuario@dominio.com')
      return
    }
    setError('')
    setMensaje('Revisa el código que fue enviado a tu correo.')
    setPaso('codigo')
  }

  const handleVerificarCodigo = () => {
    // Aquí deberías verificar el código con backend
    setPaso('restablecer')
  }

  const handleCambiarContrasena = () => {
    setCambioExitoso(true)
    setPaso('exito')
  }

  const handleResendCode = () => {
    setShowCodigoEnviado(false)
    setTimeout(() => setShowCodigoEnviado(true), 10)
    setTimer(300)
    setMensaje('El código fue reenviado a tu correo.')
  }

  return {
    // Estados
    paso,
    correo,
    error,
    mensaje,
    codigo,
    timer,
    nuevaContrasena,
    repiteContrasena,
    showPassword,
    showRepeatPassword,
    cambioExitoso,
    showCodigoEnviado,
    fadeIn,

    // Setters
    setPaso, // ✅ AGREGAR ESTE SETTER
    setCorreo,
    setError,
    setMensaje,
    setCodigo,
    setTimer,
    setNuevaContrasena,
    setRepiteContrasena,
    setShowPassword,
    setShowRepeatPassword,
    setCambioExitoso,
    setShowCodigoEnviado,
    setFadeIn,

    // Métodos
    resetAllStates,
    handleBuscar,
    handleVerificarCodigo,
    handleCambiarContrasena,
    handleResendCode,

    // Refs
    timerRef,
    fadeTimeout,
  }
}
