import React from 'react';
import { ToggleButton, ToggleButtonGroup, useTheme } from '@mui/material';

const ProfileSwitch = ({ value, onChange, type, sx }) => {
  const theme = useTheme();

  const getOptions = () => {
    switch (type) {
      case 'role':
        return [
          { value: 'supplier', label: 'Proveedor' },
          { value: 'buyer', label: 'Comprador' }
        ];
      case 'accountType':
        return [
          { value: 'corriente', label: 'Corriente' },
          { value: 'vista', label: 'Vista' }
        ];
      default:
        return [];
    }
  };

  const options = getOptions();

  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={onChange}
      aria-label={`Selección de ${type}`}
      sx={{
        height: '32px',
        '& .MuiToggleButton-root': {
          borderColor: theme.palette.primary.main,
          color: theme.palette.primary.main,
          minWidth: 'unset',
          padding: '4px 12px',
          fontSize: '0.8rem',
          lineHeight: '1.5',
          height: '32px',
          '&.Mui-selected': {
            backgroundColor: theme.palette.primary.main,
            color: 'white',
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            },
          },
          '&:hover': {
            backgroundColor: theme.palette.primary.light + '20',
          },
        },
        ...sx,
      }}
    >
      {options.map((option) => (
        <ToggleButton 
          key={option.value} 
          value={option.value} 
          aria-label={option.label.toLowerCase()}
        >
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
};

export default ProfileSwitch;
