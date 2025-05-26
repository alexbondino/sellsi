import { useReducer } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'

const initialState = {
  correo: '',
  contrasena: '',
  errorCorreo: '',
  errorContrasena: '',
  showPassword: false,
  openRecuperar: false,
  openRegistro: false,
}

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_CORREO':
      return { ...state, correo: action.payload }
    case 'SET_CONTRASENA':
      return { ...state, contrasena: action.payload }
    case 'SET_ERROR_CORREO':
      return { ...state, errorCorreo: action.payload }
    case 'SET_ERROR_CONTRASENA':
      return { ...state, errorContrasena: action.payload }
    case 'TOGGLE_SHOW_PASSWORD':
      return { ...state, showPassword: !state.showPassword }
    case 'OPEN_RECUPERAR':
      return { ...state, openRecuperar: true }
    case 'CLOSE_RECUPERAR':
      return { ...state, openRecuperar: false }
    case 'OPEN_REGISTRO':
      return { ...state, openRegistro: true }
    case 'CLOSE_REGISTRO':
      return { ...state, openRegistro: false }
    case 'RESET_FORM':
      return {
        ...state,
        correo: '',
        contrasena: '',
        errorCorreo: '',
        errorContrasena: '',
        showPassword: false,
      }
    default:
      return state
  }
}

export const useLoginForm = () => {
  const navigate = useNavigate()
  const [state, dispatch] = useReducer(reducer, initialState)

  const validarFormulario = () => {
    const errores = { correo: '', contrasena: '' }

    if (!state.correo) {
      errores.correo = 'Por favor, rellena este campo.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.correo)) {
      errores.correo = 'Por favor, ingresa un correo válido.'
    }

    if (!state.contrasena) {
      errores.contrasena = 'Por favor, rellena este campo.'
    }

    dispatch({ type: 'SET_ERROR_CORREO', payload: errores.correo })
    dispatch({ type: 'SET_ERROR_CONTRASENA', payload: errores.contrasena })

    return !errores.correo && !errores.contrasena
  }

  const handleLogin = async (e, onClose) => {
    e.preventDefault()
    if (!validarFormulario()) return

    const { data: proveedor, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('email', state.correo)
      .single()

    if (error || !proveedor) {
      dispatch({ type: 'SET_ERROR_CORREO', payload: 'Usuario no encontrado' })
      return
    }

    if (state.contrasena !== proveedor.password_hash) {
      dispatch({
        type: 'SET_ERROR_CONTRASENA',
        payload: 'Contraseña incorrecta',
      })
      return
    }

    localStorage.setItem('supplierid', proveedor.supplierid)
    onClose()
    navigate('/supplier/home')
  }

  const resetForm = () => {
    dispatch({ type: 'RESET_FORM' })
  }

  return { state, dispatch, handleLogin, resetForm }
}