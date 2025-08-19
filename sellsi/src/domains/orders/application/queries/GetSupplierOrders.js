// Use case: Obtener pedidos (legacy carts -> pedidos) para un proveedor
import { supabase } from '../../../../services/supabase';
import { cartsRepository } from '../../infra/repositories/CartsRepository';
import { buildDeliveryAddress } from '../../shared/parsing';
import { calculateEstimatedDeliveryDate } from '../../shared/delivery';
import { mapSupplierOrderFromServiceObject } from '../../infra/mappers/orderMappers';
import { toSupplierUIOrder } from '../../presentation/adapters/legacyUIAdapter';
import { FLAGS } from '../../config/flags';
import { isUUID } from '../../shared/validation';

/**
 * GetSupplierOrders
 * Extrae lógica desde OrderService.getOrdersForSupplier
 * Mantiene compatibilidad con UI mediante adapter opcional.
 */
export async function GetSupplierOrders(supplierId, filters = {}) {
  if (!supplierId) throw new Error('ID de proveedor es requerido');
  if (!isUUID(supplierId)) throw new Error('ID de proveedor no tiene formato UUID válido');

  // 1. Obtener productos del proveedor
  const { data: supplierProducts, error: productsError } = await supabase
    .from('products')
    .select('productid')
    .eq('supplier_id', supplierId);
  if (productsError) throw new Error(`Error obteniendo productos del proveedor: ${productsError.message}`);
  if (!supplierProducts || supplierProducts.length === 0) return [];

  const productIds = supplierProducts.map(p => p.productid);

  // 2. Obtener carts filtrados por productos del proveedor (repositorio legacy)
  const { data, error } = await cartsRepository.listSupplierCartsByProductIds(productIds, filters);
  if (error) throw error;
  if (!data || data.length === 0) return [];

  // 3. Fallback shipping info batch (usuarios sin shipping_info embebido)
  const missingUserIds = Array.from(new Set(
    data
      .filter(cart => !(Array.isArray(cart.users?.shipping_info) && cart.users.shipping_info.length > 0))
      .map(cart => cart.user_id)
      .filter(Boolean)
  ));
  let fallbackShippingByUser = new Map();
  if (missingUserIds.length) {
    const { data: fallbackShip } = await supabase
      .from('shipping_info')
      .select('user_id, shipping_region, shipping_commune, shipping_address, shipping_number, shipping_dept')
      .in('user_id', missingUserIds);
    if (Array.isArray(fallbackShip)) {
      fallbackShippingByUser = new Map(fallbackShip.map(r => [r.user_id, r]));
    }
  }

  // 4. Transformar carts -> service objects
  const orders = data
    .filter(cart => cart.cart_items && cart.cart_items.length > 0)
    .map(cart => {
      const supplierItems = cart.cart_items.filter(item => item.products && item.products.supplier_id === supplierId);
      if (!supplierItems.length) return null;

      // Dirección despacho
      let shippingInfo = cart.users?.shipping_info?.[0] || {};
      if ((!shippingInfo || Object.keys(shippingInfo).length === 0) && fallbackShippingByUser.size) {
        const fb = fallbackShippingByUser.get(cart.user_id);
        if (fb) shippingInfo = fb;
      }
      const deliveryAddress = buildDeliveryAddress(shippingInfo);

      // Fecha estimada (helper unificado)
      const estimatedDeliveryDate = calculateEstimatedDeliveryDate(
        cart.created_at,
        supplierItems.map(it => ({
          product_id: it.product_id,
          product: { product_delivery_regions: it.products?.product_delivery_regions || [] }
        })),
        deliveryAddress.region,
        (pid) => ({ product_delivery_regions: supplierItems.find(i => i.product_id === pid)?.products?.product_delivery_regions || [] })
      );

      const linesTotal = cart.cart_items.reduce((sum, item) => sum + (item.price_at_addition * item.quantity), 0);
      const shippingPersisted = cart.shipping_total || 0;

      return {
        order_id: cart.cart_id,
        cart_id: cart.cart_id,
        payment_order_id: cart.payment_order_id || null,
        supplier_id: cart.supplier_id || null,
        buyer_id: cart.user_id,
        status: cart.status,
        payment_status: 'paid',
        created_at: cart.created_at,
        updated_at: cart.updated_at,
        estimated_delivery_date: estimatedDeliveryDate,
        buyer: {
          user_id: cart.users?.user_id || cart.user_id,
          name: cart.users?.user_nm || 'Usuario desconocido',
          email: cart.users?.email || 'Email no disponible',
          phone: cart.users?.phone_nbr || 'Teléfono no disponible'
        },
        delivery_address: deliveryAddress,
        deliveryAddress: deliveryAddress,
        items: supplierItems.map(item => ({
          cart_items_id: item.cart_items_id,
          product_id: item.product_id,
          quantity: item.quantity,
          price_at_addition: item.price_at_addition,
          price_tiers: item.price_tiers,
          document_type: item.document_type || item.documentType || 'ninguno',
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
        total_items: supplierItems.length,
        total_quantity: supplierItems.reduce((sum, i) => sum + i.quantity, 0),
        total_amount: supplierItems.reduce((sum, i) => sum + (i.price_at_addition * i.quantity), 0),
        shipping_amount: shippingPersisted,
        final_amount: linesTotal + shippingPersisted
      };
    })
    .filter(Boolean)
    .filter(o => o.items.length > 0);

  const domain = orders.map(o => mapSupplierOrderFromServiceObject(o));
  if (FLAGS.ORDERS_USE_DOMAIN_ADAPTERS) return domain.map(o => toSupplierUIOrder(o));
  return orders;
}
