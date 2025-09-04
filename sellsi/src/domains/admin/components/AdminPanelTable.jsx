/**
 * 📋 Tabla Principal del Panel Administrativo
 * 
 * Componente que muestra todas las solicitudes de pagos y permite
 * a los administradores gestionarlas (confirmar, rechazar, devolver).
 * Reutiliza componentes UI existentes para mantener consistencia.
 * 
 * @author Panel Administrativo Sellsi
 * @date 30 de Junio de 2025
 */

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Alert,
  Fab
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Undo,
  Visibility,
  FileDownload,
  Refresh,
  FilterList,
  Add,
  Assessment as AssessmentIcon,
  Schedule as ScheduleIcon,
  Done as DoneIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

// Importar componentes UI existentes
import { Widget } from '../../../shared/components/layout';
import AdminStatCard from './AdminStatCard';
// Refactor anti-ciclos: importar servicios directamente
import { getSolicitudes } from '../services/adminRequestService';
import { getEstadisticas } from '../services';

// Importar modales
import ConfirmarPagoModal from '../modals/ConfirmarPagoModal';
import RechazarPagoModal from '../modals/RechazarPagoModal';
import DevolverPagoModal from '../modals/DevolverPagoModal';
import DetallesSolicitudModal from '../modals/DetallesSolicitudModal';

// ✅ CONSTANTS
const ESTADOS = {
  pendiente: { color: 'warning', icon: '⏳', label: 'Pendiente' },
  confirmado: { color: 'success', icon: '✅', label: 'Confirmado' },
  rechazado: { color: 'error', icon: '❌', label: 'Rechazado' },
  devuelto: { color: 'info', icon: '↩️', label: 'Devuelto' },
  en_proceso: { color: 'primary', icon: '🔄', label: 'En Proceso' }
};

const FILTROS_ESTADO = [
  { value: 'todos', label: 'Todos los Estados' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'confirmado', label: 'Confirmados' },
  { value: 'rechazado', label: 'Rechazados' },
  { value: 'devuelto', label: 'Devueltos' }
];

// ✅ COMMON STYLES
const commonStyles = {
  container: {
    p: 3
  },
  headerSection: {
    mb: 4
  },
  filtersSection: {
    mb: 3,
    p: 2,
    borderRadius: 2,
    backgroundColor: '#f8f9fa'
  },
  tableContainer: {
    mb: 3
  },
  tableHeader: {
    backgroundColor: '#1976d2',
    color: 'white',
    fontWeight: 'bold'
  },
  tableRow: {
    '&:hover': {
      backgroundColor: '#f5f5f5'
    }
  },
  actionButton: {
    m: 0.5,
    minWidth: 'auto'
  },
  estadoChip: {
    fontWeight: 'bold',
    minWidth: 100
  },
  refreshFab: {
    position: 'fixed',
    bottom: 16,
    right: 16
  }
};

// ✅ ADMIN PANEL TABLE COMPONENT
const MemoAdminStatCard = memo(AdminStatCard);
const AdminPanelTable = () => {
  // ========================================
  // 🔧 ESTADO
  // ========================================
  
  const [solicitudes, setSolicitudes] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtros
  const [filtros, setFiltros] = useState({
    estado: 'todos',
    proveedor: '',
    comprador: '',
    fechaDesde: '',
    fechaHasta: ''
  });

  // Modales
  const [modales, setModales] = useState({
    confirmar: { open: false, solicitud: null },
    rechazar: { open: false, solicitud: null },
    devolver: { open: false, solicitud: null },
    detalles: { open: false, solicitud: null }
  });

  // ========================================
  // 🔧 EFECTOS
  // ========================================

  useEffect(() => {
    cargarDatos();
  }, [filtros]);

  // ========================================
  // 🔧 HANDLERS
  // ========================================

  const cargarDatos = async () => {
    setLoading(true);
    setError('');

    try {
      // Cargar solicitudes con filtros
      const filtrosActivos = Object.fromEntries(
        Object.entries(filtros).filter(([_, value]) => value && value !== 'todos')
      );

      const [solicitudesResult, estadisticasResult] = await Promise.all([
        getSolicitudes(filtrosActivos),
        getEstadisticas()
      ]);

      if (solicitudesResult.success) {
        setSolicitudes(solicitudesResult.data || []);
      } else {
        setError(solicitudesResult.error || 'Error cargando solicitudes');
      }

      if (estadisticasResult.success) {
        setEstadisticas(estadisticasResult.stats || {});
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error interno del servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = useCallback((campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  }, []);

  const abrirModal = useCallback((tipo, solicitud) => {
    setModales(prev => ({
      ...prev,
      [tipo]: { open: true, solicitud }
    }));
  }, []);

  const cerrarModal = useCallback((tipo) => {
    setModales(prev => ({
      ...prev,
      [tipo]: { open: false, solicitud: null }
    }));
  }, []);

  const handleAccionCompletada = useCallback(() => {
    cargarDatos();
    setModales({
      confirmar: { open: false, solicitud: null },
      rechazar: { open: false, solicitud: null },
      devolver: { open: false, solicitud: null },
      detalles: { open: false, solicitud: null }
    });
  }, []);

  // ========================================
  // 🔧 COMPUTED VALUES
  // ========================================

  const solicitudesFiltradas = useMemo(() => {
    return solicitudes.filter(solicitud => {
      if (filtros.estado !== 'todos' && solicitud.estado !== filtros.estado) {
        return false;
      }
      
      if (filtros.proveedor && !solicitud.proveedor.toLowerCase().includes(filtros.proveedor.toLowerCase())) {
        return false;
      }
      
      if (filtros.comprador && !solicitud.comprador.toLowerCase().includes(filtros.comprador.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [solicitudes, filtros]);

  // ========================================
  // 🎨 RENDER FUNCTIONS
  // ========================================

  const renderEstadisticas = useCallback(() => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <MemoAdminStatCard
          title="Total Solicitudes"
          value={estadisticas.total || 0}
          icon={AssessmentIcon}
          color="primary"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MemoAdminStatCard
          title="Pendientes"
          value={estadisticas.pendientes || 0}
          icon={ScheduleIcon}
          color="warning"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MemoAdminStatCard
          title="Confirmados"
          value={estadisticas.confirmados || 0}
          icon={DoneIcon}
          color="success"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MemoAdminStatCard
          title="Rechazados/Devueltos"
          value={(estadisticas.rechazados || 0) + (estadisticas.devueltos || 0)}
          icon={ErrorIcon}
          color="error"
        />
      </Grid>
    </Grid>
  ), [estadisticas]);

  const menuPropsEstado = useMemo(() => ({
    disableScrollLock: true,
    PaperProps: {
      style: {
        maxHeight: 300,
        minWidth: 200
      }
    },
    anchorOrigin: {
      vertical: 'bottom',
      horizontal: 'left'
    },
    transformOrigin: {
      vertical: 'top',
      horizontal: 'left'
    }
  }), []);
  const sxEstado = useMemo(() => ({ '& .MuiSelect-select': { minHeight: 'auto' }, maxWidth: '100%' }), []);

  const renderFiltros = useCallback(() => (
    <Paper sx={commonStyles.filtersSection}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <FilterList sx={{ mr: 1 }} />
        <Typography variant="h6">Filtros</Typography>
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth sx={sxEstado}>
            <InputLabel>Estado</InputLabel>
            <Select
              value={filtros.estado}
              onChange={(e) => handleFiltroChange('estado', e.target.value)}
              label="Estado"
              MenuProps={menuPropsEstado}
            >
              {FILTROS_ESTADO.map(filtro => (
                <MenuItem key={filtro.value} value={filtro.value}>
                  {filtro.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Proveedor"
            value={filtros.proveedor}
            onChange={(e) => handleFiltroChange('proveedor', e.target.value)}
            placeholder="Buscar por proveedor..."
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Comprador"
            value={filtros.comprador}
            onChange={(e) => handleFiltroChange('comprador', e.target.value)}
            placeholder="Buscar por comprador..."
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Fecha Desde"
            type="date"
            value={filtros.fechaDesde}
            onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>
    </Paper>
  ), [filtros, handleFiltroChange]);

  const renderAcciones = (solicitud) => {
    const acciones = solicitud.acciones?.split(',') || [];
    
    return (
      <Box>
        {acciones.includes('confirmar') && (
          <Tooltip title="Confirmar Pago">
            <IconButton
              size="small"
              color="success"
              onClick={() => abrirModal('confirmar', solicitud)}
              sx={commonStyles.actionButton}
            >
              <CheckCircle />
            </IconButton>
          </Tooltip>
        )}
        
        {acciones.includes('rechazar') && (
          <Tooltip title="Rechazar Pago">
            <IconButton
              size="small"
              color="error"
              onClick={() => abrirModal('rechazar', solicitud)}
              sx={commonStyles.actionButton}
            >
              <Cancel />
            </IconButton>
          </Tooltip>
        )}
        
        {acciones.includes('devolver') && (
          <Tooltip title="Devolver Pago">
            <IconButton
              size="small"
              color="info"
              onClick={() => abrirModal('devolver', solicitud)}
              sx={commonStyles.actionButton}
            >
              <Undo />
            </IconButton>
          </Tooltip>
        )}
        
        <Tooltip title="Ver Detalles">
          <IconButton
            size="small"
            color="primary"
            onClick={() => abrirModal('detalles', solicitud)}
            sx={commonStyles.actionButton}
          >
            <Visibility />
          </IconButton>
        </Tooltip>
        
        {solicitud.comprobante_pago && (
          <Tooltip title="Descargar Comprobante">
            <IconButton
              size="small"
              color="secondary"
              onClick={() => window.open(solicitud.comprobante_pago, '_blank')}
              sx={commonStyles.actionButton}
            >
              <FileDownload />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  };

  const renderTabla = () => (
    <Paper sx={commonStyles.tableContainer}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">
          Solicitudes de Pago ({solicitudesFiltradas.length})
        </Typography>
      </Box>
      
      {loading ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography>Cargando solicitudes...</Typography>
        </Box>
      ) : solicitudesFiltradas.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="textSecondary">
            No se encontraron solicitudes con los filtros aplicados
          </Typography>
        </Box>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Ticket</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Proveedor</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Comprador</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Venta</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Fecha Solicitud</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Estado</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {solicitudesFiltradas.map((solicitud) => (
                <tr key={solicitud.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {solicitud.ticket}
                    </Typography>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Typography variant="body2">
                      {solicitud.proveedor}
                    </Typography>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Typography variant="body2">
                      {solicitud.comprador}
                    </Typography>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#2196f3' }}>
                      ${solicitud.venta?.toLocaleString('es-CL')}
                    </Typography>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Typography variant="body2">
                      {new Date(solicitud.fecha_solicitada).toLocaleDateString('es-CL')}
                    </Typography>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Chip
                      label={ESTADOS[solicitud.estado]?.label || solicitud.estado}
                      color={ESTADOS[solicitud.estado]?.color || 'default'}
                      size="small"
                      sx={commonStyles.estadoChip}
                    />
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {renderAcciones(solicitud)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      )}
    </Paper>
  );

  // ========================================
  // 🎨 MAIN RENDER
  // ========================================

  return (
    <Box sx={commonStyles.container}>
      {/* Header */}
      <Box sx={commonStyles.headerSection}>
        <Typography variant="h4" gutterBottom>
          Panel de Control Administrativo
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Gestión de pagos, solicitudes y devoluciones
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Estadísticas */}
      {renderEstadisticas()}

      {/* Filtros */}
      {renderFiltros()}

      {/* Tabla Principal */}
      {renderTabla()}

      {/* Botón de Refresco */}
      <Fab
        color="primary"
        onClick={cargarDatos}
        sx={commonStyles.refreshFab}
        disabled={loading}
      >
        <Refresh />
      </Fab>

      {/* Modales */}
      <ConfirmarPagoModal
        open={modales.confirmar.open}
        solicitud={modales.confirmar.solicitud}
        onClose={() => cerrarModal('confirmar')}
        onSuccess={handleAccionCompletada}
      />

      <RechazarPagoModal
        open={modales.rechazar.open}
        solicitud={modales.rechazar.solicitud}
        onClose={() => cerrarModal('rechazar')}
        onSuccess={handleAccionCompletada}
      />

      <DevolverPagoModal
        open={modales.devolver.open}
        solicitud={modales.devolver.solicitud}
        onClose={() => cerrarModal('devolver')}
        onSuccess={handleAccionCompletada}
      />

      <DetallesSolicitudModal
        open={modales.detalles.open}
        solicitud={modales.detalles.solicitud}
        onClose={() => cerrarModal('detalles')}
      />
    </Box>
  );
};

export default AdminPanelTable;
