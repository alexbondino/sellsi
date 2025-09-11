import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography, Button, IconButton, TextField, Tooltip, Stack } from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CheckIcon from '@mui/icons-material/Check';
import ShippingRegionsModal from '../../../../../shared/components/modals/ShippingRegionsModal';
import { ShippingRegionsDisplay } from '../../../../../shared/components/display/ShippingRegionsDisplay';
import { convertModalRegionsToDisplay, convertFormRegionsToDb } from '../../../../../utils/shippingRegionsUtils';
import { useShippingRegionPresets } from '../../../hooks/useShippingRegionPresets';

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
  supplierId, // inyectado desde el contenedor para estabilidad
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  // Snapshot interno para evitar parpadeos cuando props cambian durante un update
  const [displayRegions, setDisplayRegions] = useState(formData.shippingRegions || []);
  // supplierId ahora llega por props (evita relecturas y facilita test)
  const { presets, loading: presetsLoading, saving: presetsSaving, savePreset, rename, getPresetByIndex } = useShippingRegionPresets(supplierId);
  const [activePreset, setActivePreset] = useState(null); // 1..3
  const [renamingIndex, setRenamingIndex] = useState(null);
  const [tempName, setTempName] = useState('');
  const [baselineHash, setBaselineHash] = useState(''); // Hash de la última aplicación/guardado del preset activo

  // Utilidad: genera hash normalizado de regiones (ordenadas por region)
  const computeRegionsHash = (regions = []) => {
    if (!regions || regions.length === 0) return 'empty';
    const norm = regions.map(r => {
      const region = r.region || r.value;
      const price = parseInt(r.price != null ? r.price : (r.shippingValue || 0), 10) || 0;
      const days = parseInt(r.delivery_days != null ? r.delivery_days : (r.maxDeliveryDays || 0), 10) || 0;
      return { region, price, days };
    }).sort((a,b)=> a.region.localeCompare(b.region));
    return norm.map(x => `${x.region}:${x.price}:${x.days}`).join('|');
  };

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

  // Detectar si snapshot difiere del preset activo
  // Dirty detection basada en hash vs baselineHash
  const currentHash = useMemo(() => computeRegionsHash(displayRegions), [displayRegions]);
  const presetDirty = useMemo(() => {
    if (!activePreset) return false; // no hay preset activo -> no preguntamos
    return currentHash !== baselineHash;
  }, [activePreset, currentHash, baselineHash]);

  const handleApplyPreset = (index) => {
    const preset = getPresetByIndex(index);
    // Si el preset existe y contiene regiones, aplicarlas.
    // Si no existe o no tiene regiones guardadas, limpiar las regiones mostradas
    // para que no se muestre nada debajo (UX requirement).
    if (preset && Array.isArray(preset.regionsDisplay) && preset.regionsDisplay.length > 0) {
      setDisplayRegions(preset.regionsDisplay);
      onRegionChange(preset.regionsDisplay);
      setActivePreset(index);
      // Baseline hash se deriva del formato display aplicado
      const newHash = computeRegionsHash(preset.regionsDisplay);
      setBaselineHash(newHash);
    } else {
      // Preset vacío o no guardado: limpiar snapshot y notificar al padre
      setDisplayRegions([]);
      onRegionChange([]);
      setActivePreset(index);
      // Baseline es vacio
      setBaselineHash(computeRegionsHash([]));
    }
  };

  const handleSavePreset = async () => {
    let idx = activePreset;
    if (!idx) {
      const used = presets.map(p=>p.index);
      idx = [1,2,3].find(i => !used.includes(i)) || 1;
      setActivePreset(idx);
    }
    const preset = getPresetByIndex(idx);
    const name = preset?.name || `Config. ${idx}`;
    await savePreset(idx, name, displayRegions);
    // Actualizar baseline tras guardar
    setBaselineHash(computeRegionsHash(displayRegions));
  };

  const MAX_NAME_LENGTH = 15;

  const startRenaming = (index) => {
    const preset = getPresetByIndex(index);
    setRenamingIndex(index);
    setTempName((preset?.name || `Config. ${index}`).slice(0, MAX_NAME_LENGTH));
  };

  const commitRename = async () => {
    if (!renamingIndex) return;
    const name = tempName.trim();
    if (name) {
      await rename(renamingIndex, name);
    }
    setRenamingIndex(null);
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
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'black', mb: 1, textAlign: 'left', width: '100%' }}>
          Despacho
        </Typography>
      )}

      {/* Barra de Presets */}
      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 1, mb: 1 }}>
        {[1,2,3].map(idx => {
          const preset = getPresetByIndex(idx);
          const isActive = activePreset === idx;
          const isRenaming = renamingIndex === idx;
          return (
            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Button
                variant={isActive ? 'contained' : 'outlined'}
                size="small"
                onClick={() => handleApplyPreset(idx)}
                disabled={freezeDisplay || presetsLoading || presetsSaving}
                sx={{ textTransform: 'none', fontWeight: 500, minWidth: 96 }}
              >
                {isRenaming ? 'Renombrar' : (preset?.name || `Config. ${idx}`)}
              </Button>
              {preset && !isRenaming && (
                <Tooltip title="Renombrar">
                  <IconButton size="small" onClick={() => startRenaming(idx)} disabled={freezeDisplay || presetsSaving}>
                    <EditIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              )}
              {isRenaming && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <TextField size="small" value={tempName} autoFocus onChange={e=>setTempName(e.target.value.slice(0, MAX_NAME_LENGTH))} onBlur={commitRename} inputProps={{ maxLength: MAX_NAME_LENGTH }} onKeyDown={e=>{ if(e.key==='Enter'){ commitRename(); } if(e.key==='Escape'){ setRenamingIndex(null);} }} sx={{ width:140 }} />
                  <IconButton size="small" onMouseDown={commitRename}><CheckIcon fontSize="inherit"/></IconButton>
                </Stack>
              )}
            </Box>
          );
        })}
        <Tooltip title={activePreset ? (presetDirty ? 'Guardar cambios en preset' : 'Sin cambios') : 'Guardar en un preset'}>
          <span>
            <Button
              variant="outlined"
              size="small"
              startIcon={<SaveIcon />}
              disabled={freezeDisplay || displayRegions.length===0 || presetsSaving || (!presetDirty && !!activePreset)}
              onClick={handleSavePreset}
              sx={{ textTransform: 'none', fontWeight:600 }}
            >
              Guardar
            </Button>
          </span>
        </Tooltip>
      </Box>

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
