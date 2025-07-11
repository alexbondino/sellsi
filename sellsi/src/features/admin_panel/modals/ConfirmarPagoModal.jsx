/**
 * ✅ Modal de Confirmación de Pago
 * 
 * Modal que permite a los administradores confirmar pagos,
 * subir comprobantes y enviar notificaciones a los compradores.
 * 
 * @author Panel Administrativo Sellsi
 * @date 30 de Junio de 2025
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Alert,
  Divider,
  Grid,
  Chip
} from '@mui/material';
import { CheckCircle, Receipt, Notifications } from '@mui/icons-material';

// Importar componentes UI existentes
import { PrimaryButton, FileUploader } from '../../ui';
import { confirmarPago, subirComprobante, enviarNotificacion } from '../../../services/adminPanelService';

// ✅ COMMON STYLES
const commonStyles = {
  dialogPaper: {
    borderRadius: 3,
    maxWidth: 600
  },
  headerSection: {
    display: 'flex',
    alignItems: 'center',
    mb: 2
  },
  infoCard: {
    p: 2,
    borderRadius: 2,
    backgroundColor: '#f8f9fa',
    mb: 2
  },
  successIcon: {
    color: '#4caf50',
    fontSize: 40,
    mr: 2
  },
  comprobantesSection: {
    mt: 2,
    p: 2,
    border: '2px dashed #ddd',
    borderRadius: 2,
    textAlign: 'center'
  }
};

const ConfirmarPagoModal = ({ open, solicitud, onClose, onSuccess }) => {
  // ========================================
  // 🔧 ESTADO
  // ========================================
  
  const [formData, setFormData] = useState({
    notificarComprador: true
  });
  const [comprobantes, setComprobantes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ========================================
  // 🔧 HANDLERS
  // ========================================

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleFileUpload = async (files) => {
    try {
      const nuevosComprobantes = [];
      
      for (const file of files) {
        const result = await subirComprobante(file, solicitud?.id);
        
        if (result.success) {
          nuevosComprobantes.push({
            name: file.name,
            url: result.url,
            size: file.size,
            type: file.type
          });
        } else {
          setError(`Error subiendo ${file.name}: ${result.error}`);
          return;
        }
      }
      
      setComprobantes(prev => [...prev, ...nuevosComprobantes]);
      setSuccess('Comprobantes subidos exitosamente');
    } catch (error) {
      console.error('Error subiendo comprobantes:', error);
      setError('Error subiendo comprobantes');
    }
  };

  const handleEliminarComprobante = (index) => {
    setComprobantes(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirmar = async () => {
    if (!solicitud) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Confirmar el pago
      const datos = {
        comprobantes_urls: comprobantes.map(c => c.url),
        fecha_confirmacion: new Date().toISOString()
      };

      const result = await confirmarPago(solicitud.id, datos);

      if (result.success) {
        // Enviar notificación al comprador si está habilitado
        if (formData.notificarComprador) {
          await enviarNotificacion(
            solicitud.comprador_email, // Esto debería venir de la solicitud
            'confirmado',
            {
              ticket: solicitud.ticket,
              proveedor: solicitud.proveedor,
              monto: solicitud.venta
            }
          );
        }

        setSuccess('Pago confirmado exitosamente');
        
        // Cerrar modal después de un delay
        setTimeout(() => {
          onSuccess?.();
          handleClose();
        }, 1500);
      } else {
        setError(result.error || 'Error confirmando el pago');
      }
    } catch (error) {
      console.error('Error en confirmación:', error);
      setError('Error interno del servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      notificarComprador: true
    });
    setComprobantes([]);
    setError('');
    setSuccess('');
    onClose?.();
  };

  // ========================================
  // 🎨 RENDER FUNCTIONS
  // ========================================

  const renderInfoSolicitud = () => (
    <Box sx={commonStyles.infoCard}>
      <Typography variant="h6" gutterBottom>
        Información de la Solicitud
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography variant="body2" color="textSecondary">Ticket:</Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {solicitud?.ticket}
          </Typography>
        </Grid>
        
        <Grid item xs={6}>
          <Typography variant="body2" color="textSecondary">Proveedor:</Typography>
          <Typography variant="body1">
            {solicitud?.proveedor}
          </Typography>
        </Grid>
        
        <Grid item xs={6}>
          <Typography variant="body2" color="textSecondary">Comprador:</Typography>
          <Typography variant="body1">
            {solicitud?.comprador}
          </Typography>
        </Grid>
        
        <Grid item xs={6}>
          <Typography variant="body2" color="textSecondary">Monto:</Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#2196f3' }}>
            ${solicitud?.venta?.toLocaleString('es-CL')}
          </Typography>
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="body2" color="textSecondary">Dirección de Entrega:</Typography>
          <Typography variant="body1">
            {solicitud?.direccion_entrega}
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );

  const renderComprobantes = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Comprobantes de Pago
      </Typography>
      
      <FileUploader
        onFileSelect={handleFileUpload}
        accept="image/*,.pdf"
        multiple
        maxSize={5}
        helperText="Sube comprobantes de pago (imágenes o PDF, máx. 5MB)"
      />
      
      {comprobantes.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Comprobantes subidos:
          </Typography>
          
          {comprobantes.map((comprobante, index) => (
            <Chip
              key={index}
              label={comprobante.name}
              onDelete={() => handleEliminarComprobante(index)}
              sx={{ m: 0.5 }}
              color="primary"
            />
          ))}
        </Box>
      )}
    </Box>
  );

  const renderFormulario = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <input
          type="checkbox"
          id="notificar-comprador"
          checked={formData.notificarComprador}
          onChange={(e) => handleInputChange('notificarComprador', e.target.checked)}
          style={{ marginRight: 8 }}
        />
        <label htmlFor="notificar-comprador">
          <Typography variant="body2">
            Notificar automáticamente al comprador por email
          </Typography>
        </label>
      </Box>
    </Box>
  );

  // ========================================
  // 🎨 MAIN RENDER
  // ========================================

  if (!solicitud) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: commonStyles.dialogPaper }}
    >
      <DialogTitle>
        <Box sx={commonStyles.headerSection}>
          <CheckCircle sx={commonStyles.successIcon} />
          <Box>
            <Typography variant="h5">
              Confirmar Pago
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Confirma el pago y notifica al comprador
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Alertas */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* Información de la solicitud */}
        {renderInfoSolicitud()}

        <Divider sx={{ my: 2 }} />

        {/* Subida de comprobantes */}
        {renderComprobantes()}

        <Divider sx={{ my: 2 }} />

        {/* Formulario */}
        {renderFormulario()}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <PrimaryButton
          variant="outlined"
          onClick={handleClose}
          disabled={loading}
        >
          Cancelar
        </PrimaryButton>
        
        <PrimaryButton
          onClick={handleConfirmar}
          loading={loading}
          disabled={!solicitud || success}
          startIcon={<CheckCircle />}
        >
          {loading ? 'Confirmando...' : 'Confirmar Pago'}
        </PrimaryButton>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmarPagoModal;
