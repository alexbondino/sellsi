import React, { useRef, useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  LinearProgress,
  Chip,
  alpha,
  useTheme,
} from '@mui/material'
import {
  CloudUpload as CloudUploadIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  PictureAsPdf as PdfIcon,
  FileDownload as DownloadIcon,
} from '@mui/icons-material'
import { toast } from 'react-hot-toast'
import UploadService from '../../../services/uploadService'

/**
 * PDFUploader - Componente optimizado para subir múltiples archivos PDF
 * Basado en el patrón de ImageUploader pero adaptado para documentos técnicos
 */
const PDFUploader = ({
  documents = [],
  onDocumentsChange,
  maxFiles = 3,
  maxSize = 5 * 1024 * 1024, // 5MB por defecto
  error,
}) => {
  const theme = useTheme()
  const fileInputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files)
    processFiles(files)
    // Reset input para permitir seleccionar el mismo archivo
    event.target.value = ''
  }

  const processFiles = async (files) => {
    if (!files || files.length === 0) return

    // Validar límite de archivos
    if (documents.length + files.length > maxFiles) {
      toast.error(`Máximo ${maxFiles} archivos permitidos`)
      return
    }

    // Validar cada archivo
    const validFiles = []
    for (const file of files) {
      // Validar que sea PDF
      if (file.type !== 'application/pdf') {
        toast.error(`${file.name}: Solo se permiten archivos PDF`)
        continue
      }

      // Validar tamaño
      if (file.size > maxSize) {
        toast.error(`${file.name}: Debe ser menor a ${formatFileSize(maxSize)}`)
        continue
      }

      validFiles.push(file)
    }

    if (validFiles.length === 0) return

    // Crear objetos de documento para el estado local (sin subir aún)
    const newDocuments = validFiles.map((file) => ({
      id: Date.now() + Math.random(),
      file,
      fileName: file.name,
      size: file.size,
      type: file.type,
      status: 'local', // local, uploading, uploaded, error
      uploadedAt: new Date().toISOString(),
    }))

    // Agregar al estado inmediatamente para preview
    onDocumentsChange([...documents, ...newDocuments])

    toast.success(`${validFiles.length} archivo(s) agregado(s)`)
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (event) => {
    event.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragOver(false)

    const files = Array.from(event.dataTransfer.files)
    processFiles(files)
  }

  const removeDocument = async (documentId) => {
    const documentToRemove = documents.find((doc) => doc.id === documentId)

    try {
      // Si el documento está en el servidor, eliminarlo
      if (documentToRemove.filePath && documentToRemove.status === 'uploaded') {
        setUploading(true)
        const deleteResult = await UploadService.deletePDF(
          documentToRemove.filePath
        )
        if (!deleteResult.success) {
          toast.error('Error al eliminar archivo del servidor')
          return
        }
      }

      // Remover del estado local
      const newDocuments = documents.filter((doc) => doc.id !== documentId)
      onDocumentsChange(newDocuments)

      toast.success('Archivo eliminado')
    } catch (error) {
      console.error('Error removing document:', error)
      toast.error('Error al eliminar archivo')
    } finally {
      setUploading(false)
    }
  }

  const uploadDocuments = async () => {
    const localDocuments = documents.filter((doc) => doc.status === 'local')

    if (localDocuments.length === 0) {
      toast.info('No hay archivos nuevos para subir')
      return
    }

    setUploading(true)

    try {
      // Simular IDs de producto y proveedor (en la implementación real vendrían como props)
      const productId = 'temp-' + Date.now()
      const supplierId = 'supplier-' + Date.now()

      // Actualizar estado a "uploading"
      const updatedDocs = documents.map((doc) =>
        localDocuments.find((local) => local.id === doc.id)
          ? { ...doc, status: 'uploading' }
          : doc
      )
      onDocumentsChange(updatedDocs)

      // Subir archivos usando el servicio optimizado
      const filesToUpload = localDocuments.map((doc) => doc.file)
      const uploadResult = await UploadService.uploadMultiplePDFs(
        filesToUpload,
        productId,
        supplierId
      )

      if (uploadResult.success && uploadResult.data.length > 0) {
        // Actualizar documentos con información del servidor
        const finalDocs = documents.map((doc) => {
          const localDoc = localDocuments.find((local) => local.id === doc.id)
          if (localDoc) {
            const uploadedData = uploadResult.data.find(
              (uploaded) => uploaded.fileName === localDoc.fileName
            )
            if (uploadedData) {
              return {
                ...doc,
                ...uploadedData,
                status: 'uploaded',
              }
            }
          }
          return doc
        })

        onDocumentsChange(finalDocs)
        toast.success(
          `${uploadResult.data.length} archivo(s) subido(s) al servidor`
        )
      }

      if (uploadResult.errors && uploadResult.errors.length > 0) {
        // Marcar archivos con error
        const finalDocs = documents.map((doc) => {
          const localDoc = localDocuments.find((local) => local.id === doc.id)
          if (
            localDoc &&
            uploadResult.errors.some((error) =>
              error.includes(localDoc.fileName)
            )
          ) {
            return { ...doc, status: 'error' }
          }
          return doc
        })
        onDocumentsChange(finalDocs)

        uploadResult.errors.forEach((error) => toast.error(error))
      }
    } catch (error) {
      console.error('Error uploading files:', error)
      toast.error('Error al subir archivos')

      // Revertir estado a local en caso de error
      const revertedDocs = documents.map((doc) =>
        localDocuments.find((local) => local.id === doc.id)
          ? { ...doc, status: 'error' }
          : doc
      )
      onDocumentsChange(revertedDocs)
    } finally {
      setUploading(false)
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const downloadDocument = (document) => {
    if (document.publicUrl) {
      window.open(document.publicUrl, '_blank')
    } else if (document.file) {
      // Para archivos locales, crear URL temporal
      const url = URL.createObjectURL(document.file)
      const a = document.createElement('a')
      a.href = url
      a.download = document.fileName
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const canAddMore = documents.length < maxFiles
  const hasLocalFiles = documents.some((doc) => doc.status === 'local')

  return (
    <Box>
      {/* Area de drop/upload */}
      {canAddMore && (
        <Paper
          elevation={0}
          sx={{
            border: `2px dashed ${
              dragOver ? theme.palette.primary.main : theme.palette.divider
            }`,
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            bgcolor: dragOver
              ? alpha(theme.palette.primary.main, 0.05)
              : 'grey.50',
            mb: 2,
            '&:hover': {
              borderColor: theme.palette.primary.main,
              bgcolor: alpha(theme.palette.primary.main, 0.05),
            },
          }}
          onClick={openFileDialog}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <PdfIcon
              sx={{
                fontSize: 48,
                color: dragOver ? 'primary.main' : 'text.secondary',
              }}
            />
            <Typography variant="h6" color="text.secondary">
              Agregar documentos PDF
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Arrastra y suelta archivos PDF aquí o haz clic para seleccionar
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Solo archivos PDF • Máximo {formatFileSize(maxSize)} por archivo •
              Hasta {maxFiles} archivos
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Barra de progreso durante upload */}
      {uploading && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Subiendo archivos...
          </Typography>
        </Box>
      )}

      {/* Preview de documentos */}
      {documents.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Documentos técnicos ({documents.length}/{maxFiles})
            </Typography>
            {hasLocalFiles && (
              <Button
                variant="contained"
                size="small"
                onClick={uploadDocuments}
                disabled={uploading}
                startIcon={<CloudUploadIcon />}
                sx={{ textTransform: 'none' }}
              >
                Subir al servidor
              </Button>
            )}
          </Box>

          <Grid container spacing={2}>
            {documents.map((document) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={document.id}>
                <Card
                  elevation={2}
                  sx={{
                    position: 'relative',
                    '&:hover .action-buttons': {
                      opacity: 1,
                    },
                  }}
                >
                  <CardContent sx={{ pb: 1 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <PdfIcon color="error" />
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                        }}
                      >
                        {document.fileName}
                      </Typography>
                    </Box>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      {formatFileSize(document.size)}
                    </Typography>

                    {/* Estado del archivo */}
                    <Box sx={{ mt: 1 }}>
                      {document.status === 'local' && (
                        <Chip label="Local" size="small" color="default" />
                      )}
                      {document.status === 'uploading' && (
                        <Chip
                          label="Subiendo..."
                          size="small"
                          color="primary"
                        />
                      )}
                      {document.status === 'uploaded' && (
                        <Chip
                          label="En servidor"
                          size="small"
                          color="success"
                        />
                      )}
                      {document.status === 'error' && (
                        <Chip label="Error" size="small" color="error" />
                      )}
                    </Box>
                  </CardContent>

                  <CardActions sx={{ p: 1, pt: 0 }}>
                    <Box
                      className="action-buttons"
                      sx={{
                        display: 'flex',
                        gap: 1,
                        width: '100%',
                        opacity: { xs: 1, sm: 0 },
                        transition: 'opacity 0.2s ease',
                      }}
                    >
                      {(document.publicUrl || document.file) && (
                        <IconButton
                          size="small"
                          onClick={() => downloadDocument(document)}
                          title="Descargar/Ver"
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => removeDocument(document.id)}
                        color="error"
                        title="Eliminar"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Botón adicional para agregar más */}
      {canAddMore && documents.length > 0 && (
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={openFileDialog}
          sx={{ textTransform: 'none', mb: 2 }}
          disabled={uploading}
        >
          Agregar más documentos
        </Button>
      )}

      {/* Error */}
      {error && (
        <Typography
          variant="caption"
          color="error"
          display="block"
          sx={{ mt: 1 }}
        >
          {error}
        </Typography>
      )}

      {/* Info adicional */}
      {documents.length === 0 && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
          <Typography
            variant="body2"
            color="info.main"
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <PdfIcon fontSize="small" />
            Los documentos técnicos ayudan a los compradores a conocer mejor tu
            producto
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default PDFUploader
