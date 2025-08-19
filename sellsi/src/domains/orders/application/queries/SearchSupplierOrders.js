// Use case: Buscar pedidos (legacy carts) por texto para un supplier
import { cartsRepository } from '../../infra/repositories/CartsRepository';
import { sanitizeSearchText, buildIlikePattern } from '../../shared/search';

/**
 * SearchSupplierOrders
 * Mantiene la lógica previa: sanitiza, ejecuta búsqueda limitada y filtra por email en memoria.
 * Retorna mismo formato que antes (filas crudas de carts con subselects mínimas) para UI existente.
 */
export async function SearchSupplierOrders(supplierId, rawSearchText) {
  const safe = sanitizeSearchText(rawSearchText);
  if (!safe) return [];
  const pattern = buildIlikePattern(safe);
  const { data, error } = await cartsRepository.searchSupplierCarts(supplierId, pattern);
  if (error) throw error;
  const finalData = (data || []).filter(row => {
    if (!row?.users?.email) return true;
    return row.users.email.toLowerCase().includes(safe.toLowerCase());
  });
  return finalData;
}
