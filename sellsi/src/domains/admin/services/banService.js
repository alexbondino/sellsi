/**
 * 🔒 Servicio de Sistema de Baneos - Dominio Admin
 * 
 * Re-export del servicio de baneos que está en el dominio de security
 * ya que la funcionalidad de baneos es transversal entre admin y security
 * 
 * @author Panel Administrativo Sellsi
 * @date 21 de Julio de 2025 - Migrado a domains/admin/services/
 */

// Re-export desde la ubicación en security (es la ubicación correcta)
export * from '../../../services/security/banService'

// Exportar la instancia por defecto
export { default } from '../../../services/security/banService'

// Exportar también como banService nombrado para conveniencia
export { default as banService } from '../../../services/security/banService'
