import React, { useState } from 'react';
import ImportExcel from '../../../../ui-components/imports/ImportExcel';
import { downloadExcelTemplate } from '../../../../ui-components/templates/ExcelTemplateGenerator';
import { Box, Button } from '@mui/material';

// Definición de los campos requeridos para el Excel con descripciones
const PRODUCT_IMPORT_FIELDS = [
  {
    key: 'productnm',
    label: 'Texto',
    description: 'Nombre completo del producto.',
  },
  {
    key: 'category',
    label: 'Texto',
    description: (
      <>
        Categoría a la que pertenece el producto.{' '}
        <a
          href="/ui-components/imports/category-dictionary"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#1976d2',
            textDecoration: 'underline',
            fontWeight: 500,
          }}
        >
          ver diccionario de categorías
        </a>
      </>
    ),
  },
  {
    key: 'description',
    label: 'Texto',
    description: 'Descripción breve del producto.',
  },
  {
    key: 'productqty',
    label: 'Número Entero',
    description: 'Cantidad disponible para la venta.',
  },
  {
    key: 'price',
    label: 'Número Entero',
    description: 'Precio unitario del producto.',
  },
  {
    key: 'minimum_purchase',
    label: 'Número Entero',
    description: 'Cantidad mínima que se puede comprar.',
  },
  {
    key: 'image_urls',
    label: 'URL de imagen (opcional)',
    description:
      'URL directa de la imagen del producto. Si se provee, la imagen será descargada y subida al bucket de productos.',
    optional: true,
  },
];

const MassiveProductImport = ({ open, onClose, onSuccess }) => {
  // Para el template y el import, solo se pasan los keys
  const fieldKeys = PRODUCT_IMPORT_FIELDS.map(f => f.key);
  // Obtener el userId del localStorage
  const userId = localStorage.getItem('user_id');
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
            downloadExcelTemplate(fieldKeys, 'productos_template.xlsx')
          }
        >
          Descargar template
        </Button>
        <ImportExcel
          table="products"
          fields={fieldKeys}
          userId={userId}
          onSuccess={onSuccess}
          buttonProps={{ variant: 'contained' }}
        />
      </Box>
      <Box
        sx={{
          color: 'text.secondary',
          fontSize: 16,
          maxWidth: 500,
          mx: 'auto',
          mt: 2,
        }}
      >
        <div style={{ fontWeight: 500, marginBottom: 8 }}>
          Los campos requeridos en el Excel son:
        </div>
        <ul style={{ textAlign: 'left', paddingLeft: 24, margin: 0 }}>
          {PRODUCT_IMPORT_FIELDS.map(field => (
            <li key={field.key} style={{ marginBottom: 6 }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                {field.key}
              </span>
              {field.optional ? (
                <span style={{ color: '#888', marginLeft: 4 }}>(opcional)</span>
              ) : null}
              {': '}
              <span style={{ fontWeight: 500 }}>{field.label}</span>
              <span style={{ color: '#888', marginLeft: 4 }}>
                – {field.description}
              </span>
            </li>
          ))}
        </ul>
      </Box>
    </Box>
  );
};

export default MassiveProductImport;
