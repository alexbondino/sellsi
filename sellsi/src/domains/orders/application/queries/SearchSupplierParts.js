import { supplierOrdersRepository } from '../../infra/repositories/SupplierOrdersRepository';
import { supabase } from '../../../../services/supabase';
import { sanitizeSearchText } from '../../shared/search';
import { isUUID } from '../../shared/validation';

// Búsqueda simple sobre supplier_orders por ID parent, item name o order id
export async function SearchSupplierParts(supplierId, rawSearchText) {
  if (!isUUID(supplierId)) throw new Error('ID proveedor inválido');
  const safe = sanitizeSearchText(rawSearchText);
  if (!safe) return [];
  const { data: parts, error } = await supplierOrdersRepository.listBySupplier(supplierId, {});
  if (error) throw error;
  if (!parts || !parts.length) return [];
  const parentIds = Array.from(new Set(parts.map(p=>p.parent_order_id)));
  let parentMap = new Map();
  if (parentIds.length) {
    const { data: parents } = await supabase
      .from('orders')
      .select('id, items')
      .in('id', parentIds);
    (parents||[]).forEach(p => parentMap.set(p.id, p));
  }
  const needle = safe.toLowerCase();
  return parts.filter(p => {
    if ((p.id||'').toLowerCase().includes(needle)) return true;
    if ((p.parent_order_id||'').toLowerCase().includes(needle)) return true;
    const parent = parentMap.get(p.parent_order_id);
    if (parent?.items) {
      try {
        const arr = Array.isArray(parent.items) ? parent.items : JSON.parse(parent.items);
        return arr.some(it => (it.name||'').toLowerCase().includes(needle));
      } catch(_) {}
    }
    return false;
  });
}
