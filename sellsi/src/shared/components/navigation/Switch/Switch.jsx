// 📁 src/components/common/RoleToggleSwitch.jsx
import React from 'react';
import { useTheme } from '@mui/material';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

/* Pasar argumentos como proveedor y comprador en vez de hardcodearlos */

/**
 * Componente de switch de rol reutilizable (Comprador/Proveedor).
 * Este es un componente "controlado", su valor y manejo de cambios
 * son gestionados por el componente padre.
 *
 * @param {object} props - Las props del componente.
 * @param {'buyer' | 'supplier'} props.value - El rol actualmente seleccionado ('buyer' o 'supplier').
 * @param {function(React.SyntheticEvent, 'buyer' | 'supplier'): void} props.onChange - Callback que se ejecuta cuando el rol cambia.
 * @param {boolean} [props.disabled] - Si el switch está deshabilitado.
 * @param {object} [props.sx] - Estilos adicionales para el ToggleButtonGroup principal.
 */
export default function Switch({ value, onChange, disabled = false, sx }) {
  const theme = useTheme();

  const handleChange = (event, newValue) => {
    if (!disabled && onChange) {
      onChange(event, newValue);
    }
  };

  return (
    <ToggleButtonGroup
      value={value} // El valor es controlado por el padre
      exclusive // Solo una opción puede estar seleccionada
      onChange={handleChange} // El cambio es manejado por el padre
      disabled={disabled} // ✅ Soporte para disabled
      aria-label="Selección de rol"
      sx={{
        mr: 2, // Margen derecho por defecto, el padre puede sobrescribirlo
        height: '32px', // Altura del grupo
        // Estilos generales para los ToggleButtons dentro del grupo
        '& .MuiToggleButton-root': {
          borderColor: 'white',
          color: 'white',
          minWidth: 'unset', // Permite que los botones sean más pequeños
          padding: '4px 12px', // Padding interno
          fontSize: '0.8rem', // Tamaño de fuente
          lineHeight: '1.5',
          height: '32px', // Altura individual del botón
          '&.Mui-selected': {
            backgroundColor: theme.palette.primary.main,
            color: 'white',
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.1)',
          },
        },
        ...sx, // Permite sobrescribir o añadir estilos desde el componente padre
      }}
    >
      {/* Proveedor primero, luego Comprador */}
      <ToggleButton value="supplier" aria-label="proveedor">
        Proveedor
      </ToggleButton>
      <ToggleButton value="buyer" aria-label="comprador">
        Comprador
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
