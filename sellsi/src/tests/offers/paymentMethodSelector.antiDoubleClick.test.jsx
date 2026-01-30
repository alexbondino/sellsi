/**
 * Tests para PaymentMethodSelector - Anti-doble-click y manejo de errores
 * 
 * Estos tests verifican la lógica de bloqueo de doble-click y manejo de errores
 * sin necesidad de renderizar el componente completo, usando mocks directos.
 * 
 * La implementación real está en:
 * - src/domains/checkout/components/PaymentMethodSelector.jsx
 *   - isProcessingRef.current para bloqueo inmediato (línea 137-141)
 *   - paymentSuccessRef.current para evitar reset en success (línea 248)
 *   - Detección de constraint error por mensaje (líneas 265-274)
 */

describe('PaymentMethodSelector Logic - Anti-double-click & Error Handling', () => {
  // =========================================================================
  // Test helpers que simulan la lógica del componente
  // =========================================================================
  
  /**
   * Simula la lógica del ref anti-doble-click del handleContinue
   * Basado en líneas 137-141 de PaymentMethodSelector.jsx
   */
  function createProcessingGuard() {
    const isProcessingRef = { current: false };
    const paymentSuccessRef = { current: false };
    
    return {
      isProcessingRef,
      paymentSuccessRef,
      canStartProcessing: () => {
        if (isProcessingRef.current) {
          return false; // Bloquear segundo intento
        }
        isProcessingRef.current = true;
        return true;
      },
      onSuccess: () => {
        paymentSuccessRef.current = true;
      },
      resetIfNotSuccess: () => {
        if (!paymentSuccessRef.current) {
          isProcessingRef.current = false;
        }
      }
    };
  }
  
  /**
   * Simula la detección de error de constraint duplicada
   * Basado en líneas 265-274 de PaymentMethodSelector.jsx
   */
  // NOTE: This helper mirrors component logic; keep it in sync or export from the component in a future refactor.
  function detectDuplicateOrderError(error) {
    const message = (error?.message || '').toLowerCase();
    // Match several possible Postgres / backend phrasings to avoid brittle tests
    return message.includes('duplicate key') ||
           message.includes('uniq_orders_cart_pending') ||
           message.includes('violates unique constraint') ||
           message.includes('duplicate entry') ||
           message.includes('uniq_orders_cart');
  }

  // =========================================================================
  // Tests de lógica anti-doble-click
  // =========================================================================
  describe('Anti-double-click logic', () => {
    it('canStartProcessing retorna true en primer intento', () => {
      const guard = createProcessingGuard();
      
      const result = guard.canStartProcessing();
      
      expect(result).toBe(true);
      expect(guard.isProcessingRef.current).toBe(true);
    });

    it('canStartProcessing retorna false en segundo intento (bloquea doble-click)', () => {
      const guard = createProcessingGuard();
      
      // Primer intento
      guard.canStartProcessing();
      
      // Segundo intento - debe ser bloqueado
      const result = guard.canStartProcessing();
      
      expect(result).toBe(false);
    });

    it('resetIfNotSuccess NO resetea si hubo éxito', () => {
      const guard = createProcessingGuard();
      guard.canStartProcessing();
      guard.onSuccess(); // Marcar éxito
      
      guard.resetIfNotSuccess();
      
      // Debe seguir bloqueado porque hubo éxito
      expect(guard.isProcessingRef.current).toBe(true);
    });

    it('resetIfNotSuccess SÍ resetea si NO hubo éxito (para reintentos)', () => {
      const guard = createProcessingGuard();
      guard.canStartProcessing();
      // Sin llamar onSuccess (simula error)
      
      guard.resetIfNotSuccess();
      
      // Debe resetearse para permitir reintento
      expect(guard.isProcessingRef.current).toBe(false);
      
      // Ahora sí puede procesar de nuevo
      expect(guard.canStartProcessing()).toBe(true);
    });

    it('secuencia completa: bloquea durante proceso, resetea en error, permite reintento', () => {
      const guard = createProcessingGuard();
      
      // Intento 1: inicia
      expect(guard.canStartProcessing()).toBe(true);
      
      // Intento 2: bloqueado (doble-click)
      expect(guard.canStartProcessing()).toBe(false);
      
      // Error ocurre, reset condicional
      guard.resetIfNotSuccess();
      
      // Intento 3: permitido (reintento tras error)
      expect(guard.canStartProcessing()).toBe(true);
    });
  });

  // =========================================================================
  // Tests de detección de error de constraint
  // =========================================================================
  describe('Duplicate order error detection', () => {
    it('detecta error por "duplicate key"', () => {
      const error = new Error('Error: duplicate key value violates unique constraint');
      
      expect(detectDuplicateOrderError(error)).toBe(true);
    });

    it('detecta error por "uniq_orders_cart_pending"', () => {
      const error = new Error('Error: uniq_orders_cart_pending constraint violated');
      
      expect(detectDuplicateOrderError(error)).toBe(true);
    });

    it('detecta error combinado del mensaje real de Supabase', () => {
      const error = new Error(
        'No se pudo crear la orden: duplicate key value violates unique constraint "uniq_orders_cart_pending"'
      );
      
      expect(detectDuplicateOrderError(error)).toBe(true);
    });

    it('detecta variaciones de mensaje de duplicate (robustez)', () => {
      const variants = [
        new Error('duplicate entry "uniq_orders_cart_pending"'),
        new Error('VIOLATES UNIQUE CONSTRAINT: uniq_orders_cart_pending'),
        new Error('duplicate Key Value'),
        new Error('Error: DUPLICATE ENTRY detected')
      ];

      variants.forEach(v => expect(detectDuplicateOrderError(v)).toBe(true));
    });

    it('NO detecta otros errores como duplicate', () => {
      const error = new Error('Error de red desconocido');
      
      expect(detectDuplicateOrderError(error)).toBe(false);
    });

    it('maneja error null/undefined gracefully', () => {
      expect(detectDuplicateOrderError(null)).toBe(false);
      expect(detectDuplicateOrderError(undefined)).toBe(false);
      expect(detectDuplicateOrderError({})).toBe(false);
    });
  });

  // =========================================================================
  // Tests de integración de la lógica
  // =========================================================================
  describe('Integration: guard + error detection', () => {
    it('escenario: doble-click bloqueado, error duplicate detectado, redirige a pedidos y resetea guard', async () => {
      const guard = createProcessingGuard();
      const mockNavigate = jest.fn();
      const mockToast = { info: jest.fn(), success: jest.fn(), error: jest.fn() };

      // Simular handleContinue con error de constraint; ahora la función accepta mocks para toasts
      async function simulateHandleContinue(throwError = false) {
        if (!guard.canStartProcessing()) {
          return { blocked: true };
        }

        try {
          if (throwError) {
            throw new Error('duplicate key value violates unique constraint "uniq_orders_cart_pending"');
          }
          guard.onSuccess();
          if (mockToast) mockToast.success('ok');
          return { success: true };
        } catch (err) {
          if (detectDuplicateOrderError(err)) {
            mockNavigate('/buyer/orders');
            if (mockToast) mockToast.info('Ya tienes un pago en proceso para este carrito. Revisa tus pedidos.');
            // return antes del finally en el handler real
            return { redirected: true };
          }
          throw err;
        } finally {
          // En la implementación real el finally resetea isProcessingRef solo si paymentSuccessRef.current es false
          if (!guard.paymentSuccessRef.current) {
            guard.isProcessingRef.current = false;
          }
        }
      }

      // Primer intento - simula error de constraint
      const result1 = await simulateHandleContinue(true);
      expect(result1.redirected).toBe(true);
      expect(mockNavigate).toHaveBeenCalledWith('/buyer/orders');
      expect(mockToast.info).toHaveBeenCalled();

      // El guard debe haber sido reseteado en finally (duplicate no mantiene bloqueo)
      expect(guard.isProcessingRef.current).toBe(false);
    });

    it('escenario: éxito marca paymentSuccess y mantiene ref bloqueado', async () => {
      const guard = createProcessingGuard();
      const mockToast = { info: jest.fn(), success: jest.fn(), error: jest.fn() };

      async function simulateHandleContinue(shouldSucceed = true) {
        if (!guard.canStartProcessing()) return { blocked: true };
        try {
          if (!shouldSucceed) throw new Error('fail');
          guard.onSuccess();
          if (mockToast) mockToast.success('ok');
          return { success: true };
        } catch (err) {
          throw err;
        } finally {
          // Real logic: only reset ref if no success
          if (!guard.paymentSuccessRef.current) guard.isProcessingRef.current = false;
        }
      }

      const r = await simulateHandleContinue(true);
      expect(r.success).toBe(true);
      expect(guard.paymentSuccessRef.current).toBe(true);
      // When success, implementation intentionally keeps isProcessingRef true to avoid races with redirect
      expect(guard.isProcessingRef.current).toBe(true);
      // Additional no-double-submit assertion: immediate second attempt must be blocked
      expect(guard.canStartProcessing()).toBe(false);
    });

    it('escenario: no selectedMethod muestra toast y no procesa', async () => {
      const guard = createProcessingGuard();
      const mockToast = { error: jest.fn() };

      // Simulate behavior when selectedMethod is not set
      function handleContinueNoMethod() {
        if (!guard.canStartProcessing()) return { blocked: true };
        // In real handler: it will set isProcessingRef.current = false and toast.error
        guard.isProcessingRef.current = false;
        if (mockToast) mockToast.error('Debe seleccionar un método de pago');
        return { error: true };
      }

      const r = handleContinueNoMethod();
      expect(mockToast.error).toHaveBeenCalledWith('Debe seleccionar un método de pago');
      expect(guard.isProcessingRef.current).toBe(false);
    });

    it('escenario: error genérico permite reintento', async () => {
      const guard = createProcessingGuard();
      let attemptCount = 0;
      
      async function simulateHandleContinue(shouldSucceed = false) {
        if (!guard.canStartProcessing()) {
          return { blocked: true };
        }
        
        attemptCount++;
        
        try {
          if (!shouldSucceed && attemptCount === 1) {
            throw new Error('Error de red temporal');
          }
          guard.onSuccess();
          return { success: true };
        } catch (err) {
          if (detectDuplicateOrderError(err)) {
            return { redirected: true };
          }
          // Error genérico - resetear para permitir reintento
          throw err;
        } finally {
          guard.resetIfNotSuccess();
        }
      }
      
      // Primer intento - falla con error genérico
      await expect(simulateHandleContinue(false)).rejects.toThrow('Error de red temporal');
      
      // Guard se reseteó, permite reintento
      expect(guard.isProcessingRef.current).toBe(false);
      
      // Segundo intento - éxito
      const result2 = await simulateHandleContinue(true);
      expect(result2.success).toBe(true);
      expect(attemptCount).toBe(2);
    });
  });
});
