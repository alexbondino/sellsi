/**
 * ❌ Modal de Rechazo de Pago
 * 
 * Modal que permite a los administradores rechazar pagos,
 * especificar motivos y adjuntar documentos explicativos.
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
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Cancel, Warning, AttachFile } from '@mui/icons-material';

// Importar componentes UI existentes
import { PrimaryButton, FileUploader } from '../../../shared/components/forms';
import { rechazarPago, subirAdjuntos, enviarNotificacion } from '../../../domains/admin';

// ✅ CONSTANTS
const MOTIVOS_RECHAZO = [
  { value: 'documentos_invalidos', label: 'Documentos inválidos o ilegibles' },
  { value: 'monto_incorrecto', label: 'Monto incorrecto' },
  { value: 'datos_incompletos', label: 'Datos incompletos' },
  { value: 'solicitud_duplicada', label: 'Solicitud duplicada' },
  { value: 'politicas_incumplidas', label: 'Incumplimiento de políticas' },
  { value: 'verificacion_fallida', label: 'Falla en verificación' },
  { value: 'otro', label: 'Otro motivo (especificar)' }
];

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
    backgroundColor: '#ffebee',
    mb: 2,
    border: '1px solid #ffcdd2'
  },
  errorIcon: {
    color: '#f44336',
    fontSize: 40,
    mr: 2
  },
  warningBox: {
    p: 2,
    borderRadius: 2,
    backgroundColor: '#fff3e0',
    border: '1px solid #ffcc02',
    mb: 2
  },
  adjuntosSection: {
    mt: 2,
    p: 2,
    border: '2px dashed #ddd',
    borderRadius: 2,
    textAlign: 'center'
  }
};

const RechazarPagoModal = ({ open, solicitud, onClose, onSuccess }) => {
  // ========================================
  // 🔧 ESTADO
  // ========================================
  
  const [formData, setFormData] = useState({
    motivo: '',
    motivoPersonalizado: '',
    detalles: '',
    notificarComprador: true
  });
  const [adjuntos, setAdjuntos] = useState([]);
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
      const result = await subirAdjuntos(files, solicitud?.id);
      
      if (result.success) {
        const nuevosAdjuntos = Array.from(files).map((file, index) => ({
          name: file.name,
          url: result.urls[index],
          size: file.size,
          type: file.type
        }));
        
        setAdjuntos(prev => [...prev, ...nuevosAdjuntos]);
        setSuccess('Adjuntos subidos exitosamente');
      } else {
        setError(`Error subiendo adjuntos: ${result.error}`);
      }
    } catch (error) {
      console.error('Error subiendo adjuntos:', error);
      setError('Error subiendo adjuntos');
    }
  };

  const handleEliminarAdjunto = (index) => {
    setAdjuntos(prev => prev.filter((_, i) => i !== index));
  };

  const handleRechazar = async () => {
    if (!solicitud) return;

    // Validaciones
    if (!formData.motivo) {
      setError('Debe seleccionar un motivo de rechazo');
      return;
    }

    if (formData.motivo === 'otro' && !formData.motivoPersonalizado) {
      setError('Debe especificar el motivo personalizado');
      return;
    }

    if (!formData.detalles) {
      setError('Debe proporcionar detalles del rechazo');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Obtener adminId desde localStorage
      const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
      if (!adminUser.id) {
        setError('Sesión administrativa expirada. Por favor, inicie sesión nuevamente.');
        setLoading(false);
        return;
      }

      // Rechazar el pago
      const motivoFinal = formData.motivo === 'otro' 
        ? formData.motivoPersonalizado 
        : MOTIVOS_RECHAZO.find(m => m.value === formData.motivo)?.label;

      const datos = {
        motivo: motivoFinal,
        detalles: formData.detalles,
        adjuntos_urls: adjuntos.map(a => a.url),
        fecha_rechazo: new Date().toISOString()
      };

      const result = await rechazarPago(solicitud.id, datos, adminUser.id);

      if (result.success) {
        // Enviar notificación al comprador si está habilitado
        if (formData.notificarComprador) {
          await enviarNotificacion(
            solicitud.comprador_email, // Esto debería venir de la solicitud
            'rechazado',
            {
              ticket: solicitud.ticket,
              proveedor: solicitud.proveedor,
              motivo: motivoFinal,
              detalles: formData.detalles
            }
          );
        }

        setSuccess('Pago rechazado exitosamente');
        
        // Cerrar modal después de un delay
        setTimeout(() => {
          onSuccess?.();
          handleClose();
        }, 1500);
      } else {
        setError(result.error || 'Error rechazando el pago');
      }
    } catch (error) {
      console.error('Error en rechazo:', error);
      setError('Error interno del servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      motivo: '',
      motivoPersonalizado: '',
      detalles: '',
      notificarComprador: true
    });
    setAdjuntos([]);
    setError('');
    setSuccess('');
    onClose?.();
  };

  // ========================================
  // 🎨 RENDER FUNCTIONS
  // ========================================

  const renderInfoSolicitud = () => (
    <Box sx={commonStyles.infoCard}>
      <Typography variant="h6" gutterBottom sx={{ color: '#d32f2f' }}>
        Solicitud a Rechazar
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
          <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
            ${solicitud?.venta?.toLocaleString('es-CL')}
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );

  const renderAdvertencia = () => (
    <Box sx={commonStyles.warningBox}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Warning sx={{ color: '#ff9800', mr: 1 }} />
        <Typography variant="h6" sx={{ color: '#e65100' }}>
          Advertencia
        </Typography>
      </Box>
      <Typography variant="body2" color="textSecondary">
        El rechazo de esta solicitud es una acción definitiva. El comprador será 
        notificado automáticamente y deberá corregir los problemas identificados 
        para reenviar su solicitud.
      </Typography>
    </Box>
  );

  const renderFormulario = () => (
    <Box>
      {/* Motivo de rechazo */}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Motivo de Rechazo *</InputLabel>
        <Select
          value={formData.motivo}
          onChange={(e) => handleInputChange('motivo', e.target.value)}
          label="Motivo de Rechazo *"
        >
          {MOTIVOS_RECHAZO.map(motivo => (
            <MenuItem key={motivo.value} value={motivo.value}>
              {motivo.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Motivo personalizado */}
      {formData.motivo === 'otro' && (
        <TextField
          fullWidth
          label="Especificar Motivo *"
          value={formData.motivoPersonalizado}
          onChange={(e) => handleInputChange('motivoPersonalizado', e.target.value)}
          placeholder="Describe el motivo específico del rechazo..."
          sx={{ mb: 2 }}
        />
      )}

      {/* Detalles del rechazo */}
      <TextField
        fullWidth
        multiline
        rows={4}
        label="Detalles del Rechazo *"
        value={formData.detalles}
        onChange={(e) => handleInputChange('detalles', e.target.value)}
        placeholder="Proporciona detalles específicos que ayuden al comprador a entender y corregir el problema..."
        sx={{ mb: 2 }}
        required
      />
      
      {/* Checkbox notificación */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <input
          type="checkbox"
          id="notificar-comprador-rechazo"
          checked={formData.notificarComprador}
          onChange={(e) => handleInputChange('notificarComprador', e.target.checked)}
          style={{ marginRight: 8 }}
        />
        <label htmlFor="notificar-comprador-rechazo">
          <Typography variant="body2">
            Notificar automáticamente al comprador por email
          </Typography>
        </label>
      </Box>
    </Box>
  );

  const renderAdjuntos = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Adjuntos Explicativos (Opcional)
      </Typography>
      
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Puedes adjuntar documentos que ayuden a explicar el motivo del rechazo
      </Typography>
      
      <FileUploader
        onFileSelect={handleFileUpload}
        accept="image/*,.pdf,.doc,.docx"
        multiple
        maxSize={5}
        helperText="Sube documentos explicativos (imágenes, PDF, DOC, máx. 5MB)"
      />
      
      {adjuntos.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Adjuntos subidos:
          </Typography>
          
          {adjuntos.map((adjunto, index) => (
            <Chip
              key={index}
              label={adjunto.name}
              onDelete={() => handleEliminarAdjunto(index)}
              sx={{ m: 0.5 }}
              color="secondary"
              icon={<AttachFile />}
            />
          ))}
        </Box>
      )}
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
          <Cancel sx={commonStyles.errorIcon} />
          <Box>
            <Typography variant="h5">
              Rechazar Pago
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Especifica el motivo del rechazo y notifica al comprador
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

        {/* Advertencia */}
        {renderAdvertencia()}

        <Divider sx={{ my: 2 }} />

        {/* Formulario */}
        {renderFormulario()}

        <Divider sx={{ my: 2 }} />

        {/* Adjuntos */}
        {renderAdjuntos()}
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
          onClick={handleRechazar}
          loading={loading}
          disabled={!solicitud || success || !formData.motivo || !formData.detalles}
          startIcon={<Cancel />}
          sx={{ backgroundColor: '#d32f2f', '&:hover': { backgroundColor: '#b71c1c' } }}
        >
          {loading ? 'Rechazando...' : 'Rechazar Pago'}
        </PrimaryButton>
      </DialogActions>
    </Dialog>
  );
};

export default RechazarPagoModal;
