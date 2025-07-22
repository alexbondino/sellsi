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
} from '@mui/material';
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
            <TableCell>Productos</TableCell>
            <TableCell>ID Venta</TableCell>
            <TableCell>Dirección Entrega</TableCell>
            <TableCell>Fecha Solicitada</TableCell>
            <TableCell>Fecha Entrega</TableCell>
            <TableCell align="right">Venta</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>Acciones</TableCell>
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
