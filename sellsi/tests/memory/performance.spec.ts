/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  TEST DE PERFORMANCE AVANZADO - DIAGNÓSTICO DE LAGS                       ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  Este test identifica las CAUSAS RAÍZ de los lags:                        ║
 * ║                                                                           ║
 * ║  📊 CDP Performance Metrics:                                              ║
 * ║     - JSHeapUsedSize, JSHeapTotalSize                                     ║
 * ║     - ScriptDuration (tiempo ejecutando JS)                               ║
 * ║     - LayoutDuration (tiempo en layout/reflow)                            ║
 * ║     - RecalcStyleDuration (tiempo recalculando estilos)                   ║
 * ║     - TaskDuration (tiempo total de tareas)                               ║
 * ║                                                                           ║
 * ║  🔍 Long Tasks Analysis:                                                  ║
 * ║     - Detecta tareas >50ms que bloquean el main thread                    ║
 * ║     - Attribution: qué script/componente causó el lag                     ║
 * ║                                                                           ║
 * ║  EJECUCIÓN:                                                               ║
 * ║    Terminal 1: npm run dev                                                ║
 * ║    Terminal 2: npm run test:performance                                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { test, expect } from '@playwright/test';
import {
  CONFIG,
  BuyerFlowRunner,
  measureAdvanced,
  printDetailedMetrics,
  printDiagnosis,
  setPreviousCDPMetrics,
  resetPreviousCDPMetrics,
  getCSSAnimationInfo,
  printCSV,
  printPageComparison,
  type AdvancedMetrics,
} from './base';

// ═══════════════════════════════════════════════════════════════════════════
// TEST PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

test.describe('📊 Performance Avanzado - Diagnóstico de Lags', () => {
  test('Analizar causas de lag durante navegación buyer', async () => {
    const allMetrics: AdvancedMetrics[] = [];
    resetPreviousCDPMetrics();

    const runner = new BuyerFlowRunner({ headless: false });

    try {
      // Setup
      await runner.setup();

      console.log('\n');
      console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
      console.log('║      🔬 TEST DE PERFORMANCE AVANZADO - DIAGNÓSTICO DE LAGS                    ║');
      console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
      console.log('║  Este test identifica las CAUSAS EXACTAS de los lags:                         ║');
      console.log('║    • Tiempo de JavaScript (ScriptDuration)                                    ║');
      console.log('║    • Tiempo de Layout/Reflow (LayoutDuration)                                 ║');
      console.log('║    • Long Tasks que bloquean el main thread                                   ║');
      console.log('║    • Layout shifts (saltos visuales)                                          ║');
      console.log('║    • Recursos render-blocking                                                 ║');
      console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');

      // Login (después del login, la app redirige automáticamente a /buyer/marketplace)
      await runner.login();
      await runner.page.waitForTimeout(CONFIG.waitTime); // Esperar redirección

      // Reset métricas CDP después del login (ya en marketplace)
      await setPreviousCDPMetrics(runner.cdp);

      // Medición inicial
      allMetrics.push(await measureAdvanced(runner.page, runner.cdp, '📍 Inicial (post-login)', 0));
      printDetailedMetrics(allMetrics[allMetrics.length - 1]);

      // Ciclos con medición
      for (let cycle = 1; cycle <= CONFIG.cycles.performance; cycle++) {
        console.log(`\n${'═'.repeat(80)}`);
        console.log(`🔄 === CICLO ${cycle}/${CONFIG.cycles.performance} ===`);
        console.log('═'.repeat(80));

        // Ejecutar ciclo con callback de medición
        await runner.runCycle(cycle, async (step: string) => {
          const metrics = await measureAdvanced(runner.page, runner.cdp, `🔬 ${step}`, cycle);
          allMetrics.push(metrics);
          printDetailedMetrics(metrics);
        });
      }

      // Diagnóstico final
      printDiagnosis(allMetrics);
      
      // Promedios por página (útil para comparar antes/después de optimizaciones)
      printPageComparison(allMetrics);
      
      // Información de animaciones CSS (verificar fix de BuyerOrders)
      const cssAnimations = await getCSSAnimationInfo(runner.page);
      console.log('\n');
      console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
      console.log('║                    🎬 CSS ANIMATIONS ACTIVAS                                  ║');
      console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
      console.log(`║   Total: ${cssAnimations.totalAnimations}   Running: ${cssAnimations.runningAnimations}`.padEnd(80) + '║');
      if (cssAnimations.animationNames.length > 0) {
        console.log(`║   Names: ${cssAnimations.animationNames.slice(0, 5).join(', ')}`.padEnd(80) + '║');
      }
      console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
      
      // CSV para análisis externo (copiar a Excel/Google Sheets)
      printCSV(allMetrics);

      expect(allMetrics.length).toBeGreaterThan(0);

    } finally {
      await runner.close();
    }
  });
});