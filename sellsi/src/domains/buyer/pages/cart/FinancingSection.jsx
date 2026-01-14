import React from 'react';
import {
  Paper,
  Typography,
  Button,
  Stack,
} from '@mui/material';
import { RequestQuote as RequestQuoteIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import ActiveFinancingsList from './components/ActiveFinancingsList';

const FinancingSection = ({
  onOpenFinancingModal,
  financingEnabled = false,
  cartItems = [], // Recibir items del carrito para filtrar financiamientos
}) => {
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
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={onOpenFinancingModal}
            startIcon={<RequestQuoteIcon sx={{ color: 'white' }} />}
            sx={{
              py: 1.5,
              borderRadius: 2,
              fontWeight: 'bold',
              textTransform: 'none',
              backgroundColor: '#2E52B2',
              '&:hover': {
                backgroundColor: '#1e3a7a',
              },
            }}
          >
            Pagar con Financiamiento
          </Button>
        </motion.div>

        {/* Lista de financiamientos activos */}
        <ActiveFinancingsList cartItems={cartItems} />
      </Stack>
    </Paper>
  );
};

export default FinancingSection;
