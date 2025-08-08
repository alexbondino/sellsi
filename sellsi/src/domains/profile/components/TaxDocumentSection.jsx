import React from 'react';
import { Box } from '@mui/material';

// Mantener componente por compatibilidad si fuese importado, pero sin render (selector ahora vive en Información General)
const TaxDocumentSection = () => {
  return <Box sx={{ display: 'none' }} />;
};

export default TaxDocumentSection;
