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

/**
 * Información del producto agregado al carrito (para tracking)
 */
export interface AddedProductInfo {
  productName: string;
  supplierName: string;
  cardIndex: number;
  timestamp: number;
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
  
  /**
   * Tracking del último producto agregado al carrito
   * Se usa para poder eliminarlo específicamente después
   */
  private _lastAddedProduct: AddedProductInfo | null = null;

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

  get lastAddedProduct(): AddedProductInfo | null {
    return this._lastAddedProduct;
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

  async navigateToCart(): Promise<void> {
    console.log('  → Carrito');
    await this.safeClick(SELECTORS.sidebarItem('Carrito'), ROUTES.buyer.cart);
    await this.waitForPageLoad();
  }

  async navigateToPaymentMethod(): Promise<void> {
    console.log('  → Método de Pago');
    await this.page.goto(`${CONFIG.baseUrl}${ROUTES.buyer.paymentMethod}`);
    await this.waitForPageLoad();
  }

  /**
   * Busca productos de un proveedor en el batch actual del DOM
   * @returns Array de productos encontrados con su información
   */
  private async _findProductsFromSupplierInCurrentBatch(supplierName: string): Promise<Array<{
    index: number;
    productName: string;
    card: ReturnType<ReturnType<Page['locator']>['nth']>;
  }>> {
    const productCards = this.page.locator(SELECTORS.productCard);
    const cardCount = await productCards.count();
    
    const matchedProducts: Array<{
      index: number;
      productName: string;
      card: ReturnType<typeof productCards.nth>;
    }> = [];
    
    for (let i = 0; i < cardCount; i++) {
      const card = productCards.nth(i);
      
      // Buscar en todo el contenido de texto de la card
      const cardText = await card.textContent().catch(() => '');
      const hasSupplierInCard = cardText?.toLowerCase().includes(supplierName.toLowerCase());
      
      if (hasSupplierInCard) {
        const productName = await card
          .locator('h6, [class*="MuiTypography-h6"]')
          .first()
          .textContent()
          .catch(() => 'Producto desconocido');
        
        matchedProducts.push({
          index: i,
          productName: productName?.trim() || 'Producto desconocido',
          card,
        });
      }
    }
    
    return matchedProducts;
  }

  /**
   * Agrega un producto al carrito, con búsqueda robusta que incluye scroll.
   * 
   * ESTRATEGIA:
   * 1. Si hay proveedor preferido configurado → Buscarlo en batch actual
   * 2. Si no está → Hacer scroll y buscar en siguientes batches (hasta maxScrolls)
   * 3. Si después de todos los scrolls no lo encuentra → Usar cualquier producto
   * 4. Si no hay proveedor preferido → Usar cualquier producto al azar
   * 
   * @param supplierName - Proveedor a buscar (opcional, usa CONFIG.cart.preferredSupplier si no se especifica)
   * @returns AddedProductInfo si encontró y clickeó, null si no
   */
  async addProductFromSupplierToCart(supplierName?: string): Promise<AddedProductInfo | null> {
    const targetSupplier = supplierName || CONFIG.cart.preferredSupplier;
    const maxScrolls = CONFIG.cart.maxScrollsToFindSupplier;
    const scrollWaitTime = CONFIG.cart.scrollWaitTime;
    
    // =========================================================================
    // CASO 1: Si hay proveedor específico, buscarlo con scroll si es necesario
    // =========================================================================
    if (targetSupplier) {
      console.log(`  → Buscando producto del proveedor "${targetSupplier}"...`);
      
      let scrollAttempts = 0;
      let previousCardCount = 0;
      
      while (scrollAttempts <= maxScrolls) {
        const productCards = this.page.locator(SELECTORS.productCard);
        const currentCardCount = await productCards.count();
        
        console.log(`    📊 Batch ${scrollAttempts}: ${currentCardCount} ProductCards en DOM`);
        
        // Buscar productos del proveedor en el batch actual
        const matchedProducts = await this._findProductsFromSupplierInCurrentBatch(targetSupplier);
        
        if (matchedProducts.length > 0) {
          console.log(`    ✅ Encontrados ${matchedProducts.length} productos de "${targetSupplier}"`);
          
          // Elegir uno al azar
          const randomIndex = Math.floor(Math.random() * matchedProducts.length);
          const selected = matchedProducts[randomIndex];
          
          console.log(`    🎲 Seleccionado al azar: "${selected.productName}" (${randomIndex + 1}/${matchedProducts.length})`);
          
          // Hacer clic en el botón "AGREGAR"
          const addButton = selected.card.locator(SELECTORS.addToCartButton).first();
          const isVisible = await addButton.isVisible().catch(() => false);
          
          if (isVisible) {
            await addButton.click();
            console.log('    ✅ Click en botón "AGREGAR"');
            await this.page.waitForTimeout(CONFIG.modalAnimationDelay);
            
            this._lastAddedProduct = {
              productName: selected.productName,
              supplierName: targetSupplier,
              cardIndex: selected.index,
              timestamp: Date.now(),
            };
            
            console.log(`    📦 Producto trackeado: "${this._lastAddedProduct.productName}"`);
            return this._lastAddedProduct;
          }
        }
        
        // Si no encontramos y podemos hacer más scroll
        if (scrollAttempts < maxScrolls) {
          // Verificar si hay más contenido (el count cambió)
          if (currentCardCount === previousCardCount && scrollAttempts > 0) {
            console.log(`    📍 No hay más productos para cargar (count estable: ${currentCardCount})`);
            break;
          }
          
          console.log(`    🔄 Scroll #${scrollAttempts + 1} para buscar más productos...`);
          await this.scrollToBottom();
          await this.page.waitForTimeout(scrollWaitTime);
          previousCardCount = currentCardCount;
        }
        
        scrollAttempts++;
      }
      
      console.log(`    ⚠️ Proveedor "${targetSupplier}" no encontrado después de ${scrollAttempts} intentos`);
    }
    
    // =========================================================================
    // CASO 2: Fallback - Usar cualquier producto disponible al azar
    // =========================================================================
    console.log('    📌 Usando fallback: producto aleatorio de cualquier proveedor');
    
    // Volver arriba para tener productos frescos
    await this.page.evaluate(() => window.scrollTo(0, 0));
    await this.page.waitForTimeout(1000);
    
    const productCards = this.page.locator(SELECTORS.productCard);
    const cardCount = await productCards.count();
    
    if (cardCount === 0) {
      console.log('    ❌ No hay productos disponibles en el marketplace');
      this._lastAddedProduct = null;
      return null;
    }
    
    // Elegir un producto al azar
    const randomCardIndex = Math.floor(Math.random() * cardCount);
    const randomCard = productCards.nth(randomCardIndex);
    
    // Extraer información del producto
    const productName = await randomCard
      .locator('h6, [class*="MuiTypography-h6"]')
      .first()
      .textContent()
      .catch(() => 'Producto aleatorio');
    
    // Intentar extraer el nombre del proveedor
    const cardText = await randomCard.textContent().catch(() => '');
    const porMatch = cardText?.match(/por\s+(\w+)/i);
    const extractedSupplier = porMatch ? porMatch[1] : 'desconocido';
    
    console.log(`    🎲 Seleccionado: "${productName}" de "${extractedSupplier}" (tarjeta ${randomCardIndex + 1}/${cardCount})`);
    
    const addButton = randomCard.locator(SELECTORS.addToCartButton).first();
    const isVisible = await addButton.isVisible().catch(() => false);
    
    if (isVisible) {
      await addButton.click();
      console.log('    ✅ Click en botón "AGREGAR"');
      await this.page.waitForTimeout(CONFIG.modalAnimationDelay);
      
      this._lastAddedProduct = {
        productName: productName?.trim() || 'Producto aleatorio',
        supplierName: extractedSupplier,
        cardIndex: randomCardIndex,
        timestamp: Date.now(),
      };
      
      console.log(`    📦 Producto trackeado: "${this._lastAddedProduct.productName}"`);
      return this._lastAddedProduct;
    }
    
    console.log('    ❌ No se pudo hacer clic en ningún producto');
    this._lastAddedProduct = null;
    return null;
  }

  /**
   * Confirma el agregado al carrito en el modal AddToCartModal
   */
  async confirmAddToCart(): Promise<boolean> {
    console.log('  → Confirmando agregar al carrito en modal...');
    
    // Esperar a que el modal esté visible
    const modal = this.page.locator(SELECTORS.addToCartModal);
    const modalVisible = await modal.isVisible().catch(() => false);
    
    if (!modalVisible) {
      console.log('    ⚠️ Modal AddToCart no visible');
      return false;
    }

    // Buscar y hacer clic en el botón "Agregar al Carrito"
    const confirmButton = this.page.locator(SELECTORS.addToCartModalButton).first();
    const buttonVisible = await confirmButton.isVisible().catch(() => false);
    
    if (buttonVisible) {
      // Esperar a que el botón esté habilitado (puede estar deshabilitado mientras carga)
      await this.page.waitForTimeout(1000);
      const isDisabled = await confirmButton.isDisabled().catch(() => true);
      
      if (!isDisabled) {
        await confirmButton.click();
        console.log('    ✅ Click en "Agregar al Carrito"');
        await this.page.waitForTimeout(CONFIG.waitTime);
        return true;
      } else {
        console.log('    ⚠️ Botón "Agregar al Carrito" está deshabilitado');
      }
    } else {
      console.log('    ⚠️ Botón "Agregar al Carrito" no visible');
    }

    return false;
  }

  /**
   * Hace clic en "Continuar al Pago" en OrderSummary
   */
  async clickContinueToPayment(): Promise<boolean> {
    console.log('  → Continuar al Pago...');
    
    const button = this.page.locator(SELECTORS.continueToPaymentButton).first();
    const isVisible = await button.isVisible().catch(() => false);
    
    if (isVisible) {
      const isDisabled = await button.isDisabled().catch(() => true);
      
      if (!isDisabled) {
        await button.click();
        console.log('    ✅ Click en "Continuar al pago"');
        await this.waitForPageLoad();
        return true;
      } else {
        console.log('    ⚠️ Botón "Continuar al pago" está deshabilitado');
      }
    } else {
      console.log('    ⚠️ Botón "Continuar al pago" no visible');
    }

    return false;
  }

  /**
   * Elimina un item del carrito (abre modal y confirma)
   * Si se agregó un producto con addProductFromSupplierToCart, busca ese específicamente
   * Si no, elimina el primer item disponible
   * 
   * @returns true si se eliminó correctamente
   */
  async removeItemFromCart(): Promise<boolean> {
    console.log('  → Eliminando item del carrito...');
    
    // Obtener información del producto que queremos eliminar
    const targetProduct = this._lastAddedProduct;
    
    if (targetProduct) {
      console.log(`    🎯 Buscando producto específico: "${targetProduct.productName}"`);
      
      // Buscar todos los CartItems (Paper elements con la estructura del cart)
      // CartItem usa Paper con ciertos estilos específicos
      const cartItems = this.page.locator('[class*="MuiPaper"]:has(button:has(svg[data-testid="DeleteIcon"]))');
      const itemCount = await cartItems.count();
      console.log(`    📊 Items en carrito: ${itemCount}`);
      
      // Buscar el item que coincide con el producto que agregamos
      for (let i = 0; i < itemCount; i++) {
        const item = cartItems.nth(i);
        const itemText = await item.textContent().catch(() => '');
        
        // Verificar si este item contiene el nombre del producto
        if (itemText?.includes(targetProduct.productName)) {
          console.log(`    ✅ Encontrado item: "${targetProduct.productName}" (posición ${i + 1})`);
          
          // Buscar el botón de eliminar dentro de este item específico
          const deleteButton = item.locator('button:has(svg[data-testid="DeleteIcon"])').first();
          const isVisible = await deleteButton.isVisible().catch(() => false);
          
          if (isVisible) {
            await deleteButton.click();
            console.log('    ✅ Click en botón eliminar');
            await this.page.waitForTimeout(CONFIG.modalAnimationDelay);
            
            // Confirmar en el modal
            const confirmed = await this._confirmDeleteModal();
            if (confirmed) {
              // Limpiar el tracking del producto
              this._lastAddedProduct = null;
            }
            return confirmed;
          }
        }
      }
      
      console.log(`    ⚠️ No se encontró "${targetProduct.productName}" en el carrito`);
    }
    
    // Fallback: eliminar el primer item si no encontramos el específico
    console.log('    📌 Usando fallback: eliminar primer item disponible');
    const deleteButton = this.page.locator(SELECTORS.deleteCartItemButton).first();
    const isVisible = await deleteButton.isVisible().catch(() => false);
    
    if (!isVisible) {
      console.log('    ⚠️ Botón eliminar no visible');
      return false;
    }

    // Click en el botón de eliminar para abrir el modal
    await deleteButton.click();
    console.log('    ✅ Click en botón eliminar (fallback)');
    await this.page.waitForTimeout(CONFIG.modalAnimationDelay);

    return await this._confirmDeleteModal();
  }

  /**
   * Helper: Confirma la eliminación en el modal
   */
  private async _confirmDeleteModal(): Promise<boolean> {
    // Esperar el modal de confirmación
    const confirmModal = this.page.locator(SELECTORS.deleteConfirmModal);
    const modalVisible = await confirmModal.isVisible().catch(() => false);
    
    if (!modalVisible) {
      console.log('    ⚠️ Modal de confirmación no apareció');
      return false;
    }

    // Buscar y hacer clic en el botón "Eliminar" del modal
    const confirmButton = this.page.locator(SELECTORS.deleteConfirmButton).first();
    const confirmVisible = await confirmButton.isVisible().catch(() => false);
    
    if (confirmVisible) {
      await confirmButton.click();
      console.log('    ✅ Click en "Eliminar" - Item eliminado del carrito');
      await this.page.waitForTimeout(CONFIG.waitTime);
      return true;
    } else {
      console.log('    ⚠️ Botón "Eliminar" no visible en el modal');
    }

    return false;
  }

  /**
   * Alias para close() - para compatibilidad
   */
  async cleanup(): Promise<void> {
    await this.close();
  }

  // =========================================================================
  // FLUJO DE PAGO (Payment Flow)
  // =========================================================================
  
  /**
   * Selecciona el método de pago "Tarjeta de Crédito/Débito" (Flow)
   */
  async selectFlowPaymentMethod(): Promise<boolean> {
    console.log('  → Seleccionando método de pago: Tarjeta de Crédito/Débito...');
    
    const flowOption = this.page.locator(SELECTORS.flowPaymentOption).first();
    const isVisible = await flowOption.isVisible().catch(() => false);
    
    if (isVisible) {
      await flowOption.click();
      console.log('    ✅ Seleccionado: Tarjeta de Crédito/Débito (Flow)');
      await this.page.waitForTimeout(1000);
      return true;
    } else {
      console.log('    ⚠️ Opción de pago Flow no visible');
      return false;
    }
  }

  /**
   * Hace clic en "Confirmar y pagar" en CheckoutSummary
   * Esto iniciará la redirección a Flow
   */
  async clickConfirmPayment(): Promise<boolean> {
    console.log('  → Click en "Confirmar y pagar"...');
    
    const confirmButton = this.page.locator(SELECTORS.confirmPaymentButton).first();
    const isVisible = await confirmButton.isVisible().catch(() => false);
    
    if (isVisible) {
      const isDisabled = await confirmButton.isDisabled().catch(() => true);
      
      if (!isDisabled) {
        await confirmButton.click();
        console.log('    ✅ Click en "Confirmar y pagar"');
        console.log('    ⏳ Esperando redirección a Flow...');
        await this.page.waitForTimeout(CONFIG.waitTime);
        return true;
      } else {
        console.log('    ⚠️ Botón "Confirmar y pagar" está deshabilitado');
      }
    } else {
      console.log('    ⚠️ Botón "Confirmar y pagar" no visible');
    }
    
    return false;
  }

  /**
   * Ejecuta el ciclo de pago completo (hasta llegar a Flow)
   * Login → Marketplace → Agregar al Carro → Cart → PaymentMethod → Flow
   * 
   * Este ciclo se detiene en Flow para permitir interacción manual o
   * automatización adicional de la pasarela de pagos.
   * 
   * @returns URL actual después de hacer click en "Confirmar y pagar"
   */
  async runPaymentCycle(): Promise<string> {
    console.log('\n💳 === CICLO DE PAGO E2E ===\n');

    // 1. Ya estamos en marketplace post-login
    console.log('1️⃣ Marketplace (post-login)');
    await this.page.waitForTimeout(2000);

    // 2. Agregar producto al carrito
    console.log('\n2️⃣ Agregar producto al carrito');
    const addedProduct = await this.addProductFromSupplierToCart();
    
    if (!addedProduct) {
      console.log('    ❌ No se pudo agregar producto al carrito');
      return this.page.url();
    }
    
    console.log(`    📦 Producto: "${addedProduct.productName}" de "${addedProduct.supplierName}"`);

    // 3. Confirmar en modal AddToCart
    console.log('\n3️⃣ Confirmar en modal AddToCart');
    const confirmed = await this.confirmAddToCart();
    if (!confirmed) {
      console.log('    ⚠️ No se pudo confirmar agregar al carrito');
    }

    // 4. Ir al carrito
    console.log('\n4️⃣ Ir al Carrito');
    await this.navigateToCart();

    // 5. Continuar al pago
    console.log('\n5️⃣ Continuar al pago');
    const wentToPayment = await this.clickContinueToPayment();
    if (!wentToPayment) {
      console.log('    ⚠️ No se pudo continuar al pago');
      return this.page.url();
    }

    // Esperar a estar en /buyer/paymentmethod
    await this.page.waitForURL(`**${ROUTES.buyer.paymentMethod}*`, { timeout: 10000 }).catch(() => {});
    await this.page.waitForTimeout(2000);

    // 6. Seleccionar método de pago (Flow)
    console.log('\n6️⃣ Seleccionar método de pago');
    const selectedFlow = await this.selectFlowPaymentMethod();
    if (!selectedFlow) {
      console.log('    ⚠️ No se pudo seleccionar Flow');
      return this.page.url();
    }

    // 7. Confirmar y pagar
    console.log('\n7️⃣ Confirmar y pagar');
    const clickedConfirm = await this.clickConfirmPayment();
    if (!clickedConfirm) {
      console.log('    ⚠️ No se pudo hacer click en Confirmar y pagar');
      return this.page.url();
    }

    // Esperar un momento para la redirección
    await this.page.waitForTimeout(5000);

    const currentUrl = this.page.url();
    console.log(`\n✅ URL actual: ${currentUrl}`);
    console.log('🔄 Ahora deberías estar en Flow (o redirigiendo)...');

    return currentUrl;
  }

  // =========================================================================
  // CICLO COMPLETO (NAVEGACIÓN)
  // =========================================================================
  /**
   * Ejecuta un ciclo completo de navegación buyer:
   * Marketplace (scroll) → Pedidos → Ofertas → Marketplace → ProductPage → 
   * Marketplace → Agregar al Carro → Cart → Payment Method → Cart → Eliminar Item
   * 
   * @param cycleNumber - Número del ciclo actual (para logging)
   * @param onStepComplete - Callback opcional después de cada paso (para métricas)
   */
  async runCycle(
    cycleNumber: number,
    onStepComplete?: (step: string) => Promise<void>
  ): Promise<void> {
    console.log(`\n🔄 === CICLO ${cycleNumber} ===`);

    // =========================================================================
    // MARKETPLACE INICIAL
    // Ciclo 1: Ya estamos en marketplace después del login, solo hacer scroll
    // Ciclos 2+: Navegamos explícitamente al marketplace
    // =========================================================================
    if (cycleNumber === 1) {
      console.log('  → Marketplace (ya estamos aquí post-login, haciendo scroll)');
    } else {
      console.log('  → Marketplace (navegando)');
      await this.page.goto(`${CONFIG.baseUrl}${ROUTES.buyer.marketplace}`);
      await this.waitForPageLoad();
    }

    const sidebarVisible = await this.page
      .locator('[role="button"]:has-text("Marketplace")')
      .first()
      .isVisible()
      .catch(() => false);
    console.log(`    📊 Sidebar expandido: ${sidebarVisible}`);

    await this.scrollToBottom();
    if (onStepComplete) await onStepComplete(`Ciclo ${cycleNumber}: Marketplace (scroll)`);
    await this.page.waitForTimeout(1000); // Pequeña espera para que se asienten las cards

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

    // Product Page (Ficha Técnica)
    await this.clickProductCard();
    if (onStepComplete) await onStepComplete(`Ciclo ${cycleNumber}: Ficha Técnica`);

    // =========================================================================
    // NUEVO FLUJO: Agregar al Carro → Cart → Payment → Cart → Eliminar
    // =========================================================================
    
    // Volver a Marketplace para agregar producto al carro
    console.log('  → Marketplace (para agregar al carro)');
    await this.page.goto(`${CONFIG.baseUrl}${ROUTES.buyer.marketplace}`);
    await this.waitForPageLoad();
    if (onStepComplete) await onStepComplete(`Ciclo ${cycleNumber}: Marketplace (pre-carrito)`);

    // Agregar producto al carrito (usa proveedor de CONFIG.cart.preferredSupplier con fallback)
    const addedProduct = await this.addProductFromSupplierToCart();
    if (addedProduct) {
      console.log(`    📦 Producto agregado: "${addedProduct.productName}" de "${addedProduct.supplierName}"`);
      // Confirmar en el modal AddToCart
      const confirmed = await this.confirmAddToCart();
      if (onStepComplete) await onStepComplete(`Ciclo ${cycleNumber}: Agregar al Carro (${confirmed ? 'OK' : 'FAIL'})`);
    } else {
      if (onStepComplete) await onStepComplete(`Ciclo ${cycleNumber}: Agregar al Carro (No encontrado)`);
    }

    // Navegar al Carrito
    await this.navigateToCart();
    if (onStepComplete) await onStepComplete(`Ciclo ${cycleNumber}: Carrito`);

    // Click en "Continuar al Pago" → navega a /buyer/paymentmethod
    const wentToPayment = await this.clickContinueToPayment();
    if (wentToPayment) {
      // Verificar que estamos en payment method
      await this.page.waitForURL(`**${ROUTES.buyer.paymentMethod}*`, { timeout: 5000 }).catch(() => {});
      if (onStepComplete) await onStepComplete(`Ciclo ${cycleNumber}: Payment Method`);
    } else {
      if (onStepComplete) await onStepComplete(`Ciclo ${cycleNumber}: Payment Method (SKIP)`);
    }

    // Volver al Carrito
    console.log('  → Volver al Carrito');
    await this.page.goto(`${CONFIG.baseUrl}${ROUTES.buyer.cart}`);
    await this.waitForPageLoad();
    if (onStepComplete) await onStepComplete(`Ciclo ${cycleNumber}: Carrito (vuelta)`);

    // Eliminar el item que agregamos
    const removed = await this.removeItemFromCart();
    if (onStepComplete) await onStepComplete(`Ciclo ${cycleNumber}: Eliminar Item (${removed ? 'OK' : 'FAIL'})`);

    // Fin de ciclo - Volver a Marketplace
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
