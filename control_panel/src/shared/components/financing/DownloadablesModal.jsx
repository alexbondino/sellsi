import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { formatPrice } from '../../utils/formatters';

// Local modal styles (copied to match existing modals in control_panel)
const MODAL_DIALOG_ACTIONS_STYLES = {
  flexDirection: { xs: 'column', sm: 'row' },
  gap: { xs: 1.5, sm: 2 },
  p: { xs: 2, sm: 3 },
  pt: { xs: 1.5, sm: 1 },
  justifyContent: 'center',
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (e) {
    return dateString;
  }
};

const MODAL_CANCEL_BUTTON_STYLES = {
  textTransform: 'none',
  borderRadius: 2,
  fontSize: { xs: '0.875rem', sm: '0.875rem' },
  px: 2,
  py: { xs: 1, sm: 0.75 },
  width: { xs: '100%', sm: '160px' },
  boxSizing: 'border-box',
  fontWeight: 500,
};

const MODAL_SUBMIT_BUTTON_STYLES = {
  textTransform: 'none',
  borderRadius: 2,
  fontSize: { xs: '0.875rem', sm: '0.875rem' },
  px: 2,
  py: { xs: 1, sm: 0.75 },
  width: { xs: '100%', sm: '160px' },
  boxSizing: 'border-box',
  fontWeight: 600,
};

const SELLSI_BLUE = '#2E52B2';

function useBodyScrollLock(open) {
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    if (open) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);
}

const getFileIcon = (fileName) => {
  const ext = (fileName || '').split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return <PictureAsPdfIcon sx={{ color: '#d32f2f' }} />;
    case 'doc':
    case 'docx':
      return <DescriptionIcon sx={{ color: '#1976d2' }} />;
    case 'jpg':
    case 'jpeg':
    case 'png':
      return <ImageIcon sx={{ color: '#388e3c' }} />;
    default:
      return <InsertDriveFileIcon sx={{ color: 'text.secondary' }} />;
  }
};

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
};

const DownloadablesModal = ({ open, onClose, financing, documents = [], loading = false, onDownloadFile, showMetadata = true }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useBodyScrollLock(open);

  // Fallback: if no documents prop is provided, build a short sample (keeps behavior similar a DownloadablesModal original)
  const resolvedDocs = React.useMemo(() => {
    if (documents && documents.length >= 0) return documents;
    if (!financing) return [];
    const sample = [
      { id: '1', name: 'Contrato Marco de Financiamiento.pdf', size: 245678, uploaded_at: financing.created_at },
      { id: '2', name: 'Pagaré.pdf', size: 123456, uploaded_at: financing.created_at },
    ];
    return sample;
  }, [documents, financing]);

  const handleClose = () => onClose?.();

  const handleDownload = (doc) => onDownloadFile?.(doc);

  const handleDownloadAll = () => {
    resolvedDocs.forEach(d => onDownloadFile?.(d));
  };

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (reason === 'backdropClick') return;
        handleClose();
      }}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      disableScrollLock
      sx={{ zIndex: 1500 }}
      PaperProps={{ sx: { borderRadius: isMobile ? 0 : 2, minWidth: isMobile ? 'auto' : '600px' } }}
    >
      <DialogTitle sx={{ fontWeight: 700, backgroundColor: SELLSI_BLUE, color: '#fff', py: { xs: 2, sm: 2.5 }, px: { xs: 2, sm: 3 }, position: 'relative', fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
        <IconButton onClick={handleClose} sx={{ position: 'absolute', right: { xs: 8, sm: 16 }, top: { xs: 8, sm: 12 }, color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)', p: { xs: 0.75, sm: 1 }, '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' } }}>
          <CloseIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'center' }}>
          <DownloadIcon />
          <span>Documentos Descargables</span>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, backgroundColor: '#f9f9f9' }}>
        {showMetadata && (
          <Box sx={{ p: { xs: 2, sm: 3 }, backgroundColor: '#fff', borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Solicitud de Financiamiento
            </Typography>

            <Typography variant="h6" fontWeight={600}>
              {financing?.buyer_user_nm || financing?.buyer?.user_nm || financing?.supplier_user_nm || financing?.supplier?.user_nm || financing?.requested_by || 'N/A'}
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
              <Typography variant="body2" color="text.secondary">Fecha: <strong style={{ color: 'inherit' }}>{formatDate(financing?.created_at)}</strong></Typography>
              <Typography variant="body2" color="text.secondary">Comprador: <strong style={{ color: 'inherit' }}>{financing?.buyer_user_nm || financing?.buyer?.user_nm || '-'}</strong></Typography>
              <Typography variant="body2" color="text.secondary">Proveedor: <strong style={{ color: 'inherit' }}>{financing?.supplier_user_nm || financing?.supplier?.user_nm || '-'}</strong></Typography>
              <Typography variant="body2" color="text.secondary">Monto: <strong style={{ color: 'inherit' }}>{formatPrice(financing?.amount)}</strong></Typography>
              <Typography variant="body2" color="text.secondary">Plazo: <strong style={{ color: 'inherit' }}>{financing?.term_days ? `${financing.term_days} días` : '-'}</strong></Typography>
              <Typography variant="body2" color="text.secondary">Vencimiento: <strong style={{ color: 'inherit' }}>{financing?.expires_at ? formatDate(financing.expires_at) : '-'}</strong></Typography>
              <Typography variant="body2" color="text.secondary">Saldo: <strong style={{ color: 'inherit' }}>{formatPrice((Number(financing?.amount_used || 0) - Number(financing?.amount_paid || 0)) || 0)}</strong></Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {resolvedDocs.length} {resolvedDocs.length === 1 ? 'documento disponible' : 'documentos disponibles'}
            </Typography>

          </Box>
        )}


        <List sx={{ p: { xs: 1, sm: 2 }, maxHeight: { xs: '450px', sm: '480px' }, overflowY: 'auto' }}>
          {resolvedDocs.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">No hay documentos disponibles</Typography>
            </Box>
          ) : (
            resolvedDocs.map((doc, index) => (
              <React.Fragment key={doc.id}>
                <ListItem disablePadding sx={{ mb: index < resolvedDocs.length - 1 ? 1 : 0, backgroundColor: '#fff', borderRadius: 1, border: 1, borderColor: 'divider', '&:hover': { borderColor: SELLSI_BLUE, boxShadow: 1 } }}>
                  <ListItemButton onClick={() => handleDownload(doc)} sx={{ py: { xs: 1.5, sm: 2 }, px: { xs: 2, sm: 2.5 } }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>{getFileIcon(doc.document_name || doc.name)}</ListItemIcon>
                    <ListItemText primary={doc.document_name || doc.name || 'Sin nombre'} secondary={formatFileSize(doc.size || doc.file_size || 0)} primaryTypographyProps={{ fontSize: { xs: '0.875rem', sm: '0.95rem' }, fontWeight: 500 }} secondaryTypographyProps={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }} />
                    <IconButton edge="end" sx={{ color: SELLSI_BLUE, '&:hover': { backgroundColor: 'rgba(46, 82, 178, 0.08)' } }}>
                      <DownloadIcon />
                    </IconButton>
                  </ListItemButton>
                </ListItem>
              </React.Fragment>
            ))
          )}
        </List>
      </DialogContent>

      <DialogActions sx={MODAL_DIALOG_ACTIONS_STYLES}>
        <Button onClick={handleClose} variant="outlined" sx={MODAL_CANCEL_BUTTON_STYLES}>Cerrar</Button>
        <Button onClick={handleDownloadAll} variant="contained" disabled={resolvedDocs.length === 0} sx={{ ...MODAL_SUBMIT_BUTTON_STYLES, minWidth: { xs: 'auto', sm: '160px' } }}>Descargar Todo</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DownloadablesModal;
