// Minimal client-side service wrapper. Insert operations should ideally be done via secure edge functions.
// Adjust path if project organizes supabase client differently
import { supabase } from '../../../services/supabase';

const PAGE_SIZE = 20;

class NotificationService {
  async fetchInitial(limit = PAGE_SIZE) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }
  async fetchOlder(beforeCreatedAt, limit = PAGE_SIZE) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .lt('created_at', beforeCreatedAt)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }
  async markRead(ids) {
    if (!Array.isArray(ids)) ids = [ids];
    if (!ids.length) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .in('id', ids);
    if (error) throw error;
  }
}

export const notificationService = new NotificationService();
export default notificationService;
