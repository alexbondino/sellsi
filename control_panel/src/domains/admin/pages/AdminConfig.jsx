// ============================================================================
// ADMIN CONFIG - PÁGINA DE CONFIGURACIÓN DEL SISTEMA
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  ArrowBack as ArrowBackIcon,
  Payment as PaymentIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../services/supabase';

const AdminConfig = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState({
    khipu: false,
    flow: true,
    bank_transfer: true,
  });

  // Cargar configuración desde Supabase
  useEffect(() => {
    loadPaymentMethodsConfig();
  }, []);

  const loadPaymentMethodsConfig = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payment_methods_config')
        .select('*')
        .single();

      if (error) {
        // Si no existe configuración, crear una por defecto
        if (error.code === 'PGRST116') {
          await createDefaultConfig();
        } else {
          throw error;
        }
      } else {
        setPaymentMethods({
          khipu: data.khipu_enabled,
          flow: data.flow_enabled,
          bank_transfer: data.bank_transfer_enabled,
        });
      }
    } catch (error) {
      console.error('Error loading payment methods config:', error);
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultConfig = async () => {
    try {
      const { error } = await supabase
        .from('payment_methods_config')
        .insert({
          khipu_enabled: false,
          flow_enabled: true,
          bank_transfer_enabled: true,
        });

      if (error) throw error;

      setPaymentMethods({
        khipu: false,
        flow: true,
        bank_transfer: true,
      });
    } catch (error) {
      console.error('Error creating default config:', error);
      throw error;
    }
  };

  const handleToggle = async (method) => {
    const newValue = !paymentMethods[method];
    
    // Validar que al menos un método esté habilitado
    const otherMethods = Object.keys(paymentMethods).filter(m => m !== method);
    const atLeastOneEnabled = otherMethods.some(m => paymentMethods[m]) || newValue;
    
    if (!atLeastOneEnabled) {
      toast.error('Debe haber al menos un método de pago habilitado');
      return;
    }

    // Guardar en base de datos primero
    try {
      setSaving(true);
      
      // Construir objeto de actualización con el nuevo valor
      const updateData = {
        khipu_enabled: method === 'khipu' ? newValue : paymentMethods.khipu,
        flow_enabled: method === 'flow' ? newValue : paymentMethods.flow,
        bank_transfer_enabled: method === 'bank_transfer' ? newValue : paymentMethods.bank_transfer,
      };
      
      const { error } = await supabase
        .from('payment_methods_config')
        .update(updateData)
        .eq('id', 1);

      if (error) throw error;

      // Solo actualizar estado local si el save fue exitoso
      setPaymentMethods(prev => ({
        ...prev,
        [method]: newValue,
      }));

      toast.success(`${getMethodLabel(method)} ${newValue ? 'habilitado' : 'deshabilitado'}`);
    } catch (error) {
      console.error('Error updating payment method:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const getMethodLabel = (method) => {
    const labels = {
      khipu: 'Khipu',
      flow: 'Flow',
      bank_transfer: 'Transferencia Manual',
    };
    return labels[method] || method;
  };

  const getMethodInfo = (method) => {
    const info = {
      khipu: 'Transferencia bancaria instantánea. Comisión: $500 fijo',
      flow: 'Tarjeta de crédito/débito. Comisión: 3.8%',
      bank_transfer: 'Transferencia manual con verificación. Comisión: 0.5%',
    };
    return info[method] || '';
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <IconButton onClick={() => navigate('/admin-panel')} size="large">
            <ArrowBackIcon />
          </IconButton>
          <SettingsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Configuración del Sistema
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Administra los ajustes generales de la plataforma
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Payment Methods Section */}
      <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PaymentIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Métodos de Pago
            </Typography>
          </Box>

          <Alert severity="info" icon={<InfoIcon />}>
            Habilita o deshabilita los métodos de pago disponibles para los compradores.
            Los cambios se aplican inmediatamente en todo el sistema.
          </Alert>

          <Divider />

          {/* Khipu */}
          <Box sx={{ 
            p: 2, 
            borderRadius: 2, 
            backgroundColor: paymentMethods.khipu ? 'success.lighter' : 'grey.50',
            border: '1px solid',
            borderColor: paymentMethods.khipu ? 'success.main' : 'grey.300',
            transition: 'all 0.3s ease',
          }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Khipu
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {getMethodInfo('khipu')}
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={paymentMethods.khipu}
                    onChange={() => handleToggle('khipu')}
                    disabled={saving}
                    color="success"
                  />
                }
                label={paymentMethods.khipu ? 'Habilitado' : 'Deshabilitado'}
              />
            </Stack>
          </Box>

          {/* Flow */}
          <Box sx={{ 
            p: 2, 
            borderRadius: 2, 
            backgroundColor: paymentMethods.flow ? 'success.lighter' : 'grey.50',
            border: '1px solid',
            borderColor: paymentMethods.flow ? 'success.main' : 'grey.300',
            transition: 'all 0.3s ease',
          }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Flow
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {getMethodInfo('flow')}
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={paymentMethods.flow}
                    onChange={() => handleToggle('flow')}
                    disabled={saving}
                    color="success"
                  />
                }
                label={paymentMethods.flow ? 'Habilitado' : 'Deshabilitado'}
              />
            </Stack>
          </Box>

          {/* Bank Transfer */}
          <Box sx={{ 
            p: 2, 
            borderRadius: 2, 
            backgroundColor: paymentMethods.bank_transfer ? 'success.lighter' : 'grey.50',
            border: '1px solid',
            borderColor: paymentMethods.bank_transfer ? 'success.main' : 'grey.300',
            transition: 'all 0.3s ease',
          }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Transferencia Manual
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {getMethodInfo('bank_transfer')}
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={paymentMethods.bank_transfer}
                    onChange={() => handleToggle('bank_transfer')}
                    disabled={saving}
                    color="success"
                  />
                }
                label={paymentMethods.bank_transfer ? 'Habilitado' : 'Deshabilitado'}
              />
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
};

export default AdminConfig;
