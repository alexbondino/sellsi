import { supabase } from '../supabase';
import { validateQuantity, sanitizeCartItems, isQuantityError } from '../../utils/quantityValidation';

// In-flight dedupe para getCartItems: evita múltiples GET idénticos concurrentes
const __inFlightCartItems = new Map(); // cartId -> Promise

// Normaliza el tipo de documento tributario a uno de: 'boleta' | 'factura' | 'ninguno'
function normalizeDocumentType(val) {
  if (!val) return 'ninguno';
  const v = String(val).toLowerCase();
  if (v === 'boleta' || v === 'factura') return v;
  return 'ninguno';
}

/**
 * CartService - Servicio para manejar todas las operaciones del carrito con Supabase
 *
 * Centraliza la comunicación con Supabase para operaciones del carrito.
 */
class CartService {
  /**
   * Obtiene o crea un carrito activo para el usuario
   */
  async getOrCreateActiveCart(userId, options = {}) {
    const { includeItems = true } = options;
    if (!userId) throw new Error('userId requerido');
    // Dedupe in-flight de carts activos (evita múltiples selects simultáneos)
    if (!this.__inFlightActive) this.__inFlightActive = new Map();
    if (this.__inFlightActive.has(userId)) {
      const shared = await this.__inFlightActive.get(userId);
      // Si el consumidor pide items pero la versión compartida no los trae, forzar fetch de items ahora
      if (includeItems && shared && !Array.isArray(shared.items)) {
        const items = await this.getCartItems(shared.cart_id);
        return { ...shared, items };
      }
      // Si el consumidor no necesita items podemos devolver lo existente incluso si incluye items.
      if (!includeItems && shared) {
        // Evitar devolver items pesados si no se requieren
        if (shared.items) {
          const { items, ...rest } = shared; // descartar items
          return rest;
        }
      }
      return shared;
    }
    const promise = (async () => {
      try {
        let existingCart = null;
        let searchError = null;

      try {
        const { data, error } = await supabase
          .from('carts')
          .select('cart_id, status, created_at, updated_at')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle();

        existingCart = data;
        searchError = error;
      } catch (err) {
        searchError = err;
      }

      let cartId;
      let cartData;

      if (existingCart && existingCart.cart_id) {
        cartId = existingCart.cart_id;
        cartData = existingCart;
      } else {
        const { data: newCart, error: createError } = await supabase
          .from('carts')
          .insert({ user_id: userId, status: 'active' })
          .select('cart_id, status, created_at, updated_at')
          .single();

        if (createError) throw createError;

        cartId = newCart.cart_id;
        cartData = newCart;
      }

      let cartItems = undefined;
      if (includeItems) {
        cartItems = await this.getCartItems(cartId);
      }

      return {
        cart_id: cartId,
        user_id: userId,
        status: 'active',
        ...(includeItems ? { items: cartItems } : {}),
        created_at: cartData?.created_at || new Date().toISOString(),
        updated_at: cartData?.updated_at || new Date().toISOString()
      };
      } catch (error) {
        throw new Error(`No se pudo obtener el carrito: ${error.message}`);
      }
    })();
    this.__inFlightActive.set(userId, promise);
    try {
      return await promise;
    } finally {
      this.__inFlightActive.delete(userId);
    }
  }

  /**
   * Obtiene todos los items de un carrito
   */
  async getCartItems(cartId) {
    try {
      if (!cartId) return [];
      if (__inFlightCartItems.has(cartId)) {
        return await __inFlightCartItems.get(cartId);
      }
      const promise = (async () => {
      // Log diagnóstico mínimo
      try {
        // eslint-disable-next-line no-console
        console.log('[cartService] getCartItems cartId:', cartId);
      } catch (e) {}

      // Intentar consulta extendida (con columnas de oferta). Si falla, hacer fallback
      let data, error;
      try {
        const res = await supabase
          .from('cart_items')
          .select(`
            cart_items_id,
            product_id,
            quantity,
            price_at_addition,
            price_tiers,
            document_type,
            offer_id,
            offered_price,
            metadata,
            added_at,
            updated_at,
            products (
              productid,
              productnm,
              price,
              category,
              minimum_purchase,
              negotiable,
              description,
              supplier_id,
              productqty,
              product_images (image_url),
              product_delivery_regions (
                id,
                region,
                price,
                delivery_days
              ),
              users!products_supplier_id_fkey (
                user_nm,
                logo_url,
                verified
              )
            )
          `)
          .eq('cart_id', cartId)
          .order('added_at', { ascending: false });

        data = res.data;
        error = res.error;
      } catch (queryErr) {
        try {
          // eslint-disable-next-line no-console
          console.warn('[cartService] Extended getCartItems query failed, retrying fallback select:', queryErr?.message || queryErr);
        } catch (e) {}

        const res2 = await supabase
          .from('cart_items')
          .select(`
            cart_items_id,
            product_id,
            quantity,
            price_at_addition,
            price_tiers,
            document_type,
            added_at,
            updated_at,
            products (
              productid,
              productnm,
              price,
              category,
              minimum_purchase,
              negotiable,
              description,
              supplier_id,
              productqty,
              product_images (image_url),
              product_delivery_regions (
                id,
                region,
                price,
                delivery_days
              ),
              users!products_supplier_id_fkey (
                user_nm,
                logo_url,
                verified
              )
            )
          `)
          .eq('cart_id', cartId)
          .order('added_at', { ascending: false });

        data = res2.data;
        error = res2.error;
      }

      if (error) {
        try {
          // eslint-disable-next-line no-console
          console.error('[cartService] getCartItems supabase error:', error);
        } catch (e) {}
        return [];
      }

  const transformedData = (data || []).map(item => {
        const docType = normalizeDocumentType(item.document_type);

        return {
          cart_items_id: item.cart_items_id,
          product_id: item.product_id,
          quantity: item.quantity,
          price_at_addition: item.price_at_addition,
          price_tiers: item.price_tiers,

          offer_id: item.offer_id || null,
          offered_price: item.offered_price || null,
          metadata: item.metadata || {},

          document_type: docType,
          documentType: docType,
          added_at: item.added_at,
          updated_at: item.updated_at,

          // id único de línea para permitir múltiples filas mismo producto (oferta vs regular)
          id: item.cart_items_id,
          // Mantener productid para lógica de negocio (slug, navegación, etc.)
          productid: item.products?.productid || item.product_id,

          name: item.products?.productnm || null,
          nombre: item.products?.productnm || null,
          productnm: item.products?.productnm || null,

          supplier: item.products?.users?.user_nm || 'Proveedor no encontrado',
          proveedor: item.products?.users?.user_nm || 'Proveedor no encontrado',

          proveedorVerificado: item.products?.users?.verified || false,
          verified: item.products?.users?.verified || false,
          supplier_verified: item.products?.users?.verified || false,

          image: item.products?.product_images?.[0]?.image_url || null,
          imagen: item.products?.product_images?.[0]?.image_url || null,
          image_url: item.products?.product_images?.[0]?.image_url || null,
          thumbnail_url: item.products?.product_images?.[0]?.thumbnail_url || null,

          price: item.offered_price || item.products?.price || null,
          precio: item.offered_price || item.products?.price || null,
          originalPrice: item.products?.price || null,
          precioOriginal: item.products?.price || null,
          basePrice: item.products?.price || null,

          stock: item.products?.productqty || 99,
          maxStock: item.products?.productqty || 99,

          shippingRegions: item.products?.product_delivery_regions || [],
          delivery_regions: item.products?.product_delivery_regions || [],
          shipping_regions: item.products?.product_delivery_regions || [],

          category: item.products?.category,
          minimum_purchase: item.products?.minimum_purchase,
          compraMinima: item.products?.minimum_purchase,
          negotiable: item.products?.negotiable,
          description: item.products?.description,
          supplier_id: item.products?.supplier_id
        };
      });

      try {
        // eslint-disable-next-line no-console
        console.log('[cartService] getCartItems transformed count:', (transformedData || []).length);
      } catch (e) {}

      return transformedData;
      })();
      __inFlightCartItems.set(cartId, promise);
      try {
        const result = await promise;
        return result;
      } finally {
        __inFlightCartItems.delete(cartId);
      }
    } catch (error) {
      return [];
    }
  }

  /**
   * Agrega un producto al carrito
   */
  async addItemToCart(cartId, product, quantity) {
    try {
      const productId = product.productid || product.id || product.product_id;
      if (!productId) throw new Error('Product ID not found in product object');

      const safeQuantity = this.validateQuantity(quantity);

      try {
        // eslint-disable-next-line no-console
        console.log('[cartService] addItemToCart cartId, productId, quantity:', cartId, productId, quantity);
      } catch (e) {}

      // Determinar si el nuevo producto es versión ofertada
      const incomingIsOffered = !!(product.offer_id || product.offered_price || product.isOffered || product.metadata?.isOffered);

      // Obtener todos los ítems existentes con mismo product_id (puede haber oferta y regular separados)
      const { data: existingItems, error: searchError } = await supabase
        .from('cart_items')
        .select('cart_items_id, quantity, offer_id, offered_price')
        .eq('cart_id', cartId)
        .eq('product_id', productId);

      if (searchError) {
        try { console.warn('[cartService] search existing items error:', searchError); } catch(e) {}
      }

      // Buscar candidato a merge SOLO si coincide la naturaleza ofertada/no ofertada
      const mergeCandidate = (existingItems || []).find(it => {
        const existingIsOffered = !!(it.offer_id || it.offered_price);
        // Casos no ofertados: se permite merge (legacy) porque sólo depende de product_id
        if (!incomingIsOffered && !existingIsOffered) return true;
        // Casos ofertados: AHORA requerimos explícitamente offer_id en ambos y que coincidan
        if (incomingIsOffered && existingIsOffered) {
          return !!product.offer_id && !!it.offer_id && it.offer_id === product.offer_id;
        }
        // Diferente naturaleza (uno ofertado otro no) => no merge
        return false;
      });

      let result;

      if (mergeCandidate) {
        const newTotalQuantity = this.validateQuantity(mergeCandidate.quantity + safeQuantity);
        // Intento de actualización directa por cart_items_id; usar maybeSingle para evitar 406 si la fila ya no existe
        const { data: updatedArr, error: updErr } = await supabase
          .from('cart_items')
          .update({ quantity: newTotalQuantity, updated_at: new Date().toISOString() })
          .eq('cart_items_id', mergeCandidate.cart_items_id)
          .select();
        if (updErr) throw updErr;
        const updated = Array.isArray(updatedArr) ? updatedArr[0] : updatedArr;
        if (!updated) {
          // Fila desapareció entre lectura y actualización (race). Insertar nueva línea como fallback seguro.
          const { data: inserted, error: insErr } = await supabase
            .from('cart_items')
            .insert({
              cart_id: cartId,
              product_id: productId,
              quantity: newTotalQuantity,
              price_at_addition: product.price,
              price_tiers: product.price_tiers || product.priceTiers || null,
              document_type: normalizeDocumentType(product.documentType || product.document_type),
              offer_id: product.offer_id || null,
              offered_price: product.offered_price || null,
              metadata: product.metadata || null
            })
            .select();
          if (insErr) {
            try { console.error('[cartService] addItemToCart fallback insert error:', insErr); } catch(e) {}
            throw insErr;
          }
          result = Array.isArray(inserted) ? inserted[0] : inserted;
        } else {
          result = updated;
        }
        await this.updateCartTimestamp(cartId);
      } else {
        // Insertar una nueva fila (regular u oferta independiente)
        const { data: insertedArr, error: insErr } = await supabase
          .from('cart_items')
          .insert({
            cart_id: cartId,
            product_id: productId,
            quantity: safeQuantity,
            price_at_addition: product.price,
            price_tiers: product.price_tiers || product.priceTiers || null,
            document_type: normalizeDocumentType(product.documentType || product.document_type),
            offer_id: product.offer_id || null,
            offered_price: product.offered_price || null,
            metadata: product.metadata || null
          })
          .select();
        if (insErr) {
          try { console.error('[cartService] addItemToCart insert error:', insErr); } catch(e) {}
          throw insErr;
        }
        result = Array.isArray(insertedArr) ? insertedArr[0] : insertedArr;
        await this.updateCartTimestamp(cartId);
      }

      try {
        // eslint-disable-next-line no-console
        console.log('[cartService] addItemToCart result:', result);
      } catch (e) {}

      return result;
    } catch (error) {
      throw new Error(`No se pudo agregar el producto al carrito: ${error.message}`);
    }
  }

  validateQuantity(quantity) {
    return validateQuantity(quantity);
  }

  async updateItemQuantity(cartId, productOrLineId, newQuantity) {
    try {
      const safeQuantity = this.validateQuantity(newQuantity);
      if (safeQuantity <= 0) {
        return await this.removeItemFromCart(cartId, productOrLineId);
      }

      // Heurística: la mayoría de llamadas pasan product_id (no cart_items_id). Intentar primero (cart_id + product_id)
      let primary = await supabase
        .from('cart_items')
        .update({ quantity: safeQuantity, updated_at: new Date().toISOString() })
        .eq('cart_id', cartId)
        .eq('product_id', productOrLineId)
        .select();

      let data = primary.data;
      let error = primary.error;
      if (error && error.code !== 'PGRST116') throw error;

      if (!data || (Array.isArray(data) && data.length === 0)) {
        // Intentar por cart_items_id sólo si el primer camino no afectó filas
        const secondary = await supabase
          .from('cart_items')
          .update({ quantity: safeQuantity, updated_at: new Date().toISOString() })
          .eq('cart_items_id', productOrLineId)
          .select();
        if (secondary.error && secondary.error.code !== 'PGRST116') throw secondary.error;
        data = secondary.data;
        if (!data || (Array.isArray(data) && data.length === 0)) {
          // Crear fila si no existe (comportamiento legacy de establecer cantidad)
          const insertRes = await supabase
            .from('cart_items')
            .insert({
              cart_id: cartId,
              product_id: productOrLineId,
              quantity: safeQuantity,
              updated_at: new Date().toISOString()
            })
            .select();
          if (insertRes.error) throw insertRes.error;
          data = insertRes.data;
        }
      }

      const row = Array.isArray(data) ? data[0] : data;
      await this.updateCartTimestamp(cartId);
      return row;
    } catch (error) {
      throw new Error(`No se pudo actualizar la cantidad: ${error.message}`);
    }
  }

  async removeItemFromCart(cartId, productOrLineId) {
    try {
      // Intentar borrar por cart_items_id primero
      const res = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_items_id', productOrLineId)
        .select();

      // Si la primera consulta devolvió un error, lanzar
      if (res.error) {
        throw res.error;
      }

      // Si la primera eliminación no afectó filas (p. ej. se pasó product_id en vez de cart_items_id),
      // intentar fallback por cart_id + product_id
      if (!res.data || (Array.isArray(res.data) && res.data.length === 0)) {
        const res2 = await supabase
          .from('cart_items')
          .delete()
          .eq('cart_id', cartId)
          .eq('product_id', productOrLineId)
          .select();

        if (res2.error) throw res2.error;
      }

      await this.updateCartTimestamp(cartId);

      return true;
    } catch (error) {
      throw new Error(`No se pudo eliminar el producto del carrito: ${error.message}`);
    }
  }

  async clearCart(cartId) {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cartId);

      if (error) throw error;

      await this.updateCartTimestamp(cartId);

      return true;
    } catch (error) {
      throw new Error(`No se pudo vaciar el carrito: ${error.message}`);
    }
  }

  async checkout(cartId, checkoutData = {}) {
    try {
      const { data: order, error: updateError } = await supabase
        .from('carts')
        .update({ status: 'pending', updated_at: new Date().toISOString() })
        .eq('cart_id', cartId)
        .select('*')
        .single();

      if (updateError) throw updateError;

      return { order_id: order.cart_id, ...order, ...checkoutData };
    } catch (error) {
      throw new Error(`No se pudo procesar el checkout: ${error.message}`);
    }
  }

  async updateCartTimestamp(cartId) {
    try {
      await supabase.from('carts').update({ updated_at: new Date().toISOString() }).eq('cart_id', cartId);
    } catch (error) {}
  }

  /**
   * Obtiene una línea individual enriquecida (para evitar refetch completo tras add/update)
   */
  async getCartItemEnriched(cartItemsId) {
    if (!cartItemsId) return null;
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          cart_items_id,
          product_id,
          quantity,
          price_at_addition,
          price_tiers,
          document_type,
          offer_id,
          offered_price,
          metadata,
          added_at,
          updated_at,
          products (
            productid,
            productnm,
            price,
            category,
            minimum_purchase,
            negotiable,
            description,
            supplier_id,
            productqty,
            product_images (image_url, thumbnail_url),
            product_delivery_regions (id, region, price, delivery_days),
            users!products_supplier_id_fkey (user_nm, logo_url, verified)
          )
        `)
        .eq('cart_items_id', cartItemsId)
        .maybeSingle();
      if (error) return null;
      if (!data) return null;
      return {
        cart_items_id: data.cart_items_id,
        product_id: data.product_id,
        quantity: data.quantity,
        price_at_addition: data.price_at_addition,
        price_tiers: data.price_tiers,
        offer_id: data.offer_id || null,
        offered_price: data.offered_price || null,
        metadata: data.metadata || {},
        document_type: normalizeDocumentType(data.document_type),
        documentType: normalizeDocumentType(data.document_type),
        added_at: data.added_at,
        updated_at: data.updated_at,
        id: data.cart_items_id,
        productid: data.products?.productid || data.product_id,
        name: data.products?.productnm || null,
        nombre: data.products?.productnm || null,
        productnm: data.products?.productnm || null,
        supplier: data.products?.users?.user_nm || 'Proveedor no encontrado',
        proveedor: data.products?.users?.user_nm || 'Proveedor no encontrado',
        proveedorVerificado: data.products?.users?.verified || false,
        verified: data.products?.users?.verified || false,
        supplier_verified: data.products?.users?.verified || false,
        image: data.products?.product_images?.[0]?.image_url || null,
        imagen: data.products?.product_images?.[0]?.image_url || null,
        image_url: data.products?.product_images?.[0]?.image_url || null,
        thumbnail_url: data.products?.product_images?.[0]?.thumbnail_url || null,
        price: data.offered_price || data.products?.price || null,
        precio: data.offered_price || data.products?.price || null,
        originalPrice: data.products?.price || null,
        precioOriginal: data.products?.price || null,
        basePrice: data.products?.price || null,
        stock: data.products?.productqty || 99,
        maxStock: data.products?.productqty || 99,
        shippingRegions: data.products?.product_delivery_regions || [],
        delivery_regions: data.products?.product_delivery_regions || [],
        shipping_regions: data.products?.product_delivery_regions || [],
        category: data.products?.category,
        minimum_purchase: data.products?.minimum_purchase,
        compraMinima: data.products?.minimum_purchase,
        negotiable: data.products?.negotiable,
        description: data.products?.description,
        supplier_id: data.products?.supplier_id
      };
    } catch (_) {
      return null;
    }
  }

  async migrateLocalCart(userId, localCartItems, options = {}) {
    const { existingCart = null, skipFinalFetch = false } = options;
    try {
      if (!localCartItems || localCartItems.length === 0) {
        if (skipFinalFetch) {
          return existingCart || (await this.getOrCreateActiveCart(userId));
        }
        return await this.getOrCreateActiveCart(userId);
      }

      const cart = existingCart || (await this.getOrCreateActiveCart(userId));

      const backendItems = (cart.items || []).reduce((acc, item) => {
        acc[item.product_id || item.id] = item;
        return acc;
      }, {});

      const sanitizationResult = sanitizeCartItems(localCartItems);
      const { validItems } = sanitizationResult;

      for (const item of validItems) {
        const backendItem = backendItems[item.product_id || item.id];
        const localQty = item.quantity;
        const backendQty = backendItem ? backendItem.quantity : 0;
        const finalQty = Math.max(localQty, backendQty);
        try {
          await this.updateItemQuantity(cart.cart_id, item.product_id || item.id, finalQty);
        } catch (error) {
          if (isQuantityError(error)) {
            try {
              await this.updateItemQuantity(cart.cart_id, item.product_id || item.id, 1);
            } catch (retryError) {}
          }
        }
      }

      if (skipFinalFetch) {
        return { cart_id: cart.cart_id, user_id: userId };
      }
      return await this.getOrCreateActiveCart(userId);
    } catch (error) {
      throw new Error(`No se pudo migrar el carrito local: ${error.message}`);
    }
  }
}

export const cartService = new CartService();
export default cartService;

