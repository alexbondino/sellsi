/**
 * ============================================================================
 * INFO POPOVER COMPONENT
 * ============================================================================
 * 
 * Componente reutilizable para mostrar información estructurada en un popover.
 * Incluye funcionalidad de copiado al portapapeles.
 * 
 * Usado en:
 * - TableRows.jsx (columna Documento - datos de facturación)
 * - SupplierFinancingTable.jsx (columna Solicitado Por - datos empresa)
 * 
 * @example
 * <InfoPopover
 *   label="Factura"
 *   linkText="Ver detalle"
 *   title="Información de Facturación"
 *   fields={[
 *     { label: 'Razón Social', value: 'Mi Empresa S.A.' },
 *     { label: 'RUT', value: '76.123.456-7' }
 *   ]}
 * />
 */

import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Popover,
  Button,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const InfoPopover = ({
  label = null,
  linkText = 'Ver detalle',
  title = 'Información',
  fields = [],
  popoverWidth = 460,
  showCopyButton = true,
  onOpen = null,
  onClose = null,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef(null);

  const open = Boolean(anchorEl);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
    onOpen?.();
  };

  const handleClose = () => {
    setAnchorEl(null);
    if (copyTimerRef.current) {
      clearTimeout(copyTimerRef.current);
      copyTimerRef.current = null;
    }
    setCopied(false);
    onClose?.();
  };

  const buildCopyText = () => {
    return fields
      .filter(f => f.value && f.value !== '—')
      .map(f => `${f.label}: ${f.value}`)
      .join('\n');
  };

  const handleCopy = async () => {
    try {
      const text = buildCopyText();
      if (!text) return;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        {label && (
          <Typography variant="body2">{label}</Typography>
        )}
        <Typography
          variant="body2"
          sx={{
            color: 'primary.main',
            cursor: 'pointer',
            textDecoration: 'underline',
            userSelect: 'none',
          }}
          onClick={handleOpen}
        >
          {linkText}
        </Typography>
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { p: 2, width: popoverWidth, maxWidth: '95vw' } }}
        disableScrollLock
      >
        <Typography variant="subtitle2" gutterBottom>
          {title}
        </Typography>

        {/* Grid de campos */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '120px 1fr',
            rowGap: 1,
            columnGap: 1,
          }}
        >
          {fields.map((field, index) => (
            <React.Fragment key={index}>
              <Typography variant="body2" color="text.secondary">
                {field.label}:
              </Typography>
              <Typography variant="body2">{field.value || '—'}</Typography>
            </React.Fragment>
          ))}
        </Box>

        {/* Botón copiar */}
        {showCopyButton && (
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
              <Button onClick={handleCopy} size="small">
                Copiar
              </Button>
            )}
          </Box>
        )}
      </Popover>
    </>
  );
};

export default InfoPopover;
