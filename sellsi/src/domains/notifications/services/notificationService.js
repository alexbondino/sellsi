// Minimal client-side service wrapper. Insert operations should ideally be done via secure edge functions.
// Adjust path if project organizes supabase client differently
import { supabase } from '../../../services/supabase';

const PAGE_SIZE = 20;

class NotificationService {
  async fetchInitial(limit = PAGE_SIZE, userId) {
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query;
    if (error) {
      // eslint-disable-next-line no-console
      console.error('[notificationService.fetchInitial] error', error);
      throw error;
    }
    return data || [];
  }
  async fetchOlder(beforeCreatedAt, limit = PAGE_SIZE, userId) {
    let query = supabase
      .from('notifications')
      .select('*')
      .lt('created_at', beforeCreatedAt)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query;
    if (error) {
      // eslint-disable-next-line no-console
      console.error('[notificationService.fetchOlder] error', error);
      throw error;
    }
    return data || [];
  }
  async markRead(ids) {
    if (!Array.isArray(ids)) ids = [ids];
    if (!ids.length) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .in('id', ids);
    if (error) {
      // eslint-disable-next-line no-console
      console.error('[notificationService.markRead] error', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
