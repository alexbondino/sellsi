import { supabase } from '../../../../services/supabase';

// Encapsula queries a tabla 'carts' (legacy)
export class CartsRepository {
  async listSupplierCartsByProductIds(productIds, filters = {}) {
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
      .neq('status', 'active')
      .in('cart_items.product_id', productIds)
      .order('created_at', { ascending: false });

    if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);
    if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
    if (filters.dateTo) query = query.lte('created_at', filters.dateTo);

    if (typeof filters.limit === 'number') {
      if (typeof filters.offset === 'number') {
        const to = filters.offset + filters.limit - 1;
        query = query.range(filters.offset, to);
      } else {
        query = query.limit(filters.limit);
      }
    }
    return query;
  }

  async listBuyerCarts(buyerId, filters = {}) {
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
      .neq('status', 'active')
      .order('created_at', { ascending: false });

    if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);
    if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
    if (filters.dateTo) query = query.lte('created_at', filters.dateTo);

    if (typeof filters.limit === 'number') {
      if (typeof filters.offset === 'number') {
        const to = filters.offset + filters.limit - 1;
        query = query.range(filters.offset, to);
      } else {
        query = query.limit(filters.limit);
      }
    }
    return query;
  }

  async updateStatus(cartId, updateData) {
    return supabase
      .from('carts')
      .update(updateData)
      .eq('cart_id', cartId)
      .select('*')
      .single();
  }

  // Listado simplificado para estadísticas por supplier
  async listSupplierCartsForStats(supplierId, period = {}) {
    let query = supabase
      .from('carts')
      .select(`
        status,
        created_at,
        cart_items!inner (
          quantity,
          price_at_addition,
          products!inner ( supplier_id )
        )
      `)
      .neq('status', 'active')
      .eq('cart_items.products.supplier_id', supplierId);
    if (period.from) query = query.gte('created_at', period.from);
    if (period.to) query = query.lte('created_at', period.to);
    return query;
  }

  // Búsqueda (ya con pattern ilike sanitizado) limitada a cart_id y user_nm
  async searchSupplierCarts(supplierId, pattern) {
    return supabase
      .from('carts')
      .select(`
        cart_id,
        user_id,
        status,
        created_at,
        updated_at,
        users!carts_user_id_fkey ( user_nm, email ),
        cart_items (
          products (
            supplier_id,
            productnm
          )
        )
      `)
      .neq('status', 'active')
      .eq('cart_items.products.supplier_id', supplierId)
      .ilike('cart_id', pattern)
      .ilike('users.user_nm', pattern);
  }
}

export const cartsRepository = new CartsRepository();
