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
  cuentaNoVerificada: false,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_CORREO':
      return {
        ...state,
        correo: action.payload,
        errorCorreo: '',
        cuentaNoVerificada: false,
      };
    case 'SET_CONTRASENA':
      return { ...state, contrasena: action.payload, errorContrasena: '' };
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
    case 'CUENTA_NO_VERIFICADA':
      return { ...state, cuentaNoVerificada: true, errorCorreo: '' };
    case 'VOLVER_A_LOGIN':
      return {
        ...state,
        cuentaNoVerificada: false,
        correo: '',
        contrasena: '',
        errorCorreo: '',
        errorContrasena: '',
      };
    case 'RESET_FORM':
      return {
        ...state,
        correo: '',
        contrasena: '',
        errorCorreo: '',
        errorContrasena: '',
        showPassword: false,
        cuentaNoVerificada: false,
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: state.correo,
        password: state.contrasena,
      });

      const user = data?.user;

      // ⚠️ Si hay error, evaluamos el mensaje
      if (error) {
        if (error.message === 'Email not confirmed') {
          dispatch({ type: 'CUENTA_NO_VERIFICADA' });

          await supabase.auth.resend({
            type: 'signup',
            email: state.correo,
          });

          await supabase.auth.signOut();
          return;
        }

        // Credenciales incorrectas u otro error
        dispatch({
          type: 'SET_ERROR_CORREO',
          payload: 'Correo o contraseña incorrectos',
        });
        return;
      }

      // ⚠️ Si el usuario existe pero no confirmó el email
      if (!user.email_confirmed_at) {
        dispatch({ type: 'CUENTA_NO_VERIFICADA' });

        await supabase.auth.signOut();
        return;
      }

      // ✅ Buscar perfil
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

      // ✅ Guardar e ir al home
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

  const reenviarCorreo = async () => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: state.correo,
    });

    if (!error) {
      alert('Correo de verificación reenviado.');
    } else {
      alert('No se pudo reenviar el correo.');
    }
  };

  const resetForm = () => {
    dispatch({ type: 'RESET_FORM' });
  };

  return {
    state,
    dispatch,
    handleLogin,
    resetForm,
    reenviarCorreo,
  };
};
