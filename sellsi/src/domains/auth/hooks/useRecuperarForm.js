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
  // Validación mejorada de correo electrónico
  const validarCorreo = (email) => {
    // Regex más completa para validación de email
    const regexCompleto =
      /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/

    // Verificaciones básicas
    if (!email) return false
    if (email.length > 254) return false // RFC 5321 límite
    if (email.includes('..')) return false // No permitir puntos consecutivos
    if (email.startsWith('.') || email.endsWith('.')) return false
    if (email.includes('@.') || email.includes('.@')) return false

    // Validar estructura general
    const parts = email.split('@')
    if (parts.length !== 2) return false

    const [localPart, domain] = parts

    // Validar parte local (antes del @)
    if (localPart.length === 0 || localPart.length > 64) return false

    // Validar dominio
    if (domain.length === 0 || domain.length > 253) return false
    if (domain.includes('..')) return false
    if (!domain.includes('.')) return false

    // Verificar que el dominio tenga al menos un punto y una extensión válida
    const domainParts = domain.split('.')
    if (domainParts.length < 2) return false
    const lastPart = domainParts[domainParts.length - 1]
    if (lastPart.length < 2) return false

    return regexCompleto.test(email)
  }
  // Handlers de pasos
  const handleBuscar = (e) => {
    e.preventDefault()
    if (!correo) {
      setError('Por favor, rellena este campo.')
      return
    }
    if (!validarCorreo(correo)) {
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
