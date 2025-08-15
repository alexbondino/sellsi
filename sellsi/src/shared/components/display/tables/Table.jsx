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
} from '@mui/material';
import { InfoOutlined as InfoOutlinedIcon } from '@mui/icons-material';
import Rows from './TableRows';

const Table = ({ orders, onActionClick }) => {
  if (!orders || orders.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No se encontraron pedidos
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper}>
      <MuiTable sx={{ minWidth: 650 }} aria-label="tabla de pedidos">
        <TableHead>
          <TableRow>
            <TableCell align="center" sx={{ width: '50px' }}>
              {/* Columna para icono de advertencia */}
            </TableCell>
            <TableCell sx={{ pl: 0 }}>Producto</TableCell>
            <TableCell>Unidades</TableCell>
            <TableCell>ID Venta</TableCell>
            <TableCell>Dirección Entrega</TableCell>
            <TableCell>Fecha Solicitud</TableCell>
            <TableCell>Fecha Entrega Limite</TableCell>
            <TableCell align="right">Venta y Envío (IVA inc.)</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <span>Acciones</span>
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
                        • Aceptado: Despachar* (pasa a En Transito) · Rechazar
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'common.white' }} display="block">
                        • En Transito: Confirmar Entrega (finaliza)
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'common.white' }} display="block" gutterBottom>
                        • Entregado: Solo Chat postventa
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'common.white', opacity: 0.9 }}>
                        * Despachar requiere Fecha estimada; mensajes/motivos son opcionales.
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
