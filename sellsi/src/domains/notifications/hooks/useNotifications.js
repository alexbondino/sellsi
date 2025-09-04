import { useEffect, useCallback, useRef } from 'react';
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
  // Debounce control para refresh de pedidos supplier
  const pendingRefreshRef = useRef(null);
  const triggerOrdersRefresh = useCallback(() => {
    try {
      const { useOrdersStore } = require('../../../shared/stores/orders/ordersStore');
      const { refreshOrders, supplierId } = useOrdersStore.getState();
      if (!supplierId) return;
      if (pendingRefreshRef.current) clearTimeout(pendingRefreshRef.current);
      pendingRefreshRef.current = setTimeout(() => {
        // triple intento escalonado para cubrir ventana de confirmación de pago
        refreshOrders();
        setTimeout(()=>refreshOrders(), 6000);
        setTimeout(()=>refreshOrders(), 15000);
      }, 1200); // pequeño delay para que fila orders se consolide
    } catch(_) {}
  }, []);

  // Initial load
  useEffect(() => {
    if (!userId) return;
    let mounted = true;
    (async () => {
      try {
        const initial = await notificationService.fetchInitial(undefined, userId);
        if (mounted) bootstrap(initial);
        // Reconciliar buffer local de leídos pendiente
        try {
          const LS_KEY = 'notifications_read_buffer';
            const buffered = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
          if (Array.isArray(buffered) && buffered.length) {
            const unreadIds = initial.filter(n=>buffered.includes(n.id) && !n.is_read).map(n=>n.id);
            if (unreadIds.length) {
              markAsRead(unreadIds);
              try { await notificationService.markRead(unreadIds); } catch(_) {}
              // limpiar buffer de los ya aplicados
              const remaining = buffered.filter(id => !unreadIds.includes(id));
              localStorage.setItem(LS_KEY, JSON.stringify(remaining));
            }
          }
        } catch(_) {}
      } catch (e) { console.error('[useNotifications] fetchInitial error', e); }
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
        // Hotfix: si es notificación de nuevo pedido para supplier, refrescar listado
        const n = payload.new;
        if (n?.type === 'order_new' && n?.role_context === 'supplier') {
          triggerOrdersRefresh();
        }
      })
      .subscribe();
    // Poll fallback if no realtime for >120s
    const pollInterval = setInterval(async () => {
      if (Date.now() - lastRealtime > 120000) {
        try {
          const latest = await notificationService.fetchInitial(undefined, userId);
          bootstrap(latest);
          lastRealtime = Date.now();
        } catch (e) { console.error('[useNotifications] poll refresh error', e); }
      }
    }, 30000);
    return () => { try { supabase.removeChannel(channel); } catch (_) {} };
  }, [userId, add, triggerOrdersRefresh]);

  const loadMore = useCallback(async () => {
    if (!notifications.length) return;
    const last = notifications[notifications.length - 1];
    try {
      const older = await notificationService.fetchOlder(last.created_at, undefined, userId);
      appendOlder(older);
    } catch (e) { console.error('[useNotifications] fetchOlder error', e); }
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
