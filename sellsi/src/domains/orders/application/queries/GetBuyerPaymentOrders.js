// Use case: Obtener payment orders (tabla orders) para un comprador
import { ordersRepository } from '../../infra/repositories/OrdersRepository';
import { supabase } from '../../../../services/supabase';
import { parseOrderItems, normalizeDocumentType } from '../../shared/parsing';
import { mapBuyerOrderFromServiceObject } from '../../infra/mappers/orderMappers';
import { toBuyerUIOrder } from '../../presentation/adapters/legacyUIAdapter';

export async function GetBuyerPaymentOrders(buyerId, { limit, offset } = {}) {
  const { data, error } = await ordersRepository.listByBuyer(buyerId, { limit, offset });
  if (error) throw error;
  if (!data || data.length === 0) return [];

  // Parse items y recolectar ids
  const productIdsSet = new Set();
  const parsed = data.map(row => {
    const items = parseOrderItems(row.items);
    items.forEach(i => i?.product_id && productIdsSet.add(i.product_id));
    return { row, items };
  });
  const supplierIdsSet = new Set();
  parsed.forEach(({ items }) => items.forEach(it => it?.supplier_id && supplierIdsSet.add(it.supplier_id)));

  // Suppliers
  let suppliersMap = new Map();
  if (supplierIdsSet.size) {
    const { data: suppliers, error: supErr } = await supabase
      .from('users')
      .select('user_id, user_nm, verified, email')
      .in('user_id', Array.from(supplierIdsSet));
    if (!supErr && suppliers) suppliersMap = new Map(suppliers.map(u => [u.user_id, u]));
  }

  // Products (imágenes)
  let productsMap = new Map();
  if (productIdsSet.size) {
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select('productid, product_images (image_url, thumbnail_url, thumbnails)')
      .in('productid', Array.from(productIdsSet));
    if (!prodErr && products) productsMap = new Map(products.map(p => [p.productid, p]));
  }

  const serviceObjects = parsed.map(({ row, items }) => {
    const normalizedItems = items.map((it, idx) => {
      const su = it.supplier_id ? suppliersMap.get(it.supplier_id) : null;
      const prod = it.product_id ? (productsMap.get(it.product_id) || {}) : {};
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
          supplier_id: it.supplier_id || null,
          image_url: it.image_url || firstImage?.image_url || null,
          thumbnail_url: it.thumbnail_url || firstImage?.thumbnail_url || null,
          thumbnails: it.thumbnails || firstImage?.thumbnails || null,
          imagen: it.image_url || it.thumbnail_url || firstImage?.image_url || firstImage?.thumbnail_url || null,
          supplier: {
            name: su?.user_nm || it.supplier_name || 'Proveedor desconocido',
            email: su?.email || it.supplier_email || '',
            verified: !!su?.verified
          },
          proveedor: su?.user_nm || it.supplier_name || 'Proveedor desconocido',
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
      estimated_delivery_date: row.estimated_delivery_date || null,
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

  const domain = serviceObjects.map(o => mapBuyerOrderFromServiceObject(o));
  return domain.map(o => toBuyerUIOrder(o));
}
