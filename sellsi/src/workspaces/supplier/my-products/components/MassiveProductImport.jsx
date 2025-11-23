import React, { useState } from 'react';
import ImportExcel from '../../../../ui-components/imports/ImportExcel';
import { downloadExcelTemplate } from '../../../../ui-components/templates/ExcelTemplateGenerator';
import { Box, Button } from '@mui/material';

// Definición de los campos requeridos para el Excel
const PRODUCT_IMPORT_FIELDS = [
  'productnm',
  'category',
  'description',
  'productqty',
  'price',
  'minimum_purchase',
  'product_type',
];

const MassiveProductImport = ({ open, onClose, onSuccess }) => {
  return (
    <Box>
      <Box
        sx={{
          mb: 2,
          display: 'flex',
          gap: 2,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Button
          variant="outlined"
          onClick={() =>
            downloadExcelTemplate(
              PRODUCT_IMPORT_FIELDS,
              'productos_template.xlsx'
            )
          }
        >
          Descargar template
        </Button>
        <ImportExcel
          table="products"
          fields={PRODUCT_IMPORT_FIELDS}
          onSuccess={onSuccess}
          buttonProps={{ variant: 'contained' }}
        />
      </Box>
      <Box sx={{ textAlign: 'center', color: 'text.secondary', fontSize: 16 }}>
        Los campos requeridos en el Excel son:
        <br />
        <span style={{ fontFamily: 'monospace', fontSize: 15 }}>
          {PRODUCT_IMPORT_FIELDS.join(', ')}
        </span>
      </Box>
    </Box>
  );
};

export default MassiveProductImport;
