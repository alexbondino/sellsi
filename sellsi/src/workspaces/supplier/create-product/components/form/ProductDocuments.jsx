import React from 'react';
import { Box, Typography } from '@mui/material';
import { FileUploader } from '../../../../../shared/components/forms';

/**
 * Componente para la gestión de documentación técnica del producto
 * Maneja la carga de archivos PDF
 */
const ProductDocuments = ({
  formData,
  errors,
  onDocumentsChange,
}) => {
  return (
    <Box className="full-width">
      <Typography
        variant="h6"
        gutterBottom
        sx={{ fontWeight: 600, color: 'black', mb: 2 }}
      >
        Documentación Técnica
      </Typography>
      <FileUploader
        files={formData.documentos}
        onFilesChange={onDocumentsChange}
        maxFiles={3}
        acceptedTypes=".pdf,application/pdf"
        title="Agregar documentos PDF"
        description="Arrastra y suelta archivos PDF aquí o haz clic para seleccionar"
        helpText="Solo archivos PDF • Máximo 5MB por archivo • Hasta 3 archivos"
        error={errors.documentos}
        showUploadButton={false}
        allowPreview={true}
      />
    </Box>
  );
};

export default ProductDocuments;
