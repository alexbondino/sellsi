/**
 * ↩️ Modal de Devolución de Pago
 * 
 * Modal que permite a los administradores procesar devoluciones,
 * subir comprobantes de devolución y notificar a los compradores.
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
  MenuItem,
  InputAdornment
} from '@mui/material';
import { Undo, AccountBalance, Receipt } from '@mui/icons-material';

// Importar componentes UI existentes
import { PrimaryButton, FileUploader } from '../../ui';
import { devolverPago, subirComprobante, enviarNotificacion } from '../../../services/adminPanelService';

// ✅ CONSTANTS
const METODOS_DEVOLUCION = [
  { value: 'transferencia', label: 'Transferencia Bancaria' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta_credito', label: 'Reversa Tarjeta de Crédito' },
  { value: 'billetera_digital', label: 'Billetera Digital' },
  { value: 'otro', label: 'Otro método' }
];

const MOTIVOS_DEVOLUCION = [
  { value: 'producto_no_entregado', label: 'Producto no entregado' },
  { value: 'producto_defectuoso', label: 'Producto defectuoso' },
  { value: 'solicitud_comprador', label: 'Solicitud del comprador' },
  { value: 'error_administrativo', label: 'Error administrativo' },
  { value: 'cancelacion_proveedor', label: 'Cancelación del proveedor' },
  { value: 'otro', label: 'Otro motivo' }
];

// ✅ COMMON STYLES
const commonStyles = {
  dialogPaper: {
    borderRadius: 3,
    maxWidth: 700
  },
  headerSection: {
    display: 'flex',
    alignItems: 'center',
    mb: 2
  },
  infoCard: {
    p: 2,
    borderRadius: 2,
    backgroundColor: '#e3f2fd',
    mb: 2,
    border: '1px solid #bbdefb'
  },
  infoIcon: {
    color: '#2196f3',
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
  comprobanteSection: {
    mt: 2,
    p: 2,
    border: '2px dashed #ddd',
    borderRadius: 2,
    textAlign: 'center'
  },
  montoSection: {
    p: 2,
    borderRadius: 2,
    backgroundColor: '#f1f8e9',
    border: '1px solid #c8e6c9',
    mb: 2
  }
};

const DevolverPagoModal = ({ open, solicitud, onClose, onSuccess }) => {
  // ========================================
  // 🔧 ESTADO
  // ========================================
  
  const [formData, setFormData] = useState({
    motivo: '',
    motivoPersonalizado: '',
    metodoDevolucion: '',
    montoDevolucion: '',
    detallesDevolucion: '',
    notificarComprador: true
  });
  const [comprobantesDevolucion, setComprobantesDevolucion] = useState([]);
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

  const handleMontoChange = (value) => {
    // Validar que sea un número y no exceda el monto original
    const numericValue = value.replace(/[^0-9]/g, '');
    const montoOriginal = solicitud?.venta || 0;
    
    if (parseInt(numericValue) <= montoOriginal) {
      handleInputChange('montoDevolucion', numericValue);
    }
  };

  const handleFileUpload = async (files) => {
    try {
      const nuevosComprobantes = [];
      
      for (const file of files) {
        const result = await subirComprobante(file, `${solicitud?.id}_devolucion`);
        
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
      
      setComprobantesDevolucion(prev => [...prev, ...nuevosComprobantes]);
      setSuccess('Comprobantes de devolución subidos exitosamente');
    } catch (error) {
      console.error('Error subiendo comprobantes:', error);
      setError('Error subiendo comprobantes de devolución');
    }
  };

  const handleEliminarComprobante = (index) => {
    setComprobantesDevolucion(prev => prev.filter((_, i) => i !== index));
  };

  const handleDevolver = async () => {
    if (!solicitud) return;

    // Validaciones
    if (!formData.motivo) {
      setError('Debe seleccionar un motivo de devolución');
      return;
    }

    if (formData.motivo === 'otro' && !formData.motivoPersonalizado) {
      setError('Debe especificar el motivo personalizado');
      return;
    }

    if (!formData.metodoDevolucion) {
      setError('Debe seleccionar un método de devolución');
      return;
    }

    if (!formData.montoDevolucion) {
      setError('Debe especificar el monto a devolver');
      return;
    }

    if (parseInt(formData.montoDevolucion) <= 0) {
      setError('El monto a devolver debe ser mayor a 0');
      return;
    }

    if (!formData.detallesDevolucion) {
      setError('Debe proporcionar detalles de la devolución');
      return;
    }

    if (comprobantesDevolucion.length === 0) {
      setError('Debe subir al menos un comprobante de devolución');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Procesar la devolución
      const motivoFinal = formData.motivo === 'otro' 
        ? formData.motivoPersonalizado 
        : MOTIVOS_DEVOLUCION.find(m => m.value === formData.motivo)?.label;

      const metodoFinal = METODOS_DEVOLUCION.find(m => m.value === formData.metodoDevolucion)?.label;

      const datos = {
        motivo: motivoFinal,
        metodo_devolucion: metodoFinal,
        monto_devolucion: parseInt(formData.montoDevolucion),
        detalles: formData.detallesDevolucion,
        comprobantes_devolucion_urls: comprobantesDevolucion.map(c => c.url),
        fecha_devolucion: new Date().toISOString()
      };

      const result = await devolverPago(solicitud.id, datos);

      if (result.success) {
        // Enviar notificación al comprador si está habilitado
        if (formData.notificarComprador) {
          await enviarNotificacion(
            solicitud.comprador_email, // Esto debería venir de la solicitud
            'devuelto',
            {
              ticket: solicitud.ticket,
              proveedor: solicitud.proveedor,
              monto_original: solicitud.venta,
              monto_devuelto: parseInt(formData.montoDevolucion),
              metodo: metodoFinal,
              motivo: motivoFinal
            }
          );
        }

        setSuccess('Devolución procesada exitosamente');
        
        // Cerrar modal después de un delay
        setTimeout(() => {
          onSuccess?.();
          handleClose();
        }, 1500);
      } else {
        setError(result.error || 'Error procesando la devolución');
      }
    } catch (error) {
      console.error('Error en devolución:', error);
      setError('Error interno del servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      motivo: '',
      motivoPersonalizado: '',
      metodoDevolucion: '',
      montoDevolucion: '',
      detallesDevolucion: '',
      notificarComprador: true
    });
    setComprobantesDevolucion([]);
    setError('');
    setSuccess('');
    onClose?.();
  };

  // ========================================
  // 🎨 RENDER FUNCTIONS
  // ========================================

  const renderInfoSolicitud = () => (
    <Box sx={commonStyles.infoCard}>
      <Typography variant="h6" gutterBottom sx={{ color: '#1976d2' }}>
        Solicitud para Devolución
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
          <Typography variant="body2" color="textSecondary">Monto Original:</Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
            ${solicitud?.venta?.toLocaleString('es-CL')}
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );

  const renderMontoDevolucion = () => (
    <Box sx={commonStyles.montoSection}>
      <Typography variant="h6" gutterBottom>
        Monto a Devolver
      </Typography>
      
      <TextField
        fullWidth
        label="Monto de Devolución"
        value={formData.montoDevolucion}
        onChange={(e) => handleMontoChange(e.target.value)}
        placeholder="0"
        InputProps={{
          startAdornment: <InputAdornment position="start">$</InputAdornment>,
        }}
        helperText={`Máximo: $${solicitud?.venta?.toLocaleString('es-CL')}`}
        sx={{ mb: 2 }}
      />
      
      {formData.montoDevolucion && (
        <Typography variant="body2" color="textSecondary">
          Monto formateado: ${parseInt(formData.montoDevolucion)?.toLocaleString('es-CL')}
        </Typography>
      )}
    </Box>
  );

  const renderFormulario = () => (
    <Box>
      {/* Motivo de devolución */}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Motivo de Devolución *</InputLabel>
        <Select
          value={formData.motivo}
          onChange={(e) => handleInputChange('motivo', e.target.value)}
          label="Motivo de Devolución *"
        >
          {MOTIVOS_DEVOLUCION.map(motivo => (
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
          placeholder="Describe el motivo específico de la devolución..."
          sx={{ mb: 2 }}
        />
      )}

      {/* Método de devolución */}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Método de Devolución *</InputLabel>
        <Select
          value={formData.metodoDevolucion}
          onChange={(e) => handleInputChange('metodoDevolucion', e.target.value)}
          label="Método de Devolución *"
        >
          {METODOS_DEVOLUCION.map(metodo => (
            <MenuItem key={metodo.value} value={metodo.value}>
              {metodo.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Detalles de la devolución */}
      <TextField
        fullWidth
        multiline
        rows={4}
        label="Detalles de la Devolución *"
        value={formData.detallesDevolucion}
        onChange={(e) => handleInputChange('detallesDevolucion', e.target.value)}
        placeholder="Proporciona detalles sobre el proceso de devolución, tiempos estimados, etc..."
        sx={{ mb: 2 }}
        required
      />
      
      {/* Checkbox notificación */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <input
          type="checkbox"
          id="notificar-comprador-devolucion"
          checked={formData.notificarComprador}
          onChange={(e) => handleInputChange('notificarComprador', e.target.checked)}
          style={{ marginRight: 8 }}
        />
        <label htmlFor="notificar-comprador-devolucion">
          <Typography variant="body2">
            Notificar automáticamente al comprador por email
          </Typography>
        </label>
      </Box>
    </Box>
  );

  const renderComprobantes = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Comprobantes de Devolución *
      </Typography>
      
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Sube comprobantes que documenten la devolución (transferencias, cheques, etc.)
      </Typography>
      
      <FileUploader
        onFileSelect={handleFileUpload}
        accept="image/*,.pdf"
        multiple
        maxSize={5}
        helperText="Sube comprobantes de devolución (imágenes o PDF, máx. 5MB)"
      />
      
      {comprobantesDevolucion.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Comprobantes subidos:
          </Typography>
          
          {comprobantesDevolucion.map((comprobante, index) => (
            <Chip
              key={index}
              label={comprobante.name}
              onDelete={() => handleEliminarComprobante(index)}
              sx={{ m: 0.5 }}
              color="primary"
              icon={<Receipt />}
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
          <Undo sx={commonStyles.infoIcon} />
          <Box>
            <Typography variant="h5">
              Devolver Pago
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Procesa la devolución y notifica al comprador
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

        {/* Monto de devolución */}
        {renderMontoDevolucion()}

        <Divider sx={{ my: 2 }} />

        {/* Formulario */}
        {renderFormulario()}

        <Divider sx={{ my: 2 }} />

        {/* Comprobantes */}
        {renderComprobantes()}
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
          onClick={handleDevolver}
          loading={loading}
          disabled={!solicitud || success || !formData.motivo || !formData.metodoDevolucion || 
                   !formData.montoDevolucion || !formData.detallesDevolucion || 
                   comprobantesDevolucion.length === 0}
          startIcon={<Undo />}
          sx={{ backgroundColor: '#2196f3', '&:hover': { backgroundColor: '#1976d2' } }}
        >
          {loading ? 'Procesando...' : 'Procesar Devolución'}
        </PrimaryButton>
      </DialogActions>
    </Dialog>
  );
};

export default DevolverPagoModal;
