import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * Ruta protegida que verifica solo la autenticación y el estado de onboarding.
 * Cualquier usuario autenticado (comprador o proveedor) y con onboarding completo
 * puede acceder a las rutas envueltas por este componente.
 * @param {React.ReactNode} children - Componentes a renderizar si está autenticado y con onboarding completo
 * @param {string} redirectTo - Ruta a la que redirigir si no está autenticado (default: '/login')
 */
const PrivateRoute = ({
  children,
  redirectTo = '/', // Default redirect for unauthenticated users
}) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false); // To check user_nm status

  // Define USER_NAME_STATUS here or import if it's truly global
  const USER_NAME_STATUS = {
    PENDING: 'pendiente',
  };

  useEffect(() => {
    let mounted = true; // Flag to prevent state updates on unmounted component
    const checkAuthAndOnboarding = async () => {
      try {
        setLoading(true); // Start loading state

        // 1. Check Supabase session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return; // Exit if component unmounted during async operation

        if (!session) {
          // No session means not authenticated
          setIsAuthenticated(false);
          setNeedsOnboarding(false); // No session, so no onboarding to check
          setLoading(false);
          return;
        }

        // If session exists, user is authenticated
        setIsAuthenticated(true);

        // 2. Fetch user profile to check onboarding status (user_nm)
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('user_nm') // Only need user_nm for this check
          .eq('user_id', session.user.id)
          .single();

        if (!mounted) return; // Exit if component unmounted

        if (profileError || !userProfile) {
          console.error(
            'Error fetching user profile for onboarding check:',
            profileError?.message || 'Profile not found.'
          );
          // If profile fetch fails, treat as needs onboarding or unauthenticated for safety
          setIsAuthenticated(false); // Can't verify profile, assume not authenticated
          setNeedsOnboarding(true); // Or force onboarding if profile is missing
          setLoading(false);
          return;
        }

        // 3. Check user_nm for onboarding status
        if (userProfile.user_nm?.toLowerCase() === USER_NAME_STATUS.PENDING) {
          setNeedsOnboarding(true);
        } else {
          setNeedsOnboarding(false);
        }
      } catch (error) {
        console.error('❌ Error in PrivateRoute authentication check:', error);
        setIsAuthenticated(false);
        setNeedsOnboarding(false); // Assume no onboarding needed if error occurs
      } finally {
        if (mounted) {
          setLoading(false); // End loading state
        }
      }
    };

    checkAuthAndOnboarding();

    // Set up auth state change listener
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (mounted) {
          // Re-run the check if authentication state changes
          checkAuthAndOnboarding();
        }
      }
    );

    // Cleanup listener on component unmount
    return () => {
      mounted = false;
      if (listener?.subscription) {
        listener.subscription.unsubscribe();
      }
    };
  }, []); // Empty dependency array means this effect runs once on mount

  // Display loading indicator
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          bgcolor: '#f5f5f5', // Example background color
        }}
      >
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Verificando sesión...
        </Typography>
      </Box>
    );
  }

  // If not authenticated, redirect
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // If authenticated but needs onboarding, redirect to onboarding page
  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  // If authenticated and onboarding complete, render the children
  return children;
};

export default PrivateRoute;
