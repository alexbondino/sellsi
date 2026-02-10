// ============================================================================
// PAYMENT METHOD SELECTOR - VERSIÓN FINAL
// ============================================================================

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CreditCard as CreditCardIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Hooks y servicios
import { useCheckout, usePaymentMethods } from '../hooks';
import checkoutService from '../services/checkoutService'; // Corregido
import { trackUserAction } from '../../../services/security';
import { calculatePriceForQuantity } from '../../../utils/priceCalculation';
import useCartStore from '../../../shared/stores/cart/cartStore';
import { useAuth } from '../../../infrastructure/providers/UnifiedAuthProvider';

// Componentes UI
import CheckoutSummary from './CheckoutSummary';
import PaymentMethodCard from '../../../shared/components/modals/PaymentMethodCard';
import { CheckoutProgressStepper } from '../../../shared/components/navigation';
import MobilePaymentLayout from './MobilePaymentLayout';
import BankTransferModal from '../../../shared/components/modals/BankTransferModal';
import BankTransferConfirmModal from '../../../shared/components/modals/BankTransferConfirmModal';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const PaymentMethodSelector = ({ variant = 'default' }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { session } = useAuth();

  // ===== DETECCIÓN DE MOBILE =====
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // ===== DETECCIÓN DE MODO FINANCIAMIENTO =====
  const isFinancingMode = variant === 'financing';

  // Estados del checkout
  const {
    orderData,
    paymentMethod,
    selectPaymentMethod,
    nextStep,
    previousStep,
    setError,
    clearError,
    error,
    currentStep,
    completedSteps,
    startPaymentProcessing,
    completePayment,
    failPayment,
    currentStepId,
    currentStepOrder,
  } = useCheckout();

  // Estados de métodos de pago
  const {
    availableMethods: allAvailableMethods,
    selectedMethod,
    selectMethod,
    validateMethod,
    isValidating,
    validationErrors,
    getMethodFees,
    loadPaymentMethods,
    isLoadingMethods,
  } = usePaymentMethods();

  // ✅ FILTRAR métodos de pago para financiamiento: solo Khipu y Flow
  const availableMethods = useMemo(() => {
    if (isFinancingMode || orderData.isFinancingPayment) {
      // Solo permitir Khipu y Flow para pagos de financiamiento
      return allAvailableMethods.filter(m => m.id === 'khipu' || m.id === 'flow');
    }
    return allAvailableMethods;
  }, [isFinancingMode, orderData.isFinancingPayment, allAvailableMethods]);

  // Estado local
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  
  // Estados para modales de transferencia bancaria
  const [showBankTransferModal, setShowBankTransferModal] = useState(false);
  const [showBankTransferConfirmModal, setShowBankTransferConfirmModal] = useState(false);

  // Refs para bloqueo inmediato anti-doble-click
  const isProcessingRef = useRef(false);
  const paymentSuccessRef = useRef(false);

  // ===== CÁLCULO BASE TOTAL (igual que CheckoutSummary) =====
  const baseTotal = useMemo(() => {
    if (!orderData.items || orderData.items.length === 0) return 0;

    const getItemPrice = item => {
      if (item.price_tiers && item.price_tiers.length > 0) {
        // ⚠️ CRÍTICO: Convertir a Number para evitar bypass con valores falsy
        const basePrice =
          Number(
            item.originalPrice ||
              item.precioOriginal ||
              item.price ||
              item.precio
          ) || 0;
        return calculatePriceForQuantity(
          item.quantity,
          item.price_tiers,
          basePrice
        );
      }
      return item.price || 0;
    };

    const totalBruto = orderData.items.reduce((total, item) => {
      const unitPrice = getItemPrice(item);
      const quantity = item.quantity || 0;
      return total + quantity * unitPrice;
    }, 0);

    const shippingCost = orderData.shipping || 0;
    return Math.trunc(totalBruto) + shippingCost;
  }, [orderData.items, orderData.shipping]);

  // ✅ NUEVO: Detectar si el 100% está cubierto por financiamiento
  const financingAmount = orderData.financingAmount || 0;
  const remainingToPay = Math.max(0, baseTotal - financingAmount);
  const isFullyFinanced = remainingToPay === 0 && baseTotal > 0;

  console.log('💳 [PaymentMethodSelector] Estado de financiamiento:', {
    financingAmount,
    baseTotal,
    remainingToPay,
    isFullyFinanced
  });

  // ===== CÁLCULO DEL MONTO A MOSTRAR EN MODAL (incluye fee para transferencia manual si grand_total no está sellado por servidor) =====
  const amountForBankModal = useMemo(() => {
    const raw = orderData.grand_total ?? orderData.total ?? baseTotal;
    if (raw == null) return null;
    const base = Number(raw) || 0;

    // Si grand_total existe lo consideramos sellado por server (incluye fees)
    if (orderData.grand_total != null) return Math.round(base);

    // Si el método seleccionado es transferencia bancaria, aplicar fee local
    if (selectedMethod?.id === 'bank_transfer') {
      const feePct = Number(selectedMethod?.fees?.percentage ?? 0);
      return Math.round(base * (1 + feePct / 100));
    }

    return Math.round(base);
  }, [orderData.grand_total, orderData.total, baseTotal, selectedMethod]);

  // ===== EFECTOS =====

  // Cargar métodos de pago desde Supabase al montar el componente
  useEffect(() => {
    loadPaymentMethods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // ✅ CRÍTICO: NO redirigir a cart si el pago ya fue exitoso
    // Previene race condition cuando clearCart() vacía orderData.items después de navigate('/buyer/orders')
    if (paymentSuccessRef.current) {
      console.log('[PaymentMethodSelector] useEffect - Pago exitoso detectado, NO redirigiendo a cart');
      return;
    }
    
    if (!orderData.items || orderData.items.length === 0) {
      console.log('[PaymentMethodSelector] useEffect - Cart vacío detectado, redirigiendo a /buyer/cart');
      navigate('/buyer/cart', { replace: true });
      return;
    }
    clearError();
  }, [orderData, navigate, clearError]);

  // ✅ Limpiar método de pago cuando la orden está 100% financiada
  useEffect(() => {
    if (isFullyFinanced && selectedMethod !== null) {
      console.log('[PaymentMethodSelector] Orden 100% financiada detectada - limpiando método de pago seleccionado');
      setSelectedMethodId(null);
      selectMethod(null);
      selectPaymentMethod(null);
      clearError();
    }
  }, [isFullyFinanced, selectedMethod, selectMethod, selectPaymentMethod, clearError]);

  // ===== HANDLERS =====

  const handleMethodSelect = async methodId => {
    try {
      setSelectedMethodId(methodId);
      selectMethod(methodId);
      // ✅ FIX: Validar con baseTotal (sin fee de pago) ya que el fee se agrega después
      // baseTotal es el total que se usa para calcular el fee del método de pago
      const isValid = await validateMethod(methodId, baseTotal);
      if (isValid) {
        selectPaymentMethod(availableMethods.find(m => m.id === methodId));
        const currentSelectedMethod = availableMethods.find(
          m => m.id === methodId
        );
        // Solo trackear si hay usuario autenticado
        if (session?.user?.id) {
          await trackUserAction(
            session.user.id,
            `payment_method_selected_${currentSelectedMethod?.name || methodId}`
          );
        }
        clearError();
      }
    } catch (error) {
      console.error('Error selecting payment method:', error);
      setError('Error al seleccionar método de pago');
    }
  };

  const handleBack = () => {
    if (isFinancingMode) {
      // En modo financiamiento, regresar a la página de financiamientos
      // Usar state para abrir la pestaña correcta (tab 1 = Aprobados)
      navigate('/buyer/my-financing', { state: { activeTab: 1 } });
    } else {
      // Modo normal: regresar al carrito
      previousStep();
      navigate('/buyer/cart');
    }
  };

  const handleViewOrders = () => {
    navigate('/buyer/orders');
  };

  const handleContinueShopping = () => {
    navigate('/buyer/marketplace');
  };

  // ===== HANDLERS PARA TRANSFERENCIA BANCARIA =====
  
  const handleBankTransferModalClose = () => {
    setShowBankTransferModal(false);
    setIsProcessing(false);
  };
  
  const handleBankTransferModalConfirm = () => {

    setShowBankTransferModal(false);
    setShowBankTransferConfirmModal(true);
  };
  
  const handleBankTransferConfirmClose = () => {
    setShowBankTransferConfirmModal(false);
    setIsProcessing(false);
  };
  
  const handleBankTransferConfirmBack = () => {
    setShowBankTransferConfirmModal(false);
    setShowBankTransferModal(true);
  };
  
  // ===== 🆕 HANDLER PARA PAGO DE FINANCIAMIENTO =====
  const handleFinancingPayment = async () => {
    isProcessingRef.current = true;
    setIsProcessing(true);
    
    try {
      const userId = localStorage.getItem('user_id');
      const userEmail = localStorage.getItem('user_email');
      
      if (!userId) {
        throw new Error('Usuario no autenticado');
      }

      // Obtener financingId del orderData
      const financingId = orderData.financingId;
      if (!financingId) {
        throw new Error('ID de financiamiento no encontrado');
      }

      const amountToPay = orderData.total || 0;
      if (amountToPay <= 0) {
        throw new Error('Monto a pagar inválido');
      }

      console.log('[PaymentMethodSelector] 💳 Procesando pago de financiamiento:', {
        financingId,
        amountToPay,
        method: selectedMethod.id,
        userId
      });

      startPaymentProcessing();

      if (selectedMethod.id === 'khipu') {
        console.log('[PaymentMethodSelector] Procesando pago de financiamiento con Khipu...');
        
        // Importar khipuService
        const khipuService = (await import('../services/khipuService')).default;
        
        const paymentResult = await khipuService.createPaymentOrder({
          total: amountToPay,
          currency: 'CLP',
          orderId: `financing_${financingId}`,
          userId: userId,
          items: orderData.items || [],
          shippingAddress: null,
          billingAddress: orderData.billingAddress || null,
          financingAmount: 0, // No hay financiamiento en un pago de deuda
        });

        if (paymentResult.success && paymentResult.paymentUrl) {
          paymentSuccessRef.current = true;
          console.log('[PaymentMethodSelector] Redirigiendo a Khipu:', paymentResult.paymentUrl);
          toast.success('Redirigiendo a Khipu para completar el pago...');
          setTimeout(() => {
            window.location.href = paymentResult.paymentUrl;
          }, 1500);
        } else {
          throw new Error('Error al crear orden de pago en Khipu');
        }
      } else if (selectedMethod.id === 'flow') {
        console.log('[PaymentMethodSelector] Procesando pago de financiamiento con Flow...');
        
        // Importar flowService
        const flowService = (await import('../services/flowService')).default;
        
        const paymentResult = await flowService.createPaymentOrder({
          total: amountToPay,
          currency: 'CLP',
          orderId: `financing_${financingId}`,
          userId: userId,
          userEmail: userEmail,
          items: orderData.items || [],
          shippingAddress: null,
          billingAddress: orderData.billingAddress || null,
          financingAmount: 0, // No hay financiamiento en un pago de deuda
        });

        if (paymentResult.success && paymentResult.paymentUrl) {
          paymentSuccessRef.current = true;
          console.log('[PaymentMethodSelector] Redirigiendo a Flow:', paymentResult.paymentUrl);
          toast.success('Redirigiendo a Flow para completar el pago...');
          setTimeout(() => {
            window.location.href = paymentResult.paymentUrl;
          }, 1500);
        } else {
          throw new Error('Error al crear orden de pago en Flow');
        }
      } else if (selectedMethod.id === 'bank_transfer') {
        // ⚠️ NOTA: Transferencia bancaria está DESHABILITADA para pagos de financiamiento
        // Este bloque existe para futuras implementaciones, pero actualmente bank_transfer
        // está filtrado en availableMethods cuando isFinancingMode = true
        console.log('[PaymentMethodSelector] Procesando pago de financiamiento con Transferencia Bancaria...');
        
        // Para transferencia bancaria, registrar en financing_payments como pendiente
        // y mostrar los datos bancarios al usuario
        const { supabase } = await import('../../../services/supabase');
        
        // buyer_id debe ser el ID de la tabla buyer (no auth.users)
        // porque la RLS policy valida: buyer_id IN (SELECT b.id FROM buyer WHERE b.user_id = auth.uid())
        const buyerTableId = orderData.items?.[0]?.metadata?.buyerId;
        if (!buyerTableId) {
          throw new Error('No se pudo determinar el ID de comprador para la transferencia');
        }
        
        const { data: fpData, error: fpError } = await supabase
          .from('financing_payments')
          .insert({
            financing_request_id: financingId,
            buyer_id: buyerTableId,
            amount: amountToPay,
            currency: 'CLP',
            payment_method: 'bank_transfer',
            payment_status: 'pending',
          })
          .select('id')
          .single();

        if (fpError) {
          console.error('[PaymentMethodSelector] Error registrando pago por transferencia:', fpError);
          throw new Error('Error al registrar el pago por transferencia');
        }

        console.log('[PaymentMethodSelector] Pago por transferencia registrado:', fpData?.id);
        
        paymentSuccessRef.current = true;
        toast.success('Pago por transferencia registrado. Envía el comprobante a tu proveedor para que lo valide.');
        
        // Redirigir a my-financing después de un momento
        setTimeout(() => {
          window.location.href = '/buyer/my-financing';
        }, 3000);
      } else {
        throw new Error('Método de pago no soportado para financiamientos');
      }
    } catch (error) {
      console.error('[PaymentMethodSelector] Error procesando pago de financiamiento:', error);
      setError(error.message);
      toast.error(error.message);
      failPayment(error.message);
    } finally {
      setIsProcessing(false);
      if (!paymentSuccessRef.current) {
        isProcessingRef.current = false;
      }
    }
  };
  
  const handleBankTransferConfirmFinal = async () => {
    // Bloqueo inmediato
    if (isProcessingRef.current || paymentSuccessRef.current) {
      console.log('[PaymentMethodSelector] Click ignorado - ya procesando');
      return;
    }
    isProcessingRef.current = true;
    setIsProcessing(true);
    
    try {
      const userId = localStorage.getItem('user_id');
      const userEmail = localStorage.getItem('user_email');
      
      if (!userId) {
        throw new Error('Usuario no autenticado');
      }

      const validation = checkoutService.validateCheckoutData({
        ...orderData,
        paymentMethod: selectedMethod.id,
        userId: userId,
      });

      if (!validation.isValid) {
        const errorMessage = Object.values(validation.errors).join(', ');
        throw new Error(errorMessage);
      }

      startPaymentProcessing();

      // Calcular el total exactamente igual que en CheckoutSummary.jsx
      const getItemPrice = item => {
        if (item.price_tiers && item.price_tiers.length > 0) {
          const basePrice =
            item.originalPrice ||
            item.precioOriginal ||
            item.price ||
            item.precio ||
            0;
          return calculatePriceForQuantity(
            item.quantity,
            item.price_tiers,
            basePrice
          );
        }
        return item.price || 0;
      };
      const totalBruto = orderData.items.reduce((total, item) => {
        const unitPrice = getItemPrice(item);
        const quantity = item.quantity || 0;
        return total + quantity * unitPrice;
      }, 0);
      const calculatedIva = Math.trunc(totalBruto * 0.19);
      const calculatedSubtotal = Math.trunc(totalBruto) - calculatedIva;
      const shippingCost = orderData.shipping || 0;
      
      // ✅ CRÍTICO: Considerar financiamiento
      const financingAmount = orderData.financingAmount || 0;
      const baseTotal = Math.round(calculatedSubtotal + calculatedIva + shippingCost);
      
      // Total REAL a pagar (después de aplicar financiamiento)
      const orderTotal = Math.max(0, baseTotal - financingAmount);
      
      console.log('💰 [PaymentMethodSelector - Bank Transfer] Cálculo de total:', {
        baseTotal,
        financingAmount,
        orderTotal,
        remainingToPay: orderTotal
      });

      // ✅ CRÍTICO: Obtener configuración de financiamiento por producto del store
      const productFinancingBT = useCartStore.getState().productFinancing || {};

      // Normalizar a un único campo document_type + inyectar financing_amount por item
      const itemsWithDocType = (orderData.items || []).map(it => {
        const raw = it.document_type || it.documentType;
        const norm =
          raw && ['boleta', 'factura'].includes(String(raw).toLowerCase())
            ? String(raw).toLowerCase()
            : 'ninguno';
        
        // ✅ NUEVO: Inyectar financing_amount por item
        const financingCfg = productFinancingBT[it.id];
        const itemFinancingAmount = financingCfg ? Math.max(0, Number(financingCfg.amount) || 0) : 0;
        
        return { 
          ...it, 
          document_type: norm,
          financing_amount: itemFinancingAmount,
        };
      });

      // Obtener cartId del store para vincular orden con carrito
      const cartId = useCartStore.getState().cartId;

      // Calcular payment_fee para transferencia bancaria (0.5%) sobre el monto restante
      const paymentFee = Math.round(orderTotal * 0.005);
      const grandTotal = orderTotal + paymentFee;

      const order = await checkoutService.createOrder({
        userId: userId,
        items: itemsWithDocType,
        subtotal: orderData.subtotal,
        tax: orderData.tax,
        shipping: orderData.shipping,
        total: baseTotal, // ✅ CORREGIDO: Total BASE (subtotal + shipping), la RPC restará financing
        financingAmount: financingAmount, // ✅ CRÍTICO: Enviar monto financiado
        currency: orderData.currency || 'CLP',
        paymentMethod: selectedMethod.id,
        paymentFee: paymentFee,
        grandTotal: grandTotal,
        shippingAddress: orderData.shippingAddress,
        billingAddress: orderData.billingAddress,
        cartId: cartId,
      });

      console.log('[PaymentMethodSelector] Orden creada con transferencia bancaria:', order);

      // Finalizar precios y validar (stock, precios, compra mínima)
      await checkoutService.finalizeOrderPricing(order.id);
      console.log('[PaymentMethodSelector] Precios finalizados y validados para orden:', order.id);

      // Para transferencia bancaria, marcar como pending y redirigir a Mis Pedidos
      paymentSuccessRef.current = true;
      
      // Cerrar modal de confirmación
      setShowBankTransferConfirmModal(false);
      
      // Vaciar el carrito ya que la orden pasó a pending
      await useCartStore.getState().clearCart();
      console.log('[PaymentMethodSelector] Carrito vaciado después de crear orden pending');
      
      toast.success('¡Pedido registrado! Recibirás confirmación cuando se verifique el pago.');
      
      // Redirigir inmediatamente a Mis Pedidos
      navigate('/buyer/orders');
      
    } catch (error) {
      console.error('Error processing bank transfer:', error);

      // Manejo de errores igual que en otros métodos de pago
      const errorMessages = {
        MINIMUM_PURCHASE_VIOLATION:
          'No se cumple la compra mínima de uno o más proveedores.',
        MINIMUM_PURCHASE_NOT_MET:
          'No se cumple la compra mínima requerida por el proveedor.',
        INSUFFICIENT_STOCK: 'Stock insuficiente para uno o más productos.',
        PRODUCT_NOT_FOUND: 'Uno o más productos ya no están disponibles.',
        INVALID_ITEM: 'Hay items inválidos en el carrito.',
        INVALID_QUANTITY: 'La cantidad de uno o más productos es inválida.',
        INVALID_PRODUCT: 'Uno o más productos no tienen proveedor asignado.',
        INVALID_SUPPLIER: 'El proveedor de uno o más productos no existe.',
        INVALID_ORDER: 'La orden está vacía o es inválida.',
      };

      const knownError = Object.keys(errorMessages).find(key =>
        error.message?.includes(key)
      );

      if (knownError) {
        const userMessage = errorMessages[knownError];
        console.log(
          `[PaymentMethodSelector] Error de validación: ${knownError}`
        );
        toast.error(userMessage + ' Revisa tu carrito.');
        navigate('/buyer/cart');
        return;
      }

      const isDuplicateOrder =
        error.message?.includes('uniq_orders_cart_pending') ||
        error.message?.includes('duplicate key');

      if (isDuplicateOrder) {
        console.log(
          '[PaymentMethodSelector] Orden duplicada detectada, redirigiendo a pedidos'
        );
        toast.info(
          'Ya tienes un pago en proceso para este carrito. Revisa tus pedidos.'
        );
        navigate('/buyer/orders');
        return;
      }

      setError(error.message);
      toast.error(error.message);
      failPayment(error.message);
      
      // Cerrar modal en caso de error
      setShowBankTransferConfirmModal(false);
      setShowBankTransferModal(false);
    } finally {
      setIsProcessing(false);
      if (!paymentSuccessRef.current) {
        isProcessingRef.current = false;
      }
    }
  };

  const handleContinue = async () => {
    // Bloqueo inmediato con ref (no espera re-render de useState)
    if (isProcessingRef.current || paymentSuccessRef.current) {
      console.log(
        '[PaymentMethodSelector] Click ignorado - ya procesando o redirigiendo'
      );
      return;
    }

    // ✅ VALIDACIÓN CRÍTICA: Asegurar coherencia entre isFullyFinanced y selectedMethod
    if (isFullyFinanced && selectedMethod !== null) {
      toast.error('Error: Orden 100% financiada no requiere procesador de pago');
      console.error('[PaymentMethodSelector] Inconsistencia: isFullyFinanced=true pero selectedMethod!=null', {
        isFullyFinanced,
        selectedMethod: selectedMethod?.id,
        financingAmount,
        baseTotal
      });
      return;
    }

    // ✅ NUEVO: Permitir continuar sin método de pago cuando está 100% financiado
    if (!selectedMethod && !isFullyFinanced) {
      toast.error('Debe seleccionar un método de pago');
      return;
    }
    
    // ===== 🆕 MANEJO ESPECIAL PARA PAGO DE FINANCIAMIENTO =====
    // Debe ir ANTES de bank_transfer para que todos los métodos pasen por handleFinancingPayment
    if (isFinancingMode || orderData.isFinancingPayment) {
      console.log('[PaymentMethodSelector] 💳 Modo financing detectado - flujo de pago de deuda');
      await handleFinancingPayment();
      return;
    }
    
    // ===== MANEJO ESPECIAL PARA TRANSFERENCIA BANCARIA =====
    if (selectedMethod && selectedMethod.id === 'bank_transfer') {
      // Para transferencia bancaria, mostrar el modal
      // Usamos isProcessing solo para sincronizar con CheckoutSummary
      console.log('[DEBUG] Abriendo modal de transferencia bancaria');
      setIsProcessing(true);
      setShowBankTransferModal(true);
      return;
    }
    
    // Para otros métodos de pago, SÍ bloquear con ref
    isProcessingRef.current = true;
    
    setIsProcessing(true);
    try {
      const userId = localStorage.getItem('user_id');
      const userEmail = localStorage.getItem('user_email');
      if (!userId) {
        throw new Error('Usuario no autenticado');
      }

      const validation = checkoutService.validateCheckoutData({
        ...orderData,
        paymentMethod: isFullyFinanced ? 'financing' : selectedMethod.id,
        userId: userId,
      });

      if (!validation.isValid) {
        const errorMessage = Object.values(validation.errors).join(', ');
        throw new Error(errorMessage);
      }

      startPaymentProcessing();

      // Calcular el total exactamente igual que en CheckoutSummary.jsx
      const getItemPrice = item => {
        if (item.price_tiers && item.price_tiers.length > 0) {
          const basePrice =
            item.originalPrice ||
            item.precioOriginal ||
            item.price ||
            item.precio ||
            0;
          return calculatePriceForQuantity(
            item.quantity,
            item.price_tiers,
            basePrice
          );
        }
        return item.price || 0;
      };
      const totalBruto = orderData.items.reduce((total, item) => {
        const unitPrice = getItemPrice(item);
        const quantity = item.quantity || 0;
        return total + quantity * unitPrice;
      }, 0);
      const calculatedIva = Math.trunc(totalBruto * 0.19);
      const calculatedSubtotal = Math.trunc(totalBruto) - calculatedIva;
      const shippingCost = orderData.shipping || 0;
      
      // ✅ CRÍTICO: Considerar financiamiento
      const financingAmount = orderData.financingAmount || 0;
      const baseTotal = Math.round(calculatedSubtotal + calculatedIva + shippingCost);
      
      // Total REAL a pagar (después de aplicar financiamiento)
      // El servidor añadirá payment_fee y calculará grand_total
      const orderTotal = Math.max(0, baseTotal - financingAmount);
      
      console.log('💰 [PaymentMethodSelector] Cálculo de total para orden:', {
        baseTotal,
        financingAmount,
        orderTotal,
        remainingToPay: orderTotal
      });

      // ✅ CRÍTICO: Obtener configuración de financiamiento por producto del store
      // Esto preserva la información granular de qué productos están financiados
      const productFinancing = useCartStore.getState().productFinancing || {};

      // Normalizar a un único campo document_type + inyectar financing_amount por item
      const itemsWithDocType = (orderData.items || []).map(it => {
        const raw = it.document_type || it.documentType;
        const norm =
          raw && ['boleta', 'factura'].includes(String(raw).toLowerCase())
            ? String(raw).toLowerCase()
            : 'ninguno';
        
        // ✅ NUEVO: Inyectar financing_amount por item desde productFinancing
        const financingCfg = productFinancing[it.id];
        const itemFinancingAmount = financingCfg ? Math.max(0, Number(financingCfg.amount) || 0) : 0;
        
        return { 
          ...it, 
          document_type: norm,
          financing_amount: itemFinancingAmount, // Monto financiado para ESTE producto
        };
      });

      // Obtener cartId del store para vincular orden con carrito
      const cartId = useCartStore.getState().cartId;

      const order = await checkoutService.createOrder({
        userId: userId,
        items: itemsWithDocType,
        subtotal: orderData.subtotal,
        tax: orderData.tax,
        shipping: orderData.shipping,
        total: baseTotal, // ✅ CORREGIDO: Total BASE (subtotal + shipping), la RPC restará financing
        financingAmount: financingAmount, // ✅ CRÍTICO: Enviar monto financiado al backend
        currency: orderData.currency || 'CLP',
        paymentMethod: isFullyFinanced ? 'financing' : selectedMethod.id, // ✅ NUEVO: 'financing' cuando 100% financiado
        shippingAddress: orderData.shippingAddress,
        billingAddress: orderData.billingAddress,
        cartId: cartId, // ✅ Vincular orden con carrito para limpieza server-side
      });

      console.log('[PaymentMethodSelector] Orden creada:', order);

      // ✅ NUEVO: Si está 100% financiado, no requiere procesador de pago externo
      if (isFullyFinanced) {
        console.log('[PaymentMethodSelector] 🔵 Orden 100% financiada, finalizando pricing...');
        
        try {
          // ⭐ CRÍTICO: Llamar a finalize_order_pricing para:
          // 1. Validar stock y precios
          // 2. Calcular payment_fee y grand_total
          // 3. Marcar automáticamente como 'paid' (migration 20260205000002)
          console.log('[PaymentMethodSelector] 🔵 Llamando finalizeOrderPricing para orden:', order.id);
          await checkoutService.finalizeOrderPricing(order.id);
          console.log('[PaymentMethodSelector] ✅ finalizeOrderPricing completado');
          
          // ✅ CRÍTICO: Marcar como completado ANTES de navigate y clearCart
          console.log('[PaymentMethodSelector] 🔵 Marcando paymentSuccessRef = true');
          paymentSuccessRef.current = true;
          
          console.log('[PaymentMethodSelector] 🔵 Llamando completePayment()');
          completePayment({ transactionId: order.id, paymentReference: `FINANCING_${order.id}` });
          
          // ✅ Redirigir PRIMERO a órdenes (sincrónico, sin delay)
          console.log('[PaymentMethodSelector] 🔵 Navegando a /buyer/orders (paymentSuccessRef:', paymentSuccessRef.current, ')');
          navigate('/buyer/orders', { replace: true });
          console.log('[PaymentMethodSelector] 🔵 Navigate ejecutado');
          
          // ✅ Limpiar carrito DESPUÉS de la redirección
          toast.success('¡Orden confirmada! El 100% está cubierto por financiamiento.');
          const clearCart = useCartStore.getState().clearCart;
          if (clearCart) {
            console.log('[PaymentMethodSelector] 🔵 Ejecutando clearCart() en background');
            // Ejecutar en background sin esperar
            clearCart()
              .then(() => console.log('[PaymentMethodSelector] ✅ clearCart() completado'))
              .catch(err => console.error('[PaymentMethodSelector] ❌ Error limpiando carrito:', err));
          }
          
          console.log('[PaymentMethodSelector] ✅ Flujo de financiamiento 100% completado exitosamente');
          return;
        } catch (finalizeErr) {
          console.error('[PaymentMethodSelector] Error finalizando orden financiada:', finalizeErr);
          
          // Mostrar error específico según el tipo
          if (finalizeErr.message?.includes('INSUFFICIENT_STOCK')) {
            toast.error('Stock insuficiente para completar la orden');
          } else if (finalizeErr.message?.includes('MINIMUM_PURCHASE_NOT_MET')) {
            toast.error('No se alcanzó la compra mínima requerida');
          } else {
            toast.error('Error al procesar la orden: ' + finalizeErr.message);
          }
          
          setIsProcessing(false);
          isProcessingRef.current = false;
          return;
        }
      }

      if (selectedMethod.id === 'khipu') {
        console.log('[PaymentMethodSelector] Procesando pago con Khipu...');
        // Usar el total que quedó persistido en la fila (server authoritative) si existe
        const authoritativeTotal =
          order && typeof order.total === 'number'
            ? Math.round(order.total)
            : orderTotal; // sigue siendo base total
        if (authoritativeTotal !== orderTotal) {
          console.log(
            '[PaymentMethodSelector] Diferencia entre order.total y orderTotal calculado front:',
            { authoritativeTotal, frontComputed: orderTotal }
          );
        }
        const paymentResult = await checkoutService.processKhipuPayment({
          orderId: order.id,
          userId: userId,
          userEmail: userEmail || '',
          amount: authoritativeTotal, // monto base; Edge usará grand_total (incluye fee) para cobrar
          financingAmount: financingAmount, // ✅ CRÍTICO: Pasar monto financiado
          currency: orderData.currency || 'CLP',
          items: itemsWithDocType,
          // ✔ Propagar direcciones para que no se pierdan en el pipeline de pago
          shippingAddress: orderData.shippingAddress || null,
          billingAddress: orderData.billingAddress || null,
        });

        if (paymentResult.success && paymentResult.paymentUrl) {
          // Marcar éxito ANTES del redirect para evitar reset en finally
          paymentSuccessRef.current = true;
          console.log(
            '[PaymentMethodSelector] Redirigiendo a Khipu:',
            paymentResult.paymentUrl
          );
          toast.success('Redirigiendo a Khipu para completar el pago...');
          setTimeout(() => {
            window.location.href = paymentResult.paymentUrl;
          }, 1500);
        } else {
          throw new Error('Error al crear orden de pago en Khipu');
        }
      } else if (selectedMethod.id === 'flow') {
        console.log('[PaymentMethodSelector] Procesando pago con Flow...');
        const authoritativeTotal =
          order && typeof order.total === 'number'
            ? Math.round(order.total)
            : orderTotal;

        const paymentResult = await checkoutService.processFlowPayment({
          orderId: order.id,
          userId: userId,
          userEmail: userEmail || '',
          amount: authoritativeTotal,
          financingAmount: financingAmount, // ✅ CRÍTICO: Pasar monto financiado
          currency: orderData.currency || 'CLP',
          items: itemsWithDocType,
          shippingAddress: orderData.shippingAddress || null,
          billingAddress: orderData.billingAddress || null,
        });

        if (paymentResult.success && paymentResult.paymentUrl) {
          paymentSuccessRef.current = true;
          console.log(
            '[PaymentMethodSelector] Redirigiendo a Flow:',
            paymentResult.paymentUrl
          );
          toast.success('Redirigiendo a Flow para completar el pago...');
          setTimeout(() => {
            window.location.href = paymentResult.paymentUrl;
          }, 1500);
        } else {
          throw new Error('Error al crear orden de pago en Flow');
        }
      } else {
        throw new Error('Método de pago no implementado aún');
      }
    } catch (error) {
      console.error('Error processing payment:', error);

      // ⭐ MANEJO COMPLETO DE ERRORES DE VALIDACIÓN SQL
      const errorMessages = {
        MINIMUM_PURCHASE_VIOLATION:
          'No se cumple la compra mínima de uno o más proveedores.',
        MINIMUM_PURCHASE_NOT_MET:
          'No se cumple la compra mínima requerida por el proveedor.',
        INSUFFICIENT_STOCK: 'Stock insuficiente para uno o más productos.',
        PRODUCT_NOT_FOUND: 'Uno o más productos ya no están disponibles.',
        INVALID_ITEM: 'Hay items inválidos en el carrito.',
        INVALID_QUANTITY: 'La cantidad de uno o más productos es inválida.',
        INVALID_PRODUCT: 'Uno o más productos no tienen proveedor asignado.',
        INVALID_SUPPLIER: 'El proveedor de uno o más productos no existe.',
        INVALID_ORDER: 'La orden está vacía o es inválida.',
      };

      // Buscar mensaje de error conocido
      const knownError = Object.keys(errorMessages).find(key =>
        error.message?.includes(key)
      );

      if (knownError) {
        const userMessage = errorMessages[knownError];
        console.log(
          `[PaymentMethodSelector] Error de validación: ${knownError}`
        );

        // Todos los errores de validación redirigen al carrito para corrección
        toast.error(userMessage + ' Revisa tu carrito.');
        navigate('/buyer/cart');
        return;
      }

      // Detectar error de constraint duplicada por mensaje
      const isDuplicateOrder =
        error.message?.includes('uniq_orders_cart_pending') ||
        error.message?.includes('duplicate key');

      if (isDuplicateOrder) {
        console.log(
          '[PaymentMethodSelector] Orden duplicada detectada, redirigiendo a pedidos'
        );
        toast.info(
          'Ya tienes un pago en proceso para este carrito. Revisa tus pedidos.'
        );
        navigate('/buyer/orders');
        return;
      }

      // Error desconocido
      setError(error.message);
      toast.error(error.message);
      failPayment(error.message);
    } finally {
      setIsProcessing(false);
      // Solo resetear ref si NO hubo éxito (evita race condition con setTimeout del redirect)
      if (!paymentSuccessRef.current) {
        isProcessingRef.current = false;
      }
    }
  };

  // ===== ANIMACIONES =====

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 },
    },
  };

  // ===== RENDERIZADO (COMPLETO) =====

  // Mostrar loader mientras se cargan los métodos de pago
  if (isLoadingMethods) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Validar que haya métodos de pago disponibles
  if (availableMethods.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', px: 3 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No hay métodos de pago disponibles
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          Por favor, escribenos si crees que esto es un error.
        </Typography>
      </Box>
    );
  }

  // Derivar total para barra inferior (replicado del summary calculado allí) - simple fallback
  const totalForBar = orderData.total || 0;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Layout condicional: móvil vs desktop */}
      {isMobile ? (
        <Box sx={{ width: '100%', maxWidth: '100%', px: 0, mx: 'auto' }}>
          <MobilePaymentLayout
            orderData={orderData}
            availableMethods={availableMethods}
            selectedMethodId={selectedMethodId}
            onMethodSelect={handleMethodSelect}
            onBack={handleBack}
            onContinue={handleContinue}
            isProcessing={isProcessing}
            formatPrice={checkoutService.formatPrice}
            // Pasar número de orden seguro al layout móvil
            currentStep={
              currentStepOrder ? currentStepOrder() : currentStep?.order || 2
            }
            totalSteps={3}
          />
        </Box>
      ) : (
        /* Layout desktop existente */
        <>
          {/* Header */}
          <Box sx={{ mb: { xs: 2.5, md: 4 }, px: { xs: 2, md: 3 } }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={2}
              sx={{ mb: 3 }}
            >
              <Tooltip title="Volver" arrow>
                <IconButton onClick={handleBack} sx={{ p: 1 }}>
                  <ArrowBackIcon />
                </IconButton>
              </Tooltip>
              <CreditCardIcon
                sx={{
                  color: 'primary.main',
                  fontSize: { xs: 26, md: 32 },
                  mr: 1,
                }}
              />
              <Typography
                variant={'h4'}
                fontWeight="bold"
                sx={{
                  fontSize: { xs: '1.45rem', sm: '1.55rem', md: '2.125rem' },
                }}
              >
                <span style={{ color: '#2E52B2' }}>Método de Pago</span>
              </Typography>
            </Stack>

            {/* Stepper de progreso */}
            <Box
              sx={{
                maxWidth: {
                  xs: 340,
                  sm: 480,
                  md: '100%',
                  lg: '100%',
                  xl: '100%',
                },
                width: '100%',
                display: 'flex',
                justifyContent: 'flex-start',
              }}
            >
              <CheckoutProgressStepper
                currentStep={currentStep}
                completedSteps={completedSteps}
                orientation="horizontal"
                showLabels={true}
                isFinancingMode={isFinancingMode}
              />
            </Box>
          </Box>

          {/* Contenido principal */}
          <Box sx={{ px: { xs: 2, md: 3 }, pb: { xs: 10, md: 0 } }}>
            <Stack
              direction={{ xs: 'column', md: 'row', lg: 'row' }}
              spacing={{ xs: 3, md: 2, lg: 4 }}
            >
              {/* Panel izquierdo - Métodos de pago */}
              <Box
                sx={{
                  width: { xs: '100%' },
                  flexBasis: { xs: '100%', md: '65%', lg: '65%', xl: '65%' },
                  maxWidth: { xs: '100%', md: '65%', lg: '65%', xl: '65%' },
                }}
              >
                <motion.div variants={itemVariants}>
                  <Paper
                    elevation={3}
                    sx={{
                      p: { xs: 2, sm: 3, md: 4 },
                      borderRadius: { xs: 2, md: 3 },
                      background:
                        'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
                      border: '1px solid rgba(102, 126, 234, 0.1)',
                    }}
                  >
                    <Typography
                      variant="h5"
                      fontWeight="bold"
                      sx={{
                        mb: 3,
                        fontSize: {
                          xs: '1.15rem',
                          sm: '1.25rem',
                          md: '1.5rem',
                        },
                      }}
                    >
                      {isCompleted
                        ? '¡Pago Completado!'
                        : isFullyFinanced
                        ? 'Pago 100% Financiado'
                        : 'Selecciona tu método de pago'}
                    </Typography>

                    {/* Alerta cuando está 100% financiado */}
                    {isFullyFinanced && !isCompleted && (
                      <Alert severity="info" sx={{ mb: 3 }}>
                        <Typography variant="body1" fontWeight="bold">
                          Tu compra está 100% cubierta por financiamiento
                        </Typography>
                        <Typography variant="body2">
                          No necesitas seleccionar un método de pago. Puedes continuar directamente para finalizar tu pedido.
                        </Typography>
                      </Alert>
                    )}

                    {isCompleted && (
                      <Alert severity="success" sx={{ mb: 3 }}>
                        <Typography variant="body1" fontWeight="bold">
                          ¡Tu pago ha sido procesado exitosamente!
                        </Typography>
                        <Typography variant="body2">
                          Puedes ver el estado de tu pedido en la sección "Mis
                          Pedidos" o continuar comprando.
                        </Typography>
                      </Alert>
                    )}

                    {/* Métodos de pago disponibles */}
                    {!isFullyFinanced && (
                      <Stack spacing={2}>
                        <AnimatePresence>
                          {availableMethods.map(method => {
                            const isSelected = selectedMethodId === method.id;
                            const fees = getMethodFees(method.id, remainingToPay);
                            return (
                              <PaymentMethodCard
                                key={method.id}
                                method={method}
                                isSelected={isSelected}
                                onSelect={handleMethodSelect}
                                fees={fees}
                                formatPrice={checkoutService.formatPrice}
                                baseTotal={remainingToPay}
                              />
                            );
                          })}
                        </AnimatePresence>
                      </Stack>
                    )}

                    {/* Errores de validación */}
                    {Object.keys(validationErrors).length > 0 && (
                      <Alert severity="error" sx={{ mt: 3 }}>
                        {Object.values(validationErrors).join('. ')}
                      </Alert>
                    )}

                    {/* Error general */}
                    {error && (
                      <Alert severity="error" sx={{ mt: 3 }}>
                        {error}
                      </Alert>
                    )}
                  </Paper>
                </motion.div>
              </Box>

              {/* Panel derecho - Resumen */}
              <Box
                sx={{
                  width: { xs: '100%' },
                  flexBasis: { xs: '100%', md: '35%', lg: '35%', xl: '35%' },
                  maxWidth: { xs: '100%', md: '35%', lg: '35%', xl: '35%' },
                }}
              >
                <motion.div variants={itemVariants}>
                  <CheckoutSummary
                    orderData={orderData}
                    selectedMethod={selectedMethod}
                    onContinue={handleContinue}
                    onBack={handleBack}
                    isProcessing={isProcessing}
                    canContinue={
                      // Si está 100% financiado, puede continuar sin método de pago
                      isFullyFinanced ||
                      // Si hay monto a pagar, requiere método de pago seleccionado y válido
                      (!!selectedMethodId &&
                      !!selectedMethod &&
                      !isValidating &&
                      Object.keys(validationErrors).length === 0)
                    }
                    isCompleted={isCompleted}
                    onViewOrders={handleViewOrders}
                    onContinueShopping={handleContinueShopping}
                    variant={isFinancingMode ? 'financing' : 'default'}
                  />
                </motion.div>
              </Box>
            </Stack>
          </Box>
        </>
      )}
      
      {/* Modales de Transferencia Bancaria */}
      {selectedMethod?.id === 'bank_transfer' && selectedMethod.bankDetails && (
        <>
          <BankTransferModal
            open={showBankTransferModal}
            onClose={handleBankTransferModalClose}
            onConfirm={handleBankTransferModalConfirm}
            bankDetails={selectedMethod.bankDetails}
            amount={amountForBankModal}
          />
          
          <BankTransferConfirmModal
            open={showBankTransferConfirmModal}
            onClose={handleBankTransferConfirmClose}
            onBack={handleBankTransferConfirmBack}
            onConfirm={handleBankTransferConfirmFinal}
          />
        </>
      )}
    </motion.div>
  );
};

export default PaymentMethodSelector;
