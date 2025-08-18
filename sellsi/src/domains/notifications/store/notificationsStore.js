import { create } from 'zustand';

const MAX_CACHE = 100;

export const useNotificationsStore = create((set, get) => ({
  notifications: [], // newest first
  unreadCount: 0,
  hasMore: true,
  isLoading: false,
  activeTab: 'all',
  pendingMarkReadIds: new Set(),

  bootstrap(list = []) {
    const ordered = list.slice().sort((a,b)=> new Date(b.created_at)-new Date(a.created_at));
    const unreadCount = ordered.filter(n=>!n.is_read).length;
    set({ notifications: ordered, unreadCount, hasMore: ordered.length >= 20 });
  },
  add(notification) {
    const { notifications } = get();
    // simple dedupe by id
    if (notifications.find(n=>n.id === notification.id)) return;
    const next = [notification, ...notifications].slice(0, MAX_CACHE);
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
}));
