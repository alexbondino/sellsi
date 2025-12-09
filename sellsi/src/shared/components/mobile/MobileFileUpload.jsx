import React, { useRef } from 'react'
import { Box, Button, Typography } from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'

/**
 * MobileFileUpload - Componente para subir archivos en mobile
 * Patrón useRef para input hidden + Button trigger
 *
 * @param {File|null} file - Archivo seleccionado
 * @param {string|null} error - Mensaje de error de validación
 * @param {Function} onChange - Callback cuando cambia el archivo (event)
 * @param {string} label - Etiqueta del campo
 * @param {string} accept - Tipos de archivos aceptados (ej: "application/pdf")
 */
const MobileFileUpload = ({ file, error, onChange, label, accept = '*' }) => {
  const fileInputRef = useRef(null)

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <Box sx={{ width: '100%' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={onChange}
        style={{ display: 'none' }}
      />

      <Button
        variant="outlined"
        fullWidth
        startIcon={<CloudUploadIcon />}
        onClick={handleButtonClick}
        sx={{
          justifyContent: 'flex-start',
          py: 1.5,
          borderColor: error ? 'error.main' : 'divider',
          color: error ? 'error.main' : 'text.primary',
        }}
      >
        {file ? file.name : label}
      </Button>

      {error && (
        <Typography
          variant="caption"
          color="error"
          sx={{ display: 'block', mt: 0.5, ml: 1.5 }}
        >
          {error}
        </Typography>
      )}
    </Box>
  )
}

export default MobileFileUpload
