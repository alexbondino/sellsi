import React, { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import ShippingRegionsModal from '../../../ui/ShippingRegionsModal';
import ShippingRegionsDisplay from '../../../ui/ShippingRegionsDisplay';

/**
 * Componente para la configuración de regiones de despacho
 * Maneja la configuración de regiones con valores y tiempos de despacho
 */
const ProductRegions = ({
  formData,
  onRegionChange,
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  // Extraer las regiones de despacho del formData
  const shippingRegions = formData.shippingRegions || [];

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleSaveRegions = (regions) => {
    // Actualizar el formData con las nuevas regiones
    onRegionChange(regions);
    setModalOpen(false);
  };

  return (
    <Box
      className="full-width"
      sx={{
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        display: 'block',
        mx: 0,
      }}
    >
      <Typography
        variant="h6"
        gutterBottom
        sx={{ fontWeight: 600, color: 'black', mb: 2, textAlign: 'center', width: '100%' }}
      >
        Región de Despacho
      </Typography>

      {/* Botón para abrir el modal de configuración */}
      <Button
        variant="outlined"
        startIcon={<SettingsIcon />}
        onClick={handleOpenModal}
        sx={{
          textTransform: 'none',
          fontWeight: 500,
          mb: 2,
          borderRadius: 2,
        }}
      >
        Configurar Regiones de Despacho
      </Button>

      {/* Mostrar las regiones configuradas */}
      <Box sx={{ width: '100%' }}>
        <ShippingRegionsDisplay regions={shippingRegions} />
      </Box>

      {/* Modal para configurar regiones */}
      <ShippingRegionsModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveRegions}
        initialData={shippingRegions}
      />
    </Box>
  );
};

export default ProductRegions;
