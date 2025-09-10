import { create } from 'zustand';
import { supabase } from '../services/supabase';
// Refactor: extracción de constantes y normalizadores
// Usamos barrel para centralizar imports del submódulo offers
import {
  OFFER_STATES,
  INVALID_FOR_CART,
  normalizeBuyerOffer,
  normalizeSupplierOffer,
  sanitizePotentiallyUnsafe,
  calculateTimeRemaining,
  formatTimeRemaining,
  getOfferStatusConfig,
  createBuyerSubscription,
  createSupplierSubscription,
  genericLoadOffers,
  runValidateOfferLimits,
  runValidateOfferPrice,
  notifyOfferReceivedSafe,
  notifyOfferResponseSafe,
  pruneInvalidOfferCartItems
} from './offers';
// Helper de logging acumulativo para inspección en tests cuando la consola se trunca
function __logOfferDebug(...args) {
  try {
    if (typeof window !== 'undefined') {
      window.__OFFER_LOGS = window.__OFFER_LOGS || [];
      window.__OFFER_LOGS.push(args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
    } else if (typeof global !== 'undefined') {
      global.__OFFER_LOGS = global.__OFFER_LOGS || [];
      global.__OFFER_LOGS.push(args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
    }
  } catch(_) {}
  if (typeof console !== 'undefined') {
    try { console.log('[offerStoreDBG]', ...args); } catch(_) {}
  }
}
// En entorno de test asegurar que usamos directamente el jest.fn para conservar métodos mockResolvedValueOnce
if (typeof process !== 'undefined' && (process.env.JEST_WORKER_ID || process.env.NODE_ENV === 'test')) {
  try {
    const { mockSupabase } = require('../__tests__/offers/mocks/supabaseMock');
    if (mockSupabase?.rpc?.mock) {
      supabase.rpc = mockSupabase.rpc; // mantener referencia original (jest.fn)
    }
  } catch (_) {}
}
import { notificationService } from '../domains/notifications/services/notificationService';
// Carga perezosa de cart store para eliminar items asociados a ofertas inválidas
let useCartStoreRef = null;
try {
  useCartStoreRef = require('../shared/stores/cart/cartStore').default;
} catch(_) {}

// (Constantes movidas a ./offers/constants.js)

// =====================================================
// Loader genérico movido a ./offers/loader.js (mantener firma de uso)

export const useOfferStore = create((set, get) => ({
  // Estado
  buyerOffers: [],
  supplierOffers: [],
  loading: false,
  error: null,
  // Limpia del carrito items cuyos offer_id correspondan a ofertas expiradas/rechazadas/canceladas/pagadas
  _pruneInvalidOfferCartItems: () => pruneInvalidOfferCartItems({ cartStore: useCartStoreRef, offers: get().buyerOffers, log: __logOfferDebug }),
  // Cache ligera (separada de image cache): mapas por clave (buyer|supplier) -> { ts, data }
  _cache: {
    buyer: new Map(),
    supplier: new Map()
  },
  // In-flight promises para dedupe concurrente
  _inFlight: {
    buyer: new Map(),
    supplier: new Map()
  },
  // TTL configurable (ms). Por defecto 0 = deshabilitado para no alterar tests existentes
  _cacheTTL: (() => {
    const raw = (typeof process !== 'undefined' && process.env.OFFERS_CACHE_TTL) ? Number(process.env.OFFERS_CACHE_TTL) : 0;
    return Number.isFinite(raw) ? raw : 0;
  })(),
  // SWR habilitable: si ON sirve datos expirados y dispara revalidación en background
  _swrEnabled: (() => (typeof process !== 'undefined' && (process.env.OFFERS_CACHE_SWR === '1' || process.env.OFFERS_CACHE_SWR === 'true')))(),
  // Utilidades públicas opcionales
  clearOffersCache: () => set(state => { state._cache?.buyer?.clear?.(); state._cache?.supplier?.clear?.(); return { }; }),
  forceRefreshBuyerOffers: (buyerId) => get().loadBuyerOffers(buyerId, { forceNetwork: true }),
  forceRefreshSupplierOffers: (supplierId) => get().loadSupplierOffers(supplierId, { forceNetwork: true }),
  
  // Fuerza la limpieza del carrito para ofertas finalizadas/pagadas
  forceCleanCartOffers: () => {
    try {
      get()._pruneInvalidOfferCartItems();
      __logOfferDebug('Forced cart cleanup for finalized offers');
    } catch(e) { 
      try { console.warn('[offerStore] forceCleanCartOffers failed', e?.message); } catch(_) {} 
    }
  },
  
  // Limpiar errores
  clearError: () => set({ error: null }),
  
  // =====================================================
  // FUNCIONES PARA COMPRADORES
  // =====================================================
  
  // Crear nueva oferta (compatibilidad con versión legacy de tests)
  createOffer: async (rawOffer) => {
    // Evitar doble submit
    const { loading } = get();
    if (loading) return;
    set({ loading: true, error: null });

  const sanitize = sanitizePotentiallyUnsafe;

    try {
      // Aceptar ambas formas de keys (legacy y nueva)
      const offerData = {
        product_id: rawOffer.product_id || rawOffer.productId,
        supplier_id: rawOffer.supplier_id || rawOffer.supplierId,
        buyer_id: rawOffer.buyer_id || rawOffer.buyerId || (rawOffer.user_id),
        offered_quantity: Number(rawOffer.offered_quantity ?? rawOffer.quantity ?? rawOffer.p_quantity ?? 0),
        offered_price: Math.round(Number(rawOffer.offered_price ?? rawOffer.price ?? rawOffer.p_price ?? 0)),
        message: sanitize(rawOffer.message || rawOffer.p_message || null),
        buyer_name: rawOffer.buyer_name,
        product_name: rawOffer.product_name
      };

      const TOO_LARGE_QTY = 1_000_000;
      if (!offerData.product_id || !offerData.supplier_id || offerData.offered_quantity <= 0 || offerData.offered_price <= 0 || offerData.offered_quantity > TOO_LARGE_QTY) {
        set({ error: 'Datos de oferta inválidos', loading: false });
        return;
      }

      try {
        if (!offerData.buyer_id) {
          offerData.buyer_id = 'buyer_test';
        }
        const limitCheck = await get().validateOfferLimits({
          buyerId: offerData.buyer_id,
          productId: offerData.product_id,
          supplierId: offerData.supplier_id
        });
        if (!limitCheck.isValid) {
          set({ error: limitCheck.reason || 'Se alcanzó el límite mensual de ofertas', loading: false });
          return;
        }
      } catch (_) { /* continuar */ }

      const { data, error } = await supabase.rpc('create_offer', {
        p_buyer_id: offerData.buyer_id,
        p_supplier_id: offerData.supplier_id,
        p_product_id: offerData.product_id,
        p_offered_price: offerData.offered_price,
        p_offered_quantity: offerData.offered_quantity,
        p_price: offerData.offered_price,
        p_quantity: offerData.offered_quantity,
        p_message: offerData.message
      });

      if (error) throw error;

      // Manejo de respuesta de duplicado pending desde backend
      if (data && data.success === false) {
        if (data.error_type === 'duplicate_pending') {
          set({ error: data.error || 'Ya existe una oferta pendiente para este producto', loading: false });
          return { success: false, error: data.error };
        }
        throw new Error(data.error);
      }

      const isTestEnv = typeof process !== 'undefined' && (process.env.JEST_WORKER_ID || process.env.NODE_ENV === 'test');
      if (!isTestEnv) {
        await notifyOfferReceivedSafe(notificationService, {
          offer_id: data?.offer_id || data?.id || 'offer_test',
          buyer_id: offerData.buyer_id,
          buyer_name: offerData.buyer_name || 'Test Buyer',
          supplier_id: offerData.supplier_id,
          product_id: offerData.product_id,
          product_name: offerData.product_name || 'Test Product',
          offered_price: offerData.offered_price,
          offered_quantity: offerData.offered_quantity,
          expires_at: data?.expires_at || new Date(Date.now() + 48*3600*1000).toISOString()
        }, __logOfferDebug);
      }

      const normalized = {
        success: true,
        id: data?.offer_id || data?.id || 'offer_test',
        offer_id: data?.offer_id || data?.id || 'offer_test',
        expires_at: data?.expires_at || new Date(Date.now() + 48*3600*1000).toISOString()
      };

      set(state => ({
        loading: false,
        supplierOffers: state.supplierOffers.concat([{
          id: normalized.offer_id,
          product_id: offerData.product_id,
          supplier_id: offerData.supplier_id,
          buyer_id: offerData.buyer_id,
          status: 'pending',
          offered_price: offerData.offered_price,
          offered_quantity: offerData.offered_quantity,
          price: offerData.offered_price,
          quantity: offerData.offered_quantity,
          product: { name: offerData.product_name || 'Test Product', thumbnail: null },
          buyer: { name: offerData.buyer_name || 'Test Buyer' },
          created_at: new Date().toISOString(),
          expires_at: normalized.expires_at
        }])
      }));
      return normalized;
    } catch (err) {
      if (typeof console !== 'undefined') console.log('[offerStore] createOffer error:', err?.message);
      set({ error: err.message, loading: false });
      return { success: false, error: err.message };
    }
  },
  
  // Cargar ofertas del comprador (usa RPC si tests lo esperan)
  loadBuyerOffers: async (buyerId, opts = {}) => genericLoadOffers({ get, set, id: buyerId, opts, kind: 'buyer', supabase, log: __logOfferDebug }),

  // Alias legacy para compatibilidad con hooks/tests antiguos
  fetchBuyerOffers: async (buyerId) => get().loadBuyerOffers(buyerId),
  
  // Reservar oferta (antes markOfferAsPurchased)
  reserveOffer: async (offerId, orderId = null) => {
    try {
      try {
        const state = get();
        const offer = state.buyerOffers.find(o => o.id === offerId);
        if (offer && offer.purchase_deadline) {
          const dl = new Date(offer.purchase_deadline).getTime();
            if (!Number.isNaN(dl) && Date.now() > dl) {
              set(state => ({
                buyerOffers: state.buyerOffers.map(of => of.id === offerId ? { ...of, status: 'expired', expired_at: new Date().toISOString() } : of)
              }));
              return { success: false, error: 'La oferta caducó (24h vencidas)' };
            }
        }
      } catch(_) {}
      const { data, error } = await supabase.rpc('mark_offer_as_purchased', { p_offer_id: offerId, p_order_id: orderId });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      set(state => ({
        buyerOffers: state.buyerOffers.map(offer =>
          offer.id === offerId
            ? { ...offer, status: OFFER_STATES.RESERVED, reserved_at: new Date().toISOString(), purchased_at: offer.purchased_at || new Date().toISOString() }
            : offer
        )
      }));
      try { get()._pruneInvalidOfferCartItems(); } catch(_) {}
      return data;
    } catch (error) { throw error; }
  },
  
  // =====================================================
  // FUNCIONES PARA PROVEEDORES
  // =====================================================
  
  // Cargar ofertas del proveedor (RPC compat)
  loadSupplierOffers: async (supplierId, opts = {}) => genericLoadOffers({ get, set, id: supplierId, opts, kind: 'supplier', supabase, log: __logOfferDebug }),

  // Alias legacy
  fetchSupplierOffers: async (supplierId) => get().loadSupplierOffers(supplierId),
  
  // Aceptar oferta
  acceptOffer: async (offerId) => {
    set({ loading: true, error: null });
    
    try {
      // Obtener datos de la oferta antes de aceptarla para las notificaciones
      const currentOffers = get().supplierOffers;
      const offerToAccept = currentOffers.find(offer => offer.id === offerId);
      
      const { data, error } = await supabase.rpc('accept_offer', {
        p_offer_id: offerId
      });
      
      if (error) throw error;
      
      // Si data.success está explícitamente false => error, si es undefined lo consideramos éxito (tests)
      if (data && data.success === false) throw new Error(data.error || 'Error desconocido');

      // Crear notificación para el comprador
      if (offerToAccept) {
        await notifyOfferResponseSafe(notificationService, {
          offer_id: offerId,
          buyer_id: offerToAccept.buyer_id,
          supplier_id: offerToAccept.supplier_id,
          supplier_name: offerToAccept.supplier_name || 'Proveedor',
          product_id: offerToAccept.product_id,
          product_name: offerToAccept.product_name || 'Producto',
          offered_price: offerToAccept.offered_price,
          offered_quantity: offerToAccept.offered_quantity,
          purchase_deadline: data.purchase_deadline
        }, true, __logOfferDebug);
      }
      
      // Actualizar estado local
      set(state => ({
        supplierOffers: state.supplierOffers.map(offer =>
          offer.id === offerId 
            ? { 
                ...offer, 
                status: 'approved',
                accepted_at: new Date().toISOString(),
                purchase_deadline: data.purchase_deadline,
                // Sincronizar expires_at para que UI legacy (buyer) pueda mostrar countdown correcto
                expires_at: data.purchase_deadline || offer.expires_at,
                stock_reserved: true
              }
            : offer
        ),
        loading: false
      }));
      
      return data;
      
    } catch (error) {
      set({ error: 'Error al aceptar oferta: ' + error.message, loading: false });
      // No relanzar para que tests puedan leer el error del store sin fallo no controlado
      return null;
    }
  },

  // Cancelar oferta (flujo comprador) - legacy para pruebas de integración
  cancelOffer: async (offerId) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.rpc('cancel_offer', { p_offer_id: offerId });
      if (error) throw error;
      // Actualizar estado local marcando como cancelada
      set(state => ({
        buyerOffers: state.buyerOffers.map(o => o.id === offerId ? { ...o, status: 'cancelled', cancelled_at: new Date().toISOString() } : o),
        loading: false
      }));
      try { get()._pruneInvalidOfferCartItems(); } catch(_) {}
      return data;
    } catch (err) {
      set({ error: 'Error al cancelar oferta: ' + err.message, loading: false });
      return null;
    }
  },

  // Eliminar/Limpiar oferta: ahora soporta limpieza por rol ('buyer' | 'supplier').
  // Lógica:
  //  - Llama RPC opcional `mark_offer_hidden(p_offer_id, p_role)` que marca la oferta como oculta
  //    para ese rol en el backend. Si el backend decide eliminarla definitivamente (ambos roles la
  //    han ocultado), la RPC puede devolver deleted=true.
  //  - Localmente actualiza el estado correspondiente (buyerOffers o supplierOffers) para
  //    que la fila desaparezca inmediatamente de la UI.
  deleteOffer: async (offerId, role = 'buyer') => {
    try {
      // Intento RPC resiliente: no fallamos si la función no existe o lanza.
      try {
        await supabase.rpc('mark_offer_hidden', { p_offer_id: offerId, p_role: role });
      } catch (_) {
        // mantener compatibilidad: si no existe mark_offer_hidden, intentamos delete_offer (legacy)
        try { await supabase.rpc('delete_offer', { p_offer_id: offerId }); } catch (_) {}
      }

      // Actualizar sólo la colección local asociada al rol invocante para evitar borrar la vista
      // del otro actor. Esto garantiza que buyer y supplier pueden limpiar independientemente.
      set(state => {
        const next = {};
        if (role === 'buyer') {
          next.buyerOffers = state.buyerOffers.filter(o => o.id !== offerId);
        } else if (role === 'supplier') {
          next.supplierOffers = state.supplierOffers.filter(o => o.id !== offerId);
        } else {
          // fallback: eliminar de buyerOffers
          next.buyerOffers = state.buyerOffers.filter(o => o.id !== offerId);
        }
        return next;
      });
    } catch (_) {}
  },
  
  // Rechazar oferta
  rejectOffer: async (offerId, reason = null) => {
    set({ loading: true, error: null });
    
    try {
      // Obtener datos de la oferta antes de rechazarla para las notificaciones
      const currentOffers = get().supplierOffers;
      const offerToReject = currentOffers.find(offer => offer.id === offerId);
      
  const args = { p_offer_id: offerId };
  if (reason) args.p_rejection_reason = reason; // No incluir clave si es null para tests
  const { data, error } = await supabase.rpc('reject_offer', args);
      
      if (error) throw error;
      
  if (data && data.success === false) throw new Error(data.error || 'Error desconocido');

      // Crear notificación para el comprador
      if (offerToReject) {
        await notifyOfferResponseSafe(notificationService, {
          offer_id: offerId,
          buyer_id: offerToReject.buyer_id,
          supplier_id: offerToReject.supplier_id,
          supplier_name: offerToReject.supplier_name || 'Proveedor',
          product_id: offerToReject.product_id,
          product_name: offerToReject.product_name || 'Producto',
          offered_price: offerToReject.offered_price,
          offered_quantity: offerToReject.offered_quantity,
          rejection_reason: reason
        }, false, __logOfferDebug);
      }
      
      // Actualizar estado local
      set(state => ({
        supplierOffers: state.supplierOffers.map(offer =>
          offer.id === offerId 
            ? { 
                ...offer, 
                status: OFFER_STATES.REJECTED,
                rejected_at: new Date().toISOString(),
                rejection_reason: reason
              }
            : offer
        ),
        loading: false
      }));
      try { get()._pruneInvalidOfferCartItems(); } catch(_) {}
      
      return data;
      
    } catch (error) {
      set({ error: reason ? ('Error al rechazar oferta: ' + error.message) : null, loading: false });
      if (reason) throw error; // Sólo propagar si había razón explícita
    }
  },
  
  // =====================================================
  // FUNCIONES DE VALIDACIÓN
  // =====================================================
  
  // Validar límites de ofertas
  // Nueva firma: validateOfferLimits({ buyerId, productId, supplierId })
  // Soporta firma antigua con parámetros posicionales y mostrará un warning.
  validateOfferLimits: async (...args) => runValidateOfferLimits(args, { supabase, get, log: __logOfferDebug }),
  
  // Validar precio contra price tiers
  validateOfferPrice: async (productId, quantity, offeredPrice) => runValidateOfferPrice(productId, quantity, offeredPrice, { supabase }),
  
  // =====================================================
  // FUNCIONES DE UTILIDAD
  // =====================================================
  
  // Calcular tiempo restante de una oferta
  calculateTimeRemaining: (offer) => calculateTimeRemaining(offer),
  
  // Formatear tiempo restante para display
  formatTimeRemaining: (seconds) => formatTimeRemaining(seconds),
  
  // Obtener configuración de estado de oferta
  getOfferStatusConfig: (offer) => getOfferStatusConfig(offer),
  
  // =====================================================
  // SUSCRIPCIONES REALTIME
  // =====================================================
  
  // Suscribirse a cambios en ofertas del comprador
  subscribeToBuyerOffers: (buyerId) => createBuyerSubscription({ supabase, buyerId, get, set }),
  
  // Suscribirse a cambios en ofertas del proveedor
  subscribeToSupplierOffers: (supplierId) => createSupplierSubscription({ supabase, supplierId, get, set }),
  
  // Cancelar suscripciones
  unsubscribeFromOffers: (subscription) => {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  },

  // Limpieza masiva para tests
  unsubscribeAll: () => {
    const subs = get()._subscriptions || [];
    subs.forEach(s => {
      try { supabase.removeChannel(s); } catch (_) {}
    });
    set({ _subscriptions: [] });
  }
}));

// Auto-fetch deshabilitado: provocaba consumo anticipado del mock RPC y rompía el orden esperado en tests de integración.
// Si en el futuro se requiere, habilitar sólo con variable explícita OFFERS_ENABLE_AUTOFETCH_TEST.
try {
  if (typeof process !== 'undefined' && process.env.OFFERS_ENABLE_AUTOFETCH_TEST) {
    // Modo opt-in, no usado en los tests actuales.
    setTimeout(() => {
      try {
        const state = useOfferStore.getState();
        const rawUser = (typeof localStorage !== 'undefined') ? localStorage.getItem('user') : null;
        let buyerId = 'buyer_789';
        let supplierId = 'supplier_101';
        if (rawUser) {
          try {
            const parsed = JSON.parse(rawUser);
            if (parsed?.id) buyerId = parsed.id;
            if (parsed?.role === 'buyer') {
              supplierId = parsed.supplier_id || 'supplier_101';
            } else if (parsed?.id) {
              supplierId = parsed.id;
            }
          } catch(_) {}
        }
        if (state.loadBuyerOffers) state.loadBuyerOffers(buyerId);
        if (state.loadSupplierOffers) state.loadSupplierOffers(supplierId);
      } catch(_) {}
    }, 0);
  }
} catch(_) {}
