/**
 * ============================================================================
 * DOWNLOADABLES MODAL - Modal de Archivos Descargables
 * ============================================================================
 * 
 * Modal que muestra la lista de documentos descargables de una solicitud
 * de financiamiento. Cada archivo ocupa 100% del ancho.
 * 
 * Características:
 * - Lista de documentos con iconos por tipo
 * - Cada archivo ocupa 100% width
 * - Botón de descarga por archivo
 * - Indicador de tamaño de archivo
 * - Responsive (mobile y desktop)
 */

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
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { useBodyScrollLock } from '../../../hooks/useBodyScrollLock';
import {
  MODAL_DIALOG_ACTIONS_STYLES,
  MODAL_CANCEL_BUTTON_STYLES,
  MODAL_SUBMIT_BUTTON_STYLES,
} from '../../feedback/Modal/Modal';

const SELLSI_BLUE = '#2E52B2';

/**
 * Obtiene el ícono apropiado según el tipo de archivo
 */
const getFileIcon = (fileName) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
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

/**
 * Formatea el tamaño del archivo
 */
const formatFileSize = (bytes) => {
  if (!bytes) return '';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
};

const DownloadablesModal = ({ open, onClose, financing, onDownloadFile }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Bloquear scroll cuando el modal está abierto
  useBodyScrollLock(open);

  // Handler para descargar todos los documentos
  const handleDownloadAll = () => {
    console.log('📥 Descargando todos los documentos');
    if (documents.length > 0) {
      documents.forEach(doc => {
        onDownloadFile?.(doc, financing);
      });
    }
  };

  // Documentos disponibles para descargar
  // TODO: Cuando exista financing_documents, obtener de allí
  const documents = React.useMemo(() => {
    if (!financing) return [];

    // Usar document_count si está disponible (para testing), sino usar lógica por defecto
    const targetCount = financing.document_count || (financing.request_type === 'extended' ? 5 : 2);
    
    const allPossibleDocs = [
      {
        id: '1',
        name: 'Contrato Marco de Financiamiento.pdf',
        type: 'contrato',
        size: 245678,
        uploadedAt: financing.created_at,
      },
      {
        id: '2',
        name: 'Pagaré.pdf',
        type: 'pagare',
        size: 123456,
        uploadedAt: financing.created_at,
      },
      {
        id: '3',
        name: 'Certificado de Poderes.pdf',
        type: 'garantia',
        size: 567890,
        uploadedAt: financing.created_at,
      },
      {
        id: '4',
        name: 'Certificado Vigencia Poderes.pdf',
        type: 'garantia',
        size: 434567,
        uploadedAt: financing.created_at,
      },
      {
        id: '5',
        name: 'Carpeta Tributaria Simplificada.pdf',
        type: 'garantia',
        size: 1234567,
        uploadedAt: financing.created_at,
      },
      {
        id: '6',
        name: 'Certificado de Deudas Tributarias.pdf',
        type: 'garantia',
        size: 789012,
        uploadedAt: financing.created_at,
      },
      {
        id: '7',
        name: 'Balance Financiero 2025.pdf',
        type: 'garantia',
        size: 2345678,
        uploadedAt: financing.created_at,
      },
    ];

    // Retornar solo la cantidad especificada
    return allPossibleDocs.slice(0, targetCount);
  }, [financing]);

  const handleDownloadFile = (doc) => {
    console.log('🔽 Descargando archivo:', doc.name);
    onDownloadFile?.(doc, financing);
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        // Solo permitir cierre con ESC o botón X, no con clic en backdrop
        if (reason === 'backdropClick') {
          return;
        }
        handleClose();
      }}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      disableScrollLock
      sx={{ zIndex: 1500 }}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          minWidth: isMobile ? 'auto' : '600px',
        },
      }}
    >
      {/* Header con fondo azul Sellsi */}
      <DialogTitle
        sx={{
          fontWeight: 700,
          backgroundColor: SELLSI_BLUE,
          color: '#fff',
          py: { xs: 2, sm: 2.5 },
          px: { xs: 2, sm: 3 },
          position: 'relative',
          fontSize: { xs: '1.125rem', sm: '1.25rem' },
        }}
      >
        {/* Botón cerrar */}
        <IconButton
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: { xs: 8, sm: 16 },
            top: { xs: 8, sm: 12 },
            color: '#fff',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            p: { xs: 0.75, sm: 1 },
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            },
          }}
        >
          <CloseIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'center' }}>
          <DownloadIcon />
          <span>Documentos Descargables</span>
        </Box>
      </DialogTitle>

      {/* Contenido */}
      <DialogContent
        sx={{
          p: 0,
          backgroundColor: '#f9f9f9',
        }}
      >
        {/* Info de la solicitud */}
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            backgroundColor: '#fff',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Solicitud de Financiamiento
          </Typography>
          <Typography variant="h6" fontWeight={600}>
            {financing?.supplier_name || financing?.requested_by || 'N/A'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {documents.length} {documents.length === 1 ? 'documento disponible' : 'documentos disponibles'}
          </Typography>
        </Box>

        {/* Lista de documentos */}
        <List 
          sx={{ 
            p: { xs: 1, sm: 2 },
            maxHeight: { xs: '450px', sm: '480px' }, // Altura para ~5 documentos
            overflowY: 'auto', // Scrollbar interna cuando hay más de 5
          }}
        >
          {documents.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No hay documentos disponibles
              </Typography>
            </Box>
          ) : (
            documents.map((doc, index) => (
              <React.Fragment key={doc.id}>
                <ListItem
                  disablePadding
                  sx={{
                    mb: index < documents.length - 1 ? 1 : 0,
                    backgroundColor: '#fff',
                    borderRadius: 1,
                    border: 1,
                    borderColor: 'divider',
                    '&:hover': {
                      borderColor: SELLSI_BLUE,
                      boxShadow: 1,
                    },
                  }}
                >
                  <ListItemButton
                    onClick={() => handleDownloadFile(doc)}
                    sx={{
                      py: { xs: 1.5, sm: 2 },
                      px: { xs: 2, sm: 2.5 },
                    }}
                  >
                    {/* Ícono del archivo */}
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {getFileIcon(doc.name)}
                    </ListItemIcon>

                    {/* Nombre y tamaño del archivo */}
                    <ListItemText
                      primary={doc.name}
                      secondary={formatFileSize(doc.size)}
                      primaryTypographyProps={{
                        fontSize: { xs: '0.875rem', sm: '0.95rem' },
                        fontWeight: 500,
                      }}
                      secondaryTypographyProps={{
                        fontSize: { xs: '0.75rem', sm: '0.8rem' },
                      }}
                    />

                    {/* Botón de descarga */}
                    <IconButton
                      edge="end"
                      sx={{
                        color: SELLSI_BLUE,
                        '&:hover': {
                          backgroundColor: 'rgba(46, 82, 178, 0.08)',
                        },
                      }}
                    >
                      <DownloadIcon />
                    </IconButton>
                  </ListItemButton>
                </ListItem>
              </React.Fragment>
            ))
          )}
        </List>
      </DialogContent>

      {/* Footer */}
      <DialogActions sx={MODAL_DIALOG_ACTIONS_STYLES}>
        <Button onClick={handleClose} variant="outlined" sx={MODAL_CANCEL_BUTTON_STYLES}>
          Cerrar
        </Button>
        <Button 
          onClick={handleDownloadAll} 
          variant="contained" 
          disabled={documents.length === 0}
          sx={{
            ...MODAL_SUBMIT_BUTTON_STYLES,
            minWidth: { xs: 'auto', sm: '160px' },
          }}
        >
          Descargar Todo
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DownloadablesModal;
