/**
 * ============================================================================
 * BUYER FINANCING PAGE - Página de Financiamiento para Compradores
 * ============================================================================
 * 
 * Página principal del módulo de financiamiento para compradores.
 * Muestra las solicitudes de financiamiento realizadas y su estado.
 * 
 * Estructura similar a Supplier para mantener consistencia visual.
 */

import React from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Typography, Container, ThemeProvider } from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import useMediaQuery from '@mui/material/useMediaQuery';
import { dashboardThemeCore } from '../../../../styles/dashboardThemeCore';
import { SPACING_BOTTOM_MAIN } from '../../../../styles/layoutSpacing';
import BuyerFinancingsList from '../components/BuyerFinancingsList';
// import { useBuyerFinancings } from '../hooks/useBuyerFinancings'; // TODO: Crear hook

// Mock data temporal hasta que se implemente el hook real
const useMockBuyerFinancings = () => {
  const financings = [
    // PASO 1: Revisión del Proveedor
    {
      id: 1,
      supplier_name: 'Proveedor ABC S.A.',
      amount: 5000000,
      term_days: 30,
      status: 'pending_supplier_review', // Buyer esperando respuesta del supplier
      created_at: '2024-01-10T10:00:00Z',
      request_type: 'express', // express | extended
      document_count: 3, // Mock: cantidad de documentos para testing
    },
      {
        id: 2,
        supplier_name: 'Distribuidora XYZ',
        amount: 3500000,
        term_days: 45,
        status: 'buyer_signature_pending', // Supplier aprobó, ahora buyer debe firmar
        created_at: '2024-01-09T15:30:00Z',
        request_type: 'express',
        document_count: 4,
      },
      {
        id: 3,
        supplier_name: 'Comercial DEF',
        amount: 2000000,
        term_days: 60,
        status: 'rejected_by_supplier', // Supplier rechazó
        rejection_reason: 'Monto solicitado excede el límite permitido para este cliente.',
        created_at: '2024-01-08T09:15:00Z',
        request_type: 'extended',
        document_count: 5,
      },
      {
        id: 4,
        supplier_name: 'Importadora Global',
        amount: 7500000,
        term_days: 90,
        status: 'cancelled_by_buyer', // Buyer canceló antes de que supplier revisara
        cancellation_reason: 'Ya no necesito el financiamiento por cambio en proyecto.',
        created_at: '2024-01-07T14:20:00Z',
        request_type: 'extended',
        document_count: 6,
      },

      // PASO 2: Firmas de ambas partes
      {
        id: 5,
        supplier_name: 'Tech Solutions SRL',
        amount: 4200000,
        term_days: 30,
        status: 'supplier_signature_pending', // Buyer firmó, esperando firma del supplier
        created_at: '2024-01-11T11:00:00Z',
        request_type: 'extended',
        document_count: 7,
      },
      {
        id: 6,
        supplier_name: 'Materiales del Sur',
        amount: 1800000,
        term_days: 45,
        status: 'cancelled_by_supplier', // Supplier canceló después de aprobar
        cancellation_reason: 'No podemos cumplir con los plazos acordados por problemas logísticos.',
        created_at: '2024-01-06T16:45:00Z',
        request_type: 'express',
        document_count: 3,
      },

      // PASO 3: Aprobación de Sellsi
      {
        id: 7,
        supplier_name: 'Electrónica Pro',
        amount: 3000000,
        term_days: 60,
        status: 'pending_sellsi_approval', // Ambos firmaron, esperando aprobación Sellsi
        created_at: '2024-01-12T08:30:00Z',
        request_type: 'express',
        document_count: 4,
      },

      // PASO 4: Resultado Final
      {
        id: 8,
        supplier_name: 'Papelería Moderna',
        amount: 6000000,
        term_days: 90,
        status: 'rejected_by_sellsi', // Sellsi rechazó el financiamiento
        rejection_reason: 'El análisis de riesgo crediticio no cumple con nuestros criterios actuales.',
        created_at: '2024-01-04T13:30:00Z',
      },

      // ============================================================================
      // FINANCIAMIENTOS APROBADOS - Casos de prueba exhaustivos
      // ============================================================================
      // Fecha actual: 2026-01-12
      
      // --- RANGO 1-7 DÍAS (threshold: 1 día antes) ---
      {
        id: 101,
        supplier_name: 'Comercio Rápido',
        amount: 500000,
        amount_used: 150000,
        term_days: 5,
        status: 'approved_by_sellsi',
        payment_status: 'pending', // pending | paid
        created_at: '2026-01-07T09:00:00Z',
        approved_at: '2026-01-09T10:00:00Z', // Aprobado hace 3 días, quedan 2 días → VERDE (2 > 1)
      },
      {
        id: 102,
        supplier_name: 'Express Insumos',
        amount: 800000,
        amount_used: 400000,
        term_days: 7,
        status: 'approved_by_sellsi',
        payment_status: 'pending',
        created_at: '2026-01-05T11:00:00Z',
        approved_at: '2026-01-06T14:00:00Z', // Aprobado hace 6 días, queda 1 día → NARANJA (1 <= 1)
      },
      {
        id: 103,
        supplier_name: 'Contado Plus',
        amount: 300000,
        amount_used: 300000,
        term_days: 3,
        status: 'approved_by_sellsi',
        payment_status: 'paid',
        created_at: '2025-12-20T08:00:00Z',
        approved_at: '2025-12-20T15:00:00Z', // Aprobado hace 23 días, plazo 3 días → ROJO (0 días, expirado)
      },

      // --- RANGO 8-15 DÍAS (threshold: 3 días antes) ---
      {
        id: 104,
        supplier_name: 'Quincenal Express',
        amount: 1200000,
        amount_used: 500000,
        term_days: 10,
        status: 'approved_by_sellsi',
        payment_status: 'pending',
        created_at: '2026-01-02T10:00:00Z',
        approved_at: '2026-01-03T11:00:00Z', // Aprobado hace 9 días, queda 1 día → NARANJA (1 <= 3)
      },
      {
        id: 105,
        supplier_name: 'Semanal Servicios',
        amount: 1500000,
        amount_used: 200000,
        term_days: 15,
        status: 'approved_by_sellsi',
        payment_status: 'paid',
        created_at: '2026-01-01T09:00:00Z',
        approved_at: '2026-01-01T16:00:00Z', // Aprobado hace 11 días, quedan 4 días → VERDE (4 > 3)
      },
      {
        id: 106,
        supplier_name: 'Ciclo Corto',
        amount: 900000,
        amount_used: 850000,
        term_days: 12,
        status: 'approved_by_sellsi',
        payment_status: 'paid',
        created_at: '2025-12-28T14:00:00Z',
        approved_at: '2025-12-29T10:00:00Z', // Aprobado hace 14 días, quedan -2 días → ROJO (0 días, expirado)
      },

      // --- RANGO 16-44 DÍAS (threshold: 7 días antes) ---
      {
        id: 107,
        supplier_name: 'Ferretería Central',
        amount: 2500000,
        amount_used: 1200000,
        term_days: 30,
        status: 'approved_by_sellsi',
        payment_status: 'pending',
        created_at: '2025-12-15T12:00:00Z',
        approved_at: '2025-12-16T10:00:00Z', // Aprobado hace 27 días, quedan 3 días → NARANJA (3 <= 7)
      },
      {
        id: 108,
        supplier_name: 'Mensual Distribuidora',
        amount: 3200000,
        amount_used: 0,
        term_days: 30,
        status: 'approved_by_sellsi',
        payment_status: 'pending',
        created_at: '2025-12-28T15:00:00Z',
        approved_at: '2025-12-28T17:00:00Z', // Aprobado hace 15 días, quedan 15 días → VERDE (15 > 7)
      },
      {
        id: 109,
        supplier_name: 'Estándar Comercio',
        amount: 1800000,
        amount_used: 900000,
        term_days: 40,
        status: 'approved_by_sellsi',
        payment_status: 'pending',
        created_at: '2026-01-05T08:00:00Z',
        approved_at: '2026-01-05T12:00:00Z', // Aprobado hace 7 días, quedan 33 días → VERDE (33 > 7)
      },
      {
        id: 110,
        supplier_name: 'Mensual Pro',
        amount: 2700000,
        amount_used: 2700000,
        term_days: 25,
        status: 'approved_by_sellsi',
        payment_status: 'paid',
        created_at: '2025-11-10T10:00:00Z',
        approved_at: '2025-11-10T14:00:00Z', // Aprobado hace 63 días, plazo 25 → ROJO (0 días, expirado)
      },

      // --- RANGO 45-60+ DÍAS (threshold: 10 días antes) ---
      {
        id: 111,
        supplier_name: 'Grandes Facturas SA',
        amount: 8500000,
        amount_used: 3200000,
        term_days: 60,
        status: 'approved_by_sellsi',
        payment_status: 'pending',
        created_at: '2025-11-15T09:00:00Z',
        approved_at: '2025-11-15T16:00:00Z', // Aprobado hace 58 días, quedan 2 días → NARANJA (2 <= 10)
      },
      {
        id: 112,
        supplier_name: 'Bimestral Solutions',
        amount: 5000000,
        amount_used: 1500000,
        term_days: 60,
        status: 'approved_by_sellsi',
        payment_status: 'paid',
        created_at: '2025-12-20T11:00:00Z',
        approved_at: '2025-12-20T15:00:00Z', // Aprobado hace 23 días, quedan 37 días → VERDE (37 > 10)
      },
      {
        id: 113,
        supplier_name: 'Trimestral Corp',
        amount: 12000000,
        amount_used: 6000000,
        term_days: 90,
        status: 'approved_by_sellsi',
        payment_status: 'pending',
        created_at: '2025-10-15T08:00:00Z',
        approved_at: '2025-10-15T12:00:00Z', // Aprobado hace 89 días, queda 1 día → NARANJA (1 <= 10)
      },
      {
        id: 114,
        supplier_name: 'Largo Plazo SRL',
        amount: 15000000,
        amount_used: 8000000,
        term_days: 90,
        status: 'approved_by_sellsi',
        payment_status: 'pending',
        created_at: '2025-12-01T10:00:00Z',
        approved_at: '2025-12-01T14:00:00Z', // Aprobado hace 42 días, quedan 48 días → VERDE (48 > 10)
      },
      {
        id: 115,
        supplier_name: 'Vencido Ejemplo',
        amount: 4000000,
        amount_used: 4000000,
        term_days: 45,
        status: 'approved_by_sellsi',
        payment_status: 'pending',
        created_at: '2025-09-01T09:00:00Z',
        approved_at: '2025-09-01T12:00:00Z', // Aprobado hace 133 días, plazo 45 → ROJO (0 días, expirado)
      },

      // --- CASOS LÍMITE ---
      {
        id: 116,
        supplier_name: 'Recién Aprobado',
        amount: 3500000,
        amount_used: 0,
        term_days: 30,
        status: 'approved_by_sellsi',
        payment_status: 'pending',
        created_at: '2026-01-12T08:00:00Z',
        approved_at: '2026-01-12T09:00:00Z', // Aprobado hace 0 días (hoy), quedan 30 días → VERDE (30 > 7)
      },
      {
        id: 117,
        supplier_name: 'Justo en Threshold',
        amount: 2200000,
        amount_used: 500000,
        term_days: 30,
        status: 'approved_by_sellsi',
        payment_status: 'paid',
        created_at: '2025-12-18T10:00:00Z',
        approved_at: '2025-12-18T14:00:00Z', // Aprobado hace 25 días, quedan 5 días → NARANJA (5 <= 7)
      },
    ];

  // Guardar financings en sessionStorage para que useFinancingCheckout pueda acceder
  React.useEffect(() => {
    sessionStorage.setItem('mock_financings', JSON.stringify(financings));
  }, []);

  return {
    financings,
    loading: false,
    initializing: false,
    cancelFinancing: async (id, reason) => {
      console.log('Cancelar financiamiento:', id, 'Motivo:', reason);
    },
    signFinancing: async (id) => {
      console.log('Firmar financiamiento:', id);
    },
    payOnline: async (financing) => {
      console.log('💳 Pagar en línea financiamiento:', financing.id);
      // TODO: Abrir modal de pago o redirigir a página de pago
    },
  };
};

const MyFinancing = () => {
  const isMobile = useMediaQuery(dashboardThemeCore.breakpoints.down('md'));
  const location = useLocation();
  
  // Determinar pestaña inicial desde el state de navegación
  const initialTab = location.state?.activeTab ?? 0;
  
  const {
    financings,
    loading,
    initializing,
    cancelFinancing,
    signFinancing,
    payOnline,
  } = useMockBuyerFinancings(); // TODO: Reemplazar con useBuyerFinancings()

  return (
    <ThemeProvider theme={dashboardThemeCore}>
      <Box
        sx={{
          backgroundColor: 'background.default',
          minHeight: '100vh',
          pt: { xs: 4.5, md: 5 },
          ml: { xs: 0, md: 10, lg: 14, xl: 24 },
          px: { xs: 0, md: 3 },
          pb: SPACING_BOTTOM_MAIN,
        }}
      >
        <Container
          maxWidth={false}
          disableGutters={isMobile}
          sx={{ width: '100%' }}
        >
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, px: { xs: 2, md: 0 } }}>
            <AccountBalanceIcon
              sx={{ color: 'primary.main', mr: 1, fontSize: 36 }}
            />
            <Typography
              variant="h4"
              fontWeight={600}
              color="primary.main"
              gutterBottom
            >
              Mis Financiamientos
            </Typography>
          </Box>

          {/* Lista de Financiamientos */}
          <BuyerFinancingsList
            financings={financings}
            loading={loading}
            initializing={initializing}
            onCancel={cancelFinancing}
            onSign={signFinancing}
            onPayOnline={payOnline}
            initialTab={initialTab}
          />
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default MyFinancing;
