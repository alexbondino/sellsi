/**
 * ============================================================================
 * FINANCING ID CELL COMPONENT
 * ============================================================================
 * 
 * Componente reutilizable para mostrar ID de financiamiento en tablas.
 * Similar al patrón usado en Supplier/Orders para "ID Venta".
 * 
 * Features:
 * - Muestra los primeros 9 caracteres del UUID
 * - Tooltip "Clic para ver y copiar"
 * - Popover con ID completo y botón de copiar
 * - Feedback visual de copiado (3 segundos)
 * - Monospace font para mejor legibilidad
 * 
 * Uso:
 * ```jsx
 * <FinancingIdCell financingId={financing.id} />
 * ```
 */

import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Tooltip,
  Popover,
  TextField,
  Button,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const FinancingIdCell = ({ financingId }) => {
  const [idAnchor, setIdAnchor] = useState(null);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef(null);

  const handleOpenId = (event) => {
    setIdAnchor(event.currentTarget);
  };

  const handleCloseId = () => {
    setIdAnchor(null);
    if (copyTimerRef.current) {
      clearTimeout(copyTimerRef.current);
      copyTimerRef.current = null;
    }
    setCopied(false);
  };

  const handleCopyId = async () => {
    try {
      if (!financingId) return;
      await navigator.clipboard.writeText(financingId);
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 3000);
    } catch (_) {
      // Silently fail
    }
  };

  // Formato corto: primeros 9 caracteres en mayúsculas
  const shortId = (id) => {
    if (!id) return '—';
    const s = String(id).toUpperCase();
    return s.slice(0, 9);
  };

  const openId = Boolean(idAnchor);

  return (
    <Box sx={{ display: 'inline-block' }}>
      <Tooltip title="Clic para ver y copiar" placement="top">
        <Typography
          variant="body2"
          fontWeight="medium"
          onClick={handleOpenId}
          sx={{
            cursor: 'pointer',
            userSelect: 'none',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
          }}
        >
          {shortId(financingId)}
        </Typography>
      </Tooltip>
      <Popover
        open={openId}
        anchorEl={idAnchor}
        onClose={handleCloseId}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { p: 2, width: 420, maxWidth: '90vw' } }}
        disableScrollLock
      >
        <Typography variant="subtitle2" gutterBottom>
          ID de financiamiento (completo)
        </Typography>
        <TextField
          value={financingId || ''}
          fullWidth
          size="small"
          InputProps={{
            readOnly: true,
            sx: { fontFamily: 'monospace', fontSize: '0.875rem' },
          }}
        />
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Selecciona o usa el botón para copiar
          </Typography>
          {copied ? (
            <Button
              size="small"
              color="success"
              variant="contained"
              startIcon={<CheckCircleOutlineIcon sx={{ fontSize: 18 }} />}
              disableElevation
            >
              Copiado
            </Button>
          ) : (
            <Button onClick={handleCopyId} size="small">
              Copiar
            </Button>
          )}
        </Box>
      </Popover>
    </Box>
  );
};

export default FinancingIdCell;
