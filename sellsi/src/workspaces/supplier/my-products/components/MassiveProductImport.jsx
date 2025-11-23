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
    <>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
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
      </Box>
      <ImportExcel
        table="products"
        fields={PRODUCT_IMPORT_FIELDS}
        onSuccess={onSuccess}
      />
    </>
  );
};

export default MassiveProductImport;
