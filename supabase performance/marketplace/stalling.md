```js
// Script para extraer SOLO tiempos de Stalling y TTFB
// Copia y pega esto en tu consola (F12 -> Console)

;(function () {
  const resources = performance.getEntriesByType('resource')

  // Filtramos solo las peticiones a tu API (asumiendo que es Supabase o similar)
  // Si tu API tiene otro nombre, cambia 'supabase' por esa palabra clave.
  const apiRequests = resources.filter(
    (r) => r.name.includes('supabase') || r.name.includes('rest/v1')
  )

  const analysis = apiRequests.map((r) => {
    // Stalling: Tiempo desde que se inicia la petición hasta que realmente sale del navegador
    // (Incluye DNS, TCP handshake y tiempo en cola de espera)
    const stallTime = r.requestStart - r.startTime

    // TTFB: Tiempo que el servidor demora en empezar a responder
    const serverTime = r.responseStart - r.requestStart

    // Content Download: Tiempo descargando el JSON
    const downloadTime = r.responseEnd - r.responseStart

    return {
      url: r.name.split('/').pop().split('?')[0], // Nombre corto del endpoint
      params: r.name.split('?')[1]?.substring(0, 50) + '...', // Un poco de los parametros
      stalling_ms: Math.round(stallTime), // <--- ESTO ES LO QUE BUSCAMOS
      ttfb_ms: Math.round(serverTime),
      download_ms: Math.round(downloadTime),
      total_ms: Math.round(r.duration),
    }
  })

  // Ordenamos por los que tuvieron más Stalling (cola)
  const topStalled = analysis
    .sort((a, b) => b.stalling_ms - a.stalling_ms)
    .slice(0, 15)

  console.log('Copia el objeto de abajo y pégalo en el chat:')
  console.log(JSON.stringify(topStalled, null, 2))
  console.table(topStalled) // Para que lo veas bonito en la consola también
})()
```

VM423:39 (index) url params stalling*ms ttfb_ms download_ms total_ms
(index) url params stalling_ms ttfb_ms download_ms total_ms
0: {url: 'supabase-DBX5QpDr.js', params: 'undefined...', stalling_ms: 15, ttfb_ms: 73, download_ms: 3, total_ms: 91}
1: {url: 'user', params: 'undefined...', stalling_ms: -243, ttfb_ms: 0, download_ms: 474, total_ms: 231}
2: {url: 'users', params: 'select=*%2Cbank*info%28*%29%2Cshipping_info%28*%29...', stalling_ms: -722, ttfb_ms: 0, download_ms: 950, total_ms: 228}
3: {url: 'notifications', params: 'select=*&order=created_at.desc&limit=20&user_id=eq...', stalling_ms: -739, ttfb_ms: 0, download_ms: 965, total_ms: 226}
4: {url: 'feature_flags', params: 'select=enabled&workspace=eq.my-offers&key=eq.my_of...', stalling_ms: -756, ttfb_ms: 0, download_ms: 981, total_ms: 225}
5: {url: 'carts', params: 'select=cart_id%2Cstatus%2Ccreated_at%2Cupdated_at&...', stalling_ms: -772, ttfb_ms: 0, download_ms: 1001, total_ms: 230}
6: {url: 'marketplace_products_daily', params: 'select=productid%2Csupplier_id%2Cproductnm%2Cprice...', stalling_ms: -1085, ttfb_ms: 0, download_ms: 1497, total_ms: 412}
7: {url: 'logo.png', params: 'cb=1768064077494...', stalling_ms: -1158, ttfb_ms: 0, download_ms: 2069, total_ms: 911}
8: {url: 'logo.png', params: 'cb=1768064078423...', stalling_ms: -1169, ttfb_ms: 0, download_ms: 2093, total_ms: 924}
9: {url: 'cart_items', params: 'select=cart_items_id%2Cproduct_id%2Cquantity%2Cpri...', stalling_ms: -1180, ttfb_ms: 0, download_ms: 1403, total_ms: 222}
10: {url: 'users', params: 'select=user_id%2Cuser_nm%2Clogo_url%2Cdescripcion*...', stalling_ms: -1499, ttfb_ms: 0, download_ms: 1743, total_ms: 244}
11: {url: 'product_price_summary', params: 'select=product_id%2Cmin_price%2Cmax_price%2Ctiers*...', stalling_ms: -1745, ttfb_ms: 0, download_ms: 2014, total_ms: 269}
12: {url: 'product_price_summary', params: 'select=product_id%2Cmin_price%2Cmax_price%2Ctiers*...', stalling_ms: -1745, ttfb_ms: 0, download_ms: 1988, total_ms: 243}
13: {url: 'product_price_summary', params: 'select=product_id%2Cmin_price%2Cmax_price%2Ctiers*...', stalling_ms: -1746, ttfb_ms: 0, download_ms: 1971, total_ms: 226}
14: {url: 'product_quantity_ranges', params: 'select=\*&product_id=in.%286c4e7f0d-0ad5-4c27-8df1-...', stalling_ms: -1746, ttfb_ms: 0, download_ms: 1987, total_ms: 241}
Array(15)
length: 15 [[Prototype]]: Array(0)
