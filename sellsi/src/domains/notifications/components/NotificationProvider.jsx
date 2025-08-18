import React, { createContext, useContext } from 'react';
import { useAuth } from '../../../infrastructure/providers/AuthProvider';
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
  return <NotificationsContext.Provider value={notif}>{children}</NotificationsContext.Provider>;
};

export const useNotificationsContext = () => useContext(NotificationsContext);
