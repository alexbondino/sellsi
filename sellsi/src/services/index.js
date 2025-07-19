/**
 * 🏗️ Services Barrel Exports
 * 
 * Punto de entrada centralizado para todos los servicios de Sellsi
 * Permite importaciones limpias desde cualquier parte de la aplicación
 * 
 * @example
 * import { updateUserIP, banUser } from '../services/security';
 * import { addToCart } from '../services/user';
 * import { khipuPayment } from '../services/payment';
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

// 👑 Servicios administrativos
export * from './admin';

// 🔧 Cliente base de Supabase
export { supabase } from './supabase';

// 📋 Servicios legacy (temporalmente, hasta que toda la app migre)
export * from './adminPanelService';
