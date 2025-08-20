// Use case: Obtener payment orders (tabla orders) para un comprador
import { ordersRepository } from '../../infra/repositories/OrdersRepository';
import { supabase } from '../../../../services/supabase';
import { parseOrderItems, normalizeDocumentType } from '../../shared/parsing';
import { mapBuyerOrderFromServiceObject } from '../../infra/mappers/orderMappers';
import { toBuyerUIOrder } from '../../presentation/adapters/legacyUIAdapter';

// TEMPORAL: habilitamos tolerancia a items con precio 0 para no ocultar toda la lista si existe un item defectuoso.
// En vez de abortar, marcamos pricing_warning y forzamos price_at_addition = 1 mientras se corrige el pipeline.
const ALLOW_ZERO_PRICE_ITEMS = true; // toggled from false -> true (rollback simple si se desea)

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
      const rawPriceAddition = it.unit_price_effective ?? it.price_at_addition ?? it.price;
      let price_at_addition = 0;
      let pricing_warning = false;
      if (typeof rawPriceAddition === 'number' && Number.isFinite(rawPriceAddition)) {
        price_at_addition = rawPriceAddition;
      } else if (typeof rawPriceAddition === 'string') {
        const cleaned = rawPriceAddition.trim().replace(/[^0-9,\.]/g,'').replace(',','.');
        const parsed = Number(cleaned);
        if (Number.isFinite(parsed)) price_at_addition = parsed; else pricing_warning = true;
      } else {
        pricing_warning = true;
      }
      if (!ALLOW_ZERO_PRICE_ITEMS && price_at_addition <= 0) {
        throw new Error(`Precio inválido (0) detectado en item ${idx} de orden ${row.id}`);
      }
      // Tolerancia: si está permitido y el precio quedó <=0, lo elevamos a 1 CLP para no romper vista y marcamos warning.
      if (ALLOW_ZERO_PRICE_ITEMS && price_at_addition <= 0) {
        pricing_warning = true;
        price_at_addition = 1;
      }
      return {
        cart_items_id: it.cart_items_id || it.id || `${row.id}-itm-${idx}`,
        product_id: it.product_id || it.productid || it.id || null,
        quantity: it.quantity || 1,
        price_at_addition,
        price_tiers: it.price_tiers || null,
        document_type: normalizeDocumentType(it.document_type || it.documentType),
        pricing_warning,
        product: {
          id: it.product_id || it.productid || it.id || null,
          productid: it.product_id || it.productid || null,
            name: it.name || it.productnm || 'Producto',
          price: price_at_addition,
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
    const computedLinesTotal = normalizedItems.reduce((s,i)=>s + (i.price_at_addition * i.quantity),0);
    const delivery_address = (() => {
      const sa = row.shipping_address || row.shippingAddress || null;
      if (!sa) return null;
      if (typeof sa === 'string') {
        try { return JSON.parse(sa); } catch { return { raw: sa }; }
      }
      return sa;
    })();
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
      delivery_address,
      items: normalizedItems,
      total_items: normalizedItems.length,
      total_quantity: normalizedItems.reduce((s,i)=>s + (i.quantity||0),0),
      total_amount: row.total ?? computedLinesTotal,
      subtotal: row.subtotal || null,
      tax: row.tax || null,
      // ✅ NORMALIZACIÓN: Unificar campos de shipping
      shipping_cost: Number(row.shipping || 0), // Campo unificado
      shipping: row.shipping || null, // Campo original para compatibilidad  
      shipping_amount: Number(row.shipping || 0), // Alias para UI
      final_amount: (row.total ?? (computedLinesTotal + Number(row.shipping || 0))),
      computed_lines_total: computedLinesTotal,
      is_payment_order: true
    };
  });

  const domain = serviceObjects.map(o => mapBuyerOrderFromServiceObject(o));
  return domain.map(o => toBuyerUIOrder(o));
}
