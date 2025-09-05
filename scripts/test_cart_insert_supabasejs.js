(async ()=>{
  const { createClient } = require('@supabase/supabase-js');
  const SUP = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUP || !KEY) { console.log('MISSING_ENV'); process.exit(0); }
  const supabase = createClient(SUP, KEY, { auth: { persistSession: false } });
  console.log('CLIENT READY');
  const p = await supabase.from('products').select('productid').limit(1);
  console.log('product sample:', p.status, p.error || p.data);
  const c = await supabase.from('carts').select('cart_id,user_id').eq('cart_id', '125d1517-55b9-4a5e-8ddb-118459281956');
  console.log('cart row:', c.status, c.error || c.data);
  const prod = (p.data && p.data[0] && p.data[0].productid) || require('crypto').randomUUID();
  console.log('trying insert via supabase-js... product:', prod);
  const ins = await supabase.from('cart_items').insert([{ cart_id: '125d1517-55b9-4a5e-8ddb-118459281956', product_id: prod, quantity:1, price_at_addition:1 }]);
  console.log('insert result:', ins.status, ins.error || ins.data);
  // cleanup
  const del = await supabase.from('cart_items').delete().match({ cart_id: '125d1517-55b9-4a5e-8ddb-118459281956', product_id: prod });
  console.log('cleanup:', del.status, del.error || del.data);
})();
