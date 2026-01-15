import React from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material'
import { MODAL_DIALOG_HEADER_STYLES } from '../../shared/components/feedback/Modal/Modal'

const ConfirmDialog = ({
  open,
  title = 'Confirmar acción',
  description = '',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  disabled = false,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      disableScrollLock={true}
      disableRestoreFocus={true}
      BackdropProps={{
        style: { backgroundColor: 'rgba(0,0,0,0.5)' },
      }}
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      {title && (
        <DialogTitle sx={{ ...MODAL_DIALOG_HEADER_STYLES, textAlign: 'center' }}>{title}</DialogTitle>
      )}
      {description && (
        <DialogContent>
          <Typography variant="body2">{description}</Typography>
        </DialogContent>
      )}
      <DialogActions sx={{ justifyContent: 'center', gap: 2.5, p: 3 }}>
        <Button
          onClick={onCancel}
          disabled={disabled}
          variant="outlined"
          sx={{ textTransform: 'none', fontWeight: 500, borderRadius: 2 }}
        >
          {cancelText}
        </Button>
        <Button onClick={onConfirm} disabled={disabled} variant="contained" color="error" sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>{confirmText}</Button>
      </DialogActions>
    </Dialog>
  )
}

export default ConfirmDialog
