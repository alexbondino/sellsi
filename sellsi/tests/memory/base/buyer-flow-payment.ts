/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  BUYER FLOW PAYMENT - Flujo E2E de Pago Completo                          ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  Extiende BuyerFlowRunner para incluir el flujo de pago con Flow.         ║
 * ║                                                                           ║
 * ║  FLUJO:                                                                   ║
 * ║    1. Login                                                               ║
 * ║    2. Marketplace → Agregar producto al carro                             ║
 * ║    3. Cart → Continuar al pago                                            ║
 * ║    4. PaymentMethod → Seleccionar Flow (Tarjeta)                          ║
 * ║    5. Confirmar y pagar → Redirección a Flow                              ║
 * ║    6. [Flow sandbox] → Completar pago                                     ║
 * ║    7. Retorno a la app                                                    ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { BuyerFlowRunner, type FlowOptions, type AddedProductInfo } from './buyer-flow';
import { CONFIG, ROUTES, SELECTORS } from './config';

// ═══════════════════════════════════════════════════════════════════════════
// SELECTORES ESPECÍFICOS DE FLOW SANDBOX
// ═══════════════════════════════════════════════════════════════════════════
const FLOW_SELECTORS = {
  // Flow sandbox (se irán agregando a medida que explores)
  // TODO: Agregar selectores de Flow aquí cuando explores la página
};

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════
export interface PaymentCycleResult {
  success: boolean;
  currentUrl: string;
  addedProduct: AddedProductInfo | null;
  reachedFlow: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// BUYER FLOW PAYMENT RUNNER
// ═══════════════════════════════════════════════════════════════════════════
export class BuyerFlowPaymentRunner extends BuyerFlowRunner {
  
  constructor(options: FlowOptions = {}) {
    super(options);
  }

  // =========================================================================
  // MÉTODOS ESPECÍFICOS DE FLOW SANDBOX
  // =========================================================================

  /**
   * Espera a que Flow cargue (detecta URL de Flow)
   */
  async waitForFlowRedirect(timeout = 15000): Promise<boolean> {
    console.log('  → Esperando redirección a Flow...');
    
    try {
      // Flow sandbox URLs suelen ser algo como: https://sandbox.flow.cl/...
      await this.page.waitForURL(/flow\.cl/, { timeout });
      console.log(`    ✅ Redirigido a Flow: ${this.page.url()}`);
      return true;
    } catch {
      console.log('    ⚠️ No se detectó redirección a Flow');
      console.log(`    📍 URL actual: ${this.page.url()}`);
      return false;
    }
  }

  /**
   * Placeholder para interacción con Flow sandbox
   * Aquí agregaremos los pasos específicos de Flow sandbox
   */
  async interactWithFlow(): Promise<boolean> {
    console.log('  → Interactuando con Flow sandbox...');
    console.log('    ⏸️ PAUSA: Necesito instrucciones de qué hacer en Flow');
    
    // TODO: Agregar lógica de Flow aquí
    // Ejemplo de lo que vendrá:
    // await this.page.click('SELECTOR_METODO_PAGO');
    // await this.page.fill('SELECTOR_NUMERO_TARJETA', '4051885600446623');
    // await this.page.fill('SELECTOR_CVV', '123');
    // await this.page.click('SELECTOR_CONFIRMAR');
    
    return false;
  }

  /**
   * Espera el retorno de Flow a la app
   */
  async waitForFlowReturn(timeout = 30000): Promise<boolean> {
    console.log('  → Esperando retorno de Flow a la app...');
    
    try {
      // Esperar a volver a localhost o la URL de la app
      await this.page.waitForURL(/localhost:3000/, { timeout });
      console.log(`    ✅ Retornado a la app: ${this.page.url()}`);
      return true;
    } catch {
      console.log('    ⚠️ No se detectó retorno a la app');
      console.log(`    📍 URL actual: ${this.page.url()}`);
      return false;
    }
  }

  // =========================================================================
  // CICLO DE PAGO COMPLETO (EXTENDIDO)
  // =========================================================================

  /**
   * Ejecuta el ciclo de pago completo hasta llegar a Flow
   * 
   * NOTA: Este método tiene un nombre diferente a runPaymentCycle() de la clase base
   * porque retorna información detallada del resultado, incluyendo si llegó a Flow.
   * 
   * FLUJO:
   * Marketplace → Agregar al Carro → Cart → PaymentMethod → Flow
   * 
   * @returns Información detallada del resultado del ciclo
   */
  async runFullPaymentCycle(): Promise<PaymentCycleResult> {
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                    💳 CICLO DE PAGO E2E COMPLETO                              ║');
    console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');

    let addedProduct: AddedProductInfo | null = null;

    // =========================================================================
    // 1. Ya estamos en marketplace post-login
    // =========================================================================
    console.log('\n1️⃣ MARKETPLACE (post-login)');
    console.log('   Ya estamos aquí después del login');
    await this.page.waitForTimeout(2000);

    // =========================================================================
    // 2. Agregar producto al carrito
    // =========================================================================
    console.log('\n2️⃣ AGREGAR PRODUCTO AL CARRITO');
    addedProduct = await this.addProductFromSupplierToCart();
    
    if (!addedProduct) {
      console.log('   ❌ No se pudo agregar producto al carrito');
      return {
        success: false,
        currentUrl: this.page.url(),
        addedProduct: null,
        reachedFlow: false,
      };
    }
    
    console.log(`   📦 Producto: "${addedProduct.productName}"`);
    console.log(`   🏪 Proveedor: "${addedProduct.supplierName}"`);

    // =========================================================================
    // 3. Confirmar en modal AddToCart
    // =========================================================================
    console.log('\n3️⃣ CONFIRMAR EN MODAL');
    const confirmed = await this.confirmAddToCart();
    if (!confirmed) {
      console.log('   ⚠️ No se pudo confirmar agregar al carrito');
      return {
        success: false,
        currentUrl: this.page.url(),
        addedProduct,
        reachedFlow: false,
      };
    }

    // =========================================================================
    // 4. Ir al carrito
    // =========================================================================
    console.log('\n4️⃣ IR AL CARRITO');
    await this.navigateToCart();
    await this.page.waitForTimeout(2000);

    // =========================================================================
    // 5. Continuar al pago
    // =========================================================================
    console.log('\n5️⃣ CONTINUAR AL PAGO');
    const wentToPayment = await this.clickContinueToPayment();
    if (!wentToPayment) {
      console.log('   ⚠️ No se pudo continuar al pago');
      return {
        success: false,
        currentUrl: this.page.url(),
        addedProduct,
        reachedFlow: false,
      };
    }

    // Esperar a estar en /buyer/paymentmethod
    await this.page.waitForURL(`**${ROUTES.buyer.paymentMethod}*`, { timeout: 10000 }).catch(() => {});
    await this.page.waitForTimeout(2000);
    console.log(`   📍 URL: ${this.page.url()}`);

    // =========================================================================
    // 6. Seleccionar método de pago (Flow)
    // =========================================================================
    console.log('\n6️⃣ SELECCIONAR MÉTODO DE PAGO');
    const selectedFlow = await this.selectFlowPaymentMethod();
    if (!selectedFlow) {
      console.log('   ⚠️ No se pudo seleccionar Flow');
      return {
        success: false,
        currentUrl: this.page.url(),
        addedProduct,
        reachedFlow: false,
      };
    }

    // =========================================================================
    // 7. Confirmar y pagar (redirección a Flow)
    // =========================================================================
    console.log('\n7️⃣ CONFIRMAR Y PAGAR');
    const clickedConfirm = await this.clickConfirmPayment();
    if (!clickedConfirm) {
      console.log('   ⚠️ No se pudo hacer click en Confirmar y pagar');
      return {
        success: false,
        currentUrl: this.page.url(),
        addedProduct,
        reachedFlow: false,
      };
    }

    // =========================================================================
    // 8. Esperar redirección a Flow
    // =========================================================================
    console.log('\n8️⃣ ESPERANDO FLOW');
    const reachedFlow = await this.waitForFlowRedirect();

    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log(`📍 URL ACTUAL: ${this.page.url()}`);
    console.log(`✅ Llegó a Flow: ${reachedFlow ? 'SÍ' : 'NO'}`);
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('\n🔄 Ahora puedes indicarme qué hacer en Flow...');

    return {
      success: true,
      currentUrl: this.page.url(),
      addedProduct,
      reachedFlow,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FACTORY FUNCTION
// ═══════════════════════════════════════════════════════════════════════════
export async function createBuyerFlowPaymentRunner(options?: FlowOptions): Promise<BuyerFlowPaymentRunner> {
  const runner = new BuyerFlowPaymentRunner(options);
  await runner.setup();
  return runner;
}
