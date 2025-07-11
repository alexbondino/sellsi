import React from 'react';
import { Button } from '@mui/material';

import { useTheme } from '@mui/material/styles';

const PrimaryButton = ({
  /* Boton custom, cambiar nombre y estandarizar */
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  onClick,
  type = 'button',
  fullWidth = false,
  startIcon,
  sx = {},
  ...props
}) => {
  const theme = useTheme();
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? theme.palette.action.disabled : theme.palette.primary.main,
          color: '#fff',
          '&:hover': {
            backgroundColor: disabled ? theme.palette.action.disabled : theme.palette.primary.dark,
          },
        };
      case 'secondary':
        return {
          backgroundColor: '#e4e6eb',
          color: '#757575',
          '&:hover': { backgroundColor: '#d8dadf' },
        };
      case 'text':
        return {
          color: theme.palette.primary.main,
          backgroundColor: 'transparent',
          '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' },
        };
      default:
        return {};
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'large':
        return { fontSize: 20, height: 56, px: 4, py: 1 };
      case 'medium':
        return { fontSize: 16, height: 42, px: 3, py: 1 };
      case 'small':
        return { fontSize: 14, height: 36, px: 2, py: 0.5 };
      default:
        return {};
    }
  };

  return (
    <Button
      variant="contained"
      disabled={disabled}
      onClick={onClick}
      type={type}
      fullWidth={fullWidth}
      startIcon={startIcon}
      sx={{
        borderRadius: 2,
        textTransform: 'none',
        fontWeight: 700,
        boxShadow: 'none',
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
};

export default PrimaryButton;
