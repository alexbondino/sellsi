import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../../services/supabase';

// Constante para el estado pendiente del nombre de usuario
const USER_NAME_STATUS = {
  PENDING: 'pendiente',
};

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loadingUserStatus, setLoadingUserStatus] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  
  // Persistente entre renders
  const lastSessionIdRef = useRef(null);

  const checkUserAndFetchProfile = async (currentSession) => {
    if (!currentSession || !currentSession.user) {
      setUserProfile(null);
      setNeedsOnboarding(false);
      setLoadingUserStatus(false);
      // Limpiar user_id global
      try { 
        localStorage.removeItem('user_id'); 
      } catch (e) {}
      return;
    }

    // Siempre forzar la obtención del perfil tras SIGNED_IN
    lastSessionIdRef.current = currentSession.user.id;
    
    // Guardar user_id globalmente en localStorage
    try { 
      localStorage.setItem('user_id', currentSession.user.id); 
    } catch (e) {}

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_nm, main_supplier, logo_url')
      .eq('user_id', currentSession.user.id)
      .single();

    if (userError) {
      setNeedsOnboarding(true);
      setUserProfile(null);
      setLoadingUserStatus(false);
      // Limpiar user_id global
      try { 
        localStorage.removeItem('user_id'); 
      } catch (e) {}
      return;
    }

    if (!userData || userData.user_nm?.toLowerCase() === USER_NAME_STATUS.PENDING) {
      setNeedsOnboarding(true);
      setUserProfile(null);
      // Limpiar user_id global
      try { 
        localStorage.removeItem('user_id'); 
      } catch (e) {}
    } else {
      setNeedsOnboarding(false);
      setUserProfile(userData);
    }
    setLoadingUserStatus(false);
  };

  useEffect(() => {
    let mounted = true;
    setLoadingUserStatus(true);
    setNeedsOnboarding(false);

    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        checkUserAndFetchProfile(data.session);
      }
    });

    // Listener para cambios de autenticación
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (mounted) {
          if (event === 'SIGNED_IN') {
            setSession(newSession);
            // Guardar user_id globalmente en localStorage
            if (newSession?.user?.id) {
              try { 
                localStorage.setItem('user_id', newSession.user.id); 
              } catch (e) {}
            }
            // Forzar obtención del perfil incluso si el usuario ya estaba en sesión
            checkUserAndFetchProfile(newSession);
          } else if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
            // Limpiar localStorage de toda la sesión
            localStorage.removeItem('user_id');
            localStorage.removeItem('account_type');
            localStorage.removeItem('supplierid');
            localStorage.removeItem('sellerid');
            localStorage.removeItem('access_token');
            localStorage.removeItem('auth_token');
            setSession(newSession);
            checkUserAndFetchProfile(newSession);
          } else if (event === 'USER_UPDATED') {
            setSession(newSession);
            // Guardar user_id globalmente en localStorage
            if (newSession?.user?.id) {
              try { 
                localStorage.setItem('user_id', newSession.user.id); 
              } catch (e) {}
            }
          }
        }
      }
    );

    return () => {
      mounted = false;
      if (listener?.subscription) {
        listener.subscription.unsubscribe();
      }
    };
  }, []); // SOLO al montar

  // Función para refrescar el perfil del usuario
  const refreshUserProfile = async () => {
    if (!session?.user?.id) return;
    
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_nm, main_supplier, logo_url')
        .eq('user_id', session.user.id)
        .single();

      if (userError) {
        console.error('❌ [AUTH] Error refreshing user profile:', userError.message);
        return;
      }

      if (userData) {
        setUserProfile(userData);
      }
    } catch (error) {
      console.error('❌ [AUTH] Error refreshing user profile:', error);
    }
  };

  const value = {
    session,
    userProfile,
    loadingUserStatus,
    needsOnboarding,
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
