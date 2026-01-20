import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from '../../../infrastructure/providers';
import { supabase } from '../../../services/supabase';
import { useNotifications } from '../hooks/useNotifications';

const NotificationsContext = createContext(null);

export const NotificationsProvider = ({ children }) => {
  const { session } = useAuth?.() || { session: null }; // fallback if hook absent
  const userId = session?.user?.id || null;
  const { needsOnboarding } = useAuth();
  const notif = useNotifications(userId);

  // Create welcome notification once if onboarding needed
  React.useEffect(() => {
    if (userId && needsOnboarding) {
      (async () => {
        try { await supabase.rpc('create_welcome_notification', { p_user_id: userId }); } catch (_) {}
      })();
    }
  }, [userId, needsOnboarding]);
  
  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => notif, [notif]);
  
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
};

export const useNotificationsContext = () => useContext(NotificationsContext);
