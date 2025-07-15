import { supabase } from './supabase';
import { validateQuantity, sanitizeCartItems, isQuantityError } from '../utils/quantityValidation';

/**
 * CartService - Servicio para manejar todas las operaciones del carrito con Supabase
 * 
 * Este servicio centraliza toda la lógica de comunicación con el backend para:
 * - Crear y obtener carritos de usuarios
 * - Agregar, actualizar y eliminar items del carrito
 * - Sincronizar el estado local con el backend
 * - Transición de carrito a pedido (checkout)
 */

class CartService {  /**
   * Obtiene o crea un carrito activo para el usuario
   * @param {string} userId - ID del usuario
   * @returns {Object} Carrito con sus items
   */
  async getOrCreateActiveCart(userId) {
    try {
      // Intentar buscar carrito activo existente
      let existingCart = null;
      let searchError = null;
      
      try {
        const { data, error } = await supabase
          .from('carts')
          .select('cart_id, status, created_at, updated_at')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle(); // Usar maybeSingle en lugar de single para evitar errores si no hay resultados

        existingCart = data;
        searchError = error;
        
      } catch (err) {
        console.warn('[CartService] Error buscando carrito existente, procederemos a crear uno nuevo:', err);
        searchError = err;
      }

      if (searchError && searchError.code !== 'PGRST116') {
        console.warn('[CartService] Error no fatal buscando carrito:', searchError);
      }

      let cartId;
      let cartData;

      if (existingCart && existingCart.cart_id) {
        cartId = existingCart.cart_id;
        cartData = existingCart;
      } else {
        // Crear nuevo carrito activo
        const { data: newCart, error: createError } = await supabase
          .from('carts')
          .insert({
            user_id: userId,
            status: 'active'
          })
          .select('cart_id, status, created_at, updated_at')
          .single();

        if (createError) {
          console.error('[CartService] Error creando carrito:', createError);
          throw createError;
        }
        
        cartId = newCart.cart_id;
        cartData = newCart;
      }      // Obtener items del carrito
      const cartItems = await this.getCartItems(cartId);

      const result = {
        cart_id: cartId,
        user_id: userId,
        status: 'active',
        items: cartItems,
        created_at: cartData?.created_at || new Date().toISOString(),
        updated_at: cartData?.updated_at || new Date().toISOString()
      };
      
      return result;

    } catch (error) {
      console.error('[CartService] ❌ Error getting or creating cart:', error);
      throw new Error(`No se pudo obtener el carrito: ${error.message}`);
    }
  }  /**
   * Obtiene todos los items de un carrito
   * @param {string} cartId - ID del carrito
   * @returns {Array} Lista de items del carrito con información del producto
   */
  async getCartItems(cartId) {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          cart_items_id,
          product_id,
          quantity,
          price_at_addition,
          price_tiers,
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
            product_images (image_url),            users!products_supplier_id_fkey (
              user_nm,
              logo_url
            )
          )
        `)
        .eq('cart_id', cartId)
        .order('added_at', { ascending: false });

      if (error) {
        console.error('[CartService] Error obteniendo items del carrito:', error);
        // En lugar de lanzar error, retornar array vacío para mantener funcionalidad
        return [];
      }      // Transformar los datos para que coincidan con el formato esperado por el frontend
      const transformedData = (data || []).map(item => {
        
        return {
        cart_items_id: item.cart_items_id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_addition: item.price_at_addition,
        price_tiers: item.price_tiers,
        added_at: item.added_at,
        updated_at: item.updated_at,
        
        // ✅ Campos que espera el frontend (CartItem.jsx)
        id: item.products?.productid, // Para item.id
        productid: item.products?.productid,
        
        // Nombres del producto
        name: item.products?.productnm, // Para item.name
        nombre: item.products?.productnm, // Para item.nombre
        productnm: item.products?.productnm,
          // Proveedor
        supplier: item.products?.users?.user_nm || 'Proveedor no encontrado', // Para item.supplier
        proveedor: item.products?.users?.user_nm || 'Proveedor no encontrado', // Para item.proveedor
        
        // Imagen
        image: item.products?.product_images?.[0]?.image_url, // Para item.image
        imagen: item.products?.product_images?.[0]?.image_url, // Para item.imagen
        image_url: item.products?.product_images?.[0]?.image_url,
        thumbnail_url: item.products?.product_images?.[0]?.thumbnail_url, // ✅ NUEVO: Agregar thumbnail_url
        
        // Precios
        price: item.products?.price, // Para item.price
        precio: item.products?.price, // Para item.precio
        originalPrice: item.products?.price, // Para item.originalPrice
        precioOriginal: item.products?.price, // Para item.precioOriginal
        basePrice: item.products?.price,
          // Stock
        stock: item.products?.productqty || 99, // Para item.stock
        maxStock: item.products?.productqty || 99, // Para item.maxStock
            // Otros campos
          category: item.products?.category,
          minimum_purchase: item.products?.minimum_purchase,
          compraMinima: item.products?.minimum_purchase, // Para item.compraMinima
          negotiable: item.products?.negotiable,
          description: item.products?.description,
          supplier_id: item.products?.supplier_id
        };
      });
      
      return transformedData;

    } catch (error) {
      console.error('[CartService] ❌ Error inesperado obteniendo items del carrito:', error);
      // Retornar array vacío en lugar de lanzar error
      return [];
    }
  }

  /**
   * Agrega un producto al carrito
   * @param {string} cartId - ID del carrito
   * @param {Object} product - Producto a agregar
   * @param {number} quantity - Cantidad a agregar
   * @returns {Object} Item agregado
   */  async addItemToCart(cartId, product, quantity) {
    try {
      // Determinar el ID del producto (puede venir como productid, id, o product_id)
      const productId = product.productid || product.id || product.product_id;
      if (!productId) {
        throw new Error('Product ID not found in product object');
      }
      
      // Validar cantidad antes de procesar
      const safeQuantity = this.validateQuantity(quantity);
      
      // Verificar si el producto ya existe en el carrito
      const { data: existingItem, error: searchError } = await supabase
        .from('cart_items')
        .select('cart_items_id, quantity')
        .eq('cart_id', cartId)
        .eq('product_id', productId)
        .maybeSingle(); // Usar maybeSingle para evitar errores si no hay resultados

      if (searchError && searchError.code !== 'PGRST116') {
        console.error('[CartService] Error buscando item existente:', searchError);
        throw searchError;
      }

      let result;

      if (existingItem) {
        // Validar la nueva cantidad total
        const newTotalQuantity = this.validateQuantity(existingItem.quantity + safeQuantity);
        result = await this.updateItemQuantity(cartId, productId, newTotalQuantity);
      } else {
        // Insertar nuevo item
        const { data, error } = await supabase
          .from('cart_items')
          .insert({
            cart_id: cartId,
            product_id: productId,
            quantity: safeQuantity,
            price_at_addition: product.price,
            price_tiers: product.price_tiers || null
          })
          .select()
          .single();

        if (error) {
          console.error('[CartService] Error insertando item:', error);
          throw error;
        }
        
        result = data;

        // Actualizar timestamp del carrito
        await this.updateCartTimestamp(cartId);
      }

      return result;

    } catch (error) {
      console.error('[CartService] ❌ Error adding item to cart:', error);
      throw new Error(`No se pudo agregar el producto al carrito: ${error.message}`);
    }
  }

  /**
   * Valida que una cantidad esté dentro de límites seguros
   * @param {number} quantity - Cantidad a validar
   * @returns {number} Cantidad validada y limitada
   */
  validateQuantity(quantity) {
    return validateQuantity(quantity);
  }

  /**
   * Actualiza la cantidad de un item en el carrito
   * @param {string} cartId - ID del carrito
   * @param {string} productId - ID del producto
   * @param {number} newQuantity - Nueva cantidad
   * @returns {Object} Item actualizado
   */
  async updateItemQuantity(cartId, productId, newQuantity) {
    try {
      // Validar cantidad antes de procesar
      const safeQuantity = this.validateQuantity(newQuantity);
      
      if (safeQuantity <= 0) {
        return await this.removeItemFromCart(cartId, productId);
      }

      const { data, error } = await supabase
        .from('cart_items')
        .update({
          quantity: safeQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('cart_id', cartId)
        .eq('product_id', productId)
        .select()
        .single();

      if (error) throw error;

      // Actualizar timestamp del carrito
      await this.updateCartTimestamp(cartId);

      return data;

    } catch (error) {
      console.error('🗄️ [cartService] ERROR:', error);
      throw new Error(`No se pudo actualizar la cantidad: ${error.message}`);
    }
  }

  /**
   * Elimina un item del carrito
   * @param {string} cartId - ID del carrito
   * @param {string} productId - ID del producto
   * @returns {boolean} True si se eliminó correctamente
   */
  async removeItemFromCart(cartId, productId) {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cartId)
        .eq('product_id', productId);

      if (error) throw error;

      // Actualizar timestamp del carrito
      await this.updateCartTimestamp(cartId);

      return true;

    } catch (error) {
      console.error('Error removing item from cart:', error);
      throw new Error(`No se pudo eliminar el producto del carrito: ${error.message}`);
    }
  }

  /**
   * Vacía completamente el carrito
   * @param {string} cartId - ID del carrito
   * @returns {boolean} True si se vació correctamente
   */
  async clearCart(cartId) {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cartId);

      if (error) throw error;

      // Actualizar timestamp del carrito
      await this.updateCartTimestamp(cartId);

      return true;

    } catch (error) {
      console.error('Error clearing cart:', error);
      throw new Error(`No se pudo vaciar el carrito: ${error.message}`);
    }
  }

  /**
   * Convierte el carrito en un pedido (checkout)
   * @param {string} cartId - ID del carrito
   * @param {Object} checkoutData - Datos adicionales del checkout
   * @returns {Object} Pedido creado
   */
  async checkout(cartId, checkoutData = {}) {
    try {
      // Cambiar el status del carrito a 'pending' (primer estado del pedido)
      const { data: order, error: updateError } = await supabase
        .from('carts')
        .update({
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('cart_id', cartId)
        .select('*')
        .single();

      if (updateError) throw updateError;

      // El carrito ahora es un pedido y MyOrders podrá verlo
      return {
        order_id: order.cart_id, // Usamos cart_id como order_id
        ...order,
        ...checkoutData
      };

    } catch (error) {
      console.error('Error during checkout:', error);
      throw new Error(`No se pudo procesar el checkout: ${error.message}`);
    }
  }

  /**
   * Actualiza el timestamp del carrito
   * @param {string} cartId - ID del carrito
   */
  async updateCartTimestamp(cartId) {
    try {
      await supabase
        .from('carts')
        .update({ updated_at: new Date().toISOString() })
        .eq('cart_id', cartId);
    } catch (error) {
      console.error('Error updating cart timestamp:', error);
      // No lanzamos error aquí porque es una operación secundaria
    }
  }

  /**
   * Migra un carrito local al backend tras login con validaciones mejoradas
   * @param {string} userId - ID del usuario
   * @param {Array} localCartItems - Items del carrito local
   * @returns {Object} Carrito migrado
   */
  async migrateLocalCart(userId, localCartItems) {
    try {
      if (!localCartItems || localCartItems.length === 0) {
        return await this.getOrCreateActiveCart(userId);
      }

      // Obtener o crear carrito activo
      const cart = await this.getOrCreateActiveCart(userId);

      // Obtener items actuales del backend para comparar cantidades
      const backendItems = (cart.items || []).reduce((acc, item) => {
        acc[item.product_id || item.id] = item;
        return acc;
      }, {});

      // Filtrar y validar items del carrito local usando utilidad centralizada
      const sanitizationResult = sanitizeCartItems(localCartItems);
      const { validItems } = sanitizationResult;

      for (const item of validItems) {
        const backendItem = backendItems[item.product_id || item.id];
        const localQty = item.quantity;
        const backendQty = backendItem ? backendItem.quantity : 0;
        // Tomar la mayor cantidad entre local y backend
        const finalQty = Math.max(localQty, backendQty);
        try {
          await this.updateItemQuantity(cart.cart_id, item.product_id || item.id, finalQty);
        } catch (error) {
          console.error(`[CartService] ❌ Error migrando item ${item.id || item.name}:`, error);
          // Si es un error de cantidad, intentar con cantidad mínima
          if (isQuantityError(error)) {
            try {
              console.warn(`[CartService] 🚨 Reintentando con cantidad mínima para item ${item.id}`);
              await this.updateItemQuantity(cart.cart_id, item.product_id || item.id, 1);
            } catch (retryError) {
              console.error(`[CartService] ❌ Falló reintento para item ${item.id}:`, retryError);
            }
          }
        }
      }

      // Retornar carrito actualizado
      return await this.getOrCreateActiveCart(userId);

    } catch (error) {
      console.error('Error migrating local cart:', error);
      throw new Error(`No se pudo migrar el carrito local: ${error.message}`);
    }
  }
}

// Exportar una instancia singleton del servicio
export const cartService = new CartService();
export default cartService;
