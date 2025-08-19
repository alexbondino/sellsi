// Use case: Obtener pedidos legacy (carts completados) para un comprador
import { cartsRepository } from '../../infra/repositories/CartsRepository';
import { isUUID } from '../../shared/validation';
import { mapBuyerOrderFromServiceObject } from '../../infra/mappers/orderMappers';
import { toBuyerUIOrder } from '../../presentation/adapters/legacyUIAdapter';
import { FLAGS } from '../../config/flags';

export async function GetBuyerOrders(buyerId, filters = {}) {
  if (!buyerId) throw new Error('ID de comprador es requerido');
  if (!isUUID(buyerId)) throw new Error('ID de comprador no tiene formato UUID válido');

  const { data, error } = await cartsRepository.listBuyerCarts(buyerId, filters);
  if (error) throw error;
  if (!data || !data.length) return [];

  const orders = data
    .filter(cart => cart.cart_items && cart.cart_items.length > 0)
    .map(cart => {
      const shippingInfo = cart.users?.shipping_info?.[0] || {};
      const deliveryAddress = {
        region: shippingInfo.shipping_region || 'Región no especificada',
        commune: shippingInfo.shipping_commune || 'Comuna no especificada',
        address: shippingInfo.shipping_address || 'Dirección no especificada',
        number: shippingInfo.shipping_number || '',
        department: shippingInfo.shipping_dept || '',
        fullAddress: `${shippingInfo.shipping_address || 'Dirección no especificada'} ${shippingInfo.shipping_number || ''} ${shippingInfo.shipping_dept || ''}`.trim()
      };
      const linesTotal = cart.cart_items.reduce((sum, item) => sum + (item.price_at_addition * item.quantity), 0);
      const shippingPersisted = cart.shipping_total || 0;
      return {
        order_id: cart.cart_id,
        cart_id: cart.cart_id,
        buyer_id: cart.user_id,
        status: cart.status,
        created_at: cart.created_at,
        updated_at: cart.updated_at,
        buyer: {
          user_id: cart.users?.user_id || cart.user_id,
          name: cart.users?.user_nm || 'Usuario desconocido',
          email: cart.users?.email || 'Email no disponible',
          phone: cart.users?.phone_nbr || 'Teléfono no disponible'
        },
        delivery_address: deliveryAddress,
        items: cart.cart_items.map(item => ({
          cart_items_id: item.cart_items_id,
          product_id: item.product_id,
          quantity: item.quantity,
          price_at_addition: item.price_at_addition,
          price_tiers: item.price_tiers,
          document_type: item.document_type || item.documentType || 'ninguno',
          product: {
            id: item.products.productid,
            productid: item.products.productid,
            name: item.products.productnm,
            price: item.products.price,
            category: item.products.category,
            description: item.products.description,
            supplier_id: item.products.supplier_id,
            image_url: item.products.product_images?.[0]?.image_url,
            thumbnail_url: item.products.product_images?.[0]?.thumbnail_url,
            thumbnails: item.products.product_images?.[0]?.thumbnails,
            imagen: item.products.product_images?.[0]?.image_url,
            supplier: {
              name: item.products.users?.user_nm || 'Proveedor desconocido',
              email: item.products.users?.email || 'Email no disponible',
              verified: !!item.products.users?.verified
            },
            proveedor: item.products.users?.user_nm || 'Proveedor desconocido',
            verified: !!item.products.users?.verified,
            supplierVerified: !!item.products.users?.verified
          }
        })),
        total_items: cart.cart_items.length,
        total_quantity: cart.cart_items.reduce((sum, i) => sum + i.quantity, 0),
        total_amount: linesTotal,
        shipping_amount: shippingPersisted,
        final_amount: linesTotal + shippingPersisted
      };
    });

  const domain = orders.map(o => mapBuyerOrderFromServiceObject(o));
  if (FLAGS.ORDERS_USE_DOMAIN_ADAPTERS) return domain.map(o => toBuyerUIOrder(o));
  return orders;
}
