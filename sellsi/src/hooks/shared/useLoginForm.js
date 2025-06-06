import { useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';

const initialState = {
  correo: '',
  contrasena: '',
  errorCorreo: '',
  errorContrasena: '',
  showPassword: false,
  openRecuperar: false,
  openRegistro: false,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_CORREO':
      return { ...state, correo: action.payload };
    case 'SET_CONTRASENA':
      return { ...state, contrasena: action.payload };
    case 'SET_ERROR_CORREO':
      return { ...state, errorCorreo: action.payload };
    case 'SET_ERROR_CONTRASENA':
      return { ...state, errorContrasena: action.payload };
    case 'TOGGLE_SHOW_PASSWORD':
      return { ...state, showPassword: !state.showPassword };
    case 'OPEN_RECUPERAR':
      return { ...state, openRecuperar: true };
    case 'CLOSE_RECUPERAR':
      return { ...state, openRecuperar: false };
    case 'OPEN_REGISTRO':
      return { ...state, openRegistro: true };
    case 'CLOSE_REGISTRO':
      return { ...state, openRegistro: false };
    case 'RESET_FORM':
      return {
        ...state,
        correo: '',
        contrasena: '',
        errorCorreo: '',
        errorContrasena: '',
        showPassword: false,
      };
    default:
      return state;
  }
};

export const useLoginForm = () => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, initialState);

  const validarFormulario = () => {
    const errores = { correo: '', contrasena: '' };

    if (!state.correo) {
      errores.correo = 'Por favor, rellena este campo.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.correo)) {
      errores.correo = 'Por favor, ingresa un correo válido.';
    }

    if (!state.contrasena) {
      errores.contrasena = 'Por favor, rellena este campo.';
    }

    dispatch({ type: 'SET_ERROR_CORREO', payload: errores.correo });
    dispatch({ type: 'SET_ERROR_CONTRASENA', payload: errores.contrasena });

    return !errores.correo && !errores.contrasena;
  };
  const handleLogin = async (e, onClose) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    try {
      // ✅ AUTENTICACIÓN CON SUPABASE AUTH
      const { data, error } = await supabase.auth.signInWithPassword({
        email: state.correo,
        password: state.contrasena,
      });

      if (error) {
        dispatch({
          type: 'SET_ERROR_CORREO',
          payload: 'Correo o contraseña incorrectos',
        });
        return;
      }

      const { user } = data;

      // ✅ OBTENER PERFIL USANDO user.id (NO email)
      const { data: perfil, error: perfilError } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (perfilError || !perfil) {
        dispatch({
          type: 'SET_ERROR_CORREO',
          payload: 'Proveedor no encontrado',
        });
        return;
      }

      // ✅ GUARDAR EN LOCALSTORAGE
      localStorage.setItem('user_id', user.id);

      onClose();
      navigate('/supplier/home');
    } catch (error) {
      console.error('Error en login:', error);
      dispatch({
        type: 'SET_ERROR_CORREO',
        payload: 'Error de conexión. Intenta de nuevo.',
      });
    }
  };

  const resetForm = () => {
    dispatch({ type: 'RESET_FORM' });
  };

  return { state, dispatch, handleLogin, resetForm };
};
