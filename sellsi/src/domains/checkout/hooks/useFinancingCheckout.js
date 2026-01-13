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
                mockFinancing.approved_at,
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
                    approvedAt: mockFinancing.approved_at,
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
            payment_status,
            approved_at,
            created_at,
            buyer:users!financing_requests_buyer_id_fkey(user_nm, email),
            supplier:users!financing_requests_supplier_id_fkey(user_nm, email)
          `)
          .eq('id', financingId)
          .single();

        if (financingError) {
          throw new Error(`Error al obtener financiamiento: ${financingError.message}`);
        }

        if (!financingData) {
          throw new Error('Financiamiento no encontrado');
        }

        // 2. Validar que el financiamiento esté aprobado y pendiente de pago
        if (financingData.status !== 'approved_by_sellsi') {
          throw new Error('El financiamiento no está aprobado');
        }

        if (financingData.payment_status === 'paid') {
          throw new Error('El financiamiento ya está pagado');
        }

        // 3. Validar que el usuario actual es el buyer
        const userId = localStorage.getItem('user_id');
        if (financingData.buyer_id !== userId) {
          throw new Error('No tienes permiso para pagar este financiamiento');
        }

        // 4. Calcular días restantes
        const { daysRemaining, status: daysStatus } = getFinancingDaysStatus(
          financingData.approved_at,
          financingData.term_days
        );

        // 5. Obtener dirección de facturación del buyer
        let billingAddress = null;
        try {
          const profile = await getUserProfileData(userId);
          
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

        // 6. Transformar a formato compatible con CheckoutSummary
        const checkoutData = {
          // Crear un "item virtual" que representa el pago del financiamiento
          items: [{
            id: `financing-${financingData.id}`,
            name: `Pago de Crédito - ${financingData.supplier.user_nm}`,
            quantity: 1,
            price: financingData.amount_used || 0,
            // Metadata adicional para el componente
            metadata: {
              isFinancing: true,
              financingId: financingData.id,
              supplierId: financingData.supplier_id,
              supplierName: financingData.supplier.user_nm,
              supplierEmail: financingData.supplier.email,
              buyerId: financingData.buyer_id,
              buyerName: financingData.buyer.user_nm,
              buyerEmail: financingData.buyer.email,
              amountGranted: financingData.amount,
              amountUsed: financingData.amount_used || 0,
              termDays: financingData.term_days,
              approvedAt: financingData.approved_at,
              createdAt: financingData.created_at,
              daysRemaining: daysRemaining,
              daysStatus: daysStatus,
              paymentStatus: financingData.payment_status
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

        setFinancing(checkoutData);
      } catch (err) {
        console.error('[useFinancingCheckout] Error:', err);
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
