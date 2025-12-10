/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  TEST DE NETWORK METRICS - ANÁLISIS COMPLETO DE RED                       ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  Este test analiza todas las métricas de red durante la navegación:       ║
 * ║                                                                           ║
 * ║  📊 Por Página:                                                           ║
 * ║     - Número de requests                                                  ║
 * ║     - Tamaño total descargado                                             ║
 * ║     - Requests fallidos                                                   ║
 * ║     - Cache hit/miss ratio                                                ║
 * ║     - Breakdown por tipo (JS, CSS, Image, XHR, etc.)                      ║
 * ║                                                                           ║
 * ║  🔌 API Calls:                                                            ║
 * ║     - Tiempo de respuesta promedio                                        ║
 * ║     - APIs más lentas                                                     ║
 * ║     - APIs fallidas                                                       ║
 * ║                                                                           ║
 * ║  FLUJO (igual que buyer-flow.ts):                                         ║
 * ║     Marketplace → Mis Pedidos → Mis Ofertas → Marketplace → Product       ║
 * ║                                                                           ║
 * ║  EJECUCIÓN:                                                               ║
 * ║    Terminal 1: npm run dev                                                ║
 * ║    Terminal 2: npm run test:network                                       ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { test, expect } from '@playwright/test';
import {
  BuyerFlowRunner,
  NetworkMetricsCollector,
  calculateNetworkTotals,
  printNetworkPageSummary,
  printNetworkTotalSummary,
  printNetworkCSV,
  type NetworkPageMetrics,
  type NetworkTestResult,
} from './base';

// ═══════════════════════════════════════════════════════════════════════════
// TEST PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

test.describe('🌐 Network Metrics - Análisis de Red', () => {
  test('Analizar métricas de red durante navegación buyer', async () => {
    const pageMetrics: NetworkPageMetrics[] = [];
    
    const runner = new BuyerFlowRunner({ headless: false });

    try {
      // Setup
      await runner.setup();
      
      // Crear colector de network
      const networkCollector = new NetworkMetricsCollector(runner.cdp);
      await networkCollector.enable();

      console.log('\n');
      console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
      console.log('║      🌐 TEST DE NETWORK METRICS - ANÁLISIS COMPLETO DE RED                    ║');
      console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
      console.log('║  Métricas capturadas via CDP Network domain:                                  ║');
      console.log('║    • Requests por página y tipo                                               ║');
      console.log('║    • Tamaño y tiempo de respuesta                                             ║');
      console.log('║    • Cache hit/miss ratio                                                     ║');
      console.log('║    • API calls: tiempo, failures, slowest                                     ║');
      console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');

      // ─────────────────────────────────────────────────────────────────────
      // LOGIN
      // ─────────────────────────────────────────────────────────────────────
      console.log('\n📍 Login...');
      networkCollector.reset();
      await runner.login();
      await runner.page.waitForTimeout(2000);
      pageMetrics.push(networkCollector.getPageMetrics('Login', runner.page.url()));
      printNetworkPageSummary(pageMetrics[pageMetrics.length - 1]);

      // ═══════════════════════════════════════════════════════════════════════
      // CICLOS DE NAVEGACIÓN (2 ciclos para ver cache en el segundo)
      // ═══════════════════════════════════════════════════════════════════════
      const CYCLES = 2;
      
      for (let cycle = 1; cycle <= CYCLES; cycle++) {
        console.log('\n');
        console.log('═'.repeat(80));
        console.log(`🔄 CICLO ${cycle}/${CYCLES}`);
        console.log('═'.repeat(80));

        // ─────────────────────────────────────────────────────────────────────
        // MARKETPLACE
        // ─────────────────────────────────────────────────────────────────────
        console.log(`\n📍 [C${cycle}] Marketplace...`);
        networkCollector.reset();
        // Ciclo 1: Ya estamos en marketplace post-login, ciclos 2+: navegar
        if (cycle > 1) {
          await runner.navigateToMarketplace();
        }
        await runner.page.waitForTimeout(2000);
        pageMetrics.push(networkCollector.getPageMetrics(`[C${cycle}] Marketplace`, runner.page.url()));
        printNetworkPageSummary(pageMetrics[pageMetrics.length - 1]);

        // ─────────────────────────────────────────────────────────────────────
        // MIS PEDIDOS
        // ─────────────────────────────────────────────────────────────────────
        console.log(`\n📍 [C${cycle}] Mis Pedidos...`);
        networkCollector.reset();
        await runner.navigateToOrders();
        await runner.page.waitForTimeout(2000);
        pageMetrics.push(networkCollector.getPageMetrics(`[C${cycle}] Mis Pedidos`, runner.page.url()));
        printNetworkPageSummary(pageMetrics[pageMetrics.length - 1]);

        // ─────────────────────────────────────────────────────────────────────
        // MIS OFERTAS
        // ─────────────────────────────────────────────────────────────────────
        console.log(`\n📍 [C${cycle}] Mis Ofertas...`);
        networkCollector.reset();
        await runner.navigateToOffers();
        await runner.page.waitForTimeout(2000);
        pageMetrics.push(networkCollector.getPageMetrics(`[C${cycle}] Mis Ofertas`, runner.page.url()));
        printNetworkPageSummary(pageMetrics[pageMetrics.length - 1]);

        // ─────────────────────────────────────────────────────────────────────
        // PRODUCT PAGE
        // ─────────────────────────────────────────────────────────────────────
        console.log(`\n📍 [C${cycle}] Product Page...`);
        networkCollector.reset();
        // Volver a marketplace primero para click en producto
        await runner.navigateToMarketplace();
        await runner.clickProductCard();
        await runner.page.waitForTimeout(2000);
        pageMetrics.push(networkCollector.getPageMetrics(`[C${cycle}] Product Page`, runner.page.url()));
        printNetworkPageSummary(pageMetrics[pageMetrics.length - 1]);
      }

      // ─────────────────────────────────────────────────────────────────────
      // RESUMEN
      // ─────────────────────────────────────────────────────────────────────
      const result: NetworkTestResult = {
        pages: pageMetrics,
        totals: calculateNetworkTotals(pageMetrics),
      };

      // Imprimir resumen total
      printNetworkTotalSummary(result);

      // CSV para análisis externo
      printNetworkCSV(result);

      // ─────────────────────────────────────────────────────────────────────
      // VALIDACIONES
      // ─────────────────────────────────────────────────────────────────────
      console.log('\n');
      console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
      console.log('║                         ✅ VALIDACIONES                                       ║');
      console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');

      // Check failed requests
      if (result.totals.failedRequests > 0) {
        console.log(`║ ⚠️  Failed requests: ${result.totals.failedRequests}`.padEnd(78) + '║');
      } else {
        console.log(`║ ✅ No hay requests fallidos`.padEnd(78) + '║');
      }

      // Check cache hit ratio
      if (result.totals.cacheHitRatio < 0.1) {
        console.log(`║ ⚠️  Cache hit ratio bajo: ${(result.totals.cacheHitRatio * 100).toFixed(1)}%`.padEnd(78) + '║');
      } else {
        console.log(`║ ✅ Cache hit ratio: ${(result.totals.cacheHitRatio * 100).toFixed(1)}%`.padEnd(78) + '║');
      }

      // Check API avg time
      if (result.totals.apiAvgTime > 500) {
        console.log(`║ ⚠️  API avg time alto: ${result.totals.apiAvgTime.toFixed(0)}ms`.padEnd(78) + '║');
      } else if (result.totals.apiCallsTotal > 0) {
        console.log(`║ ✅ API avg time: ${result.totals.apiAvgTime.toFixed(0)}ms`.padEnd(78) + '║');
      }

      console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');

      // Cleanup
      await networkCollector.disable();

      // El test pasa siempre - es diagnóstico, no assertion
      expect(true).toBe(true);

    } finally {
      await runner.close();
    }
  });
});
