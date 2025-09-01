import React, { createContext, useContext, useEffect, useRef, useState, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { useLocation, useNavigate } from 'react-router-dom';

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

export const UnifiedAuthProvider = ({ children }) => {
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
    } catch(e) {}
    return null; // null means derive from profile
  });

  const navigate = useNavigate();
  const location = useLocation();
  const lastSessionIdRef = useRef(null);
  const [isRoleSwitching, setIsRoleSwitching] = useState(false);
  const [lastMainSupplier, setLastMainSupplier] = useState(null);

  // Fetch + profile logic
  const fetchProfile = async (currentSession) => {
    if (!currentSession?.user) {
      setUserProfile(null);
      setNeedsOnboarding(false);
      setLoadingUserStatus(false);
      try { localStorage.removeItem('user_id'); } catch(e) {}
      return;
    }

    lastSessionIdRef.current = currentSession.user.id;
    try { localStorage.setItem('user_id', currentSession.user.id); } catch(e) {}

    const { data: userData, error } = await supabase
      .from('users')
      .select('user_nm, main_supplier, logo_url')
      .eq('user_id', currentSession.user.id)
      .single();

    if (error) {
      setNeedsOnboarding(true);
      setUserProfile(null);
      setLoadingUserStatus(false);
      try { localStorage.removeItem('user_id'); } catch(e) {}
      return;
    }

    if (!userData || userData.user_nm?.toLowerCase() === USER_NAME_STATUS.PENDING) {
      setNeedsOnboarding(true);
      setUserProfile(null);
      try { localStorage.removeItem('user_id'); } catch(e) {}
    } else {
      setNeedsOnboarding(false);
      setUserProfile(userData);
      setLastMainSupplier(userData.main_supplier);
    }
    setLoadingUserStatus(false);
  };

  // Initial session & listener
  useEffect(() => {
    let mounted = true;
    setLoadingUserStatus(true);
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      fetchProfile(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      if (event === 'SIGNED_IN') {
        setSession(newSession);
        if (newSession?.user?.id) {
          try { localStorage.setItem('user_id', newSession.user.id); } catch(e) {}
        }
        try { window.invalidateUserShippingRegionCache?.(); } catch(e) {}
        try { window.invalidateTransferInfoCache?.(); } catch(e) {}
        try { window.invalidateBillingInfoCache?.(); } catch(e) {}
        fetchProfile(newSession);
      } else if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        setSession(newSession);
        // Clear storage related to user & role
        ['user_id','account_type','supplierid','sellerid','access_token','auth_token','currentAppRole'].forEach(k=>{ try{localStorage.removeItem(k);}catch(e){} });
        try { window.invalidateUserShippingRegionCache?.(); } catch(e) {}
        try { window.invalidateTransferInfoCache?.(); } catch(e) {}
        try { window.invalidateBillingInfoCache?.(); } catch(e) {}
        // Reset manual override
        setManualRoleOverride(null);
        fetchProfile(newSession);
      } else if (event === 'USER_UPDATED') {
        setSession(newSession);
        if (newSession?.user?.id) {
          try { localStorage.setItem('user_id', newSession.user.id); } catch(e) {}
        }
        try { window.invalidateUserShippingRegionCache?.(); } catch(e) {}
        try { window.invalidateTransferInfoCache?.(); } catch(e) {}
        try { window.invalidateBillingInfoCache?.(); } catch(e) {}
      }
    });
    return () => { mounted = false; listener?.subscription?.unsubscribe(); };
  }, []);

  const refreshUserProfile = async () => {
    if (!session?.user?.id) return;
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('user_nm, main_supplier, logo_url')
        .eq('user_id', session.user.id)
        .single();
      if (!error && userData) {
        setUserProfile(userData);
        setLastMainSupplier(userData.main_supplier);
      }
    } catch(e) {}
  };

  // Derived role (manualOverride > profile > null)
  const derivedRole = useMemo(() => {
    if (manualRoleOverride) return manualRoleOverride;
    if (!userProfile) return session ? null : 'buyer'; // default buyer when not logged
    return userProfile.main_supplier ? 'supplier' : 'buyer';
  }, [manualRoleOverride, userProfile, session]);

  // Sync manual override to storage
  useEffect(() => {
    if (manualRoleOverride) {
      try { localStorage.setItem('currentAppRole', manualRoleOverride); } catch(e) {}
    } else {
      // If cleared, remove to allow profile derivation next session
      try { localStorage.removeItem('currentAppRole'); } catch(e) {}
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
      navigate(newRole === 'supplier' ? '/supplier/home' : '/buyer/marketplace');
    }
  };

  useEffect(() => {
    if (isRoleSwitching) {
      if ((derivedRole === 'supplier' && location.pathname.startsWith('/supplier')) ||
          (derivedRole === 'buyer' && location.pathname.startsWith('/buyer'))) {
        setIsRoleSwitching(false);
      }
    }
  }, [isRoleSwitching, derivedRole, location.pathname]);

  // Redirect neutrals to dashboard after auth ready & profile available
  useEffect(() => {
    const neutral = new Set(['/', '/marketplace', '/catalog', '/technicalspecs', '/terms-and-conditions', '/privacy-policy']);
    if (!loadingUserStatus && session && !needsOnboarding && userProfile) {
      if (neutral.has(location.pathname) && !['/terms-and-conditions','/privacy-policy'].includes(location.pathname)) {
        const target = userProfile.main_supplier ? '/supplier/home' : '/buyer/marketplace';
        if (location.pathname !== target) navigate(target, { replace: true });
      }
    }
  }, [loadingUserStatus, session, needsOnboarding, userProfile, location.pathname]);

  // Redirect onboarding when needed
  useEffect(() => {
    if (session && needsOnboarding && location.pathname !== '/onboarding') {
      navigate('/onboarding', { replace: true });
    }
  }, [session, needsOnboarding, location.pathname]);

  // Redirect after logout away from private routes
  useEffect(() => {
    if (!loadingUserStatus && !session) {
      const allowed = [ '/', '/marketplace', '/login', '/crear-cuenta', '/onboarding', '/terms-and-conditions', '/privacy-policy' ];
      const isAllowed = allowed.some(r => location.pathname === r || location.pathname.startsWith('/technicalspecs'));
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
  return false;
  }, [location.pathname]);

  const value = useMemo(() => ({
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
        navigate(userProfile.main_supplier ? '/supplier/home' : '/buyer/marketplace', { replace: true });
      }
    },
    // Layout helpers
    isDashboardRoute,
    // Backwards compatibility naming
    role: derivedRole,
  }), [session, userProfile, loadingUserStatus, needsOnboarding, derivedRole, isBuyer, isRoleLoading, isRoleSwitching, isDashboardRoute]);

  return <UnifiedAuthContext.Provider value={value}>{children}</UnifiedAuthContext.Provider>;
};
