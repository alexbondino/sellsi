import { useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../../services/supabase';
import { trackLoginIP } from '../../../../services/security';
import { useRole } from '../../../../infrastructure/providers/UnifiedAuthProvider';

const initialState = {
  correo: '',
  contrasena: '',
  errorCorreo: '',
  errorContrasena: '',
  showPassword: false,
  openRecuperar: false,
  openRegistro: false,
  cuentaNoVerificada: false,
  correoReenviado: false,
  reenviarCooldown: false,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_CORREO':
      return {
        ...state,
        correo: action.payload,
        errorCorreo: '',
        cuentaNoVerificada: false,
        correoReenviado: false,
        reenviarCooldown: false,
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
      return {
        ...state,
        cuentaNoVerificada: true,
        errorCorreo: '',
        correoReenviado: false,
        reenviarCooldown: false,
      };
    case 'CORREO_REENVIADO':
      return {
        ...state,
        correoReenviado: true,
        reenviarCooldown: true,
      };
    case 'RESET_COOLDOWN':
      return {
        ...state,
        reenviarCooldown: false,
        correoReenviado: false,
      };
    case 'VOLVER_A_LOGIN':
      return {
        ...state,
        cuentaNoVerificada: false,
        correo: '',
        contrasena: '',
        errorCorreo: '',
        errorContrasena: '',
        correoReenviado: false,
        reenviarCooldown: false,
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
        correoReenviado: false,
        reenviarCooldown: false,
      };
    default:
      return state;
  }
};

export const useLoginForm = () => {
  const navigate = useNavigate();
  const { redirectToInitialHome } = useRole();
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

        dispatch({
          type: 'SET_ERROR_CORREO',
          payload: 'Correo o contraseña incorrectos',
        });
        return;
      }

      if (!user.email_confirmed_at) {
        dispatch({ type: 'CUENTA_NO_VERIFICADA' });

        await supabase.auth.signOut();
        return;
      }
      
      // ✅ OPTIMIZACIÓN: Guardar user_id y cerrar modal inmediatamente
      localStorage.setItem('user_id', user.id);
      onClose();
      
      // ✅ OPTIMIZACIÓN: Tracking de IP en background (sin await)
      trackLoginIP(user.id, 'email_password')
        .then(ipResult => {
          if (ipResult.success) {
            console.log('📡 IP actualizada en login:', ipResult.ip);
          } else {
            console.warn('⚠️ Error actualizando IP en login:', ipResult.error);
          }
        })
        .catch(ipError => {
          console.warn('⚠️ Error en tracking de IP:', ipError);
        });
      
      // ✅ OPTIMIZACIÓN: UnifiedAuthProvider ya maneja fetch/creación de perfil en evento SIGNED_IN
      // ✅ OPTIMIZACIÓN: Usar función del RoleProvider para redirección inicial
      redirectToInitialHome();
    } catch (error) {
      console.error('Error en login:', error);
      dispatch({
        type: 'SET_ERROR_CORREO',
        payload: 'Error de conexión. Intenta de nuevo.',
      });
    }
  };

  const reenviarCorreo = async () => {
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) {
      dispatch({
        type: 'SET_ERROR_CORREO',
        payload: 'No hay sesión activa para reenviar el correo.',
      });
      return;
    }

    if (state.reenviarCooldown) return;

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: state.correo,
    });

    if (!error) {
      dispatch({ type: 'CORREO_REENVIADO' });
      setTimeout(() => dispatch({ type: 'RESET_COOLDOWN' }), 30000);
    } else if (error.status === 429) {
      dispatch({
        type: 'SET_ERROR_CORREO',
        payload: 'Demasiados intentos. Espera un momento.',
      });
    } else {
      dispatch({
        type: 'SET_ERROR_CORREO',
        payload: 'No se pudo reenviar el correo.',
      });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('❌ Error en OAuth de Google:', error);
        dispatch({
          type: 'SET_ERROR_CORREO',
          payload: 'Error al iniciar sesión con Google',
        });
      }
    } catch (error) {
      console.error('Error en login con Google:', error);
      dispatch({
        type: 'SET_ERROR_CORREO',
        payload: 'Error de conexión. Intenta de nuevo.',
      });
    }
  };

  const resetForm = () => {
    dispatch({ type: 'RESET_FORM' });
  };

  return {
    state,
    dispatch,
    handleLogin,
    handleGoogleLogin,
    resetForm,
    reenviarCorreo,
  };
};
