// Command: Crear notificaciones de nuevo pedido para supplier y buyer
import { notificationService } from '../../domain/services/NotificationService';

export async function NotifyNewOrder(orderRow) {
  try { await notificationService.notifyNewOrder(orderRow); } catch (_) {}
}
