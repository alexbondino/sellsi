/**
 * 🏗️ Services Barrel Exports
 * 
 * Punto de entrada centralizado para todos los servicios de Sellsi
 * Permite importaciones limpias desde cualquier parte de la aplicación
 * 
 * ⚠️ NOTA DE MIGRACIÓN: Los servicios admin han sido migrados a domains/admin/
 * Ver PLANREFACTOR.md paso 4 para detalles de la nueva estructura
 * 
 * @example
 * import { updateUserIP, banUser } from '../services/security';
 * import { addToCart } from '../services/user';
 * import { khipuPayment } from '../services/payment';
 * 
 * // ✅ Nueva estructura recomendada para admin:
 * import { AdminServices } from '../domains/admin';
 * import { loginAdmin, getUsers } from '../domains/admin/services';
 */

// 🔐 Servicios de autenticación
export * from './auth';

// 👤 Servicios de usuario
export * from './user';

// 🏪 Servicios de marketplace
export * from './marketplace';

// 💳 Servicios de pago
export * from './payment';

// 📦 Servicios de media
export * from './media';

// 🔒 Servicios de seguridad
export * from './security';

// 👑 Servicios administrativos - MIGRADOS A DOMAINS
// LEGACY: export * from './admin'; 
// ✅ NUEVO: Ver '../domains/admin' para la nueva estructura

// 🏗️ Dominios de negocio - ELIMINADO BARREL EXPORT
// ❌ REMOVIDO: export * from '../domains'; 
//    Motivo: Violaba encapsulación DDD, causaba bundle bloat y dependency hell
//    Solución: Usar imports específicos donde se necesiten

// 🔧 Cliente base de Supabase
export { supabase } from './supabase';
