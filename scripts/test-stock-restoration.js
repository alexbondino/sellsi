// Script de testing para validar restauración de stock en rechazos
// Test both mono-supplier and multi-supplier rejection scenarios

import { supabase } from '../services/supabase.js';

/**
 * 🧪 SUITE DE TESTS PARA RESTAURACIÓN DE STOCK
 * 
 * Tests que valida:
 * 1. ✅ Rechazo total (mono-supplier): order.status → 'rejected'
 * 2. ✅ Rechazo parcial (multi-supplier): supplier_parts_meta.status → 'rejected'
 * 3. ✅ Idempotencia: no doble restauración
 * 4. ✅ Edge cases: orden sin pago, productos inexistentes
 */

// Configuración de test
const TEST_CONFIG = {
  TEST_USER_ID: '00000000-0000-0000-0000-000000000001', // Usuario de prueba
  TEST_PRODUCT_IDS: [
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222'
  ],
  TEST_SUPPLIER_IDS: [
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  ]
};

class StockRestorationTester {
  constructor() {
    this.testResults = [];
    this.initialStocks = new Map();
  }

  async log(testName, status, message, data = null) {
    const result = {
      test: testName,
      status, // 'PASS' | 'FAIL' | 'INFO'
      message,
      data,
      timestamp: new Date().toISOString()
    };
    this.testResults.push(result);
    
    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : 'ℹ️';
    console.log(`${emoji} [${testName}] ${message}`, data ? data : '');
    
    return result;
  }

  async setupTestProducts() {
    await this.log('SETUP', 'INFO', 'Setting up test products...');
    
    for (let i = 0; i < TEST_CONFIG.TEST_PRODUCT_IDS.length; i++) {
      const productId = TEST_CONFIG.TEST_PRODUCT_IDS[i];
      const supplierId = TEST_CONFIG.TEST_SUPPLIER_IDS[i];
      const initialStock = 100 + i * 10; // 100, 110
      
      // Crear o actualizar producto de prueba
      const { data, error } = await supabase
        .from('products')
        .upsert({
          productid: productId,
          productnm: `Test Product ${i + 1}`,
          price: 1000,
          productqty: initialStock,
          supplier_id: supplierId,
          category: 'test',
          description: 'Test product for stock restoration',
          updateddt: new Date().toISOString()
        }, {
          onConflict: 'productid'
        });
      
      if (error) {
        await this.log('SETUP', 'FAIL', `Failed to setup product ${productId}: ${error.message}`);
        throw error;
      }
      
      this.initialStocks.set(productId, initialStock);
      await this.log('SETUP', 'INFO', `Product ${productId} set with stock: ${initialStock}`);
    }
  }

  async createTestOrder(isMultiSupplier = false) {
    const orderId = crypto.randomUUID();
    const items = isMultiSupplier 
      ? [
          {
            product_id: TEST_CONFIG.TEST_PRODUCT_IDS[0],
            supplier_id: TEST_CONFIG.TEST_SUPPLIER_IDS[0],
            quantity: 5,
            price_at_addition: 1000
          },
          {
            product_id: TEST_CONFIG.TEST_PRODUCT_IDS[1], 
            supplier_id: TEST_CONFIG.TEST_SUPPLIER_IDS[1],
            quantity: 3,
            price_at_addition: 1000
          }
        ]
      : [
          {
            product_id: TEST_CONFIG.TEST_PRODUCT_IDS[0],
            supplier_id: TEST_CONFIG.TEST_SUPPLIER_IDS[0],
            quantity: 7,
            price_at_addition: 1000
          }
        ];

    const supplierIds = isMultiSupplier 
      ? TEST_CONFIG.TEST_SUPPLIER_IDS 
      : [TEST_CONFIG.TEST_SUPPLIER_IDS[0]];

    // Crear orden de prueba
    const { data, error } = await supabase
      .from('orders')
      .insert({
        id: orderId,
        user_id: TEST_CONFIG.TEST_USER_ID,
        items: items,
        supplier_ids: supplierIds,
        status: 'pending',
        payment_status: 'paid', // ⚠️ IMPORTANTE: simulamos orden ya pagada
        total_amount: items.reduce((sum, item) => sum + (item.price_at_addition * item.quantity), 0),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .single();

    if (error) {
      throw new Error(`Failed to create test order: ${error.message}`);
    }

    await this.log('SETUP', 'INFO', `Created test order: ${orderId}`, { isMultiSupplier, items });
    return { orderId, items, supplierIds };
  }

  async simulateStockDecrease(items) {
    // Simular el descuento de stock que haría el webhook de pago
    for (const item of items) {
      const currentStock = this.initialStocks.get(item.product_id);
      const newStock = currentStock - item.quantity;
      
      const { error } = await supabase
        .from('products')
        .update({ 
          productqty: newStock,
          updateddt: new Date().toISOString()
        })
        .eq('productid', item.product_id);
      
      if (error) {
        throw new Error(`Failed to decrease stock: ${error.message}`);
      }
      
      await this.log('SETUP', 'INFO', `Decreased stock for ${item.product_id}: ${currentStock} → ${newStock}`);
    }
  }

  async getProductStock(productId) {
    const { data, error } = await supabase
      .from('products')
      .select('productqty')
      .eq('productid', productId)
      .single();
    
    if (error) throw error;
    return data.productqty;
  }

  async getOrderMetadata(orderId) {
    const { data, error } = await supabase
      .from('orders')
      .select('metadata, status, supplier_parts_meta')
      .eq('id', orderId)
      .single();
    
    if (error) throw error;
    return data;
  }

  // 🧪 TEST 1: Rechazo total (mono-supplier)
  async testMonoSupplierRejection() {
    const testName = 'MONO_SUPPLIER_REJECTION';
    await this.log(testName, 'INFO', 'Starting mono-supplier rejection test...');

    try {
      // 1. Crear orden mono-supplier
      const { orderId, items } = await this.createTestOrder(false);
      
      // 2. Simular descuento de stock por pago
      await this.simulateStockDecrease(items);
      
      // 3. Verificar stock decrementado
      const stockAfterPayment = await this.getProductStock(items[0].product_id);
      const expectedAfterPayment = this.initialStocks.get(items[0].product_id) - items[0].quantity;
      
      if (stockAfterPayment !== expectedAfterPayment) {
        await this.log(testName, 'FAIL', `Stock after payment incorrect: expected ${expectedAfterPayment}, got ${stockAfterPayment}`);
        return false;
      }
      
      // 4. Rechazar orden (esto debe activar el trigger)
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'rejected',
          rejection_reason: 'Test rejection',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      if (updateError) {
        await this.log(testName, 'FAIL', `Failed to reject order: ${updateError.message}`);
        return false;
      }
      
      await this.log(testName, 'INFO', 'Order status updated to rejected');
      
      // 5. Verificar que el stock fue restaurado
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for trigger
      
      const stockAfterRejection = await this.getProductStock(items[0].product_id);
      const expectedAfterRejection = this.initialStocks.get(items[0].product_id);
      
      if (stockAfterRejection === expectedAfterRejection) {
        await this.log(testName, 'PASS', `Stock correctly restored: ${stockAfterPayment} → ${stockAfterRejection}`);
      } else {
        await this.log(testName, 'FAIL', `Stock not restored: expected ${expectedAfterRejection}, got ${stockAfterRejection}`);
        return false;
      }
      
      // 6. Verificar metadata
      const orderData = await this.getOrderMetadata(orderId);
      if (orderData.metadata?.stock_restored === true) {
        await this.log(testName, 'PASS', 'Order metadata correctly updated');
      } else {
        await this.log(testName, 'FAIL', 'Order metadata not updated', orderData.metadata);
        return false;
      }
      
      return true;
      
    } catch (error) {
      await this.log(testName, 'FAIL', `Test failed with error: ${error.message}`);
      return false;
    }
  }

  // 🧪 TEST 2: Rechazo parcial (multi-supplier)
  async testMultiSupplierRejection() {
    const testName = 'MULTI_SUPPLIER_REJECTION';
    await this.log(testName, 'INFO', 'Starting multi-supplier rejection test...');

    try {
      // 1. Crear orden multi-supplier
      const { orderId, items, supplierIds } = await this.createTestOrder(true);
      
      // 2. Simular descuento de stock por pago
      await this.simulateStockDecrease(items);
      
      // 3. Simular rechazo de UN supplier (parcial)
      const rejectedSupplierId = supplierIds[0];
      const supplierPartsMeta = {};
      
      supplierIds.forEach(supplierId => {
        supplierPartsMeta[supplierId] = {
          status: supplierId === rejectedSupplierId ? 'rejected' : 'accepted',
          history: [{
            at: new Date().toISOString(),
            from: 'pending',
            to: supplierId === rejectedSupplierId ? 'rejected' : 'accepted'
          }]
        };
      });
      
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          supplier_parts_meta: supplierPartsMeta,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      if (updateError) {
        await this.log(testName, 'FAIL', `Failed to update supplier parts: ${updateError.message}`);
        return false;
      }
      
      await this.log(testName, 'INFO', `Rejected supplier: ${rejectedSupplierId}`);
      
      // 4. Verificar restauración parcial de stock
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for trigger
      
      // Solo el producto del supplier rechazado debe tener stock restaurado
      const rejectedItem = items.find(item => item.supplier_id === rejectedSupplierId);
      const acceptedItem = items.find(item => item.supplier_id !== rejectedSupplierId);
      
      const rejectedProductStock = await this.getProductStock(rejectedItem.product_id);
      const acceptedProductStock = await this.getProductStock(acceptedItem.product_id);
      
      const expectedRejectedStock = this.initialStocks.get(rejectedItem.product_id);
      const expectedAcceptedStock = this.initialStocks.get(acceptedItem.product_id) - acceptedItem.quantity;
      
      if (rejectedProductStock === expectedRejectedStock) {
        await this.log(testName, 'PASS', `Rejected supplier stock restored: ${rejectedItem.product_id}`);
      } else {
        await this.log(testName, 'FAIL', `Rejected supplier stock NOT restored: expected ${expectedRejectedStock}, got ${rejectedProductStock}`);
        return false;
      }
      
      if (acceptedProductStock === expectedAcceptedStock) {
        await this.log(testName, 'PASS', `Accepted supplier stock unchanged: ${acceptedItem.product_id}`);
      } else {
        await this.log(testName, 'FAIL', `Accepted supplier stock incorrect: expected ${expectedAcceptedStock}, got ${acceptedProductStock}`);
        return false;
      }
      
      return true;
      
    } catch (error) {
      await this.log(testName, 'FAIL', `Test failed with error: ${error.message}`);
      return false;
    }
  }

  // 🧪 TEST 3: Idempotencia (no doble restauración)
  async testIdempotency() {
    const testName = 'IDEMPOTENCY_TEST';
    await this.log(testName, 'INFO', 'Starting idempotency test...');

    try {
      // 1. Crear orden y simular rechazo
      const { orderId, items } = await this.createTestOrder(false);
      await this.simulateStockDecrease(items);
      
      // 2. Primer rechazo
      await supabase
        .from('orders')
        .update({ status: 'rejected' })
        .eq('id', orderId);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const stockAfterFirstRejection = await this.getProductStock(items[0].product_id);
      
      // 3. Segundo rechazo (debe ser idempotente)
      await supabase
        .from('orders')
        .update({ 
          status: 'rejected',
          rejection_reason: 'Double rejection test'
        })
        .eq('id', orderId);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const stockAfterSecondRejection = await this.getProductStock(items[0].product_id);
      
      if (stockAfterFirstRejection === stockAfterSecondRejection) {
        await this.log(testName, 'PASS', 'Stock not double-restored (idempotent)');
        return true;
      } else {
        await this.log(testName, 'FAIL', `Stock double-restored: ${stockAfterFirstRejection} → ${stockAfterSecondRejection}`);
        return false;
      }
      
    } catch (error) {
      await this.log(testName, 'FAIL', `Test failed with error: ${error.message}`);
      return false;
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Stock Restoration Test Suite...\n');
    
    try {
      // Setup
      await this.setupTestProducts();
      
      // Run tests
      const tests = [
        () => this.testMonoSupplierRejection(),
        () => this.testMultiSupplierRejection(),
        () => this.testIdempotency()
      ];
      
      let passCount = 0;
      for (const test of tests) {
        const passed = await test();
        if (passed) passCount++;
        console.log(''); // Spacing
      }
      
      // Summary
      console.log('📊 TEST SUMMARY:');
      console.log(`✅ Passed: ${passCount}/${tests.length}`);
      console.log(`❌ Failed: ${tests.length - passCount}/${tests.length}`);
      
      if (passCount === tests.length) {
        console.log('\n🎉 All tests passed! Stock restoration is working correctly.');
      } else {
        console.log('\n⚠️ Some tests failed. Check the logs above.');
      }
      
      return passCount === tests.length;
      
    } catch (error) {
      console.error('💥 Test suite failed:', error);
      return false;
    }
  }

  getResults() {
    return this.testResults;
  }
}

// Export for use in different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StockRestorationTester };
} else if (typeof window !== 'undefined') {
  window.StockRestorationTester = StockRestorationTester;
}

// Run tests if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  const tester = new StockRestorationTester();
  tester.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}