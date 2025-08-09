/**
 * ============================================================================
 * CART STORE - GESTIÓN GLOBAL DEL CARRITO DE COMPRAS (REFACTORIZADO)
 * ============================================================================
 *
 * Store centralizado refactorizado usando módulos independientes.
 * Punto de entrada que mantiene la misma API externa mientras usa
 * el patrón facade internamente.
 *
 * CARACTERÍSTICAS:
 * - ✅ Persistencia automática en localStorage
 * - ✅ Módulos independientes para mejor mantenibilidad
 * - ✅ Cálculos automáticos de totales
 * - ✅ Validación de stock
 * - ✅ Integración con notificaciones
 * - ✅ Arquitectura modular con facade
 *
 * MÓDULOS REFACTORIZADOS:
 * - 🔄 cartStore.constants: Constantes y configuraciones
 * - 🔄 cartStore.helpers: Funciones puras y utilitarias
 * - 🔄 cartStore.calculations: Lógica de cálculos
 * - 🔄 cartStore.local: Operaciones locales
 * - 🔄 cartStore.backend: Operaciones con backend
 * - 🔄 cartStore.core: Estado principal
 * - 🔄 cartStore.facade: Compositor de módulos
 *
 * MÓDULOS EXTERNOS:
 * - 🔄 useCartHistory: Historial y undo/redo
 * - 🔄 useShipping: Opciones de envío
 */

import { createCartStoreFacade } from './cartStore.facade'

// Crear y exportar el store facade como hook de Zustand
const useCartStore = createCartStoreFacade()

export default useCartStore
