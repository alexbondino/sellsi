// ========================================
// 🔐 SERVICIOS DE AUTENTICACIÓN
// ========================================
export {
  loginAdmin,
  verify2FA,
  generate2FASecret,
  disable2FA,
  mark2FAAsConfigured
} from './auth/adminAuthService'

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
} from './users/adminUserService'

// ========================================
// 👤 SERVICIOS DE CUENTAS ADMINISTRATIVAS
// ========================================
export {
  createAdminAccount,
  getAdminAccounts,
  updateAdminStatus,
  deleteAdminAccount,
  canCreateAdmins
} from './accounts/adminAccountService'

// ========================================
// 🛒 SERVICIOS DE GESTIÓN DE PRODUCTOS
// ========================================
export {
  getMarketplaceProducts,
  getProductStats,
  deleteProduct,
  deleteMultipleProducts,
  updateProductName
} from './products/adminProductService'

// ========================================
// 📋 SERVICIOS DE GESTIÓN DE SOLICITUDES
// ========================================
export {
  getSolicitudes,
  confirmarPago,
  rechazarPago,
  devolverPago,
  enviarNotificacion
} from './requests/adminRequestService'

// ========================================
// 📎 SERVICIOS DE GESTIÓN DE ARCHIVOS
// ========================================
export {
  subirComprobante,
  subirAdjuntos,
  validarArchivo
} from './files/adminFileService'

// ========================================
// 📊 SERVICIOS DE AUDITORÍA Y LOGS
// ========================================
export {
  registrarAccion,
  getLogs
} from './audit/adminAuditService'

// ========================================
// 🔧 SERVICIOS PRINCIPALES Y UTILIDADES
// ========================================
export {
  AdminApiService
} from './core/adminApiService'

// ========================================
// 📊 FUNCIONES DE ESTADÍSTICAS GENERALES
// ========================================

/**
 * Obtener estadísticas generales del panel administrativo
 * @returns {Promise<{success: boolean, stats?: object, error?: string}>}
 */
export const getEstadisticas = async () => {
  try {
    // Stats mock para desarrollo - mantener compatibilidad
    const mockStats = {
      total: 25,
      pendientes: 8,
      confirmados: 12,
      rechazados: 3,
      devueltos: 2
    }
    
    return { success: true, stats: mockStats }
  } catch (error) {
    console.error('Error en getEstadisticas:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}
