/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  BUYER FLOW RUNNER - Navegación E2E Reutilizable                          ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  Clase base para ejecutar el flujo de navegación buyer.                   ║
 * ║  Maneja: login, navegación sidebar, scroll, clicks seguros.               ║
 * ║                                                                           ║
 * ║  FLUJO:                                                                   ║
 * ║    1. Login (si no hay sesión)                                            ║
 * ║    2. Marketplace → scroll                                                ║
 * ║    3. Mis Pedidos                                                         ║
 * ║    4. Mis Ofertas                                                         ║
 * ║    5. Marketplace                                                         ║
 * ║    6. Click ProductCard → Product Page                                    ║
 * ║    7. Marketplace (fin ciclo)                                             ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { chromium, type Browser, type BrowserContext, type Page, type CDPSession } from '@playwright/test';
import { CONFIG, ROUTES, SELECTORS } from './config';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════
export interface BrowserSetup {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  cdp: CDPSession;
}

export interface FlowOptions {
  headless?: boolean;
  viewport?: { width: number; height: number };
  enableCDP?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// BUYER FLOW RUNNER
// ═══════════════════════════════════════════════════════════════════════════
export class BuyerFlowRunner {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private _page: Page | null = null;
  private _cdp: CDPSession | null = null;
  private options: FlowOptions;

  constructor(options: FlowOptions = {}) {
    this.options = {
      headless: false,
      viewport: { width: 1920, height: 1080 },
      enableCDP: true,
      ...options,
    };
  }

  // =========================================================================
  // GETTERS
  // =========================================================================
  get page(): Page {
    if (!this._page) throw new Error('Browser not initialized. Call setup() first.');
    return this._page;
  }

  get cdp(): CDPSession {
    if (!this._cdp) throw new Error('CDP not initialized. Call setup() first.');
    return this._cdp;
  }

  // =========================================================================
  // SETUP / TEARDOWN
  // =========================================================================
  async setup(): Promise<BrowserSetup> {
    this.browser = await chromium.launch({
      headless: this.options.headless,
      args: ['--enable-precise-memory-info'],
    });

    this.context = await this.browser.newContext({
      viewport: this.options.viewport,
    });

    this._page = await this.context.newPage();

    if (this.options.enableCDP) {
      this._cdp = await this.context.newCDPSession(this._page);
      await this._cdp.send('Performance.enable');
    }

    return {
      browser: this.browser,
      context: this.context,
      page: this._page,
      cdp: this._cdp!,
    };
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this._page = null;
      this._cdp = null;
    }
  }

  // =========================================================================
  // HELPERS
  // =========================================================================
  async waitForPageLoad(timeout = CONFIG.waitTime): Promise<void> {
    await this.page.waitForLoadState('networkidle').catch(() => {});
    await this.page.waitForTimeout(timeout);
  }

  async scrollToBottom(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(1000);
  }

  async safeClick(selector: string, fallbackUrl?: string): Promise<boolean> {
    const element = this.page.locator(selector).first();
    const isVisible = await element.isVisible().catch(() => false);

    if (isVisible) {
      await element.click();
      return true;
    } else if (fallbackUrl) {
      // Intentar selector alternativo por href
      const hrefSelector = `a[href="${fallbackUrl}"]`;
      const hrefElement = this.page.locator(hrefSelector).first();
      const hrefVisible = await hrefElement.isVisible().catch(() => false);

      if (hrefVisible) {
        await hrefElement.click();
        return true;
      }

      // Fallback: navegación directa
      await this.page.goto(`${CONFIG.baseUrl}${fallbackUrl}`);
      return true;
    }
    return false;
  }

  // =========================================================================
  // LOGIN
  // =========================================================================
  async login(): Promise<boolean> {
    console.log('🚀 Iniciando...');
    await this.page.goto(CONFIG.baseUrl);
    await this.waitForPageLoad();

    // Esperar que TopBar renderice
    await this.page.waitForTimeout(CONFIG.sessionCheckDelay);

    const loginButton = this.page.locator(SELECTORS.loginButton).first();
    const profileButton = this.page.locator(SELECTORS.profileButton).first();

    const loginVisible = await loginButton.isVisible().catch(() => false);
    const profileVisible = await profileButton.isVisible().catch(() => false);

    console.log(`  📊 Botón "Iniciar sesión" visible: ${loginVisible}`);
    console.log(`  📊 Botón perfil visible: ${profileVisible}`);

    if (loginVisible && !profileVisible) {
      console.log('🔐 Sesión NO iniciada, haciendo login...');

      await loginButton.click();
      await this.page.waitForTimeout(CONFIG.modalAnimationDelay);

      // Llenar formulario
      const emailInput = this.page.locator(SELECTORS.emailInput).first();
      const passwordInput = this.page.locator(SELECTORS.passwordInput).first();

      const emailVisible = await emailInput.isVisible().catch(() => false);
      if (emailVisible) {
        await emailInput.fill(CONFIG.credentials.email);
      } else {
        // Fallback
        await this.page.locator('input[type="email"], input').first().fill(CONFIG.credentials.email);
      }

      const passwordVisible = await passwordInput.isVisible().catch(() => false);
      if (passwordVisible) {
        await passwordInput.fill(CONFIG.credentials.password);
      } else {
        await this.page.locator('input[type="password"]').first().fill(CONFIG.credentials.password);
      }

      // Submit
      await this.page.locator(SELECTORS.submitButton).first().click();

      // Esperar login completo
      await this.page.waitForSelector(SELECTORS.profileButton, { state: 'visible', timeout: 10000 }).catch(() => {});
      await this.page.waitForTimeout(CONFIG.waitTime);

      console.log('✅ Login completado');
      return true;
    } else if (profileVisible) {
      console.log('✅ Sesión YA iniciada');
      return true;
    }

    console.log('⚠️ Estado de sesión ambiguo');
    return false;
  }

  // =========================================================================
  // NAVEGACIÓN
  // =========================================================================
  async navigateToMarketplace(): Promise<void> {
    console.log('📍 Navegando a Marketplace...');
    await this.page.goto(`${CONFIG.baseUrl}${ROUTES.buyer.marketplace}`);
    await this.waitForPageLoad();
  }

  async navigateToOrders(): Promise<void> {
    console.log('  → Mis Pedidos');
    await this.safeClick(SELECTORS.sidebarItem('Mis Pedidos'), ROUTES.buyer.orders);
    await this.waitForPageLoad();
  }

  async navigateToOffers(): Promise<void> {
    console.log('  → Mis Ofertas');
    await this.safeClick(SELECTORS.sidebarItem('Mis Ofertas'), ROUTES.buyer.offers);
    await this.waitForPageLoad();
  }

  async clickProductCard(): Promise<boolean> {
    console.log('  → Product Page (click en producto)');
    const productCards = this.page.locator(SELECTORS.productCard);
    const cardCount = await productCards.count();

    if (cardCount > 0) {
      await productCards.first().click();
      await this.waitForPageLoad();
      console.log('    ✅ Navegado a página de producto');
      return true;
    } else {
      console.log('    ⚠️ No se encontraron ProductCards');
      return false;
    }
  }

  // =========================================================================
  // CICLO COMPLETO
  // =========================================================================
  /**
   * Ejecuta un ciclo completo de navegación buyer:
   * Marketplace (scroll) → Pedidos → Ofertas → Marketplace → ProductPage → Marketplace
   * 
   * @param cycleNumber - Número del ciclo actual (para logging)
   * @param onStepComplete - Callback opcional después de cada paso (para métricas)
   */
  async runCycle(
    cycleNumber: number,
    onStepComplete?: (step: string) => Promise<void>
  ): Promise<void> {
    console.log(`\n🔄 === CICLO ${cycleNumber} ===`);

    // Marketplace con scroll
    console.log('  → Marketplace (con scroll)');
    await this.page.goto(`${CONFIG.baseUrl}${ROUTES.buyer.marketplace}`);
    await this.waitForPageLoad();

    const sidebarVisible = await this.page
      .locator('[role="button"]:has-text("Marketplace")')
      .first()
      .isVisible()
      .catch(() => false);
    console.log(`    📊 Sidebar expandido: ${sidebarVisible}`);

    await this.scrollToBottom();
    if (onStepComplete) await onStepComplete(`Ciclo ${cycleNumber}: Marketplace (scroll)`);

    // Mis Pedidos
    await this.navigateToOrders();
    if (onStepComplete) await onStepComplete(`Ciclo ${cycleNumber}: Mis Pedidos`);

    // Mis Ofertas
    await this.navigateToOffers();
    if (onStepComplete) await onStepComplete(`Ciclo ${cycleNumber}: Mis Ofertas`);

    // Volver a Marketplace
    console.log('  → Marketplace');
    await this.safeClick(SELECTORS.sidebarItem('Marketplace'), ROUTES.buyer.marketplace);
    await this.waitForPageLoad();
    if (onStepComplete) await onStepComplete(`Ciclo ${cycleNumber}: Marketplace (vuelta)`);

    // Product Page
    await this.clickProductCard();
    if (onStepComplete) await onStepComplete(`Ciclo ${cycleNumber}: Product Page`);

    // Fin de ciclo
    console.log('  → Marketplace (fin ciclo)');
    await this.page.goto(`${CONFIG.baseUrl}${ROUTES.buyer.marketplace}`);
    await this.waitForPageLoad();
    if (onStepComplete) await onStepComplete(`Ciclo ${cycleNumber}: Fin`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FACTORY FUNCTION
// ═══════════════════════════════════════════════════════════════════════════
export async function createBuyerFlowRunner(options?: FlowOptions): Promise<BuyerFlowRunner> {
  const runner = new BuyerFlowRunner(options);
  await runner.setup();
  return runner;
}
