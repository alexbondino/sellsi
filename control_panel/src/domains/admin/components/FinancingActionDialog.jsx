import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Alert, Box } from '@mui/material';

/**
 * Reusable dialog for financing actions (approve, reject, view documents, confirmable actions)
 * Props:
 * - open, onClose
 * - title
 * - children (content)
 * - confirmLabel (string|null) -> if null hides confirm button
 * - cancelLabel
 * - onConfirm (fn)
 * - loading (bool)
 * - requireReason (bool)
 * - reason, onReasonChange
 */
const FinancingActionDialog = ({
  open,
  onClose,
  title,
  children,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm = null,
  loading = false,
  requireReason = false,
  reason = '',
  onReasonChange = () => {},
}) => {
  return (
    <Dialog open={open} onClose={() => !loading && onClose?.()} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {requireReason && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Esta acción notificará al comprador y al proveedor sobre el cambio
          </Alert>
        )}

        {/* allow parent to render any content (documents list, details, etc) */}
        <Box sx={{ mt: requireReason ? 1 : 0 }}>{children}</Box>

        {requireReason && (
          <Box sx={{ mt: 2 }}>
            <TextField
              autoFocus
              multiline
              rows={4}
              fullWidth
              label="Motivo"
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Ingrese el motivo..."
              disabled={loading}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>{cancelLabel}</Button>
        {onConfirm && confirmLabel && (
          <Button onClick={onConfirm} color="error" variant="contained" disabled={loading}>
            {loading ? '...' : confirmLabel}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default FinancingActionDialog;
