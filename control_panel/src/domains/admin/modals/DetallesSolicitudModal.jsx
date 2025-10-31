/**
 * 👁️ Modal de Detalles de Solicitud
 * 
 * Modal que muestra información completa y detallada de una solicitud,
 * incluyendo historial, adjuntos y datos de contacto.
 * 
 * @author Panel Administrativo Sellsi
 * @date 30 de Junio de 2025
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Divider,
  Grid,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Paper
} from '@mui/material';
import {
  Visibility,
  ExpandMore,
  Person,
  Business,
  LocationOn,
  AttachMoney,
  CalendarToday,
  Receipt,
  History,
  AttachFile,
  Email,
  Phone,
  Download
} from '@mui/icons-material';

// Importar componentes UI existentes
import { PrimaryButton } from '../../../shared/components/forms';

// ✅ CONSTANTS
const ESTADOS_HISTORIA = {
  creado: { color: 'default', icon: '📝', label: 'Solicitud Creada' },
  pendiente: { color: 'warning', icon: '⏳', label: 'Pendiente de Revisión' },
  en_revision: { color: 'info', icon: '🔍', label: 'En Revisión' },
  confirmado: { color: 'success', icon: '✅', label: 'Pago Confirmado' },
  rechazado: { color: 'error', icon: '❌', label: 'Pago Rechazado' },
  devuelto: { color: 'info', icon: '↩️', label: 'Pago Devuelto' }
};

// ✅ COMMON STYLES
const commonStyles = {
  dialogPaper: {
    borderRadius: 3,
    maxWidth: 800
  },
  headerSection: {
    display: 'flex',
    alignItems: 'center',
    mb: 2
  },
  infoIcon: {
    color: '#2196f3',
    fontSize: 40,
    mr: 2
  },
  sectionCard: {
    p: 2,
    borderRadius: 2,
    backgroundColor: '#f8f9fa',
    mb: 2
  },
  estadoActual: {
    p: 2,
    borderRadius: 2,
    backgroundColor: '#e3f2fd',
    border: '1px solid #bbdefb',
    mb: 2,
    textAlign: 'center'
  },
  historialItem: {
    mb: 1,
    p: 1,
    borderRadius: 1,
    backgroundColor: '#fff',
    border: '1px solid #e0e0e0'
  },
  adjuntoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    p: 1,
    mb: 1,
    borderRadius: 1,
    backgroundColor: '#fff',
    border: '1px solid #e0e0e0'
  }
};

const DetallesSolicitudModal = ({ open, solicitud, onClose }) => {
  // ========================================
  // 🔧 ESTADO
  // ========================================
  
  const [historial, setHistorial] = useState([]);
  const [adjuntos, setAdjuntos] = useState([]);
  const [loading, setLoading] = useState(false);

  // ========================================
  // 🔧 EFECTOS
  // ========================================

  useEffect(() => {
    if (solicitud) {
      cargarDetallesAdicionales();
    }
  }, [solicitud]);

  // ========================================
  // 🔧 HANDLERS
  // ========================================

  const cargarDetallesAdicionales = async () => {
    setLoading(true);
    
    try {
      // TODO: Cargar historial real desde la base de datos
      // const historialResult = await getHistorialSolicitud(solicitud.id);
      
      // Mock data para desarrollo
      const historialMock = [
        {
          fecha: '2025-06-30T10:00:00Z',
          estado: 'creado',
          usuario: 'Sistema',
          descripcion: 'Solicitud creada por el comprador',
          detalles: 'Solicitud inicial procesada'
        },
        {
          fecha: '2025-06-30T10:30:00Z',
          estado: 'pendiente',
          usuario: 'Sistema',
          descripcion: 'Solicitud en cola de revisión',
          detalles: 'Asignada para revisión administrativa'
        },
        {
          fecha: '2025-06-30T11:00:00Z',
          estado: 'en_revision',
          usuario: 'admin_user',
          descripcion: 'Revisión iniciada por administrador',
          detalles: 'Documentos bajo verificación'
        }
      ];

      const adjuntosMock = [
        {
          nombre: 'comprobante_pago.pdf',
          tipo: 'application/pdf',
          tamaño: '2.5 MB',
          url: '#',
          fechaSubida: '2025-06-30T10:00:00Z'
        },
        {
          nombre: 'factura_proveedor.jpg',
          tipo: 'image/jpeg',
          tamaño: '1.8 MB',
          url: '#',
          fechaSubida: '2025-06-30T10:15:00Z'
        }
      ];

      setHistorial(historialMock);
      setAdjuntos(adjuntosMock);
    } catch (error) {
      console.error('Error cargando detalles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarAdjunto = (adjunto) => {
    // TODO: Implementar descarga real

    
    // Mock de descarga
    const link = document.createElement('a');
    link.href = adjunto.url;
    link.download = adjunto.nombre;
    link.click();
  };

  const handleClose = () => {
    setHistorial([]);
    setAdjuntos([]);
    onClose?.();
  };

  // ========================================
  // 🎨 RENDER FUNCTIONS
  // ========================================

  const renderEstadoActual = () => {
    const estado = ESTADOS_HISTORIA[solicitud?.estado] || ESTADOS_HISTORIA.pendiente;
    
    return (
      <Box sx={commonStyles.estadoActual}>
        <Typography variant="h6" gutterBottom>
          Estado Actual
        </Typography>
        <Chip
          label={estado.label}
          color={estado.color}
          size="large"
          sx={{ fontSize: '1rem', p: 2 }}
        />
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          Última actualización: {new Date(solicitud?.updated_at || solicitud?.created_at).toLocaleString('es-CL')}
        </Typography>
      </Box>
    );
  };

  const renderInformacionBasica = () => (
    <Accordion defaultExpanded>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Typography variant="h6">
          <Business sx={{ mr: 1, verticalAlign: 'middle' }} />
          Información Básica
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={commonStyles.sectionCard}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                Datos del Comprador
              </Typography>
              <Typography variant="body2"><strong>Nombre:</strong> {solicitud?.comprador}</Typography>
              <Typography variant="body2"><strong>Email:</strong> comprador@email.com</Typography>
              <Typography variant="body2"><strong>Teléfono:</strong> +56 9 1234 5678</Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={commonStyles.sectionCard}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                <Business sx={{ mr: 1, verticalAlign: 'middle' }} />
                Datos del Proveedor
              </Typography>
              <Typography variant="body2"><strong>Empresa:</strong> {solicitud?.proveedor}</Typography>
              <Typography variant="body2"><strong>Email:</strong> proveedor@empresa.com</Typography>
              <Typography variant="body2"><strong>Teléfono:</strong> +56 2 8765 4321</Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={commonStyles.sectionCard}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                <AttachMoney sx={{ mr: 1, verticalAlign: 'middle' }} />
                Información Financiera
              </Typography>
              <Typography variant="body2"><strong>Ticket:</strong> {solicitud?.ticket}</Typography>
              <Typography variant="body2"><strong>Monto Total:</strong> ${solicitud?.venta?.toLocaleString('es-CL')}</Typography>
              <Typography variant="body2"><strong>Moneda:</strong> CLP (Pesos Chilenos)</Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={commonStyles.sectionCard}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                <CalendarToday sx={{ mr: 1, verticalAlign: 'middle' }} />
                Fechas Importantes
              </Typography>
              <Typography variant="body2">
                <strong>Solicitada:</strong> {new Date(solicitud?.fecha_solicitada).toLocaleDateString('es-CL')}
              </Typography>
              <Typography variant="body2">
                <strong>Entrega:</strong> {solicitud?.fecha_entrega 
                  ? new Date(solicitud.fecha_entrega).toLocaleDateString('es-CL')
                  : 'No definida'
                }
              </Typography>
              <Typography variant="body2">
                <strong>Creación:</strong> {new Date(solicitud?.created_at).toLocaleDateString('es-CL')}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={commonStyles.sectionCard}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
                Dirección de Entrega
              </Typography>
              <Typography variant="body2">{solicitud?.direccion_entrega}</Typography>
            </Box>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );

  const renderHistorial = () => (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Typography variant="h6">
          <History sx={{ mr: 1, verticalAlign: 'middle' }} />
          Historial de Estados ({historial.length})
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        {loading ? (
          <Typography>Cargando historial...</Typography>
        ) : historial.length === 0 ? (
          <Typography color="textSecondary">No hay historial disponible</Typography>
        ) : (
          <List>
            {historial.map((item, index) => {
              const estadoInfo = ESTADOS_HISTORIA[item.estado] || ESTADOS_HISTORIA.pendiente;
              
              return (
                <ListItem key={index} sx={commonStyles.historialItem}>
                  <ListItemIcon>
                    <Box sx={{ fontSize: '1.5rem' }}>
                      {estadoInfo.icon}
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body1" component="span" sx={{ fontWeight: 'bold' }}>
                          {estadoInfo.label}
                        </Typography>
                        <Typography variant="body2" component="span" color="textSecondary">
                          {new Date(item.fecha).toLocaleString('es-CL')}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" component="div">
                          {item.descripcion}
                        </Typography>
                        {item.detalles && (
                          <Typography variant="body2" component="div" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                            {item.detalles}
                          </Typography>
                        )}
                        <Typography variant="caption" component="div" color="textSecondary">
                          Usuario: {item.usuario}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </AccordionDetails>
    </Accordion>
  );

  const renderAdjuntos = () => (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Typography variant="h6">
          <AttachFile sx={{ mr: 1, verticalAlign: 'middle' }} />
          Adjuntos y Comprobantes ({adjuntos.length})
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        {loading ? (
          <Typography>Cargando adjuntos...</Typography>
        ) : adjuntos.length === 0 ? (
          <Typography color="textSecondary">No hay adjuntos disponibles</Typography>
        ) : (
          <Box>
            {adjuntos.map((adjunto, index) => (
              <Box key={index} sx={commonStyles.adjuntoItem}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Receipt sx={{ mr: 2, color: '#2196f3' }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {adjunto.nombre}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {adjunto.tamaño} • Subido: {new Date(adjunto.fechaSubida).toLocaleDateString('es-CL')}
                    </Typography>
                  </Box>
                </Box>
                <Button
                  startIcon={<Download />}
                  onClick={() => handleDescargarAdjunto(adjunto)}
                  size="small"
                  variant="outlined"
                >
                  Descargar
                </Button>
              </Box>
            ))}
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );

  const renderAccionesRapidas = () => (
    <Paper sx={{ p: 2, mt: 2, backgroundColor: '#f5f5f5' }}>
      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
        Acciones Rápidas
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Email />}
            size="small"
          >
            Contactar Comprador
          </Button>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Business />}
            size="small"
          >
            Contactar Proveedor
          </Button>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Download />}
            size="small"
          >
            Exportar Detalles
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );

  // ========================================
  // 🎨 MAIN RENDER
  // ========================================

  if (!solicitud) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: commonStyles.dialogPaper }}
    >
      <DialogTitle>
        <Box sx={commonStyles.headerSection}>
          <Visibility sx={commonStyles.infoIcon} />
          <Box>
            <Typography variant="h5">
              Detalles de Solicitud
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Información completa de la solicitud {solicitud.ticket}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Estado Actual */}
        {renderEstadoActual()}

        <Divider sx={{ my: 2 }} />

        {/* Información Básica */}
        {renderInformacionBasica()}

        {/* Historial */}
        {renderHistorial()}

        {/* Adjuntos */}
        {renderAdjuntos()}

        {/* Acciones Rápidas */}
        {renderAccionesRapidas()}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <PrimaryButton
          onClick={handleClose}
          variant="outlined"
        >
          Cerrar
        </PrimaryButton>
      </DialogActions>
    </Dialog>
  );
};

export default DetallesSolicitudModal;
