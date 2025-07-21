/**
 * 🏗️ Dominio Admin - Punto de Entrada Principal
 * 
 * Dominio administrativo completo de Sellsi con estructura consistente.
 * 
 * Estructura del Dominio Admin:
 * - services/: Servicios de negocio específicos del dominio
 * - hooks/: (futuro) Hooks React específicos del dominio  
 * - types/: (futuro) Tipos TypeScript del dominio
 * - utils/: (futuro) Utilidades específicas del dominio
 * 
 * @author Panel Administrativo Sellsi
 * @date 21 de Julio de 2025 - Migrado según PLANREFACTOR.md paso 4
 */

// ========================================
// 🔧 SERVICIOS DEL DOMINIO ADMIN
// ========================================

// Re-export todos los servicios del dominio
export * from './services'

// Export con namespace para mejor organización
export * as AdminServices from './services'

// ========================================
// 🔗 COMPATIBILIDAD LEGACY
// ========================================

/**
 * @deprecated Use AdminServices or direct imports instead
 * Mantiene compatibilidad con código legacy que usa adminPanelService
 */
export { AdminPanelService } from './services'
