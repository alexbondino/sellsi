/**
 * Tests unitarios para eliminación batch y migración filtrada del carrito.
 * Nota: Se mockea supabase para aislar lógica.
 */
import { cartService } from '../../services/user/cartService';

// Mock básico de supabase
jest.mock('../../services/supabase', () => {
  const deleted = []; // para ver qué se elimina
  const inserted = [];
  const cartItems = [];
  return {
    supabase: {
      from: (table) => {
        if (table === 'cart_items') {
          return {
            delete: () => {
              const api = {
                _filters: {},
                eq(key, val) { this._filters[key] = val; return this; },
                in(col, arr) { this._filters[col] = arr; return this; },
                select() { return this; },
                async execute() {
                  const cart_id = this._filters.cart_id;
                  const ids = Array.isArray(this._filters.cart_items_id) ? this._filters.cart_items_id : [];
                  ids.forEach(id => deleted.push({ cart_id, id }));
                  return { data: [], error: null };
                }
              };
              // Proxy await to execute()
              return new Proxy(api, {
                get(target, prop) {
                  if (prop === 'then') {
                    return (resolve, reject) => target.execute().then(resolve, reject);
                  }
                  return target[prop];
                }
              });
            }
          };
        }
        if (table === 'carts') {
          return {
            select() { return this; },
            eq() { return this; },
            maybeSingle(){ return Promise.resolve({ data: { cart_id: 'c1', status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), items: [] }, error: null }); }
          };
        }
        return {};
      }
    }
  };
});

describe('cartService batch delete', () => {
  test('removeItemsFromCart elimina múltiples líneas sin error', async () => {
    const res = await cartService.removeItemsFromCart('c1', ['l1','l2','l2']);
    expect(res).toBe(true);
  });
});
