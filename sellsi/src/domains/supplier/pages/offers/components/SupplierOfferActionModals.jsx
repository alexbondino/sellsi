import React, { useEffect, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Alert } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import DeleteIcon from '@mui/icons-material/Delete';

const formatCLP = v => '$' + new Intl.NumberFormat('es-CL').format(Math.round(v||0));

export const SupplierOfferActionModals = ({
  open,
  mode, // 'accept' | 'reject' | 'cleanup'
  offer,
  onClose,
  onAccept,
  onReject,
  onCleanup,
}) => {
  if (!offer) return null;
  const { product = {}, price, quantity, buyer = {} } = offer;
  const total = (price||0) * (quantity||0);
  const stock = product.stock ?? 0;
  const previousPrice = product.previousPrice;
  const insufficient = mode === 'accept' && quantity > stock;

  const handlePrimary = () => {
    if (mode === 'accept') onAccept?.(offer);
    else if (mode === 'reject') onReject?.(offer);
    else if (mode === 'cleanup') onCleanup?.(offer);
  };

  // prevent body scroll and compensate for scrollbar width to avoid layout shift
  const _bodyStyle = useRef({ overflow: '', paddingRight: '' });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const body = document.body;
    if (open) {
      // save previous styles
      _bodyStyle.current.overflow = body.style.overflow;
      _bodyStyle.current.paddingRight = body.style.paddingRight;

      // compute scrollbar width and add compensation to avoid page shift
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollBarWidth > 0) body.style.paddingRight = `${scrollBarWidth}px`;

      body.style.overflow = 'hidden';
    } else {
      // restore
      body.style.overflow = _bodyStyle.current.overflow ?? '';
      body.style.paddingRight = _bodyStyle.current.paddingRight ?? '';
    }

    return () => {
      // restore on unmount as well
      body.style.overflow = _bodyStyle.current.overflow ?? '';
      body.style.paddingRight = _bodyStyle.current.paddingRight ?? '';
    };
  }, [open]);

  const titleConfig = {
    accept: { label: 'Aceptar Oferta', icon: <CheckCircleIcon color="success" fontSize="small" /> },
    reject: { label: 'Rechazar Oferta', icon: <BlockIcon color="error" fontSize="small" /> },
    cleanup: { label: 'Limpiar Oferta', icon: <DeleteIcon color="error" fontSize="small" /> },
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth disableScrollLock>
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', textAlign: 'center' }}>
        {titleConfig[mode]?.icon}
        <span>{titleConfig[mode]?.label}</span>
      </DialogTitle>
      <DialogContent dividers>
        {mode === 'cleanup' ? (
          <Typography>¿Estás seguro que quieres eliminar esta oferta de tus registros?</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography sx={{ fontWeight: 700 }}>
              {mode === 'accept' ? '¿Estás seguro que aceptas esta oferta?' : '¿Estás seguro que rechazas esta oferta?'}
            </Typography>
            <Typography variant="body2"><strong>Producto:</strong> {product.name}</Typography>
            <Typography variant="body2"><strong>Ofertante:</strong> {buyer.name}</Typography>
            <Typography variant="body2">
              <strong>Precio Ofertado:</strong> {quantity} uds * {formatCLP(price)} = {formatCLP(total)}
            </Typography>
            <Typography variant="body2">
              <strong>Precio Unitario Original:</strong> {previousPrice ? formatCLP(previousPrice) : '—'}
            </Typography>
            <Typography variant="body2"><strong>Stock disponible:</strong> {stock}</Typography>
            {mode === 'accept' && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <InfoOutlinedIcon fontSize="small" color="info" sx={{ mt: '-2px' }} />
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3 }}>
                  Una vez aceptes esta oferta, el ofertante tendrá un plazo máximo de 24 horas para concretar la compra; durante ese tiempo el stock del producto será descontado automáticamente.
                </Typography>
              </Box>
            )}
            {insufficient && (
              <Alert severity="error" sx={{ mt: 1 }}>
                No es posible aceptar esta oferta porque el stock ({stock}) es menor a la cantidad ofertada ({quantity}). Reposición requerida.
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', gap: 2 }}>
        <Button onClick={onClose} variant="text">Cancelar</Button>
        <Button
          onClick={handlePrimary}
          variant="contained"
          color={mode === 'reject' ? 'error' : 'primary'}
          disabled={mode === 'accept' && insufficient}
        >
          {mode === 'accept' ? 'Aceptar' : mode === 'reject' ? 'Rechazar' : 'Sí'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SupplierOfferActionModals;