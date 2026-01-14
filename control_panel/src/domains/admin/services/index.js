/**
 * 🏗️ Dominio Admin - Servicios Unificados
 * 
 * Punto de entrada principal para todos los servicios del dominio administrativo.
 * Esta estructura sigue el plan de refactor estructural de Sellsi para:
 * 
 * ✅ Eliminar dependencias de adminPanelService.js legacy
 * ✅ Proporcionar estructura consistente
 * ✅ Facilitar mantenimiento y testing
 * ✅ Mejorar separación de responsabilidades
 * 
 * @author Panel Administrativo Sellsi
 * @date 21 de Julio de 2025 - Migrado según PLANREFACTOR.md paso 4
 */

// ========================================
// 🔐 SERVICIOS DE AUTENTICACIÓN
// ========================================
export {
  loginAdmin,
  verify2FA,
  generate2FASecret,
  disable2FA,
  mark2FAAsConfigured,
  verifyAdminSession,
  checkTrustedDevice
} from './adminAuthService'

// ========================================
// 👥 SERVICIOS DE GESTIÓN DE USUARIOS
// ========================================
export {
  getUsers,
  getUserStats,
  banUser,
  unbanUser,
  verifyUser,
  unverifyUser,
  deleteUser,
  deleteMultipleUsers,
  getUserBanHistory
} from './adminUserService'

// ========================================
// 👤 SERVICIOS DE CUENTAS ADMINISTRATIVAS
// ========================================
export {
  createAdminAccount,
  getAdminAccounts,
  updateAdminStatus,
  deleteAdminAccount,
  canCreateAdmins
} from './adminAccountService'

// ========================================
// 🛒 SERVICIOS DE GESTIÓN DE PRODUCTOS
// ========================================
export {
  getMarketplaceProducts,
  getProductStats,
  deleteProduct,
  deleteMultipleProducts,
  updateProductName
} from './adminProductService'

// ========================================
// 📋 SERVICIOS DE GESTIÓN DE SOLICITUDES
// ========================================
export {
  getSolicitudes,
  confirmarPago,
  rechazarPago,
  devolverPago,
  enviarNotificacion
} from './adminRequestService'

// ========================================
// 💰 SERVICIOS DE LIBERACIÓN DE PAGOS
// ========================================
export {
  getPaymentReleases,
  getPaymentReleaseDetails,
  releasePayment,
  cancelPaymentRelease,
  getPaymentReleaseStats,
  getPaymentReleasesReport,
  formatCLP,
  formatDate,
  daysBetween,
  validateReleaseData,
  validateFilters
} from './adminPaymentReleaseService'

// ========================================
// � SERVICIOS DE GESTIÓN DE FINANCIAMIENTOS
// ========================================
export {
  getPendingFinancingRequests,
  getApprovedFinancingRequests,
  getAllFinancingRequests,
  approveFinancingRequest,
  rejectFinancingRequest,
  getFinancingDocuments,
  downloadDocument,
  getDocumentUrl,
  getFinancingStats
} from './adminFinancingService'

// ========================================
// �📎 SERVICIOS DE GESTIÓN DE ARCHIVOS
// ========================================
export {
  subirComprobante,
  subirAdjuntos,
  validarArchivo
} from './adminFileService'

// ========================================
// 📊 SERVICIOS DE AUDITORÍA Y LOGS
// ========================================
export {
  registrarAccion,
  getLogs
} from './adminAuditService'

// ========================================
// 🔒 SERVICIOS DE SEGURIDAD Y BANEOS
// ========================================
// BanService eliminado - no se usa en el control panel
export {
  updateUserIP,
  getCurrentUserIP,
  checkIPBanStatus,
  trackLoginIP,
  trackUserAction,
  debugCurrentIP,
  trackRouteVisit
} from '../../../services/security/ipTrackingService'

// ========================================
// 🔧 SERVICIOS PRINCIPALES Y UTILIDADES
// ========================================
export {
  AdminApiService
} from './adminApiService'

// ========================================
// 📊 FUNCIONES DE ESTADÍSTICAS GENERALES
// ========================================

/**
 * Obtener estadísticas generales del panel administrativo
 * @returns {Promise<{success: boolean, stats?: object, error?: string}>}
 */
export const getEstadisticas = async () => {
  try {
  // Usar estadísticas reales desde adminRequestService (importación estática para evitar mezcla dyn/static)
  const result = await requestServices.getSolicitudesStats()
    
    if (result.success) {
      return { success: true, stats: result.data }
    } else {
      throw new Error(result.error)
    }
  } catch (error) {
    console.error('Error en getEstadisticas:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

// ========================================
// 🔗 COMPATIBILIDAD LEGACY
// ========================================

// Importamos todas las funciones que necesitamos para el objeto legacy
import * as authServices from './adminAuthService'
import * as userServices from './adminUserService'
import * as accountServices from './adminAccountService'
import * as productServices from './adminProductService'
import * as requestServices from './adminRequestService'
import * as fileServices from './adminFileService'
import * as auditServices from './adminAuditService'
import * as ipTrackingServices from '../../../services/security/ipTrackingService'

/**
 * @deprecated Use direct imports from domains/admin/services instead
 * Esta función mantiene compatibilidad con importaciones legacy
 */
export const AdminPanelService = {
  // Auth
  ...authServices,
  
  // Users
  ...userServices,
  
  // Accounts
  ...accountServices,
  
  // Products
  ...productServices,
  
  // Requests
  ...requestServices,
  
  // Files
  ...fileServices,
  
  // Audit
  ...auditServices,
  
  // Security & IP Tracking
  ...ipTrackingServices,
  
  // Stats - función local
  getEstadisticas
}
