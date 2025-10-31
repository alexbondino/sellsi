import { test, expect } from '@playwright/test';

test.describe('Offer Payment Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login como comprador
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'buyer@test.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/buyer/marketplace');
  });

  test('Complete offer payment flow: create → approve → add to cart → pay → verify cleanup', async ({ page }) => {
    // Paso 1: Crear oferta desde ficha de producto
    await page.goto('/product/test-product-id');
    await page.click('[data-testid="offer-button"]');
    
    // Llenar modal de oferta
    await page.fill('[data-testid="offer-quantity"]', '5');
    await page.fill('[data-testid="offer-price"]', '1500');
    await page.fill('[data-testid="offer-message"]', 'Test offer for E2E');
    await page.click('[data-testid="submit-offer"]');
    
    // Verificar confirmación
    await expect(page.locator('[data-testid="offer-success"]')).toBeVisible();

    // Paso 2: Como proveedor, aprobar la oferta
    await page.goto('/auth/logout');
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'supplier@test.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/supplier/dashboard');

    await page.goto('/supplier/offers');
    await page.click('[data-testid="accept-offer-button"]');
    await page.click('[data-testid="confirm-accept"]');
    
    // Verificar oferta aprobada
    await expect(page.locator('text=Aprobada')).toBeVisible();

    // Paso 3: Como comprador, agregar oferta al carrito
    await page.goto('/auth/logout');
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'buyer@test.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    await page.goto('/buyer/offers');
    await page.click('[aria-label="Agregar al carrito"]');
    
    // Verificar que aparece en carrito
    await page.goto('/buyer/cart');
    await expect(page.locator('[data-testid="chip-ofertado"]')).toBeVisible();

    // Paso 4: Proceder al checkout
    await page.click('[data-testid="checkout-button"]');
    await page.click('[data-testid="confirm-payment"]');
    
    // Simular redirección de pago exitoso
    await page.goto('/checkout/success?payment_id=test123&transaction_id=txn456');

    // Paso 5: Verificar limpieza completa
    await expect(page.locator('text=¡Pago completado exitosamente!')).toBeVisible();
    
    // Verificar que el carrito esté vacío
    await page.goto('/buyer/cart');
    await expect(page.locator('text=Tu carrito está vacío')).toBeVisible();

    // Verificar que la oferta aparezca como "Pagada"
    await page.goto('/buyer/offers');
    await expect(page.locator('text=Pagada')).toBeVisible();
    
    // Verificar que solo tenga acción de limpiar
    await expect(page.locator('[aria-label="Limpiar esta oferta"]')).toBeVisible();
    await expect(page.locator('[aria-label="Agregar al carrito"]')).not.toBeVisible();
    await expect(page.locator('[aria-label="Cancelar Oferta"]')).not.toBeVisible();
  });

  test('Offer chip updates correctly after payment', async ({ page }) => {
    // Setup: Oferta ya existente en estado 'approved'
    await page.goto('/buyer/offers');
    
    // Verificar estado inicial
    await expect(page.locator('text=Aprobada')).toBeVisible();
    await expect(page.locator('[aria-label="Agregar al carrito"]')).toBeVisible();

    // Simular webhook que actualiza oferta a 'paid' (esto sería automático en producción)
    await page.evaluate(() => {
      // Simular actualización del estado via WebSocket o polling
      window.dispatchEvent(new CustomEvent('offer-status-updated', {
        detail: { offerId: 'test-offer-id', status: 'paid' }
      }));
    });

    // Refrescar para ver cambios
    await page.reload();

    // Verificar que el chip cambió a "Pagada"
    await expect(page.locator('text=Pagada')).toBeVisible();
    await expect(page.locator('text=Aprobada')).not.toBeVisible();

    // Verificar que las acciones cambiaron
    await expect(page.locator('[aria-label="Limpiar esta oferta"]')).toBeVisible();
    await expect(page.locator('[aria-label="Agregar al carrito"]')).not.toBeVisible();
    await expect(page.locator('[aria-label="Cancelar Oferta"]')).not.toBeVisible();
  });

  test('Cart cleanup works for mixed regular and offer items', async ({ page }) => {
    // Setup: Carrito con items regulares y ofertas
    await page.goto('/buyer/marketplace');
    
    // Agregar producto regular
    await page.click('[data-testid="add-to-cart"]:first-child');
    
    // Agregar oferta al carrito
    await page.goto('/buyer/offers');
    await page.click('[aria-label="Agregar al carrito"]');

    // Verificar carrito mixto
    await page.goto('/buyer/cart');
    await expect(page.locator('.cart-item')).toHaveCount(2);
    await expect(page.locator('[data-testid="chip-ofertado"]')).toBeVisible();

    // Proceder al pago
    await page.click('[data-testid="checkout-button"]');
    await page.click('[data-testid="confirm-payment"]');
    
    // Simular pago exitoso
    await page.goto('/checkout/success?payment_id=test123&transaction_id=txn456');
    await expect(page.locator('text=¡Pago completado exitosamente!')).toBeVisible();

    // Verificar que TODO el carrito se limpió (incluido items regulares y ofertas)
    await page.goto('/buyer/cart');
    await expect(page.locator('text=Tu carrito está vacío')).toBeVisible();
  });

  test('Error handling during cart cleanup', async ({ page }) => {
    // Interceptar y simular error en limpieza de carrito
    await page.route('**/api/cart/clear', route => {
      route.abort('failed');
    });

    await page.goto('/checkout/success?payment_id=test123&transaction_id=txn456');

    // A pesar del error, debería mostrar éxito al usuario
    await expect(page.locator('text=¡Pago completado exitosamente!')).toBeVisible();

    // Y debería tener fallback de limpieza local
    await page.goto('/buyer/cart');
    // El carrito debería estar limpio debido al fallback local
    await expect(page.locator('text=Tu carrito está vacío')).toBeVisible();
  });
});
