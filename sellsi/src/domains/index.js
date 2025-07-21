// ========================================
// 🔧 DOMINIO ADMINISTRATIVO
// ========================================
export * from './admin'
export * as Admin from './admin'

// ========================================
// 🔗 UTILIDADES CROSS-DOMAIN
// ========================================

/**
 * Registro de dominios disponibles para debugging y desarrollo
 */
export const AVAILABLE_DOMAINS = {
  ADMIN: 'admin'
  // TODO: Agregar otros dominios según progreso del refactor
  // MARKETPLACE: 'marketplace',
  // BUYER: 'buyer', 
  // SUPPLIER: 'supplier',
  // CHECKOUT: 'checkout'
}

/**
 * Verificar si un dominio está disponible
 * @param {string} domain - Nombre del dominio
 * @returns {boolean}
 */
export const isDomainAvailable = (domain) => {
  return Object.values(AVAILABLE_DOMAINS).includes(domain)
}

/**
 * Obtener información de un dominio
 * @param {string} domain - Nombre del dominio
 * @returns {object|null}
 */
export const getDomainInfo = (domain) => {
  const domains = {
    admin: {
      name: 'Admin',
      description: 'Gestión administrativa completa',
      status: 'migrated',
      services: ['auth', 'users', 'products', 'requests', 'files', 'audit'],
      migrationDate: '2025-07-21'
    }
  }
  
  return domains[domain] || null
}
