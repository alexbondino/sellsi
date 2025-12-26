import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react';
import { supabase, invalidateAuthUserCache } from '../../services/supabase';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  getUserProfile,
  invalidateUserProfileCache,
} from '../../services/user/profileService';
import { onAuthStarted, onAuthCleared } from '../auth/AuthReadyCoordinator';
// 🧹 Imports para Nuclear Cleanup (Kill Switch - Fase 1)
import { useOrdersStore } from '../../shared/stores/orders/ordersStore';
import { useOfferStore } from '../../stores/offerStore';
import useCartHistory from '../../shared/stores/cart/useCartHistory';
import { useNotificationsStore } from '../../domains/notifications/store/notificationsStore';
import { queryClient } from '../../utils/queryClient';
import useSupplierProductsBase from '../../workspaces/supplier/shared-hooks/useSupplierProductsBase';
import useSupplierProductsCRUD from '../../workspaces/supplier/shared-hooks/useSupplierProductsCRUD';
import useSupplierProductFilters from '../../workspaces/supplier/shared-hooks/useSupplierProductFilters';
import useProductImages from '../../workspaces/supplier/shared-hooks/useProductImages';
import useProductSpecifications from '../../workspaces/supplier/shared-hooks/useProductSpecifications';
import useProductPriceTiers from '../../workspaces/supplier/shared-hooks/useProductPriceTiers';
import useProductBackground from '../../workspaces/supplier/shared-hooks/useProductBackground';
import useProductCleanup from '../../workspaces/supplier/shared-hooks/useProductCleanup';
import { STORAGE_KEY } from '../../shared/stores/cart/cartStore.constants';

// Unified Auth + Role Context
const UnifiedAuthContext = createContext();

// Backward compatibility: expose useAuth (new) and useRole (alias)
export const useAuth = () => {
  const ctx = useContext(UnifiedAuthContext);
  if (!ctx) throw new Error('useAuth must be used within UnifiedAuthProvider');
  return ctx;
};

export const useRole = () => {
  // Alias so existing imports continue working after updating barrel file
  return useAuth();
};

const USER_NAME_STATUS = { PENDING: 'pendiente' };

/**
 * ☢️ NUCLEAR CLEANUP - Kill Switch para logout
 * Limpia TODOS los caches, stores y localStorage del usuario anterior
 * Resuelve Bugs: 6, 10, 12, 13, 14, 15, 16, 17, 18, 19, 20
 */
const performNuclearCleanup = () => {
  console.warn('☢️ NUCLEAR CLEANUP - Limpiando sesión anterior ☢️');

  // 1. Auth Ready Coordinator
  try {
    onAuthCleared();
  } catch (e) {}

  // 2. Stores Zustand (Bugs 12, 13, 14, 15)
  try {
    useOrdersStore.getState().clearOrders();
  } catch (e) {
    console.debug('clearOrders:', e);
  }
  try {
    useCartHistory.getState().clearHistory();
  } catch (e) {
    console.debug('clearHistory:', e);
  }
  try {
    useOfferStore.getState().clearOffersCache();
  } catch (e) {
    console.debug('clearOffersCache:', e);
  }
  try {
    useNotificationsStore.getState().reset?.();
  } catch (e) {
    console.debug('notifications reset:', e);
  }

  // 2.1 Stores de Productos del Proveedor (Bug: productos de cuenta anterior visibles)
  try {
    useSupplierProductsBase.getState().reset?.();
  } catch (e) {
    console.debug('supplier products base reset:', e);
  }
  try {
    useSupplierProductsCRUD.getState().reset?.();
  } catch (e) {
    console.debug('supplier products CRUD reset:', e);
  }
  try {
    useSupplierProductFilters.getState().reset?.();
  } catch (e) {
    console.debug('supplier filters reset:', e);
  }
  try {
    useProductImages.getState().reset?.();
  } catch (e) {
    console.debug('product images reset:', e);
  }
  try {
    useProductSpecifications.getState().reset?.();
  } catch (e) {
    console.debug('product specifications reset:', e);
  }
  try {
    useProductPriceTiers.getState().reset?.();
  } catch (e) {
    console.debug('product price tiers reset:', e);
  }
  try {
    useProductBackground.getState().reset?.();
  } catch (e) {
    console.debug('product background reset:', e);
  }
  try {
    useProductCleanup.getState().reset?.();
  } catch (e) {
    console.debug('product cleanup reset:', e);
  }

  // 3. React Query (Bug 20) - Cache de 15-30min
  try {
    queryClient.clear();
  } catch (e) {
    console.debug('queryClient.clear:', e);
  }

  // 4. Realtime Subscriptions (Bugs 17, 18)
  try {
    delete window.__ordersRealtimeSubscribed;
    useOrdersStore.getState().unsubscribeRealtime?.();
  } catch (e) {}
  try {
    useOfferStore.getState().unsubscribeAll?.();
  } catch (e) {}

  // 5. Caches de servicio (Bugs 10, 19)
  try {
    invalidateUserProfileCache();
  } catch (e) {}
  try {
    invalidateAuthUserCache();
  } catch (e) {}

  // 6. localStorage (Bugs 14, 16)
  [
    'user_id',
    'account_type',
    'supplierid',
    'sellerid',
    'access_token',
    'auth_token',
    'currentAppRole',
    STORAGE_KEY,
    'notifications_forced_read',
    'notifications_read_buffer',
  ].forEach(k => {
    try {
      localStorage.removeItem(k);
    } catch (e) {}
  });

  // 7. sessionStorage (Bug 6)
  try {
    sessionStorage.clear();
  } catch (e) {}

  // 8. Legacy invalidators (redundancia por seguridad)
  try {
    window.invalidateUserShippingRegionCache?.();
  } catch (e) {}
  try {
    window.invalidateTransferInfoCache?.();
  } catch (e) {}
  try {
    window.invalidateBillingInfoCache?.();
  } catch (e) {}
  try {
    window.invalidateShippingInfoCache?.();
  } catch (e) {}
  try {
    window.invalidateProductsCache?.();
  } catch (e) {}

  console.log('✅ Nuclear Cleanup Completado');
};

export const UnifiedAuthProvider = ({ children }) => {
  // mount/unmount debug logging removed

  // Auth state
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loadingUserStatus, setLoadingUserStatus] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Role state (manual override stored between sessions)
  const [manualRoleOverride, setManualRoleOverride] = useState(() => {
    try {
      const stored = localStorage.getItem('currentAppRole');
      if (stored === 'supplier' || stored === 'buyer') return stored;
    } catch (e) {}
    return null; // null means derive from profile
  });

  const navigate = useNavigate();
  const location = useLocation();
  const lastSessionIdRef = useRef(null);
  const fetchingUsersRef = useRef(new Set());
  const [isRoleSwitching, setIsRoleSwitching] = useState(false);
  const [lastMainSupplier, setLastMainSupplier] = useState(null);

  // Fetch + profile logic
  const fetchProfile = async currentSession => {
    if (!currentSession?.user) {
      setUserProfile(null);
      setNeedsOnboarding(false);
      setLoadingUserStatus(false);
      try {
        localStorage.removeItem('user_id');
      } catch (e) {}
      return;
    }

    const userId = currentSession.user.id;

    // If another fetch for the same user is in flight, skip duplicate work
    if (fetchingUsersRef.current.has(userId)) {
      setLoadingUserStatus(false);
      return;
    }

    // If we already loaded this user's profile for the same session id, skip
    if (lastSessionIdRef.current === userId && userProfile) {
      setLoadingUserStatus(false);
      return;
    }

    lastSessionIdRef.current = userId;
    try {
      localStorage.setItem('user_id', userId);
    } catch (e) {}
    fetchingUsersRef.current.add(userId);

    try {
      // 🔧 OPTIMIZADO: Reutilizar profileService con cache (reduce queries duplicadas)
      const { data: fullProfile, error } = await getUserProfile(userId);

      // Extraer solo los campos necesarios para auth state
      // Incluir user_id para que componentes como WhatsAppWidget puedan
      // mostrar un identificador corto sin caer en 'N/A'. Si fullProfile
      // no contiene user_id, usar el id de sesión (userId) como fallback.
      const userData = fullProfile
        ? {
            user_id: fullProfile.user_id || userId,
            user_nm: fullProfile.user_nm,
            main_supplier: fullProfile.main_supplier,
            logo_url: fullProfile.logo_url,
            email: fullProfile.email,
            verified: fullProfile.verified || false,
            verified_at: fullProfile.verified_at || null,
          }
        : null;

      // 🔧 Si el perfil no existe, crearlo automáticamente
      if (error || !userData) {
        console.log('📝 Perfil no encontrado, creando automáticamente...');

        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert({
            user_id: userId,
            email: currentSession.user.email,
            user_nm: USER_NAME_STATUS.PENDING,
            main_supplier: true,
            country: 'No especificado',
          })
          .select(
            'user_nm, main_supplier, logo_url, email, verified, verified_at'
          )
          .single();

        if (createError) {
          console.error('❌ Error creando perfil automático:', createError);
          setNeedsOnboarding(true);
          setUserProfile(null);
          setLoadingUserStatus(false);
          try {
            localStorage.removeItem('user_id');
          } catch (e) {}
          return;
        }

        console.log('✅ Perfil creado automáticamente');
        // Invalidar cache para que próxima llamada obtenga el perfil nuevo
        invalidateUserProfileCache(userId);
        setNeedsOnboarding(true); // Nuevo perfil siempre necesita onboarding
        // Asegurar que el nuevo perfil expuesto incluya user_id para consumidores
        setUserProfile({ ...newProfile, user_id: userId });
        setLoadingUserStatus(false);
        return;
      }

      // Perfil encontrado exitosamente
      if (
        !userData ||
        userData.user_nm?.toLowerCase() === USER_NAME_STATUS.PENDING
      ) {
        setNeedsOnboarding(true);
        setUserProfile(userData);
      } else {
        setNeedsOnboarding(false);
        setUserProfile(userData);
        setLastMainSupplier(userData.main_supplier);
      }
      setLoadingUserStatus(false);
    } catch (unexpectedError) {
      console.error('❌ Error inesperado en fetchProfile:', unexpectedError);
      setNeedsOnboarding(true);
      setUserProfile(null);
      setLoadingUserStatus(false);
      try {
        localStorage.removeItem('user_id');
      } catch (e) {}
    } finally {
      try {
        fetchingUsersRef.current.delete(userId);
      } catch (_) {}
    }
  };

  // Initial session & listener
  useEffect(() => {
    let mounted = true;
    setLoadingUserStatus(true);
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;

      // ⚠️ RECOVERY MODE: Detectar tokens de recovery en URL ANTES de procesar
      const currentUrl = window.location.href;
      const hashMatch =
        currentUrl.match(/#.*type=recovery/) ||
        currentUrl.match(/#.*access_token=.*&.*refresh_token=/);
      const isRecoveryUrl =
        hashMatch || currentUrl.includes('/auth/reset-password');
      const isRecoveryMode = localStorage.getItem('recovery_mode') === 'true';

      if (isRecoveryUrl || isRecoveryMode) {
        console.log(
          '🔐 Sesión inicial durante recovery mode - NO fetching profile ni redirigiendo'
        );
        console.log('  isRecoveryUrl:', !!isRecoveryUrl);
        console.log('  isRecoveryMode:', isRecoveryMode);
        setSession(data.session);
        setLoadingUserStatus(false);
        return;
      }

      setSession(data.session);
      // ✅ FIX: Disparar user-changed también cuando se restaura sesión existente (F5)
      // Esto permite que los hooks de billing/transfer/shipping recarguen sus datos
      if (data.session?.user?.id) {
        try {
          localStorage.setItem('user_id', data.session.user.id);
        } catch (e) {}
        // Delay pequeño para asegurar que los hooks ya están montados y escuchando
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent('user-changed', {
              detail: { userId: data.session.user.id },
            })
          );
        }, 50);
      }
      fetchProfile(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!mounted) return;
        if (event === 'SIGNED_IN') {
          // ⚠️ RECOVERY MODE: Detectar tokens de recovery en URL o localStorage
          const currentUrl = window.location.href;
          const hashMatch =
            currentUrl.match(/#.*type=recovery/) ||
            currentUrl.match(/#.*access_token=.*&.*refresh_token=/);
          const isRecoveryUrl =
            hashMatch || currentUrl.includes('/auth/reset-password');
          const isRecoveryMode =
            localStorage.getItem('recovery_mode') === 'true';

          if (isRecoveryUrl || isRecoveryMode) {
            console.log(
              '🔐 SIGNED_IN durante recovery mode - ignorando auto-redirect'
            );
            console.log('  isRecoveryUrl:', !!isRecoveryUrl);
            console.log('  isRecoveryMode:', isRecoveryMode);
            setSession(newSession);
            // NO llamar fetchProfile ni redirigir - el usuario está cambiando contraseña
            return;
          }

          setSession(newSession);
          if (newSession?.user?.id) {
            try {
              localStorage.setItem('user_id', newSession.user.id);
            } catch (e) {}
          }
          // 🔄 Iniciar coordinación de auth-ready (los caches deben notificar cuando estén listos)
          try {
            onAuthStarted();
          } catch (e) {}
          try {
            window.invalidateUserShippingRegionCache?.();
          } catch (e) {}
          try {
            window.invalidateTransferInfoCache?.();
          } catch (e) {}
          try {
            window.invalidateBillingInfoCache?.();
          } catch (e) {}
          try {
            window.invalidateShippingInfoCache?.();
          } catch (e) {}
          try {
            window.globalCache?.clear?.();
          } catch (e) {}
          // Dispatch custom event for user change (sin delay para reducir race conditions)
          window.dispatchEvent(
            new CustomEvent('user-changed', {
              detail: { userId: newSession?.user?.id },
            })
          );
          fetchProfile(newSession);
        } else if (event === 'TOKEN_REFRESHED') {
          // ✅ FIX Bug 9: TOKEN_REFRESHED NO es logout
          // Supabase renueva JWT cada ~1 hora, solo actualizar session
          setSession(newSession);
          // NO limpiar localStorage, NO invalidar caches, NO disparar user-changed con null
        } else if (event === 'SIGNED_OUT') {
          // 🧹 SIGNED_OUT real: Limpieza total con Nuclear Cleanup
          performNuclearCleanup();
          setSession(null);
          setManualRoleOverride(null);
          window.dispatchEvent(
            new CustomEvent('user-changed', { detail: { userId: null } })
          );
          // fetchProfile(null) no es necesario - ya está todo limpio
        } else if (event === 'USER_UPDATED') {
          setSession(newSession);
          if (newSession?.user?.id) {
            try {
              localStorage.setItem('user_id', newSession.user.id);
            } catch (e) {}
          }
          try {
            window.invalidateUserShippingRegionCache?.();
          } catch (e) {}
          try {
            window.invalidateTransferInfoCache?.();
          } catch (e) {}
          try {
            window.invalidateBillingInfoCache?.();
          } catch (e) {}
          try {
            window.invalidateShippingInfoCache?.();
          } catch (e) {}
        }
      }
    );
    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const refreshUserProfile = async () => {
    if (!session?.user?.id) return;
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('user_id, user_nm, main_supplier, logo_url')
        .eq('user_id', session.user.id)
        .single();
      if (!error && userData) {
        setUserProfile(userData);
        setLastMainSupplier(userData.main_supplier);
        setNeedsOnboarding(
          !userData ||
            userData.user_nm?.toLowerCase() === USER_NAME_STATUS.PENDING
        );
      }
    } catch (e) {}
  };

  // Derived role (manualOverride > profile > null)
  const derivedRole = useMemo(() => {
    if (manualRoleOverride) return manualRoleOverride;
    if (!userProfile) return session ? null : 'buyer'; // default buyer when not logged
    return userProfile.main_supplier ? 'supplier' : 'buyer';
  }, [manualRoleOverride, userProfile, session]);

  // 🆕 AUTO-SYNC: Sincronizar derivedRole con pathname automáticamente
  // Soluciona bug donde TopBar se actualiza pero Sidebar no al navegar con URL directa
  useEffect(() => {
    if (!session) return; // Solo para usuarios logueados

    const pathname = location.pathname;

    // Detectar navegación a workspace buyer
    if (pathname.startsWith('/buyer/')) {
      if (derivedRole !== 'buyer') {
        setManualRoleOverride('buyer');
      }
    }
    // Detectar navegación a workspace supplier
    else if (
      pathname.startsWith('/supplier/') ||
      pathname.startsWith('/provider/')
    ) {
      if (derivedRole !== 'supplier') {
        setManualRoleOverride('supplier');
      }
    }
  }, [location.pathname, derivedRole, session]);

  // Sync manual override to storage
  useEffect(() => {
    if (manualRoleOverride) {
      try {
        localStorage.setItem('currentAppRole', manualRoleOverride);
      } catch (e) {}
    } else {
      // If cleared, remove to allow profile derivation next session
      try {
        localStorage.removeItem('currentAppRole');
      } catch (e) {}
    }
  }, [manualRoleOverride]);

  // Detect profile main_supplier transitions (granting supplier) ONLY if no manual override
  useEffect(() => {
    if (!userProfile) return;
    if (lastMainSupplier === null) return; // first set handled already
    if (manualRoleOverride) return; // user chose manually
    if (userProfile.main_supplier !== lastMainSupplier) {
      setLastMainSupplier(userProfile.main_supplier);
    }
  }, [userProfile?.main_supplier]);

  // Public API to change role manually (keeps navigation logic minimal)
  const handleRoleChange = (newRole, { skipNavigation = false } = {}) => {
    setManualRoleOverride(newRole);
    if (!skipNavigation) {
      setIsRoleSwitching(true);
      navigate(
        newRole === 'supplier' ? '/supplier/home' : '/buyer/marketplace'
      );
    }
  };

  useEffect(() => {
    if (isRoleSwitching) {
      if (
        (derivedRole === 'supplier' &&
          location.pathname.startsWith('/supplier')) ||
        (derivedRole === 'buyer' && location.pathname.startsWith('/buyer'))
      ) {
        setIsRoleSwitching(false);
      }
    }
  }, [isRoleSwitching, derivedRole, location.pathname]);

  // Redirect neutrals to dashboard after auth ready & profile available
  useEffect(() => {
    const neutral = new Set([
      '/',
      '/marketplace',
      '/terms-and-conditions',
      '/privacy-policy',
    ]);
    if (!loadingUserStatus && session && !needsOnboarding && userProfile) {
      if (
        neutral.has(location.pathname) &&
        !['/terms-and-conditions', '/privacy-policy'].includes(
          location.pathname
        )
      ) {
        const target = userProfile.main_supplier
          ? '/supplier/home'
          : '/buyer/marketplace';
        if (location.pathname !== target) navigate(target, { replace: true });
      }
    }
  }, [
    loadingUserStatus,
    session,
    needsOnboarding,
    userProfile,
    location.pathname,
  ]);

  // Redirect onboarding when needed
  useEffect(() => {
    if (session && needsOnboarding && location.pathname !== '/onboarding') {
      navigate('/onboarding', { replace: true });
    }
  }, [session, needsOnboarding, location.pathname]);

  // Redirect after logout away from private routes
  useEffect(() => {
    if (!loadingUserStatus && !session) {
      const allowed = [
        '/',
        '/marketplace',
        '/login',
        '/crear-cuenta',
        '/onboarding',
        '/terms-and-conditions',
        '/privacy-policy',
        '/tailwind',
      ];
      const isAllowed = allowed.some(
        r =>
          location.pathname === r ||
          location.pathname.startsWith('/marketplace/product') ||
          location.pathname.startsWith('/catalog/')
      );
      if (!isAllowed) navigate('/', { replace: true });
    }
  }, [session, loadingUserStatus, location.pathname]);

  const isRoleLoading = derivedRole === null && session && !loadingUserStatus;
  const isBuyer = derivedRole === 'buyer';

  // Dashboard route detection (controls SideBar/layout adjustments)
  const isDashboardRoute = useMemo(() => {
    const p = location.pathname;
    // Any authenticated buyer/supplier namespace route counts as dashboard layout
    if (p.startsWith('/buyer/') || p.startsWith('/supplier/')) return true;
    // Product detail pages under marketplace should also use the dashboard layout
    // so the SideBar appears when viewing a product (this was previously shown)
    if (p.startsWith('/marketplace/product')) return true;
    // Provider catalog should also show the sidebar for consistent navigation
    if (p.startsWith('/catalog/')) return true;
    return false;
  }, [location.pathname]);

  const value = useMemo(
    () => ({
      // Auth
      session,
      userProfile,
      loadingUserStatus,
      needsOnboarding,
      refreshUserProfile,
      // Role
      currentAppRole: derivedRole,
      isBuyer,
      isRoleLoading,
      isRoleSwitching,
      handleRoleChange,
      redirectToInitialHome: () => {
        if (userProfile) {
          navigate(
            userProfile.main_supplier ? '/supplier/home' : '/buyer/marketplace',
            { replace: true }
          );
        }
      },
      // Layout helpers
      isDashboardRoute,
      // Backwards compatibility naming
      role: derivedRole,
    }),
    [
      session,
      userProfile,
      loadingUserStatus,
      needsOnboarding,
      derivedRole,
      isBuyer,
      isRoleLoading,
      isRoleSwitching,
      isDashboardRoute,
    ]
  );

  return (
    <UnifiedAuthContext.Provider value={value}>
      {children}
    </UnifiedAuthContext.Provider>
  );
};
