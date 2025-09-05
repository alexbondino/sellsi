const https = require('https');
const SUP = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUP || !KEY) { console.log('MISSING_ENV'); process.exit(0); }

function request(path, method='GET', body=null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path);
    const opts = {
      method,
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
      },
    };
    if (body) {
      const b = JSON.stringify(body);
      opts.headers['Content-Type'] = 'application/json';
      opts.headers['Content-Length'] = Buffer.byteLength(b);
      const req = https.request(opts, res => {
        let data = '';
        res.on('data', c=> data+=c);
        res.on('end', ()=> resolve({ status: res.statusCode, body: data }));
      });
      req.on('error', reject);
      req.write(b);
      req.end();
    } else {
      const req = https.request(opts, res => {
        let data = '';
        res.on('data', c=> data+=c);
        res.on('end', ()=> resolve({ status: res.statusCode, body: data }));
      });
      req.on('error', reject);
      req.end();
    }
  });
}

(async ()=>{
  console.log('SUPABASE_URL=', SUP);
  console.log('KEY_PRESENT=YES');
  try {
    const p = await request(`${SUP}/rest/v1/products?select=productid&limit=1`);
    console.log('product sample raw:', p.status, p.body);
    const c = await request(`${SUP}/rest/v1/carts?cart_id=eq.125d1517-55b9-4a5e-8ddb-118459281956&select=cart_id,user_id`);
    console.log('cart row raw:', c.status, c.body);
    let prod;
    try { prod = JSON.parse(p.body)[0].productid } catch(_) { prod = require('crypto').randomUUID(); }
    console.log('trying insert... product:', prod);
    const ins = await request(`${SUP}/rest/v1/cart_items`, 'POST', { cart_id: '125d1517-55b9-4a5e-8ddb-118459281956', product_id: prod, quantity: 1, price_at_addition: 1 });
    console.log('insert raw:', ins.status, ins.body);
    const del = await request(`${SUP}/rest/v1/cart_items?cart_id=eq.125d1517-55b9-4a5e-8ddb-118459281956&product_id=eq.${prod}`, 'DELETE');
    console.log('cleanup raw:', del.status, del.body);
  } catch (e) { console.error('ERR', e); }
})();
