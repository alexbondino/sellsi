/**
 * ============================================================================
 * BUYER FINANCING TABLE
 * ============================================================================
 * 
 * Tabla de financiamientos para compradores.
 * Vista desktop.
 */

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { getBuyerTableColumns, buyerApprovedColumns } from './BuyerFinancingColumns';

/**
 * Estilos de cabecera de tabla
 */
const headerCellSx = {
  fontWeight: 600,
  backgroundColor: 'grey.100',
  color: 'text.primary',
  fontSize: '0.875rem',
  py: 1.5,
};

/**
 * Componente de tabla para financiamientos (Buyer)
 */
const BuyerFinancingTable = ({
  financings = [],
  onViewReason,
  onCancel,
  onSign,
  onDownload,
  onPayOnline,
  isApproved = false, // Nueva prop para indicar si son aprobados
}) => {
  const columns = isApproved ? buyerApprovedColumns : getBuyerTableColumns();
  const handlers = { onViewReason, onCancel, onSign, onDownload, onPayOnline };

  return (
    <TableContainer component={Paper} elevation={1}>
      <Table sx={{ minWidth: 800 }}>
        <TableHead>
          <TableRow>
            {columns.map(col => (
              <TableCell key={col.key} sx={headerCellSx} align={col.align || 'left'}>
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {financings.map((financing) => (
            <TableRow
              key={financing.id}
              sx={{
                '&:hover': { backgroundColor: 'action.hover' },
                '&:last-child td, &:last-child th': { border: 0 },
              }}
            >
              {columns.map(col => (
                <TableCell key={col.key} align={col.align || 'left'}>
                  {col.render(financing, handlers)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default BuyerFinancingTable;
