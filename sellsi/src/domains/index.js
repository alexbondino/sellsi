// ========================================
// 🔧 DOMINIOS DE NEGOCIO
// ========================================
export * from './admin'
export * as Admin from './admin'

export * from './auth'
export * as Auth from './auth'

export * from './ban'
export * as Ban from './ban'

export * from './buyer'
export * as Buyer from './buyer'

export * from './checkout'
export * as Checkout from './checkout'

export * from './marketplace'
export * as Marketplace from './marketplace'

export * from './profile'
export * as Profile from './profile'

export * from './supplier'
export * as Supplier from './supplier'

// ========================================
// 🔗 UTILIDADES CROSS-DOMAIN
// ========================================

/**
 * Registro de dominios disponibles para debugging y desarrollo
 */
export const AVAILABLE_DOMAINS = {
  ADMIN: 'admin',
  AUTH: 'auth',
  BAN: 'ban',
  BUYER: 'buyer',
  CHECKOUT: 'checkout',
  MARKETPLACE: 'marketplace',
  PROFILE: 'profile',
  SUPPLIER: 'supplier'
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
