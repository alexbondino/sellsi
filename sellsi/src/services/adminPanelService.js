/**
 * 🔧 Servicio del Panel de Control Administrativo - Proxy de Compatibilidad
 * 
 * @deprecated Este archivo mantiene compatibilidad. Para nuevos desarrollos usar:
 * - import { loginAdmin } from './admin/auth/adminAuthService'
 * - import { getUsers } from './admin/users/adminUserService'  
 * - import { getMarketplaceProducts } from './admin/products/adminProductService'
 * 
 * @author Panel Administrativo Sellsi
 * @date 17 de Julio de 2025
 */

// Re-export de compatibilidad
export * from './admin'

// Funciones legacy específicas  
export { validarArchivo } from './admin/files/adminFileService'
export { registrarAccion } from './admin/audit/adminAuditService'
