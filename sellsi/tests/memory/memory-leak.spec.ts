/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  E2E MEMORY LEAK TEST - Sellsi                                            ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  Mide el consumo de memoria durante navegación repetida                   ║
 * ║  para detectar memory leaks en la aplicación.                             ║
 * ║                                                                           ║
 * ║  EJECUCIÓN:                                                               ║
 * ║    Terminal 1: npm run dev                                                ║
 * ║    Terminal 2: npm run test:memory                                        ║
 * ║                                                                           ║
 * ║  FLUJO: 5 ciclos de navegación buyer                                      ║
 * ║    Marketplace → Pedidos → Ofertas → Marketplace → ProductPage → (loop)  ║
 * ║                                                                           ║
 * ║  UMBRAL: Crecimiento máximo permitido = 30 MB                             ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { test, expect } from '@playwright/test';
import {
  CONFIG,
  BuyerFlowRunner,
  getMemoryUsage,
  printMemoryReport,
  type MemorySnapshot,
} from './base';

// ═══════════════════════════════════════════════════════════════════════════
// TEST PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Memory Leak Detection - Buyer Flow', () => {
  test('should maintain stable memory after repeated navigation cycles', async () => {
    const runner = new BuyerFlowRunner({ headless: false });
    const memorySnapshots: MemorySnapshot[] = [];

    try {
      // Setup browser + CDP
      await runner.setup();

      // Login (detecta automáticamente si ya hay sesión)
      await runner.login();

      // Navegar al marketplace
      await runner.navigateToMarketplace();

      // Snapshot inicial después de login
      memorySnapshots.push(await getMemoryUsage(runner.cdp, '📍 Inicial (post-login)'));

      // Ciclos de navegación
      for (let cycle = 1; cycle <= CONFIG.cycles.memory; cycle++) {
        await runner.runCycle(cycle);

        // Snapshot después de cada ciclo
        memorySnapshots.push(await getMemoryUsage(runner.cdp, `📍 Ciclo ${cycle} completado`));
      }

      // Reporte final
      const memoryGrowth = printMemoryReport(memorySnapshots);

      // Assertion: memoria no debe crecer más del umbral
      expect(memoryGrowth).toBeLessThan(CONFIG.thresholds.memoryGrowthMB);

    } finally {
      await runner.close();
    }
  });
});
