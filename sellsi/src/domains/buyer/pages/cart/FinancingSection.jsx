import React, { useMemo } from 'react';
import {
  Paper,
  Typography,
  Button,
  Stack,
  Tooltip,
} from '@mui/material';
import { RequestQuote as RequestQuoteIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import ActiveFinancingsList from './components/ActiveFinancingsList';

const FinancingSection = ({
  onOpenFinancingModal,
  financingEnabled = false,
  cartItems = [], // Recibir items del carrito para filtrar financiamientos
}) => {
  const [hasFinancings, setHasFinancings] = React.useState(false);
  const [isCheckingFinancings, setIsCheckingFinancings] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    const check = async () => {
      setIsCheckingFinancings(true);
      try {
        // ActiveFinancingsList performs the actual fetch and displays details; reuse its logic by importing service directly
        const finSvc = await import('../../../../workspaces/buyer/my-financing/services/financingService');
        const getAvailable = finSvc.getAvailableFinancingsForSupplier || (finSvc.default && finSvc.default.getAvailableFinancingsForSupplier);

        const supplierIds = Array.from(new Set(
          cartItems.map(item => item.supplier_id || item.supplierId).filter(Boolean)
        ));

        if (supplierIds.length === 0) {
          if (mounted) setHasFinancings(false);
          return;
        }

        for (const sid of supplierIds) {
          try {
            if (!getAvailable) continue;
            const list = await getAvailable(sid);
            if (Array.isArray(list) && list.filter(f => !f.paused).length > 0) {
              if (mounted) setHasFinancings(true);
              return;
            }
          } catch (e) {
            // ignore individual supplier errors
            console.error('[FinancingSection] error checking financings for supplier', sid, e);
          }
        }

        if (mounted) setHasFinancings(false);
      } catch (e) {
        console.error('[FinancingSection] failed to check financings', e);
        if (mounted) setHasFinancings(false);
      } finally {
        if (mounted) setIsCheckingFinancings(false);
      }
    };

    check();
    return () => { mounted = false; };
  }, [cartItems]);
  return (
    <Paper
      elevation={3}
      sx={{
        p: { xs: 2, sm: 2.25, md: 2, lg: 3, xl: 3 },
        borderRadius: 3,
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fff9 100%)',
        border: '1px solid rgba(46, 175, 80, 0.2)',
        position: { xs: 'static', md: 'sticky' },
        top: { md: 100 },
        width: '100%',
        maxWidth: {
          xs: '100%',
          sm: '100%',
          md: '100%',
          lg: '100%',
          xl: '100%',
        },
        boxShadow: { xs: 2, md: 3 },
      }}
    >
      <Stack spacing={2}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 'bold',
            fontSize: { xs: '1rem', sm: '1.05rem', md: '1.15rem' },
            color: 'text.primary',
          }}
        >
          Financiamiento
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: { xs: '0.85rem', md: '0.9rem' } }}
        >
          Configura cuánto de cada producto deseas pagar con financiamiento
        </Typography>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Tooltip title={isCheckingFinancings ? 'Comprobando financiamientos...' : (!hasFinancings ? 'No hay financiamientos disponibles' : 'Pagar con Financiamiento')}>
            <span>
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={onOpenFinancingModal}
                startIcon={<RequestQuoteIcon sx={{ color: 'white' }} />}
                disabled={isCheckingFinancings || !hasFinancings}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 'bold',
                  textTransform: 'none',
                  backgroundColor: '#2E52B2',
                  '&:hover': {
                    backgroundColor: '#1e3a7a',
                  },
                  '&:disabled': {
                    backgroundColor: 'grey.300',
                    color: 'text.secondary',
                  }
                }}
              >
                Pagar con Financiamiento
              </Button>
            </span>
          </Tooltip>
        </motion.div>

        {/* Lista de financiamientos activos */}
        <ActiveFinancingsList cartItems={cartItems} />
      </Stack>
    </Paper>
  );
};

export default FinancingSection;
