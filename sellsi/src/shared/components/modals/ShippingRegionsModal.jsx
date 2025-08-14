import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Checkbox,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  useTheme,
  useMediaQuery,
  Paper,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  LocalShipping as LocalShippingIcon,
} from '@mui/icons-material';
import { regiones } from '../../../utils/chileData';
import { formatCurrency } from '../../utils/formatters';

/**
 * Modal para configurar regiones de despacho con valores y tiempos
 */
const ShippingRegionsModal = ({
  isOpen,
  onClose,
  onSave,
  initialData = [],
  loading = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Estado local para las regiones y sus configuraciones
  const [regionsConfig, setRegionsConfig] = useState([]);

  // Controlar scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      // Guardar el scroll actual antes de bloquearlo
      const scrollY = window.scrollY;
      
      // Aplicar estilos para bloquear scroll
      document.documentElement.style.position = 'fixed';
      document.documentElement.style.top = `-${scrollY}px`;
      document.documentElement.style.left = '0';
      document.documentElement.style.right = '0';
      document.documentElement.style.overflow = 'hidden';
      
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none'; // Prevenir scroll en mobile
      
      // Guardar posición para restaurar después
      document.body.dataset.scrollY = scrollY.toString();
      
      return () => {
        // Restaurar scroll del body
        const savedScrollY = parseInt(document.body.dataset.scrollY || '0');
        
        document.documentElement.style.position = '';
        document.documentElement.style.top = '';
        document.documentElement.style.left = '';
        document.documentElement.style.right = '';
        document.documentElement.style.overflow = '';
        
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
        
        // Restaurar posición de scroll
        window.scrollTo(0, savedScrollY);
        
        // Limpiar dataset
        delete document.body.dataset.scrollY;
      };
    }
  }, [isOpen]);

  // Función utilitaria para parsear valor de moneda
  const parseCurrencyValue = (value) => {
    if (!value || value === '') return '';
    const numericValue = parseFloat(value.toString().replace(/[^\d]/g, ''));
    if (isNaN(numericValue)) return '';
    return numericValue;
  };

  const extractNumericValue = (value) => {
    if (!value || value === '') return '';
    const numericString = value.toString().replace(/[^\d]/g, '');
    return numericString === '' ? '' : numericString;
  };

  // Mapeo de regiones a números romanos según el orden tradicional chileno
  const getRegionRomanNumber = (regionValue) => {
    const romanMap = {
      'arica-parinacota': 'XV',
      'tarapaca': 'I',
      'antofagasta': 'II',
      'atacama': 'III',
      'coquimbo': 'IV',
      'valparaiso': 'V',
      'metropolitana': 'RM',
      'ohiggins': 'VI',
      'maule': 'VII',
      'nuble': 'XVI',
      'biobio': 'VIII',
      'araucania': 'IX',
      'los-rios': 'XIV',
      'los-lagos': 'X',
      'aysen': 'XI',
      'magallanes': 'XII',
    };
    return romanMap[regionValue] || '';
  };

  // Inicializar estado cuando se abre el modal
  useEffect(() => {
    if (isOpen) {

      
      // Crear configuración inicial con todas las regiones
      const initialConfig = regiones.map(region => {
        // Buscar configuración existente por region
        const existingConfig = initialData.find(item => item.region === region.value);

        
        return {
          region: region.value,
          regionLabel: region.label,
          enabled: !!existingConfig,
          shippingValue: existingConfig ? formatCurrency(existingConfig.price) : '', // ✅ CORREGIDO: usar 'price' en lugar de 'shippingValue'
          maxDeliveryDays: existingConfig?.delivery_days || '', // ✅ CORREGIDO: usar 'delivery_days' en lugar de 'maxDeliveryDays'
        };
      });
      

      setRegionsConfig(initialConfig);
    }
  }, [isOpen, initialData]);

  // Manejar cambio en checkbox
  const handleCheckboxChange = (regionValue, checked) => {
    setRegionsConfig(prev => 
      prev.map(config => 
        config.region === regionValue 
          ? { ...config, enabled: checked, shippingValue: checked ? config.shippingValue : '', maxDeliveryDays: checked ? config.maxDeliveryDays : '' }
          : config
      )
    );
  };

  // Manejar cambio en campos de texto
  const handleFieldChange = (regionValue, field, value) => {
    // Solo permitir números en el campo shippingValue
    let newValue = value;
    if (field === 'shippingValue') {
      // Eliminar todo lo que no sea dígito
      newValue = value.replace(/[^0-9]/g, '');
    }
    setRegionsConfig(prev => 
      prev.map(config => 
        config.region === regionValue 
          ? { ...config, [field]: newValue }
          : config
      )
    );
  };

  // Manejar blur en campo de valor de despacho (formatear automáticamente)
  const handleShippingValueBlur = (regionValue, value) => {
    if (!value || value === '') return;
    
    const numericValue = extractNumericValue(value);
    if (numericValue !== '') {
      const formattedValue = formatCurrency(numericValue);
      setRegionsConfig(prev => 
        prev.map(config => 
          config.region === regionValue 
            ? { ...config, shippingValue: formattedValue }
            : config
        )
      );
    }
  };

  // Manejar focus en campo de valor de despacho (mostrar solo números)
  const handleShippingValueFocus = (regionValue, value) => {
    const numericValue = extractNumericValue(value);
    setRegionsConfig(prev => 
      prev.map(config => 
        config.region === regionValue 
          ? { ...config, shippingValue: numericValue }
          : config
      )
    );
  };

  // Validar que los campos requeridos estén completos
  const validateData = () => {
    const enabledRegions = regionsConfig.filter(config => config.enabled);
    
    for (const config of enabledRegions) {
      if (!config.shippingValue || !config.maxDeliveryDays) {
        return false;
      }
      
      // Extraer valor numérico para validación
      const numericShippingValue = extractNumericValue(config.shippingValue);
      
      // Validar que sean números válidos
      if (isNaN(numericShippingValue) || isNaN(config.maxDeliveryDays)) {
        return false;
      }
      
      // Validar que sean números positivos
      if (parseFloat(numericShippingValue) < 0 || parseInt(config.maxDeliveryDays) < 1) {
        return false;
      }
    }
    
    return enabledRegions.length > 0;
  };

  // Manejar guardado
  const handleSave = () => {

    
    if (!validateData()) {

      return;
    }


    
    const enabledRegions = regionsConfig
      .filter(config => config.enabled)
      .map(config => ({
        region: config.region,
        price: parseFloat(extractNumericValue(config.shippingValue)),
        delivery_days: parseInt(config.maxDeliveryDays),
      }));


    
    onSave(enabledRegions);
  };

  const isValid = validateData();

  return (
    <Dialog
      open={isOpen}
      onClose={loading ? null : onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      disableScrollLock={false}
      disableEnforceFocus={false}
      disableAutoFocus={false}
      disableRestoreFocus={false}
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: isMobile ? 0 : 3,
          overflow: 'hidden',
          maxHeight: '90vh',
          zIndex: 2000,
          position: isMobile ? 'fixed' : 'relative',
          top: isMobile ? 0 : 'auto',
          left: isMobile ? 0 : 'auto',
          right: isMobile ? 0 : 'auto',
          bottom: isMobile ? 0 : 'auto',
          width: isMobile ? '100vw' : 'auto',
          height: isMobile ? '100vh' : 'auto',
        },
      }}
      BackdropProps={{
        sx: {
          zIndex: 1999,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
      }}
      sx={{
        zIndex: 2000,
        '& .MuiDialog-container': {
          zIndex: 2000,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              color: 'white',
            }}
          >
            <LocalShippingIcon />
          </Box>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Configurar Regiones de Despacho
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Selecciona las regiones donde realizas despachos. Configura precios y tiempos.
            </Typography>
          </Box>

          {!loading && (
            <IconButton
              onClick={onClose}
              sx={{ color: 'grey.500' }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 0 }}>
        <TableContainer component={Paper} elevation={0}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>
                  <Checkbox 
                    checked={regionsConfig.length > 0 && regionsConfig.every(config => config.enabled)}
                    indeterminate={regionsConfig.some(config => config.enabled) && !regionsConfig.every(config => config.enabled)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setRegionsConfig(prev => 
                        prev.map(config => ({ 
                          ...config, 
                          enabled: checked,
                          shippingValue: checked ? config.shippingValue : '',
                          maxDeliveryDays: checked ? config.maxDeliveryDays : ''
                        }))
                      );
                    }}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>
                  Región
                </TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>
                  Valor Despacho (CLP)
                </TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>
                  Tiempo Máximo (días hábiles)
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {regionsConfig.map((config) => (
                <TableRow key={config.region}>
                  <TableCell>
                    <Checkbox
                      checked={config.enabled}
                      onChange={(e) => handleCheckboxChange(config.region, e.target.checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 700,
                          color: 'primary.main',
                          minWidth: '32px',
                          textAlign: 'center'
                        }}
                      >
                        {getRegionRomanNumber(config.region)}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: config.enabled ? 600 : 400 }}>
                        {config.regionLabel}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="tel"
                      inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 9 }}
                      placeholder="$0"
                      value={config.shippingValue}
                      onChange={(e) => handleFieldChange(config.region, 'shippingValue', e.target.value)}
                      onFocus={(e) => handleShippingValueFocus(config.region, e.target.value)}
                      onBlur={(e) => handleShippingValueBlur(config.region, e.target.value)}
                      disabled={!config.enabled}
                      error={config.enabled && (!config.shippingValue || isNaN(extractNumericValue(config.shippingValue)) || parseFloat(extractNumericValue(config.shippingValue)) < 0)}
                      sx={{ minWidth: 120 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      placeholder="1"
                      value={config.maxDeliveryDays}
                      onChange={(e) => {
                        // Permitir solo enteros mayores a 0
                        const value = e.target.value;
                        if (/^\d*$/.test(value)) {
                          handleFieldChange(config.region, 'maxDeliveryDays', value.replace(/^0+/, ''));
                        }
                      }}
                      disabled={!config.enabled}
                      error={config.enabled && (!config.maxDeliveryDays || isNaN(config.maxDeliveryDays) || parseInt(config.maxDeliveryDays) < 1 || !Number.isInteger(Number(config.maxDeliveryDays)))}
                      inputProps={{ 
                        min: 1,
                        max: 365,
                        step: 1,
                        pattern: "[0-9]*",
                        inputMode: "numeric"
                      }}
                      sx={{ minWidth: 80 }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          variant="outlined"
          sx={{ textTransform: 'none', fontWeight: 500 }}
        >
          Cancelar
        </Button>

        <Button
          onClick={handleSave}
          disabled={loading || !isValid}
          variant="contained"
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          {loading ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShippingRegionsModal;
