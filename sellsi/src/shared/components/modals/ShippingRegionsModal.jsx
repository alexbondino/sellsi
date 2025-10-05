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
  const isExtraSmall = useMediaQuery(theme.breakpoints.down('xs'));

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
      maxWidth={isMobile ? false : "md"}
      fullWidth={!isMobile}
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
          maxHeight: isMobile ? '100vh' : '90vh',
          zIndex: 2000,
          position: isMobile ? 'fixed' : 'relative',
          top: isMobile ? 0 : 'auto',
          left: isMobile ? 0 : 'auto',
          right: isMobile ? 0 : 'auto',
          bottom: isMobile ? 0 : 'auto',
          width: isMobile ? '100vw' : 'auto',
          height: isMobile ? '100vh' : 'auto',
          margin: isMobile ? 0 : 'auto',
          maxWidth: isMobile ? '100vw' : 'auto',
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
          alignItems: isMobile ? 'stretch' : 'center',
          justifyContent: isMobile ? 'stretch' : 'center',
        },
        '& .MuiDialog-paper': {
          margin: isMobile ? 0 : 'auto',
          maxWidth: isMobile ? '100vw' : 'auto',
          width: isMobile ? '100vw' : 'auto',
          height: isMobile ? '100vh' : 'auto',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, px: isMobile ? 2 : 3, pt: isMobile ? 2 : 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 1.5 : 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: isMobile ? 32 : 40,
              height: isMobile ? 32 : 40,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              color: 'white',
            }}
          >
            <LocalShippingIcon sx={{ fontSize: isMobile ? 18 : 24 }} />
          </Box>
          
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography 
              variant={isMobile ? "subtitle1" : "h6"} 
              sx={{ 
                fontWeight: 600,
                lineHeight: 1.2,
                wordBreak: 'break-word'
              }}
            >
              {isMobile ? "Regiones de Despacho" : "Configurar Regiones de Despacho"}
            </Typography>
            {!isExtraSmall && (
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  lineHeight: 1.3,
                  mt: 0.5,
                  display: '-webkit-box',
                  WebkitLineClamp: isMobile ? 2 : 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {isMobile 
                  ? "Configura precios y tiempos de entrega" 
                  : "Selecciona las regiones donde realizas despachos. Configura precios y tiempos."
                }
              </Typography>
            )}
          </Box>

          {!loading && (
            <IconButton
              onClick={onClose}
              sx={{ 
                color: 'grey.500',
                p: isMobile ? 0.5 : 1
              }}
            >
              <CloseIcon sx={{ fontSize: isMobile ? 20 : 24 }} />
            </IconButton>
          )}
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
        <TableContainer 
          component={Paper} 
          elevation={0}
          sx={{ 
            maxHeight: isMobile ? 'calc(100vh - 200px)' : '60vh',
            overflow: 'auto',
            // Scroll horizontal más visible en móviles
            '&::-webkit-scrollbar': {
              height: isMobile ? 8 : 6,
              width: isMobile ? 8 : 6,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0,0,0,0.3)',
              borderRadius: 4,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'rgba(0,0,0,0.1)',
            },
          }}
        >
          <Table 
            stickyHeader 
            sx={{ 
              minWidth: isMobile ? 480 : 650,
              tableLayout: 'fixed'
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell 
                  sx={{ 
                    fontWeight: 600, 
                    bgcolor: 'grey.50',
                    width: isMobile ? 50 : 60,
                    p: isMobile ? 1 : 2
                  }}
                >
                  <Checkbox 
                    size={isMobile ? "small" : "medium"}
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
                <TableCell 
                  sx={{ 
                    fontWeight: 600, 
                    bgcolor: 'grey.50',
                    width: isMobile ? 140 : 200,
                    p: isMobile ? 1 : 2
                  }}
                >
                  <Typography variant={isMobile ? "caption" : "body2"} sx={{ fontWeight: 600 }}>
                    Región
                  </Typography>
                </TableCell>
                <TableCell 
                  sx={{ 
                    fontWeight: 600, 
                    bgcolor: 'grey.50',
                    width: isMobile ? 140 : 180,
                    p: isMobile ? 1 : 2
                  }}
                >
                  <Typography variant={isMobile ? "caption" : "body2"} sx={{ fontWeight: 600 }}>
                    {isMobile ? "Valor (CLP)" : "Valor Despacho (CLP)"}
                  </Typography>
                </TableCell>
                <TableCell 
                  sx={{ 
                    fontWeight: 600, 
                    bgcolor: 'grey.50',
                    width: isMobile ? 130 : 160,
                    p: isMobile ? 1 : 2
                  }}
                >
                  <Typography variant={isMobile ? "caption" : "body2"} sx={{ fontWeight: 600 }}>
                    {isMobile ? "Días" : "Tiempo Máximo (días hábiles)"}
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {regionsConfig.map((config) => (
                <TableRow key={config.region}>
                  <TableCell sx={{ p: isMobile ? 1 : 2 }}>
                    <Checkbox
                      size={isMobile ? "small" : "medium"}
                      checked={config.enabled}
                      onChange={(e) => handleCheckboxChange(config.region, e.target.checked)}
                    />
                  </TableCell>
                  <TableCell sx={{ p: isMobile ? 1 : 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0.5 : 1 }}>
                      <Typography 
                        variant={isMobile ? "caption" : "body2"}
                        sx={{ 
                          fontWeight: 700,
                          color: 'primary.main',
                          minWidth: isMobile ? '24px' : '32px',
                          textAlign: 'center',
                          fontSize: isMobile ? '0.7rem' : '0.875rem'
                        }}
                      >
                        {getRegionRomanNumber(config.region)}
                      </Typography>
                      <Typography 
                        variant={isMobile ? "caption" : "body2"} 
                        sx={{ 
                          fontWeight: config.enabled ? 600 : 400,
                          lineHeight: 1.2,
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: isMobile ? 'nowrap' : 'normal'
                        }}
                      >
                        {config.regionLabel}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ p: isMobile ? 1 : 2 }}>
                    <TextField
                      size="small"
                      type="tel"
                      inputProps={{ 
                        inputMode: 'numeric', 
                        pattern: '[0-9]*', 
                        maxLength: 9,
                        style: { 
                          fontSize: isMobile ? '0.8rem' : '0.875rem',
                          padding: isMobile ? '6px 8px' : '8px 12px'
                        }
                      }}
                      placeholder="$0"
                      value={config.shippingValue}
                      onChange={(e) => handleFieldChange(config.region, 'shippingValue', e.target.value)}
                      onFocus={(e) => handleShippingValueFocus(config.region, e.target.value)}
                      onBlur={(e) => handleShippingValueBlur(config.region, e.target.value)}
                      disabled={!config.enabled}
                      error={config.enabled && (!config.shippingValue || isNaN(extractNumericValue(config.shippingValue)) || parseFloat(extractNumericValue(config.shippingValue)) < 0)}
                      sx={{ 
                        width: '100%',
                        maxWidth: isMobile ? 120 : 140,
                        '& .MuiInputBase-input': {
                          fontSize: isMobile ? '0.8rem' : '0.875rem'
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ p: isMobile ? 1 : 2 }}>
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
                        inputMode: "numeric",
                        style: { 
                          fontSize: isMobile ? '0.8rem' : '0.875rem',
                          padding: isMobile ? '6px 8px' : '8px 12px'
                        }
                      }}
                      sx={{ 
                        width: '100%',
                        maxWidth: isMobile ? 100 : 120,
                        '& .MuiInputBase-input': {
                          fontSize: isMobile ? '0.8rem' : '0.875rem'
                        }
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <Divider />

      <DialogActions 
        sx={{ 
          p: isMobile ? 2 : 3, 
          gap: isMobile ? 1 : 2,
          flexDirection: isMobile ? 'column' : 'row',
          '& > button': {
            width: isMobile ? '100%' : 'auto',
            minWidth: isMobile ? 0 : 100
          }
        }}
      >
        <Button
          onClick={onClose}
          disabled={loading}
          variant="outlined"
          sx={{ 
            textTransform: 'none', 
            fontWeight: 500,
            order: isMobile ? 2 : 1,
            py: isMobile ? 1.5 : 1
          }}
        >
          Cancelar
        </Button>

        <Button
          onClick={handleSave}
          disabled={loading || !isValid}
          variant="contained"
          sx={{ 
            textTransform: 'none', 
            fontWeight: 600,
            order: isMobile ? 1 : 2,
            py: isMobile ? 1.5 : 1
          }}
        >
          {loading ? 'Cargando...' : (isMobile ? 'Confirmar' : 'Confirmar')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShippingRegionsModal;
