import React from 'react';
import {
  Box,
  Typography,
  Button
} from '@mui/material';
import { TaxDocumentSelector, BillingInfoForm } from '../../../shared/components';
import BillingInfoSection from './sections/BillingInfoSection';

const TaxDocumentSection = ({ 
  formData, 
  onFieldChange,
  onRegionChange,
  hasChanges,
  loading,
  onUpdate,
  getSensitiveFieldValue,
  onFocusSensitive,
  onBlurSensitive
}) => {
  return (
    <Box sx={{ 
      p: 3, 
      height: 'fit-content',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100%' 
    }}>
      <Typography variant="h6" sx={{ mb: 2, pb: 1, borderBottom: 2, borderColor: 'primary.main' }}>
        Documento Tributario
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {/* Selector de tipo de documento usando componente modular */}
        <TaxDocumentSelector
          documentTypes={formData.documentTypes}
          onDocumentTypesChange={(types) => onFieldChange('documentTypes', types)}
          showTitle={false}
          size="medium"
        />
        
        {/* Información de Facturación - Solo se muestra si se selecciona "factura" */}
        {formData.documentTypes && formData.documentTypes.includes('factura') && (
          <Box sx={{ mt: 3 }}>
            <BillingInfoSection 
              formData={formData}
              onFieldChange={onFieldChange}
              onRegionChange={onRegionChange}
              hasChanges={hasChanges}
              loading={loading}
              onUpdate={onUpdate}
              getSensitiveFieldValue={getSensitiveFieldValue}
              onFocusSensitive={onFocusSensitive}
              onBlurSensitive={onBlurSensitive}
              showUpdateButton={false}
            />
          </Box>
        )}
      </Box>
      
      {/* Botón Actualizar - Siempre al fondo del paper */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 'auto', pt: 3 }}>
        <Button 
          variant="contained" 
          onClick={onUpdate}
          disabled={!hasChanges || loading}
          sx={{ 
            bgcolor: 'primary.main',
            '&:hover': { bgcolor: 'primary.dark' }
          }}
        >
          {loading ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </Box>
    </Box>
  );
};

export default TaxDocumentSection;
