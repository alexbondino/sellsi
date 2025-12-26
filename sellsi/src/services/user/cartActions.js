import { supabase } from '../supabase';
import { validateQuantity } from '../../utils/quantityValidation';

// Simple in-module dedupe map for timestamp updates when used standalone
const __inFlightTimestampUpdates = new Map();

export async function updateCartTimestamp(cartId) {
  try {
    if (!cartId) return null;
    if (__inFlightTimestampUpdates.has(cartId)) return await __inFlightTimestampUpdates.get(cartId);

    const p = (async () => {
      const DEBOUNCE_MS = 150;
      await new Promise(resolve => setTimeout(resolve, DEBOUNCE_MS));
      try {
        const payload = { updated_at: new Date().toISOString() };
        const res = await supabase
          .from('carts')
          .update(payload)
          .eq('cart_id', cartId);
        return res;
      } catch (error) {
        return { error };
      } finally {
        __inFlightTimestampUpdates.delete(cartId);
      }
    })();

    __inFlightTimestampUpdates.set(cartId, p);
    return await p;
  } catch (error) {
    return null;
  }
}

export async function updateItemQuantity(cartId, productOrLineId, newQuantity, options = {}) {
  const { skipTimestamp = false, onUpdateTimestamp = null, onRemoveItem = null } = options;
  try {
    const safeQuantity = validateQuantity(newQuantity);
    if (safeQuantity <= 0) {
      if (onRemoveItem) return await onRemoveItem(cartId, productOrLineId, options);
      // Fallback: attempt delete by cart_items_id
      const res = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_items_id', productOrLineId)
        .select();
      if (res.error) throw res.error;
      if (!skipTimestamp) {
        if (onUpdateTimestamp) await onUpdateTimestamp(cartId);
        else await updateCartTimestamp(cartId);
      }
      return true;
    }

    let primary = await supabase
      .from('cart_items')
      .update({
        quantity: safeQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq('cart_id', cartId)
      .eq('product_id', productOrLineId)
      .select();

    let data = primary.data;
    let error = primary.error;
    if (error && error.code !== 'PGRST116') throw error;

    if (!data || (Array.isArray(data) && data.length === 0)) {
      const secondary = await supabase
        .from('cart_items')
        .update({
          quantity: safeQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq('cart_items_id', productOrLineId)
        .select();
      if (secondary.error && secondary.error.code !== 'PGRST116') throw secondary.error;
      data = secondary.data;
      if (!data || (Array.isArray(data) && data.length === 0)) {
        const insertRes = await supabase
          .from('cart_items')
          .insert({
            cart_id: cartId,
            product_id: productOrLineId,
            quantity: safeQuantity,
            updated_at: new Date().toISOString(),
          })
          .select();
        if (insertRes.error) throw insertRes.error;
        data = insertRes.data;
      }
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!skipTimestamp) {
      if (onUpdateTimestamp) await onUpdateTimestamp(cartId);
      else await updateCartTimestamp(cartId);
    }
    return row;
  } catch (error) {
    throw new Error(`No se pudo actualizar la cantidad: ${error.message}`);
  }
}
