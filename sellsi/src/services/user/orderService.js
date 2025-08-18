import { supabase } from '../supabase';
import { addBusinessDaysChile, toISODateOnly } from '../../utils/businessDaysChile';

// Normalizador único para document_type -> 'boleta' | 'factura' | 'ninguno'
function normalizeDocumentType(val) {
  if (!val) return 'ninguno';
  const v = String(val).toLowerCase();
  return (v === 'boleta' || v === 'factura') ? v : 'ninguno';
}

// DEBUG deshabilitado (se removieron los console.logs); cambiar a true y reintroducir prints manualmente si se necesita diagnóstico.
const DEBUG_ORDERS = false; // Mantener bandera por compatibilidad futura

/**
 * OrderService - Servicio para manejar todas las operaciones de pedidos con Supabase
 * 
 * Este servicio centraliza toda la lógica de comunicación con el backend para:
 * - Obtener pedidos por proveedor
 * - Actualizar estados de pedidos
 * - Gestionar acciones de proveedores (aceptar, rechazar, despachar, entregar)
 * - Mantener sincronía con el flujo de carrito a pedido
 */

class OrderService {
  /**
   * Obtiene pedidos de la nueva tabla 'orders' (flujo de pago Khipu) para un proveedor.
   * Filtra los items dentro de cada order para mostrar solo los productos del supplier.
   * @param {string} supplierId
   * @returns {Array}
   */
  async getPaymentOrdersForSupplier(supplierId) {
    try {
      if (!supplierId) throw new Error('ID de proveedor es requerido');
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(supplierId)) throw new Error('ID de proveedor no tiene formato UUID válido');

      // Obtener todas las órdenes con items
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          user_id,
          items,
          subtotal,
          tax,
          shipping,
          total,
          currency,
          status,
          payment_status,
          payment_method,
          created_at,
          updated_at,
          accepted_at,
          dispatched_at,
          delivered_at,
          cancelled_at,
          rejection_reason,
          cancellation_reason
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];      // Filtrar y procesar órdenes que contengan productos del supplier
      const supplierOrders = [];
      const userIdsSet = new Set();
      const productIdsSet = new Set();

      for (const order of data) {
        let parsedItems = [];
        if (Array.isArray(order.items)) parsedItems = order.items;
        else if (order.items && typeof order.items === 'string') { 
          try { parsedItems = JSON.parse(order.items); } catch (_) { parsedItems = []; } 
        }
        else if (order.items && typeof order.items === 'object') { 
          parsedItems = Array.isArray(order.items.items) ? order.items.items : [order.items]; 
        }

        // Filtrar items que pertenecen a este supplier
        const supplierItems = parsedItems.filter(item => item.supplier_id === supplierId);
        
        if (supplierItems.length > 0) {
          userIdsSet.add(order.user_id);
          supplierItems.forEach(item => {
            if (item.product_id) productIdsSet.add(item.product_id);
          });
          
          supplierOrders.push({
            ...order,
            supplier_items: supplierItems,
            original_total: order.total,
            supplier_total: supplierItems.reduce((sum, item) => sum + (item.price_at_addition * item.quantity), 0)
          });
        }
      }

      // Batch fetch user data with shipping info
      let usersMap = new Map();
      if (userIdsSet.size > 0) {
        const userIds = Array.from(userIdsSet);
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select(`
            user_id,
            user_nm,
            email,
            phone_nbr,
            shipping_info (
              shipping_region,
              shipping_commune,
              shipping_address,
              shipping_number,
              shipping_dept
            )
          `)
          .in('user_id', userIds);

        if (!usersError && users) {
          usersMap = new Map(users.map(u => [u.user_id, u]));
        }
      }

      // AGREGAR FALLBACK: Si algunos usuarios no tienen shipping_info, buscar directamente en la tabla shipping_info
      const missingUserIds = Array.from(userIdsSet).filter(userId => {
        const user = usersMap.get(userId);
        // CORREGIR: Detectar arrays vacíos también como missing
        const hasValidShippingInfo = user?.shipping_info && 
          user.shipping_info.length > 0 && 
          user.shipping_info[0]?.shipping_address && 
          user.shipping_info[0]?.shipping_region;
        
        const isMissing = !user || !hasValidShippingInfo;
        
        return isMissing;
      });

      let fallbackShippingByUser = new Map();
      if (missingUserIds.length > 0) {
        const { data: fallbackShip, error: fallbackErr } = await supabase
          .from('shipping_info')
          .select('user_id, shipping_region, shipping_commune, shipping_address, shipping_number, shipping_dept')
          .in('user_id', missingUserIds);
        if (!fallbackErr && Array.isArray(fallbackShip)) {
          fallbackShippingByUser = new Map(
            fallbackShip.map(r => [r.user_id, r])
          );
        }
      }

      // Batch fetch product data with delivery regions
      let productsMap = new Map();
      if (productIdsSet.size > 0) {
        const productIds = Array.from(productIdsSet);
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select(`
            productid,
            productnm,
            price,
            category,
            description,
            product_delivery_regions (
              region,
              price,
              delivery_days
            ),
            product_images (
              image_url,
              thumbnail_url,
              thumbnails
            )
          `)
          .in('productid', productIds);

        if (!productsError && products) {
          productsMap = new Map(products.map(p => [p.productid, p]));
        }
      }

      // Función para calcular fecha de entrega límite (igual que en flujo legacy)
      const calculateDeliveryDeadline = (createdAtISO, items, buyerRegion) => {
        let maxDeliveryDays = 0;
        items.forEach(item => {
          const product = productsMap.get(item.product_id);
          const deliveryRegions = product?.product_delivery_regions || [];
          const regionMatch = deliveryRegions.find(dr => dr.region === buyerRegion);
          if (regionMatch && Number(regionMatch.delivery_days) > maxDeliveryDays) {
            maxDeliveryDays = Number(regionMatch.delivery_days);
          }
        });
        if (maxDeliveryDays === 0) maxDeliveryDays = 7; // fallback
        const start = new Date(createdAtISO);
        const deadline = addBusinessDaysChile(start, maxDeliveryDays);
        return toISODateOnly(deadline);
      };

      // Transformar a formato compatible con MyOrdersPage
      const transformedOrders = supplierOrders.map(order => {
        const user = usersMap.get(order.user_id) || {};
        let shippingInfo = user.shipping_info?.[0] || {};
        
        // USAR FALLBACK: Si no hay shipping_info en el user, buscar en fallback
        if ((!shippingInfo || Object.keys(shippingInfo).length === 0) && fallbackShippingByUser.size > 0) {
          const fb = fallbackShippingByUser.get(order.user_id);
          if (fb) {
            shippingInfo = fb;
          }
        }
        
        const deliveryAddress = {
          region: shippingInfo.shipping_region || 'Región no especificada',
          commune: shippingInfo.shipping_commune || 'Comuna no especificada',
          address: shippingInfo.shipping_address || 'Dirección no especificada',
          number: shippingInfo.shipping_number || '',
          department: shippingInfo.shipping_dept || '',
          fullAddress: `${shippingInfo.shipping_address || 'Dirección no especificada'} ${shippingInfo.shipping_number || ''} ${shippingInfo.shipping_dept || ''}`.trim()
        };

        // Calcular fecha límite usando la misma lógica que el flujo legacy
        const estimatedDeliveryDate = calculateDeliveryDeadline(order.created_at, order.supplier_items, deliveryAddress.region);

        return {
          order_id: order.id,
          buyer_id: order.user_id,
          status: order.status,
          payment_status: order.payment_status,
          created_at: order.created_at,
          updated_at: order.updated_at,
          accepted_at: order.accepted_at,
          dispatched_at: order.dispatched_at,
          delivered_at: order.delivered_at,
          estimated_delivery_date: estimatedDeliveryDate, // Calculado correctamente
          
          // Información del comprador
          buyer: {
            user_id: user.user_id || order.user_id,
            name: user.user_nm || 'Usuario desconocido',
            email: user.email || 'Email no disponible',
            phone: user.phone_nbr || 'Teléfono no disponible'
          },

          // Dirección de entrega
          delivery_address: deliveryAddress,
          deliveryAddress: deliveryAddress,

          // Items del supplier con información completa del producto
          items: order.supplier_items.map(item => {
            const product = productsMap.get(item.product_id) || {};
            return {
              cart_items_id: item.cart_items_id || item.id || `${order.id}-${item.product_id}`,
              product_id: item.product_id,
              quantity: item.quantity,
              price_at_addition: item.price_at_addition,
              price_tiers: item.price_tiers,
              // Added document_type propagation
              document_type: normalizeDocumentType(item.document_type || item.documentType),
              
              product: {
                productid: item.product_id,
                name: item.name || item.productnm || product.productnm || 'Producto',
                price: item.price || item.price_at_addition || product.price,
                category: item.category || product.category,
                description: item.description || product.description,
                image_url: item.image_url || product.product_images?.[0]?.image_url,
                thumbnail_url: item.thumbnail_url || product.product_images?.[0]?.thumbnail_url,
                thumbnails: item.thumbnails || product.product_images?.[0]?.thumbnails,
                delivery_regions: product.product_delivery_regions || []
              }
            };
          }),

          // Totales (solo del supplier)
          total_items: order.supplier_items.length,
          total_quantity: order.supplier_items.reduce((sum, item) => sum + item.quantity, 0),
          total_amount: order.supplier_total,
          
          // Marcadores para identificar fuente
          is_payment_order: true,
          source: 'orders_table'
        };
      });

      return transformedOrders;

    } catch (error) {
      throw new Error(`No se pudieron obtener payment orders para supplier: ${error.message}`);
    }
  }

  /**
   * Obtiene pedidos de la nueva tabla 'orders' (flujo de pago Khipu) para un comprador.
   * Estos pueden estar en payment_status = pending (procesando pago) o paid (pagado) u otro (error).
   * Se usarán para mostrar en BuyerOrders mientras aún no se materializa el pedido tradicional.
   * @param {string} buyerId
   * @returns {Array}
   */
  async getPaymentOrdersForBuyer(buyerId) {
    try {
      if (!buyerId) throw new Error('ID de comprador es requerido');
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(buyerId)) throw new Error('ID de comprador no tiene formato UUID válido');

  // Log eliminado

      // Pedidos ordenados con los más recientes primero
  const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          cart_id,
          user_id,
          items,
          subtotal,
          tax,
          shipping,
          total,
          currency,
          status,
          payment_status,
          payment_method,
          created_at,
          updated_at
        `)
        .eq('user_id', buyerId)
        .order('created_at', { ascending: false });

  if (error) throw error;
      if (!data || data.length === 0) return [];

  // Log eliminado

      // 1) Parse all items once and collect supplier_ids y product_ids para enrichment
      const productIdsSet = new Set();
      const parsed = data.map(row => {
        let parsedItems = [];
        if (Array.isArray(row.items)) parsedItems = row.items;
        else if (row.items && typeof row.items === 'string') { try { parsedItems = JSON.parse(row.items); } catch (_) { parsedItems = []; } }
        else if (row.items && typeof row.items === 'object') { parsedItems = Array.isArray(row.items.items) ? row.items.items : [row.items]; }
        parsedItems.forEach(it => { if (it?.product_id) productIdsSet.add(it.product_id); });
        return { row, parsedItems };
      });

      const supplierIdsSet = new Set();
      parsed.forEach(({ parsedItems }) => {
        parsedItems.forEach(it => { if (it?.supplier_id) supplierIdsSet.add(it.supplier_id); });
      });
      const supplierIds = Array.from(supplierIdsSet);

      // 2) Batch fetch suppliers to enrich name/verified
      let suppliersMap = new Map();
      if (supplierIds.length > 0) {
        const { data: suppliers, error: supErr } = await supabase
          .from('users')
          .select('user_id, user_nm, verified, email')
          .in('user_id', supplierIds);
        if (!supErr && suppliers) {
          suppliersMap = new Map(suppliers.map(u => [u.user_id, u]));
        }
      }

      // 3) Batch fetch products (para thumbnails) sólo si faltan
      let productsMap = new Map();
      if (productIdsSet.size > 0) {
        const productIds = Array.from(productIdsSet);
        const { data: products, error: prodErr } = await supabase
          .from('products')
          .select(`
            productid,
            product_images (image_url, thumbnail_url, thumbnails)
          `)
          .in('productid', productIds);
        if (!prodErr && products) {
          productsMap = new Map(products.map(p => [p.productid, p]));
        }
      }

  // 4) Build final normalized orders with enriched supplier + imágenes
      return parsed.map(({ row, parsedItems }) => {
        const normalizedItems = parsedItems.map((it, idx) => {
          const sId = it.supplier_id || null;
          const su = sId ? suppliersMap.get(sId) : null;
          const prod = (it.product_id && productsMap.get(it.product_id)) || {};
          const firstImage = Array.isArray(prod.product_images) ? prod.product_images[0] : {};
          return {
            cart_items_id: it.cart_items_id || it.id || `${row.id}-itm-${idx}`,
            product_id: it.product_id || it.productid || it.id || null,
            quantity: it.quantity || 1,
            price_at_addition: it.price_at_addition || it.price || 0,
            price_tiers: it.price_tiers || null,
            document_type: normalizeDocumentType(it.document_type || it.documentType),
            product: {
              id: it.product_id || it.productid || it.id || null,
              productid: it.product_id || it.productid || null,
              name: it.name || it.productnm || 'Producto',
              price: it.price || it.price_at_addition || 0,
              category: it.category || null,
              description: it.description || '',
              supplier_id: sId,
              image_url: it.image_url || firstImage?.image_url || null,
              thumbnail_url: it.thumbnail_url || firstImage?.thumbnail_url || null,
              thumbnails: it.thumbnails || firstImage?.thumbnails || null,
              imagen: it.image_url || it.thumbnail_url || firstImage?.image_url || firstImage?.thumbnail_url || null,
              supplier: {
                name: (su?.user_nm) || it.supplier_name || 'Proveedor desconocido',
                email: (su?.email) || it.supplier_email || '',
                verified: !!su?.verified
              },
              proveedor: (su?.user_nm) || it.supplier_name || 'Proveedor desconocido',
              verified: !!su?.verified,
              supplierVerified: !!su?.verified
            }
          };
        });

        return {
          order_id: row.id,
          cart_id: row.cart_id || null,
          buyer_id: row.user_id,
          status: row.status || 'pending',
          payment_status: row.payment_status || 'pending',
          created_at: row.created_at,
          updated_at: row.updated_at,
          buyer: { user_id: row.user_id },
          delivery_address: null,
          items: normalizedItems,
          total_items: normalizedItems.length,
          total_quantity: normalizedItems.reduce((s,i)=>s + (i.quantity||0),0),
          total_amount: row.total || normalizedItems.reduce((s,i)=>s + (i.price_at_addition * i.quantity),0),
          subtotal: row.subtotal || null,
          tax: row.tax || null,
          shipping: row.shipping || null,
          shipping_amount: row.shipping || 0,
          final_amount: row.total || (normalizedItems.reduce((s,i)=>s + (i.price_at_addition * i.quantity),0) + (row.shipping || 0)),
          is_payment_order: true
        };
      });
    } catch (error) {
      throw new Error(`No se pudieron obtener payment orders: ${error.message}`);
    }
  }

  /**
   * Suscripción realtime a cambios en 'orders' para un comprador.
   * Llama al callback con payload Supabase.
   * Retorna función para desuscribir.
   */
  subscribeToBuyerPaymentOrders(buyerId, onChange) {
    if (!buyerId) return () => {};
    const channel = supabase
      .channel(`orders_changes_${buyerId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${buyerId}` }, (payload) => {
        try { onChange && onChange(payload); } catch (_) {}
      })
      .subscribe();
    return () => { try { supabase.removeChannel(channel); } catch (_) {} };
  }

  /**
   * Obtiene solo estados mínimos de orders para un comprador (para polling liviano)
   */
  async getPaymentStatusesForBuyer(buyerId) {
    if (!buyerId) throw new Error('ID de comprador es requerido');
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(buyerId)) throw new Error('ID de comprador no tiene formato UUID válido');
    const { data, error } = await supabase
      .from('orders')
      .select('id, payment_status, status, updated_at')
      .eq('user_id', buyerId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
  /**
   * Obtiene todos los pedidos para un proveedor específico
   * @param {string} supplierId - ID del proveedor
   * @param {Object} filters - Filtros opcionales (status, fechas, etc.)
   * @returns {Array} Lista de pedidos con sus items
  */
  async getOrdersForSupplier(supplierId, filters = {}) {
    try {
  // Log eliminado
      // Validate supplierId is a valid UUID
      if (!supplierId) {
        throw new Error('ID de proveedor es requerido');
      }
      
      // Basic UUID format validation
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(supplierId)) {
        throw new Error('ID de proveedor no tiene formato UUID válido');
      }

      // First, get the products for this supplier to filter carts
      const { data: supplierProducts, error: productsError } = await supabase
        .from('products')
        .select('productid')
        .eq('supplier_id', supplierId);

      if (productsError) {
        throw new Error(`Error obteniendo productos del proveedor: ${productsError.message}`);
      }

  if (!supplierProducts || supplierProducts.length === 0) return [];

      const productIds = supplierProducts.map(p => p.productid);
  // Log eliminado

      // Now get carts that contain items from this supplier's products
      let query = supabase
        .from('carts')
        .select(`
          cart_id,
          user_id,
          status,
          created_at,
          updated_at,
          shipping_total,
          shipping_currency,
          users!carts_user_id_fkey (
            user_id,
            user_nm,
            email,
            phone_nbr,
            shipping_info (
              shipping_region,
              shipping_commune,
              shipping_address,
              shipping_number,
              shipping_dept
            )
          ),
          cart_items!inner (
            cart_items_id,
            product_id,
            quantity,
            price_at_addition,
            price_tiers,
            added_at,
            updated_at,
            document_type,
            products!inner (
              productid,
              productnm,
              price,
              category,
              description,
              supplier_id,
              product_images (image_url, thumbnail_url),
              product_delivery_regions (
                region,
                price,
                delivery_days
              )
            )
          )
        `)
        .neq('status', 'active') // Solo pedidos (no carritos activos)
        .in('cart_items.product_id', productIds)
        .order('created_at', { ascending: false });

      // Aplicar filtros de estado
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Aplicar filtros de fecha
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query;
  if (error) throw error;

      // Handle case where no data is returned
  if (!data || data.length === 0) return [];

  // Log eliminado

      // Fallback: recolectar user_ids sin shipping_info embebido y traerlos en un batch
      const missingUserIds = Array.from(
        new Set(
          data
            .filter(cart => !(Array.isArray(cart.users?.shipping_info) && cart.users.shipping_info.length > 0))
            .map(cart => cart.user_id)
            .filter(Boolean)
        )
      );

      let fallbackShippingByUser = new Map();
      if (missingUserIds.length > 0) {
        const { data: fallbackShip, error: fallbackErr } = await supabase
          .from('shipping_info')
          .select('user_id, shipping_region, shipping_commune, shipping_address, shipping_number, shipping_dept')
          .in('user_id', missingUserIds);
        if (!fallbackErr && Array.isArray(fallbackShip)) {
          fallbackShippingByUser = new Map(
            fallbackShip.map(r => [r.user_id, r])
          );
        }
      }

      // Transformar los datos para el formato esperado por MyOrders
      const orders = data
        .filter(cart => cart.cart_items && cart.cart_items.length > 0) // Solo carritos con items del proveedor
        .map(cart => {
          // Logs de procesamiento eliminados
          // Filter items that belong to this supplier
          const supplierItems = cart.cart_items.filter(item => 
            item.products && item.products.supplier_id === supplierId
          );

          // Skip carts that don't have items for this supplier
          if (supplierItems.length === 0) return null;

          // Obtener Dirección de Despacho del comprador
          let shippingInfo = cart.users?.shipping_info?.[0] || {};
          if ((!shippingInfo || Object.keys(shippingInfo).length === 0) && fallbackShippingByUser.size > 0) {
            const fb = fallbackShippingByUser.get(cart.user_id);
            if (fb) shippingInfo = fb;
          }
          const deliveryAddress = {
            region: shippingInfo.shipping_region || 'Región no especificada',
            commune: shippingInfo.shipping_commune || 'Comuna no especificada',
            address: shippingInfo.shipping_address || 'Dirección no especificada',
            number: shippingInfo.shipping_number || '',
            department: shippingInfo.shipping_dept || '',
            fullAddress: `${shippingInfo.shipping_address || 'Dirección no especificada'} ${shippingInfo.shipping_number || ''} ${shippingInfo.shipping_dept || ''}`.trim()
          };

          // Log eliminado

          // Calcular fecha de entrega límite en días hábiles chilenos
          const calculateDeliveryDeadline = (createdAtISO, items, buyerRegion) => {
            let maxDeliveryDays = 0;
            items.forEach(item => {
              const deliveryRegions = item.products?.product_delivery_regions || [];
              const regionMatch = deliveryRegions.find(dr => dr.region === buyerRegion);
              if (regionMatch && Number(regionMatch.delivery_days) > maxDeliveryDays) {
                maxDeliveryDays = Number(regionMatch.delivery_days);
              }
            });
            if (maxDeliveryDays === 0) maxDeliveryDays = 7; // fallback
            const start = new Date(createdAtISO);
            const deadline = addBusinessDaysChile(start, maxDeliveryDays);
            return toISODateOnly(deadline);
          };

          const estimatedDeliveryDate = calculateDeliveryDeadline(cart.created_at, supplierItems, deliveryAddress.region);

          // Calcular total líneas
          const linesTotal = cart.cart_items.reduce((sum, item) => sum + (item.price_at_addition * item.quantity), 0);
          const shippingPersisted = cart.shipping_total || 0;
          // total_amount se mantiene como suma de líneas (legacy) para compat, pero añadimos final_amount
          return {
            order_id: cart.cart_id,
            cart_id: cart.cart_id,
            buyer_id: cart.user_id,
            status: cart.status,
            created_at: cart.created_at,
            updated_at: cart.updated_at,
            estimated_delivery_date: estimatedDeliveryDate,
            
            // Información del comprador
            buyer: {
              user_id: cart.users?.user_id || cart.user_id,
              name: cart.users?.user_nm || 'Usuario desconocido',
              email: cart.users?.email || 'Email no disponible',
              phone: cart.users?.phone_nbr || 'Teléfono no disponible'
            },

            // Dirección de Despacho
            delivery_address: deliveryAddress,
            deliveryAddress: deliveryAddress, // ✅ AGREGAR para consistencia con payment orders

            // Items del pedido (solo los del proveedor)
            items: supplierItems.map(item => ({
              cart_items_id: item.cart_items_id,
              product_id: item.product_id,
              quantity: item.quantity,
              price_at_addition: item.price_at_addition,
              price_tiers: item.price_tiers,
              document_type: item.document_type || item.documentType || 'ninguno',
              
              // Información del producto
              product: {
                productid: item.products.productid,
                name: item.products.productnm,
                price: item.products.price,
                category: item.products.category,
                description: item.products.description,
                image_url: item.products.product_images?.[0]?.image_url,
                thumbnail_url: item.products.product_images?.[0]?.thumbnail_url,
                delivery_regions: item.products.product_delivery_regions || []
              }
            })),

            // Cálculos del pedido
            total_items: supplierItems.length,
            total_quantity: supplierItems.reduce((sum, item) => sum + item.quantity, 0),
            total_amount: supplierItems.reduce((sum, item) => sum + (item.price_at_addition * item.quantity), 0)
          };
        })
        .filter(order => order !== null) // Remove null entries
        .filter(order => order.items.length > 0); // Solo órdenes con items del proveedor

  // Log eliminado

      return orders;

    } catch (error) {
      throw new Error(`No se pudieron obtener los pedidos: ${error.message}`);
    }
  }

  /**
   * Actualiza el estado de un pedido - maneja tanto órdenes legacy (carts) como nuevas (orders)
   * @param {string} orderId - ID del pedido
   * @param {string} newStatus - Nuevo estado del pedido
   * @param {Object} additionalData - Datos adicionales (mensajes, fechas, etc.)
   * @returns {Object} Pedido actualizado
   */
  async updateOrderStatus(orderId, newStatus, additionalData = {}) {
    try {
      // Validar estados permitidos
      const validStatuses = [
        'pending',     // Pendiente (recién creado)
        'accepted',    // Aceptado por proveedor
        'rejected',    // Rechazado por proveedor
        'in_transit',  // En tránsito / despachado
        'delivered',   // Entregado
        'cancelled'    // Cancelado
      ];

      const normalizedStatus = this.normalizeStatus(newStatus);
      
      if (!validStatuses.includes(normalizedStatus)) {
        throw new Error(`Estado no válido: ${newStatus}`);
      }

      // Preparar datos para actualizar
      const updateData = {
        status: normalizedStatus,
        updated_at: new Date().toISOString()
      };

      // ================================================================
      // GUARDIA: No permitir avanzar (accepted / in_transit / delivered)
      // si la orden de pagos asociada aún no está payment_status = 'paid'
      // (Sólo aplica a filas en la tabla orders — flujo Khipu)
      // ================================================================
      const ADVANCE_STATUSES = new Set(['accepted','in_transit','delivered']);
      if (ADVANCE_STATUSES.has(normalizedStatus)) {
        try {
          const { data: existingOrderRow, error: fetchExistingOrderErr } = await supabase
            .from('orders')
            .select('id, payment_status')
            .eq('id', orderId)
            .maybeSingle();
          if (!fetchExistingOrderErr && existingOrderRow) {
            const payStatus = existingOrderRow.payment_status || 'pending';
            if (payStatus !== 'paid') {
              throw new Error('No se puede cambiar el estado a "' + normalizedStatus + '" porque el pago no está confirmado (payment_status=' + payStatus + ').');
            }
          }
        } catch (guardErr) {
          // Re-lanzar para que el flujo superior capture y devuelva mensaje claro
          throw guardErr;
        }
      }

      // Intentar actualizar primero en la tabla orders (nuevo flujo)
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select('*')
        .single();

      // Si encontramos el pedido en orders, usar ese resultado
      if (!orderError && orderData) {
        await this.logOrderAction(orderId, newStatus, additionalData);
        return {
          success: true,
          order: orderData,
          source: 'orders',
          message: `Pedido ${this.getStatusDisplayName(normalizedStatus)} correctamente`
        };
      }

      // Si no está en orders, intentar en carts (flujo legacy)
      const { data: cartData, error: cartError } = await supabase
        .from('carts')
        .update(updateData)
        .eq('cart_id', orderId)
        .select('*')
        .single();

      if (cartError) {
        throw new Error(`Pedido no encontrado en ninguna tabla: ${cartError.message}`);
      }

      await this.logOrderAction(orderId, newStatus, additionalData);

      return {
        success: true,
        order: cartData,
        source: 'carts',
        message: `Pedido ${this.getStatusDisplayName(normalizedStatus)} correctamente`
      };

    } catch (error) {
      throw new Error(`No se pudo actualizar el estado del pedido: ${error.message}`);
    }
  }

  /**
   * Normaliza el estado del pedido para la base de datos
   * @param {string} status - Estado en español o formato UI
   * @returns {string} Estado normalizado para BD
   */
  normalizeStatus(status) {
    const statusMap = {
      'Pendiente': 'pending',
      'Aceptado': 'accepted',
      'Rechazado': 'rejected',
  'En Transito': 'in_transit',
      'Entregado': 'delivered',
      'Cancelado': 'cancelled',
      // También manejar estados en inglés
      'pending': 'pending',
      'accepted': 'accepted',
      'rejected': 'rejected',
      'in_transit': 'in_transit',
      'delivered': 'delivered',
      'cancelled': 'cancelled'
    };

    return statusMap[status] || status.toLowerCase();
  }

  /**
   * Obtiene el nombre de visualización del estado
   * @param {string} status - Estado de la BD
   * @returns {string} Nombre para mostrar
   */
  getStatusDisplayName(status) {
    const displayMap = {
      'pending': 'Pendiente',
      'accepted': 'Aceptado',
      'rejected': 'Rechazado',
  'in_transit': 'En Transito',
      'delivered': 'Entregado',
      'cancelled': 'Cancelado'
    };

    return displayMap[status] || status;
  }

  /**
   * Obtiene estadísticas de pedidos para el proveedor
   * @param {string} supplierId - ID del proveedor
   * @param {Object} period - Período de tiempo (opcional)
   * @returns {Object} Estadísticas de pedidos
   */
  async getOrderStats(supplierId, period = {}) {
    try {
      let query = supabase
        .from('carts')
        .select(`
          status,
          created_at,
          cart_items!inner (
            quantity,
            price_at_addition,
            products!inner (
              supplier_id
            )
          )
        `)
        .neq('status', 'active')
        .eq('cart_items.products.supplier_id', supplierId);

      // Aplicar filtros de período
      if (period.from) {
        query = query.gte('created_at', period.from);
      }
      if (period.to) {
        query = query.lte('created_at', period.to);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calcular estadísticas
      const stats = {
        total_orders: data.length,
        pending: data.filter(order => order.status === 'pending').length,
        accepted: data.filter(order => order.status === 'accepted').length,
        rejected: data.filter(order => order.status === 'rejected').length,
        in_transit: data.filter(order => order.status === 'in_transit').length,
        delivered: data.filter(order => order.status === 'delivered').length,
        cancelled: data.filter(order => order.status === 'cancelled').length,
        
        total_revenue: data
          .filter(order => ['accepted', 'in_transit', 'delivered'].includes(order.status))
          .reduce((sum, order) => {
            return sum + order.cart_items.reduce((itemSum, item) => {
              return itemSum + (item.price_at_addition * item.quantity);
            }, 0);
          }, 0),

        total_items_sold: data
          .filter(order => ['delivered'].includes(order.status))
          .reduce((sum, order) => {
            return sum + order.cart_items.reduce((itemSum, item) => {
              return itemSum + item.quantity;
            }, 0);
          }, 0)
      };

      return stats;

    } catch (error) {
      throw new Error(`No se pudieron obtener las estadísticas: ${error.message}`);
    }
  }

  /**
   * Registra una acción realizada en un pedido (para auditoría)
   * @param {string} orderId - ID del pedido
   * @param {string} action - Acción realizada
   * @param {Object} data - Datos adicionales
   */
  async logOrderAction(orderId, action, data = {}) {
    try {
      // Esta función puede expandirse en el futuro para crear una tabla de logs
      // Acción en pedido
      
      // En el futuro, se puede implementar una tabla order_logs:
      // const { error } = await supabase
      //   .from('order_logs')
      //   .insert({
      //     order_id: orderId,
      //     action: action,
      //     data: data,
      //     timestamp: new Date().toISOString()
      //   });

    } catch (error) {
      // No lanzar error aquí porque es una función auxiliar
    }
  }

  /**
   * Busca pedidos por texto (nombre del comprador, ID, etc.)
   * @param {string} supplierId - ID del proveedor
   * @param {string} searchText - Texto a buscar
   * @returns {Array} Pedidos que coinciden con la búsqueda
   */
  async searchOrders(supplierId, searchText) {
    try {
      const { data, error } = await supabase
        .from('carts')
        .select(`
          cart_id,
          user_id,
          status,
          created_at,
          updated_at,
          users!carts_user_id_fkey (
            user_nm,
            email
          ),
          cart_items (
            products (
              supplier_id,
              productnm
            )
          )
        `)
        .neq('status', 'active')
        .eq('cart_items.products.supplier_id', supplierId)
        .or(`
          cart_id.ilike.%${searchText}%,
          users.user_nm.ilike.%${searchText}%,
          users.email.ilike.%${searchText}%
        `);

      if (error) throw error;

      return data || [];

    } catch (error) {
      throw new Error(`Error en la búsqueda: ${error.message}`);
    }
  }

  /**
   * Obtiene todos los pedidos para un comprador específico
   * @param {string} buyerId - ID del comprador
   * @param {Object} filters - Filtros opcionales (status, fechas, etc.)
   * @returns {Array} Lista de pedidos con sus items
   */
  async getOrdersForBuyer(buyerId, filters = {}) {
    try {
      // Validate buyerId is a valid UUID
      if (!buyerId) {
        throw new Error('ID de comprador es requerido');
      }
      
      // Basic UUID format validation
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(buyerId)) {
        throw new Error('ID de comprador no tiene formato UUID válido');
      }

      // Get carts for this buyer that are not active (completed orders)
      let query = supabase
        .from('carts')
        .select(`
          cart_id,
          user_id,
          status,
          created_at,
          updated_at,
          shipping_total,
          shipping_currency,
          users!carts_user_id_fkey (
            user_id,
            user_nm,
            email,
            phone_nbr,
            shipping_info (
              shipping_region,
              shipping_commune,
              shipping_address,
              shipping_number,
              shipping_dept
            )
          ),
          cart_items (
            cart_items_id,
            product_id,
            quantity,
            price_at_addition,
            price_tiers,
            added_at,
            updated_at,
            document_type,
            products (
              productid,
              productnm,
              price,
              category,
              description,
              supplier_id,
              product_images (
                image_url,
                thumbnail_url,
                thumbnails
              ),
              users!products_supplier_id_fkey (
                user_nm,
                email,
                verified
              )
            )
          )
        `)
        .eq('user_id', buyerId)
        .neq('status', 'active') // Solo pedidos completados (no carritos activos)
        .order('created_at', { ascending: false });

      // Aplicar filtros de estado
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Aplicar filtros de fecha
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Handle case where no data is returned
      if (!data || data.length === 0) {
        return [];
      }

      // Transformar los datos para el formato esperado por BuyerOrders
      const orders = data
        .filter(cart => cart.cart_items && cart.cart_items.length > 0)
        .map(cart => {
          // Obtener Dirección de Despacho del comprador
          const shippingInfo = cart.users?.shipping_info?.[0] || {};
          const deliveryAddress = {
            region: shippingInfo.shipping_region || 'Región no especificada',
            commune: shippingInfo.shipping_commune || 'Comuna no especificada',
            address: shippingInfo.shipping_address || 'Dirección no especificada',
            number: shippingInfo.shipping_number || '',
            department: shippingInfo.shipping_dept || '',
            fullAddress: `${shippingInfo.shipping_address || 'Dirección no especificada'} ${shippingInfo.shipping_number || ''} ${shippingInfo.shipping_dept || ''}`.trim()
          };

          // Calcular totales de líneas y shipping persistido (similar a flujo supplier)
          const linesTotal = cart.cart_items.reduce((sum, item) => sum + (item.price_at_addition * item.quantity), 0);
          const shippingPersisted = cart.shipping_total || 0;

          return {
            order_id: cart.cart_id,
            cart_id: cart.cart_id,
            buyer_id: cart.user_id,
            status: cart.status,
            created_at: cart.created_at,
            updated_at: cart.updated_at,
            
            // Información del comprador
            buyer: {
              user_id: cart.users?.user_id || cart.user_id,
              name: cart.users?.user_nm || 'Usuario desconocido',
              email: cart.users?.email || 'Email no disponible',
              phone: cart.users?.phone_nbr || 'Teléfono no disponible'
            },

            // Dirección de Despacho
            delivery_address: deliveryAddress,

            // Items del pedido
      items: cart.cart_items.map(item => ({
              cart_items_id: item.cart_items_id,
              product_id: item.product_id,
              quantity: item.quantity,
              price_at_addition: item.price_at_addition,
              price_tiers: item.price_tiers,
              document_type: item.document_type || item.documentType || 'ninguno',
              
              // Información del producto
              product: {
        id: item.products.productid, // para hooks de thumbnails
                productid: item.products.productid,
                name: item.products.productnm,
                price: item.products.price,
                category: item.products.category,
                description: item.products.description,
                supplier_id: item.products.supplier_id,
        image_url: item.products.product_images?.[0]?.image_url,
        thumbnail_url: item.products.product_images?.[0]?.thumbnail_url,
        thumbnails: item.products.product_images?.[0]?.thumbnails,
        imagen: item.products.product_images?.[0]?.image_url, // fallback genérico usado por UniversalProductImage
                
                // Información del proveedor
                supplier: {
                  name: item.products.users?.user_nm || 'Proveedor desconocido',
                  email: item.products.users?.email || 'Email no disponible',
                  verified: !!item.products.users?.verified
                },
                // Aliases de compatibilidad con otros componentes
                proveedor: item.products.users?.user_nm || 'Proveedor desconocido',
                verified: !!item.products.users?.verified,
                supplierVerified: !!item.products.users?.verified
              }
            })),

            // Cálculos del pedido
            total_items: cart.cart_items.length,
            total_quantity: cart.cart_items.reduce((sum, item) => sum + item.quantity, 0),
            total_amount: linesTotal,
            shipping_amount: shippingPersisted,
            final_amount: linesTotal + shippingPersisted
          };
        });

      return orders;

    } catch (error) {
      throw new Error(`No se pudieron obtener los pedidos: ${error.message}`);
    }
  }
}

// Exportar una instancia singleton del servicio
export const orderService = new OrderService();
export default orderService;
