// Busca el primer .MuiPaper-root que contenga "Despacho" y muestra sus métricas
(function(){
  const paper = [...document.querySelectorAll('.MuiPaper-root')].find(p => /Despacho/i.test(p.innerText||''));
  if (!paper) return console.warn('No se encontró Paper con "Despacho"');
  console.log('PAPER rect:', paper.getBoundingClientRect());
  console.log('PAPER padding L/R:', getComputedStyle(paper).paddingLeft, '/', getComputedStyle(paper).paddingRight);
  const mainEl = document.querySelector('main[data-layout="app-main"]');
  console.log('MAIN padding L/R:', mainEl ? getComputedStyle(mainEl).paddingLeft + ' / ' + getComputedStyle(mainEl).paddingRight : 'main no encontrado');
  const table = paper.querySelector('table');
  if (table) {
    console.log('TABLE rect:', table.getBoundingClientRect());
    console.log('TABLE padding L/R:', getComputedStyle(table).paddingLeft, '/', getComputedStyle(table).paddingRight);
  }
})();
VM8684:5 PAPER rect: DOMRect {x: 8, y: 346.9464416503906, width: 396.0000305175781, height: 280, top: 346.9464416503906, …}
VM8684:6 PAPER padding L/R: 24px / 24px
VM8684:8 MAIN padding L/R: 8px / 8px
VM8684:11 TABLE rect: DOMRect {x: 33.142860412597656, y: 432.0446472167969, width: 375.2589416503906, height: 126.3214340209961, top: 432.0446472167969, …}
VM8684:12 TABLE padding L/R: 0px / 0px
undefined
