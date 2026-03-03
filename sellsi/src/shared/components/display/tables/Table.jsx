import React from 'react';
import {
  Table as MuiTable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Tooltip,
  IconButton,
  Button,
} from '@mui/material';
import { InfoOutlined as InfoOutlinedIcon, Assignment as AssignmentIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Rows from './TableRows';

const Table = ({ orders, onActionClick }) => {
  const navigate = useNavigate();
  
  if (!orders || orders.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <AssignmentIcon sx={{ fontSize: 48, color: 'primary.main' }} />
        </Box>
        <Typography variant="h6" color="text.secondary" sx={{ fontSize: { md: '1.5rem' } }}>
          Aún no tienes pedidos
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3, fontSize: { md: '1.05rem' } }}>
          Tus pedidos se generan cuando concretas una venta, ya sea desde el marketplace o a partir de una oferta recibida.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/supplier/myproducts')}
        >
          Ver mis productos publicados
        </Button>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper}>
      <MuiTable sx={{ minWidth: 650 }} aria-label="tabla de pedidos">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Solicitado Por</TableCell>
            <TableCell sx={{ pl: 0, fontWeight: 600 }}>Producto</TableCell>
            <TableCell sx={{ fontWeight: 600, display: { md: 'none', lg: 'table-cell' } }}>Unidades</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Fechas</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Documento</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <span style={{ fontWeight: 600 }}>Forma de Pago</span>
                <Tooltip
                  placement="top"
                  title={
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: 'common.white' }} gutterBottom>
                        Tipos de pago
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'common.white' }} display="block">
                        • Crédito: 100% con financiamiento.
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'common.white' }} display="block">
                        • Contado: 100% con métodos tradicionales (Khipu, Flow o transferencia).
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'common.white' }} display="block">
                        • Mixto: combinación de Crédito + Contado (se muestran porcentajes).
                      </Typography>
                    </Box>
                  }
                >
                  <IconButton size="small" aria-label="Información de forma de pago">
                    <InfoOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>Monto (IVA inc.)</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <span style={{ fontWeight: 600 }}>Acciones</span>
                <Tooltip
                  placement="right"
                  componentsProps={{
                    tooltip: {
                      sx: {
                        maxWidth: 320,
                        p: 1.25,
                      },
                    },
                  }}
                  title={
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: 'common.white' }} gutterBottom>
                        Guía rápida
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'common.white' }} display="block">
                        Flujo principal: Pendiente → Aceptado → En Transito → Entregado · Rechazado cierra el pedido.
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'common.white' }} display="block" gutterBottom>
                        Usa Chat para coordinar en cualquier estado.
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'common.white' }} display="block">
                        • Pendiente: Aceptar (continúa) · Rechazar (finaliza)
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'common.white' }} display="block">
                        • Aceptado: Despachar* (pasa a En Transito) · Cancelar
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'common.white' }} display="block">
                        • En Transito: Confirmar Entrega (finaliza) · Cancelar
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'common.white' }} display="block" gutterBottom>
                        • Entregado: Solo Chat postventa
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'common.white', opacity: 0.9 }}>
                        * Despachar requiere Fecha estimada; mensajes/motivos son opcionales.
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'common.white', display: 'block', mt: 1 }}>
                        Si tienes alguna duda o inquietud, contáctanos a través de la opción ‘Ayuda’
                      </Typography>
                    </Box>
                  }
                >
                  <IconButton size="small" aria-label="Información de acciones">
                    <InfoOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map(order => (
            <Rows
              key={order.order_id}
              order={order}
              onActionClick={onActionClick}
            />
          ))}
        </TableBody>
      </MuiTable>
    </TableContainer>
  );
};

export default Table;
