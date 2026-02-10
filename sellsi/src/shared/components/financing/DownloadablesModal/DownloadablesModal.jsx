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
 * - Carga documentos reales desde financing_documents
 * - Detecta contexto (buyer/supplier) para mostrar nombre correcto
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
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
  CircularProgress,
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
import { getFinancingDocuments, downloadFinancingDocument } from '../../../services/financingDocumentsService';

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
  const location = useLocation();

  // Detectar contexto: buyer o supplier
  const isBuyerView = location.pathname.includes('/buyer/');
  const isSupplierView = location.pathname.includes('/supplier/');
  
  // Estados
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Bloquear scroll cuando el modal está abierto
  useBodyScrollLock(open);

  // Cargar documentos cuando se abre el modal
  const loadDocuments = useCallback(async () => {
    if (!financing?.id) return;
    
    setLoading(true);
    try {
      console.log('📄 Cargando documentos para financing:', financing.id);
      const docs = await getFinancingDocuments(financing.id);
      console.log('📄 Documentos cargados:', docs?.length || 0);
      setDocuments(docs || []);
    } catch (error) {
      console.error('❌ Error cargando documentos:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [financing?.id]);

  useEffect(() => {
    if (open && financing?.id) {
      loadDocuments();
    } else {
      // Limpiar documentos cuando se cierra
      setDocuments([]);
    }
  }, [open, financing?.id, loadDocuments]);

  // Determinar nombre a mostrar según contexto
  const getDisplayName = () => {
    if (isBuyerView) {
      // Si es buyer, mostrar nombre del supplier
      return financing?.supplier_name || financing?.supplier?.name || 'Proveedor';
    } else if (isSupplierView) {
      // Si es supplier, mostrar nombre del buyer
      return financing?.buyer_user_nm || financing?.buyer?.user_nm || financing?.legal_name || 'Comprador';
    }
    // Fallback
    return financing?.buyer_user_nm || financing?.requested_by || 'N/A';
  };

  // Handler para descargar todos los documentos
  const handleDownloadAll = async () => {
    console.log('📥 Descargando todos los documentos');
    if (documents.length > 0) {
      for (const doc of documents) {
        await handleDownloadFile(doc);
        // Pequeño delay entre descargas para no sobrecargar
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  };

  const handleDownloadFile = async (doc) => {
    if (downloading) return; // Prevenir múltiples descargas simultáneas
    
    setDownloading(true);
    try {
      console.log('🔽 Descargando archivo:', doc.document_name || doc.name);
      
      // Descarga real desde storage
      const storagePath = doc.storage_path || doc.file_path;
      if (!storagePath) {
        throw new Error('No se encontró la ruta del documento');
      }
      
      console.log('[DownloadablesModal] Descargando desde:', storagePath);
      const blob = await downloadFinancingDocument(storagePath);
      
      // Crear URL local del blob y forzar descarga sin cambiar de página
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.document_name || doc.name || 'documento.pdf';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      console.log('✅ Documento descargado exitosamente:', doc.document_name || doc.name);
    } catch (error) {
      console.error('❌ Error descargando archivo:', error);
      alert(`Error al descargar: ${error.message}`);
    } finally {
      setDownloading(false);
    }
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
            {getDisplayName()}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {loading ? 'Cargando documentos...' : `${documents.length} ${documents.length === 1 ? 'documento disponible' : 'documentos disponibles'}`}
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
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : documents.length === 0 ? (
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
                    disabled={downloading}
                    sx={{
                      py: { xs: 1.5, sm: 2 },
                      px: { xs: 2, sm: 2.5 },
                    }}
                  >
                    {/* Ícono del archivo */}
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {getFileIcon(doc.document_name || doc.name || '')}
                    </ListItemIcon>

                    {/* Nombre y tamaño del archivo */}
                    <ListItemText
                      primary={doc.document_name || doc.name || 'Sin nombre'}
                      secondary={formatFileSize(doc.file_size || doc.size || 0)}
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
                      disabled={downloading}
                      sx={{
                        color: SELLSI_BLUE,
                        '&:hover': {
                          backgroundColor: 'rgba(46, 82, 178, 0.08)',
                        },
                      }}
                    >
                      {downloading ? <CircularProgress size={20} /> : <DownloadIcon />}
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
          disabled={documents.length === 0 || loading || downloading}
          sx={{
            ...MODAL_SUBMIT_BUTTON_STYLES,
            minWidth: { xs: 'auto', sm: '160px' },
          }}
        >
          {downloading ? 'Descargando...' : 'Descargar Todo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DownloadablesModal;