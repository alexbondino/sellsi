import { test, expect } from '@playwright/test';

// Tests E2E para el sistema de ofertas
// Estos tests requieren que la aplicación esté corriendo en localhost:3000

test.describe('Sistema de Ofertas E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Ir a la página de inicio
    await page.goto('http://localhost:3000');
    
    // Mock del localStorage con usuario logueado
    await page.addInitScript(() => {
      localStorage.setItem('user', JSON.stringify({
        id: 'test_user_123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'buyer'
      }));
    });
  });

  test('Flujo completo: Buyer crea oferta y supplier la acepta', async ({ page, context }) => {
    // Paso 1: Buyer va a un producto
    await page.goto('http://localhost:3000/product/test-product-123');
    
    // Paso 2: Abrir modal de oferta
    await page.click('[data-testid="offer-button"]');
    
    // Verificar que se abre el modal
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=Realizar Oferta')).toBeVisible();
    
    // Paso 3: Llenar formulario de oferta
    await page.fill('[data-testid="quantity-input"]', '5');
    await page.fill('[data-testid="price-input"]', '1000');
    await page.fill('[data-testid="message-input"]', 'Oferta de prueba E2E');
    
    // Verificar que el total se calcula correctamente
    await expect(page.locator('text=$5.000')).toBeVisible();
    
    // Paso 4: Enviar oferta
    await page.click('[data-testid="submit-offer-button"]');
    
    // Verificar loading state
    await expect(page.locator('[data-testid="submit-offer-button"]')).toBeDisabled();
    
    // Esperar confirmación
    await expect(page.locator('text=Oferta enviada exitosamente')).toBeVisible({ timeout: 10000 });
    
    // Modal debería cerrarse
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    
    // Paso 5: Ir a página de ofertas del buyer
    await page.goto('http://localhost:3000/buyer/offers');
    
    // Verificar que la oferta aparece
    await expect(page.locator('text=Test Product')).toBeVisible();
    await expect(page.locator('text=Pendiente')).toBeVisible();
    await expect(page.locator('text=5 uds • $1.000')).toBeVisible();
    
    // Paso 6: Simular supplier (nueva página/contexto)
    const supplierPage = await context.newPage();
    
    // Setup supplier
    await supplierPage.addInitScript(() => {
      localStorage.setItem('user', JSON.stringify({
        id: 'test_supplier_456',
        name: 'Test Supplier',
        email: 'supplier@example.com',
        role: 'supplier'
      }));
    });
    
    await supplierPage.goto('http://localhost:3000/supplier/offers');
    
    // Paso 7: Supplier ve la oferta
    await expect(supplierPage.locator('text=Test Product')).toBeVisible();
    await expect(supplierPage.locator('text=Test User')).toBeVisible(); // Nombre del buyer
    await expect(supplierPage.locator('text=5 uds * $1.000 = $5.000')).toBeVisible();
    
    // Paso 8: Supplier acepta la oferta
    await supplierPage.click('[data-testid="accept-offer-button"]');
    
    // Confirmar en modal
    await expect(supplierPage.locator('[role="dialog"]')).toBeVisible();
    await expect(supplierPage.locator('text=¿Aceptar esta oferta?')).toBeVisible();
    await supplierPage.click('[data-testid="confirm-accept-button"]');
    
    // Verificar banner de éxito
    await expect(supplierPage.locator('text=Oferta aceptada')).toBeVisible();
    
    // El estado debería cambiar a "Aceptada"
    await expect(supplierPage.locator('text=Aceptada')).toBeVisible();
    
    // Paso 9: Buyer ve la oferta aceptada
    await page.reload();
    await expect(page.locator('text=Aprobada')).toBeVisible();
    
    // Botón de agregar al carrito debería estar disponible
    await expect(page.locator('[data-testid="add-to-cart-button"]')).toBeVisible();
    
    // Paso 10: Buyer agrega al carrito
    await page.click('[data-testid="add-to-cart-button"]');
    
    // Verificar que se agregó al carrito
    await expect(page.locator('text=Producto agregado al carrito')).toBeVisible();
    
    // Cerrar páginas
    await supplierPage.close();
  });

  test('Flujo de rechazo de oferta', async ({ page, context }) => {
    // Setup: Crear oferta como buyer (pasos similares al test anterior)
    await page.goto('http://localhost:3000/product/test-product-123');
    await page.click('[data-testid="offer-button"]');
    await page.fill('[data-testid="quantity-input"]', '3');
    await page.fill('[data-testid="price-input"]', '800');
    await page.click('[data-testid="submit-offer-button"]');
    
    await expect(page.locator('text=Oferta enviada exitosamente')).toBeVisible({ timeout: 10000 });
    
    // Supplier rechaza la oferta
    const supplierPage = await context.newPage();
    await supplierPage.addInitScript(() => {
      localStorage.setItem('user', JSON.stringify({
        id: 'test_supplier_456',
        name: 'Test Supplier',
        email: 'supplier@example.com',
        role: 'supplier'
      }));
    });
    
    await supplierPage.goto('http://localhost:3000/supplier/offers');
    
    // Rechazar oferta
    await supplierPage.click('[data-testid="reject-offer-button"]');
    await expect(supplierPage.locator('[role="dialog"]')).toBeVisible();
    await supplierPage.click('[data-testid="confirm-reject-button"]');
    
    // Verificar banner de rechazo
    await expect(supplierPage.locator('text=Oferta rechazada')).toBeVisible();
    await expect(supplierPage.locator('text=Rechazada')).toBeVisible();
    
    // Buyer ve oferta rechazada
    await page.goto('http://localhost:3000/buyer/offers');
    await expect(page.locator('text=Rechazada')).toBeVisible();
    
    // Botón de limpiar debería estar disponible
    await expect(page.locator('[data-testid="delete-offer-button"]')).toBeVisible();
    
    await supplierPage.close();
  });

  test('Validación de límites de ofertas', async ({ page }) => {
    await page.goto('http://localhost:3000/product/test-product-123');
    await page.click('[data-testid="offer-button"]');
    
    // Mock: Simular que ya se alcanzó el límite
    await page.addInitScript(() => {
      // Override fetch para simular límite alcanzado
      const originalFetch = window.fetch;
      window.fetch = (...args) => {
        if (args[0].includes('count_monthly_offers')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: 3, error: null })
          });
        }
        return originalFetch(...args);
      };
    });
    
    await page.reload();
    await page.click('[data-testid="offer-button"]');
    
    // Llenar formulario
    await page.fill('[data-testid="quantity-input"]', '2');
    await page.fill('[data-testid="price-input"]', '900');
    
    // Verificar que muestra límite alcanzado
    await expect(page.locator('text=3 de 3 ofertas')).toBeVisible();
    await expect(page.locator('text=límite mensual')).toBeVisible();
    
    // Botón debería estar deshabilitado
    await expect(page.locator('[data-testid="submit-offer-button"]')).toBeDisabled();
  });

  test('Filtrado de ofertas por estado', async ({ page }) => {
    await page.goto('http://localhost:3000/buyer/offers');
    
    // Verificar que existen ofertas con diferentes estados
    await expect(page.locator('text=Pendiente')).toBeVisible();
    await expect(page.locator('text=Aprobada')).toBeVisible();
    await expect(page.locator('text=Rechazada')).toBeVisible();
    
    // Filtrar por pendientes
    await page.click('[data-testid="status-filter"]');
    await page.click('text=Pendiente');
    
    // Solo ofertas pendientes deberían ser visibles
    await expect(page.locator('text=Pendiente')).toBeVisible();
    await expect(page.locator('text=Aprobada')).not.toBeVisible();
    await expect(page.locator('text=Rechazada')).not.toBeVisible();
    
    // Cambiar a "Todos"
    await page.click('[data-testid="status-filter"]');
    await page.click('text=Todos');
    
    // Todas las ofertas deberían ser visibles nuevamente
    await expect(page.locator('text=Pendiente')).toBeVisible();
    await expect(page.locator('text=Aprobada')).toBeVisible();
    await expect(page.locator('text=Rechazada')).toBeVisible();
  });

  test('Validación de formulario de oferta', async ({ page }) => {
    await page.goto('http://localhost:3000/product/test-product-123');
    await page.click('[data-testid="offer-button"]');
    
    // Intentar enviar formulario vacío
    await page.click('[data-testid="submit-offer-button"]');
    
    // Debería mostrar errores de validación
    await expect(page.locator('text=La cantidad es requerida')).toBeVisible();
    await expect(page.locator('text=El precio es requerido')).toBeVisible();
    
    // Llenar con datos inválidos
    await page.fill('[data-testid="quantity-input"]', '0');
    await page.fill('[data-testid="price-input"]', '-100');
    
    // Verificar validaciones
    await expect(page.locator('text=La cantidad debe ser mayor a 0')).toBeVisible();
    await expect(page.locator('text=El precio debe ser mayor a 0')).toBeVisible();
    
    // El botón debería estar deshabilitado
    await expect(page.locator('[data-testid="submit-offer-button"]')).toBeDisabled();
    
    // Llenar con datos válidos
    await page.fill('[data-testid="quantity-input"]', '5');
    await page.fill('[data-testid="price-input"]', '1000');
    
    // El botón debería habilitarse
    await expect(page.locator('[data-testid="submit-offer-button"]')).toBeEnabled();
  });

  test('Tooltip informativo funciona correctamente', async ({ page }) => {
    await page.goto('http://localhost:3000/buyer/offers');
    
    // Hacer hover sobre el icono de información
    await page.hover('[data-testid="info-tooltip"]');
    
    // Verificar que aparece el tooltip
    await expect(page.locator('text=Cómo usar Acciones')).toBeVisible();
    await expect(page.locator('text=Cuando una oferta es aprobada')).toBeVisible();
    
    // Hacer hover fuera para ocultar tooltip
    await page.hover('h4'); // Hover sobre el título
    
    // Tooltip debería desaparecer
    await expect(page.locator('text=Cómo usar Acciones')).not.toBeVisible();
  });

  test('Tiempo restante se actualiza correctamente', async ({ page }) => {
    await page.goto('http://localhost:3000/buyer/offers');
    
    // Verificar que muestra tiempo restante para ofertas pendientes
    const timeDisplay = page.locator('[data-testid="remaining-time"]').first();
    const initialTime = await timeDisplay.textContent();
    
    // Esperar un momento y verificar que se actualiza
    await page.waitForTimeout(60000); // 1 minuto
    
    const updatedTime = await timeDisplay.textContent();
    expect(updatedTime).not.toBe(initialTime);
  });

  test('Cancelar oferta funciona correctamente', async ({ page }) => {
    await page.goto('http://localhost:3000/buyer/offers');
    
    // Encontrar una oferta pendiente
    const pendingOffer = page.locator('[data-testid="offer-row"]').filter({ hasText: 'Pendiente' }).first();
    
    // Hacer clic en cancelar
    await pendingOffer.locator('[data-testid="cancel-offer-button"]').click();
    
    // Confirmar cancelación
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.click('[data-testid="confirm-cancel-button"]');
    
    // Verificar que cambia a cancelada
    await expect(pendingOffer.locator('text=Cancelada')).toBeVisible();
    
    // Botón de limpiar debería aparecer
    await expect(pendingOffer.locator('[data-testid="delete-offer-button"]')).toBeVisible();
  });
});
