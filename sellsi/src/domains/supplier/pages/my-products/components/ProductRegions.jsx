import React, { useEffect, useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import ShippingRegionsModal from '../../../../../shared/components/modals/ShippingRegionsModal';
import { ShippingRegionsDisplay } from '../../../../../shared/components/display/ShippingRegionsDisplay';
import { convertModalRegionsToDisplay, convertFormRegionsToDb } from '../../../../../utils/shippingRegionsUtils';

/**
 * Componente para la configuración de regiones de despacho
 * Maneja la configuración de regiones con valores y tiempos de despacho
 */
const ProductRegions = ({
  formData,
  onRegionChange,
  errors,
  localErrors,
  triedSubmit,
  isMobile = false, // 🔧 Nueva prop para móvil
  freezeDisplay = false, // 🔧 Nuevo: congelar UI durante submit/update
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  // Snapshot interno para evitar parpadeos cuando props cambian durante un update
  const [displayRegions, setDisplayRegions] = useState(formData.shippingRegions || []);

  // Mantener el snapshot sincronizado solo cuando NO está congelado
  useEffect(() => {
    if (!freezeDisplay) {
      setDisplayRegions(formData.shippingRegions || []);
    }
  }, [formData.shippingRegions, freezeDisplay]);

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleSaveRegions = (regions) => {
    console.log('[ProductRegions] handleSaveRegions - Datos recibidos del modal:', regions);
    
    // Convertir datos del modal al formato de display y formulario
    const displayRegions = convertModalRegionsToDisplay(regions);
    console.log('[ProductRegions] handleSaveRegions - Datos convertidos para display:', displayRegions);
    
  // Actualizar snapshot local y formData con las nuevas regiones
  setDisplayRegions(displayRegions);
  onRegionChange(displayRegions);
    console.log('[ProductRegions] handleSaveRegions - Datos enviados a onRegionChange:', displayRegions);
    
    setModalOpen(false);
  };

  // Preparar datos para el modal (convertir de formato display a formato BD)
  const prepareModalData = () => {
  const modalData = convertFormRegionsToDb(displayRegions);
    return modalData;
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
        position: 'relative',
        zIndex: 1, // Reducir z-index para que no interfiera con dropdowns
      }}
    >
      {!isMobile && (
        <Typography
          variant="h6"
          gutterBottom
          sx={{ fontWeight: 600, color: 'black', mb: 2, textAlign: 'left', width: '100%' }}
        >
          Despacho
        </Typography>
      )}

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
          borderColor: 'grey.400',
          '&:hover': {
            borderColor: 'grey.500',
          },
        }}
        disabled={freezeDisplay}
      >
        Configurar Regiones de Despacho
      </Button>

      {/* Mostrar las regiones configuradas */}
      <Box sx={{ width: '100%' }}>
        <ShippingRegionsDisplay regions={displayRegions} />
      </Box>

      {/* Mostrar errores de validación */}
      {(triedSubmit && (errors?.shippingRegions || localErrors?.shippingRegions)) && (
        <Typography
          variant="caption"
          color="error"
          display="block"
          sx={{ mt: 1 }}
        >
          {errors?.shippingRegions || localErrors?.shippingRegions}
        </Typography>
      )}

      {/* Modal para configurar regiones */}
      <ShippingRegionsModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveRegions}
        initialData={prepareModalData()}
      />
    </Box>
  );
};

export default ProductRegions;
