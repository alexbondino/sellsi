import { useEffect, useCallback } from 'react';
import { useNotificationsStore } from '../store/notificationsStore';
import { notificationService } from '../services/notificationService';
import { timeAgo } from '../utils/timeAgo';
// Ajustar al mismo path utilizado en otros módulos (TopBar, servicios)
import { supabase } from '../../../services/supabase';

export function useNotifications(userId) {
  const {
    notifications,
    unreadCount,
    hasMore,
    activeTab,
    bootstrap,
    add,
    appendOlder,
    markAsRead,
    bulkMarkContext,
    setActiveTab,
  } = useNotificationsStore();

  // Initial load
  useEffect(() => {
    if (!userId) return;
    let mounted = true;
    (async () => {
      try {
        const initial = await notificationService.fetchInitial();
        if (mounted) bootstrap(initial);
      } catch (e) { /* swallow for now */ }
    })();
    return () => { mounted = false; };
  }, [userId, bootstrap]);

  // Realtime
  useEffect(() => {
    if (!userId) return;
    let lastRealtime = Date.now();
    const channel = supabase
      .channel(`notifications_${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, payload => {
        lastRealtime = Date.now();
        add(payload.new);
      })
      .subscribe();
    // Poll fallback if no realtime for >120s
    const pollInterval = setInterval(async () => {
      if (Date.now() - lastRealtime > 120000) {
        try {
          const latest = await notificationService.fetchInitial();
          bootstrap(latest);
          lastRealtime = Date.now();
        } catch (_) {}
      }
    }, 30000);
    return () => { try { supabase.removeChannel(channel); } catch (_) {} };
  }, [userId, add]);

  const loadMore = useCallback(async () => {
    if (!notifications.length) return;
    const last = notifications[notifications.length - 1];
    try {
      const older = await notificationService.fetchOlder(last.created_at);
      appendOlder(older);
    } catch (e) {}
  }, [notifications, appendOlder]);

  const markUnreadTabAsRead = useCallback(async () => {
    const unreadIds = notifications.filter(n=>!n.is_read).map(n=>n.id).slice(0,50);
    if (!unreadIds.length) return;
    markAsRead(unreadIds);
    try { await notificationService.markRead(unreadIds); } catch (_) {}
  }, [notifications, markAsRead]);

  const markContext = useCallback(async (context) => {
    const ids = bulkMarkContext(context);
    if (!ids.length) return;
    try { await notificationService.markRead(ids); } catch (_) {}
  }, [bulkMarkContext]);

  const humanized = notifications.map(n => ({ ...n, time_ago: timeAgo(n.created_at) }));

  return {
    notifications: humanized,
    unreadCount,
    hasMore,
    activeTab,
    loadMore,
    setActiveTab: (tab) => {
      setActiveTab(tab);
      if (tab === 'unread') markUnreadTabAsRead();
    },
  markContext,
  markAsRead, // expose individual mark for UI interactions
  };
}
