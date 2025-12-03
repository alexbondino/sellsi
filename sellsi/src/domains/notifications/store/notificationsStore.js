import { create } from 'zustand';
// ESM imports (evitan uso de require en runtime navegador)
import { notificationService } from '../services/notificationService';
import { supabase } from '../../../services/supabase';

const MAX_CACHE = 100;

export const useNotificationsStore = create((set, get) => ({
  notifications: [], // newest first
  unreadCount: 0,
  hasMore: true,
  isLoading: false,
  activeTab: 'all',
  pendingMarkReadIds: new Set(),
  forcedReadIds: new Set((() => { // carga inicial desde localStorage
    try {
      const raw = JSON.parse(localStorage.getItem('notifications_forced_read') || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch(_) { return []; }
  })()),

  __persistForced() {
    try {
      const arr = Array.from(get().forcedReadIds);
      localStorage.setItem('notifications_forced_read', JSON.stringify(arr));
    } catch(_) {}
  },

  bootstrap(list = []) {
    const ordered = list.slice().sort((a,b)=> new Date(b.created_at)-new Date(a.created_at));
  const { forcedReadIds } = get();
  const patched = ordered.map(n => forcedReadIds.has(n.id) ? { ...n, is_read: true } : n);
  const unreadCount = patched.filter(n=>!n.is_read).length;
  set({ notifications: patched, unreadCount, hasMore: patched.length >= 20 });
  },
  add(notification) {
    const { notifications } = get();
    // simple dedupe by id
    if (notifications.find(n=>n.id === notification.id)) return;
  const { forcedReadIds } = get();
  const adjusted = forcedReadIds.has(notification.id) ? { ...notification, is_read: true } : notification;
  const next = [adjusted, ...notifications].slice(0, MAX_CACHE);
    const unreadCount = next.filter(n=>!n.is_read).length;
    set({ notifications: next, unreadCount });
  },
  markAsRead(ids) {
    if (!Array.isArray(ids)) ids = [ids];
    if (!ids.length) return;
    const { notifications } = get();
    let changed = false;
    const idSet = new Set(ids);
    const next = notifications.map(n => {
      if (idSet.has(n.id) && !n.is_read) { changed = true; return { ...n, is_read: true, read_at: new Date().toISOString() }; }
      return n;
    });
    if (changed) {
      const unreadCount = next.filter(n=>!n.is_read).length;
      set({ notifications: next, unreadCount });
      // Persistencia inmediata al backend con retry exponencial (hasta 3 intentos)
  (async () => {
        const LS_KEY = 'notifications_read_buffer';
        // Añadir a forcedReadIds para overlay permanente
        set(state => {
          const fr = new Set(state.forcedReadIds);
          ids.forEach(id => fr.add(id));
          return { forcedReadIds: fr };
        });
        get().__persistForced();
        // Guardar en buffer local inmediatamente (garantiza re-intento tras F5)
        try {
          const existing = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
          const merged = Array.from(new Set([...existing, ...ids]));
          localStorage.setItem(LS_KEY, JSON.stringify(merged));
        } catch(_) {}
        const maxAttempts = 4;
        let lastError = null;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            // Intento 1: usar notificationService (actualiza por RPC/update simple)
            await notificationService.markRead(ids);
            // Verificar que realmente quedaron leídas (defensivo vs RLS)
            const { data: rows, error: selErr } = await supabase
              .from('notifications')
              .select('id,is_read')
              .in('id', ids);
            if (selErr) throw selErr;
            const still = rows.filter(r=>!r.is_read).map(r=>r.id);
            if (still.length === 0) {
              // Limpieza de buffer local: remover ids confirmados
              try {
                const cur = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
                const filtered = cur.filter(id => !ids.includes(id));
                localStorage.setItem(LS_KEY, JSON.stringify(filtered));
              } catch(_) {}
              // Forced read IDs ya persistidos
              break;
            }
            // Reintentar sólo los que faltan
            ids = still;
            lastError = new Error('Rows still unread after update');
          } catch (err) {
            lastError = err;
          }
          if (lastError && attempt < maxAttempts) {
            const delay = 400 * Math.pow(2, attempt - 1); // 400,800,1600 ms
            await new Promise(r => setTimeout(r, delay));
            continue;
          } else {
            break;
          }
        }
        if (lastError) {
          console.warn('[notificationsStore] Persistencia de lectura incompleta:', lastError?.message);
        }
      })();
    }
  },
  bulkMarkContext(context) {
    const { notifications } = get();
    const toMark = notifications.filter(n=>!n.is_read && n.context_section === context).map(n=>n.id);
    if (toMark.length) get().markAsRead(toMark);
    return toMark;
  },
  setActiveTab(tab) { set({ activeTab: tab }); },
  appendOlder(list) {
    if (!list?.length) { set({ hasMore: false }); return; }
    const existing = get().notifications;
    const ids = new Set(existing.map(n=>n.id));
    const merged = [...existing, ...list.filter(n=>!ids.has(n.id))]
      .sort((a,b)=> new Date(b.created_at)-new Date(a.created_at))
      .slice(0, MAX_CACHE);
    const unreadCount = merged.filter(n=>!n.is_read).length;
    set({ notifications: merged, unreadCount, hasMore: list.length >= 20 });
  },

  // 🧹 Reset completo para logout (Bug 14 - Kill Switch)
  reset: () => {
    set({
      notifications: [],
      unreadCount: 0,
      hasMore: true,
      isLoading: false,
      activeTab: 'all',
      pendingMarkReadIds: new Set(),
      forcedReadIds: new Set(),
    });
    try {
      localStorage.removeItem('notifications_forced_read');
      localStorage.removeItem('notifications_read_buffer');
    } catch(_) {}
  },
}));
