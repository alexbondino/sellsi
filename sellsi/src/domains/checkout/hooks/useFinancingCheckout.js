/**
 * ============================================================================
 * USE FINANCING CHECKOUT HOOK
 * ============================================================================
 * 
 * Hook para gestionar el checkout de pagos de financiamiento.
 * Carga los datos del financiamiento y los transforma al formato esperado
 * por el sistema de checkout.
 */

import { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabase';
import { getUserProfileData } from '../../../services/user/profileService';
import { getFinancingDaysStatus } from '../../../shared/utils/financingDaysLogic';

/**
 * Hook para obtener y preparar datos de financiamiento para checkout
 */
const useFinancingCheckout = (financingId) => {
  const [financing, setFinancing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!financingId) {
      setLoading(false);
      return;
    }

    const fetchFinancing = async () => {
      try {
        setLoading(true);
        setError(null);

        // ============================================================================
        // MODO DESARROLLO: Intentar obtener datos de sessionStorage (mock data)
        // ============================================================================
        const mockFinancingsData = sessionStorage.getItem('mock_financings');
        if (mockFinancingsData) {
          try {
            const mockFinancings = JSON.parse(mockFinancingsData);
            const mockFinancing = mockFinancings.find(f => f.id === parseInt(financingId));
            
            if (mockFinancing) {
              console.log('[useFinancingCheckout] Usando datos mock para financing:', financingId);
              
              // Validar estado del mock
              if (mockFinancing.status !== 'approved_by_sellsi') {
                throw new Error('El financiamiento no está aprobado');
              }

              if (mockFinancing.payment_status === 'paid') {
                throw new Error('El financiamiento ya está pagado');
              }

              // Calcular días restantes
              const { daysRemaining, status: daysStatus } = getFinancingDaysStatus(
                mockFinancing.activated_at,
                mockFinancing.term_days
              );

              // Transformar mock a formato checkout
              const checkoutData = {
                items: [{
                  id: `financing-${mockFinancing.id}`,
                  name: `Pago de Crédito - ${mockFinancing.supplier_name}`,
                  quantity: 1,
                  price: mockFinancing.amount_used || 0,
                  metadata: {
                    isFinancing: true,
                    financingId: mockFinancing.id,
                    supplierId: mockFinancing.supplier_id || 'mock-supplier',
                    supplierName: mockFinancing.supplier_name,
                    supplierEmail: 'mock@supplier.com',
                    buyerId: localStorage.getItem('user_id'),
                    buyerName: 'Mock Buyer',
                    buyerEmail: 'mock@buyer.com',
                    amountGranted: mockFinancing.amount,
                    amountUsed: mockFinancing.amount_used || 0,
                    termDays: mockFinancing.term_days,
                    activatedAt: mockFinancing.activated_at,
                    createdAt: mockFinancing.created_at,
                    daysRemaining: daysRemaining,
                    daysStatus: daysStatus,
                    paymentStatus: mockFinancing.payment_status
                  }
                }],
                subtotal: mockFinancing.amount_used || 0,
                shipping: 0,
                total: mockFinancing.amount_used || 0,
                currency: 'CLP',
                billingAddress: null,
                isFinancingPayment: true,
                financingId: mockFinancing.id
              };

              setFinancing(checkoutData);
              setLoading(false);
              return; // Salir temprano si encontramos mock
            }
          } catch (mockError) {
            console.warn('[useFinancingCheckout] Error procesando mock data:', mockError);
            // Continuar con query real si falla el mock
          }
        }

        // ============================================================================
        // MODO PRODUCCIÓN: Query a Supabase
        // ============================================================================

        // 1. Obtener datos del financiamiento con información de buyer y supplier
        const { data: financingData, error: financingError } = await supabase
          .from('financing_requests')
          .select(`
            id,
            buyer_id,
            supplier_id,
            amount,
            amount_used,
            term_days,
            status,
            activated_at,
            created_at,
            buyer(name, user_id)
          `)
          .eq('id', financingId)
          .single();

        console.log('[useFinancingCheckout] Financing data:', financingData);
        console.log('[useFinancingCheckout] Financing error:', financingError);

        if (financingError) {
          throw new Error(`Error al obtener financiamiento: ${financingError.message}`);
        }

        if (!financingData) {
          throw new Error('Financiamiento no encontrado');
        }

        // 1b. Obtener datos del supplier por separado (bypass RLS con RPC)
        const { data: supplierName, error: supplierError } = await supabase.rpc('get_supplier_name_for_buyer', { 
          p_supplier_id: financingData.supplier_id 
        });
        
        console.log('[useFinancingCheckout] Supplier name:', supplierName);
        console.log('[useFinancingCheckout] Supplier error:', supplierError);
        
        // Agregar supplier al financingData
        financingData.supplier = { name: supplierName || 'Proveedor Desconocido' };

        // 2. Validar que el financiamiento esté activo o aprobado
        if (!['active', 'approved_by_sellsi'].includes(financingData.status)) {
          throw new Error('El financiamiento no está activo');
        }

        // 3. Validar que el usuario actual es el buyer
        const userId = localStorage.getItem('user_id');
        console.log('[useFinancingCheckout] Current userId:', userId);
        console.log('[useFinancingCheckout] Financing buyer.user_id:', financingData.buyer?.user_id);
        console.log('[useFinancingCheckout] Financing buyer_id:', financingData.buyer_id);
        
        if (financingData.buyer?.user_id !== userId) {
          throw new Error('No tienes permiso para pagar este financiamiento');
        }
        
        console.log('[useFinancingCheckout] ✅ Validación de buyer_id pasada');

        // 4. Calcular días restantes
        const { daysRemaining, status: daysStatus } = getFinancingDaysStatus(
          financingData.activated_at,
          financingData.term_days
        );
        
        console.log('[useFinancingCheckout] Días restantes:', daysRemaining, 'Status:', daysStatus);

        // 5. Obtener dirección de facturación del buyer
        let billingAddress = null;
        try {
          console.log('[useFinancingCheckout] Obteniendo perfil de usuario...');
          const profile = await getUserProfileData(userId);
          console.log('[useFinancingCheckout] Perfil obtenido:', profile);
          
          const hasAnyBilling = [
            profile.business_name,
            profile.billing_address,
            profile.billing_rut,
            profile.business_line,
            profile.billing_region,
            profile.billing_commune
          ].some(v => v && String(v).trim() !== '');

          if (hasAnyBilling) {
            billingAddress = {
              business_name: profile.business_name || '',
              billing_rut: profile.billing_rut || '',
              business_line: profile.business_line || '',
              giro: profile.business_line || '',
              billing_address: profile.billing_address || '',
              billing_region: profile.billing_region || '',
              billing_commune: profile.billing_commune || '',
              address: profile.billing_address || '',
              region: profile.billing_region || '',
              commune: profile.billing_commune || ''
            };

            const requiredBilling = billingAddress.business_name.trim() !== '' && 
                                   billingAddress.billing_address.trim() !== '';
            if (!requiredBilling) billingAddress.incomplete = true;
          }
        } catch (profileError) {
          console.error('[useFinancingCheckout] Error obteniendo perfil:', profileError);
        }
        
        console.log('[useFinancingCheckout] billingAddress preparada:', billingAddress);

        // 6. Transformar a formato compatible con CheckoutSummary
        console.log('[useFinancingCheckout] 🔧 Iniciando preparación checkoutData...');
        console.log('[useFinancingCheckout] financingData.supplier:', financingData.supplier);
        console.log('[useFinancingCheckout] financingData.buyer:', financingData.buyer);
        
        const checkoutData = {
          // Crear un "item virtual" que representa el pago del financiamiento
          items: [{
            id: `financing-${financingData.id}`,
            name: `Pago de Crédito - ${financingData.supplier.name}`,
            quantity: 1,
            price: financingData.amount_used || 0,
            // Metadata adicional para el componente
            metadata: {
              isFinancing: true,
              financingId: financingData.id,
              supplierId: financingData.supplier_id,
              supplierName: financingData.supplier.name,
              buyerId: financingData.buyer_id,
              buyerName: financingData.buyer.name,
              amountGranted: financingData.amount,
              amountUsed: financingData.amount_used || 0,
              termDays: financingData.term_days,
              activatedAt: financingData.activated_at,
              createdAt: financingData.created_at,
              daysRemaining: daysRemaining,
              daysStatus: daysStatus
            }
          }],
          subtotal: financingData.amount_used || 0,
          shipping: 0, // No hay envío en pagos de financiamiento
          total: financingData.amount_used || 0,
          currency: 'CLP',
          billingAddress: billingAddress,
          // Flag especial para identificar que es un pago de financiamiento
          isFinancingPayment: true,
          financingId: financingData.id
        };
        
        console.log('[useFinancingCheckout] ✅ checkoutData preparado:', checkoutData);
        console.log('[useFinancingCheckout] Llamando setFinancing...');
        setFinancing(checkoutData);
        console.log('[useFinancingCheckout] ✅ setFinancing completado exitosamente');
      } catch (err) {
        console.error('[useFinancingCheckout] ❌ ERROR CAPTURADO:', err);
        console.error('[useFinancingCheckout] Error stack:', err.stack);
        setError(err.message || 'Error al cargar el financiamiento');
      } finally {
        setLoading(false);
      }
    };

    fetchFinancing();
  }, [financingId]);

  return {
    financing,
    loading,
    error,
    isFinancingMode: !!financingId
  };
};

export default useFinancingCheckout;
