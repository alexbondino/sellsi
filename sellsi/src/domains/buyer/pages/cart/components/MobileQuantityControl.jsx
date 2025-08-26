import React from 'react';
import {
  Stack,
  IconButton,
  Typography,
  Box
} from '@mui/material';
import {
  Remove as RemoveIcon,
  Add as AddIcon
} from '@mui/icons-material';

const MobileQuantityControl = ({ 
  value, 
  onChange, 
  min = 1, 
  max = 99,
  size = 'medium' // 'small' | 'medium' | 'large'
}) => {
  const sizeProps = {
    small: {
      buttonSize: 32,
      textWidth: 36,
      iconSize: 18,
      fontSize: '0.875rem'
    },
    medium: {
      buttonSize: 36,
      textWidth: 40,
      iconSize: 20,
      fontSize: '0.875rem'
    },
    large: {
      buttonSize: 40,
      textWidth: 44,
      iconSize: 22,
      fontSize: '1rem'
    }
  };

  const props = sizeProps[size];

  const handleDecrease = () => {
    const newValue = Math.max(min, value - 1);
    onChange(newValue);
  };

  const handleIncrease = () => {
    const newValue = Math.min(max, value + 1);
    onChange(newValue);
  };

  return (
    <Stack 
      direction="row" 
      alignItems="center"
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        backgroundColor: 'background.paper'
      }}
    >
      {/* Decrease button */}
      <IconButton
        onClick={handleDecrease}
        disabled={value <= min}
        sx={{ 
          borderRadius: 0,
          width: props.buttonSize,
          height: props.buttonSize,
          '&:hover': {
            backgroundColor: 'action.hover'
          },
          '&:disabled': {
            color: 'action.disabled'
          }
        }}
      >
        <RemoveIcon sx={{ fontSize: props.iconSize }} />
      </IconButton>
      
      {/* Quantity display */}
      <Box
        sx={{
          width: props.textWidth,
          height: props.buttonSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderLeft: '1px solid',
          borderRight: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'grey.50'
        }}
      >
        <Typography 
          variant="body2" 
          fontWeight={600}
          sx={{ fontSize: props.fontSize }}
        >
          {value}
        </Typography>
      </Box>
      
      {/* Increase button */}
      <IconButton
        onClick={handleIncrease}
        disabled={value >= max}
        sx={{ 
          borderRadius: 0,
          width: props.buttonSize,
          height: props.buttonSize,
          '&:hover': {
            backgroundColor: 'action.hover'
          },
          '&:disabled': {
            color: 'action.disabled'
          }
        }}
      >
        <AddIcon sx={{ fontSize: props.iconSize }} />
      </IconButton>
    </Stack>
  );
};

export default MobileQuantityControl;
