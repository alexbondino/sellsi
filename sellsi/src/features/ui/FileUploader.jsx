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
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  FileDownload as DownloadIcon,
} from '@mui/icons-material'

/**
 * FileUploader - Componente UI reutilizable para subir múltiples archivos
 * Soporta diferentes tipos de archivos con configuración flexible
 *
 * @param {Array} files - Array de archivos actuales
 * @param {Function} onFilesChange - Callback cuando cambien los archivos
 * @param {number} maxFiles - Número máximo de archivos permitidos
 * @param {number} maxSize - Tamaño máximo por archivo en bytes
 * @param {string} acceptedTypes - Tipos de archivo aceptados
 * @param {string} error - Mensaje de error a mostrar
 * @param {string} title - Título del uploader
 * @param {string} description - Descripción del uploader
 * @param {string} helpText - Texto de ayuda adicional
 * @param {Function} onError - Callback para manejar errores
 * @param {Function} onUpload - Callback opcional para subir archivos
 * @param {boolean} showUploadButton - Mostrar botón de subida
 * @param {boolean} showProgress - Mostrar barra de progreso
 * @param {boolean} allowPreview - Permitir preview/descarga
 */
const FileUploader = ({
  files = [],
  onFilesChange,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB por defecto
  acceptedTypes = '*/*',
  error,
  title = 'Agregar archivos',
  description = 'Arrastra y suelta archivos aquí o haz clic para seleccionar',
  helpText,
  onError,
  onUpload,
  showUploadButton = false,
  showProgress = false,
  allowPreview = true,
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

  const getFileIcon = (mimeType) => {
    if (mimeType.includes('pdf')) return <PdfIcon color="error" />
    if (mimeType.includes('image')) return <ImageIcon color="primary" />
    return <FileIcon color="action" />
  }

  const getFileTypeColor = (mimeType) => {
    if (mimeType.includes('pdf')) return 'error'
    if (mimeType.includes('image')) return 'primary'
    if (mimeType.includes('video')) return 'secondary'
    if (mimeType.includes('audio')) return 'info'
    return 'default'
  }

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files)
    processFiles(selectedFiles)
    // Reset input para permitir seleccionar el mismo archivo
    event.target.value = ''
  }

  const processFiles = (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return

    // Validar límite de archivos
    if (files.length + selectedFiles.length > maxFiles) {
      const errorMsg = `Máximo ${maxFiles} archivos permitidos`
      onError?.(errorMsg)
      return
    }

    // Validar cada archivo
    const validFiles = []
    const errors = []

    for (const file of selectedFiles) {
      // Validar tipo si se especifica
      if (acceptedTypes !== '*/*') {
        const isValidType = acceptedTypes.split(',').some((type) => {
          const cleanType = type.trim()
          if (cleanType.startsWith('.')) {
            return file.name.toLowerCase().endsWith(cleanType.toLowerCase())
          }
          return file.type.includes(cleanType)
        })

        if (!isValidType) {
          errors.push(`${file.name}: Tipo de archivo no permitido`)
          continue
        }
      }

      // Validar tamaño
      if (file.size > maxSize) {
        errors.push(`${file.name}: Debe ser menor a ${formatFileSize(maxSize)}`)
        continue
      }

      validFiles.push(file)
    }

    // Mostrar errores si los hay
    errors.forEach((error) => onError?.(error))

    if (validFiles.length === 0) return

    // Crear objetos de archivo para el estado local
    const newFiles = validFiles.map((file) => ({
      id: Date.now() + Math.random(),
      file,
      fileName: file.name,
      size: file.size,
      type: file.type,
      status: 'local', // local, uploading, uploaded, error
      uploadedAt: new Date().toISOString(),
    }))

    // Agregar al estado inmediatamente para preview
    onFilesChange([...files, ...newFiles])
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

    const droppedFiles = Array.from(event.dataTransfer.files)
    processFiles(droppedFiles)
  }

  const removeFile = (fileId) => {
    const newFiles = files.filter((file) => file.id !== fileId)
    onFilesChange(newFiles)
  }

  const handleUpload = async () => {
    if (!onUpload) return

    const localFiles = files.filter((file) => file.status === 'local')
    if (localFiles.length === 0) return

    setUploading(true)

    try {
      await onUpload(localFiles)
    } catch (error) {
      onError?.('Error al subir archivos')
    } finally {
      setUploading(false)
    }
  }

  const downloadFile = (file) => {
    if (file.publicUrl) {
      window.open(file.publicUrl, '_blank')
    } else if (file.file) {
      // Para archivos locales, crear URL temporal
      const url = URL.createObjectURL(file.file)
      const a = document.createElement('a')
      a.href = url
      a.download = file.fileName
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const canAddMore = files.length < maxFiles
  const hasLocalFiles = files.some((file) => file.status === 'local')

  // Generar texto de ayuda automático si no se proporciona
  const autoHelpText =
    helpText ||
    `${acceptedTypes} • Máximo ${formatFileSize(
      maxSize
    )} por archivo • Hasta ${maxFiles} archivos`

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
            <AddIcon
              sx={{
                fontSize: 48,
                color: dragOver ? 'primary.main' : 'text.secondary',
              }}
            />
            <Typography variant="h6" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {autoHelpText}
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Barra de progreso durante upload */}
      {showProgress && uploading && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Procesando archivos...
          </Typography>
        </Box>
      )}

      {/* Preview de archivos */}
      {files.length > 0 && (
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
              Archivos seleccionados ({files.length}/{maxFiles})
            </Typography>
            {showUploadButton && hasLocalFiles && onUpload && (
              <Button
                variant="contained"
                size="small"
                onClick={handleUpload}
                disabled={uploading}
                startIcon={<CloudUploadIcon />}
                sx={{ textTransform: 'none' }}
              >
                Subir archivos
              </Button>
            )}
          </Box>{' '}
          <Grid container spacing={2}>
            {files.map((file) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={file.id}>
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
                      {getFileIcon(file.type)}
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
                        {file.fileName}
                      </Typography>
                    </Box>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      {formatFileSize(file.size)}
                    </Typography>

                    {/* Estado del archivo */}
                    <Box sx={{ mt: 1 }}>
                      {file.status === 'local' && (
                        <Chip label="Local" size="small" color="default" />
                      )}
                      {file.status === 'uploading' && (
                        <Chip
                          label="Subiendo..."
                          size="small"
                          color="primary"
                        />
                      )}
                      {file.status === 'uploaded' && (
                        <Chip label="Subido" size="small" color="success" />
                      )}
                      {file.status === 'error' && (
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
                      {allowPreview && (file.publicUrl || file.file) && (
                        <IconButton
                          size="small"
                          onClick={() => downloadFile(file)}
                          title="Descargar/Ver"
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => removeFile(file.id)}
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
      {canAddMore && files.length > 0 && (
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={openFileDialog}
          sx={{ textTransform: 'none', mb: 2 }}
          disabled={uploading}
        >
          Agregar más archivos
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
    </Box>
  )
}

export default FileUploader
