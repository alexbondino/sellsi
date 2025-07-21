/**
 * 🌐 Servicio de Seguimiento de IPs - Dominio Admin
 * 
 * Re-export del servicio de tracking de IPs que está en el dominio de security
 * ya que la funcionalidad de tracking es transversal entre admin y security
 * 
 * @author Panel Administrativo Sellsi
 * @date 21 de Julio de 2025 - Migrado a domains/admin/services/
 */

// Re-export desde la ubicación en security (es la ubicación correcta)
export * from '../../../services/security/ipTrackingService'
