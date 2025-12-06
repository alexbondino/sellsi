/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  E2E PAYMENT TEST - Sellsi                                                ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  Ejecuta el flujo de pago completo hasta Flow sandbox.                    ║
 * ║                                                                           ║
 * ║  EJECUCIÓN:                                                               ║
 * ║    Terminal 1: npm run dev                                                ║
 * ║    Terminal 2: npx playwright test payment.spec.ts                        ║
 * ║                                                                           ║
 * ║  FLUJO:                                                                   ║
 * ║    Login → Marketplace → Add to Cart → Cart → Payment → Flow             ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { test, expect } from '@playwright/test';
import { BuyerFlowPaymentRunner } from './base/buyer-flow-payment';
import { CONFIG } from './base/config';

test.describe('Payment Flow E2E', () => {
  test('should complete payment flow until Flow redirect', async () => {
    const runner = new BuyerFlowPaymentRunner({ headless: false });

    try {
      // Setup browser
      await runner.setup();

      // Login
      await runner.login();
      await runner.page.waitForTimeout(CONFIG.waitTime);

      // Ejecutar ciclo de pago completo
      const result = await runner.runFullPaymentCycle();

      console.log('\n');
      console.log('╔═══════════════════════════════════════════════════════════════╗');
      console.log('║                    RESULTADO DEL TEST                         ║');
      console.log('╠═══════════════════════════════════════════════════════════════╣');
      console.log(`║  Success: ${result.success}`);
      console.log(`║  Reached Flow: ${result.reachedFlow}`);
      console.log(`║  Product: ${result.addedProduct?.productName || 'N/A'}`);
      console.log(`║  Supplier: ${result.addedProduct?.supplierName || 'N/A'}`);
      console.log(`║  URL: ${result.currentUrl}`);
      console.log('╚═══════════════════════════════════════════════════════════════╝');

      // El test pasa si llegó a Flow o si el flujo fue exitoso
      expect(result.success).toBe(true);

    } finally {
      await runner.close();
    }
  });
});
