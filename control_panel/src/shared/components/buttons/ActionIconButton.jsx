import React from 'react';
import { IconButton, Tooltip } from '@mui/material';

const COLOR_VARIANTS = {
  success: {
    color: 'success',
    hover: { backgroundColor: 'success.light', color: 'white' },
  },
  error: {
    color: 'error',
    hover: { backgroundColor: 'error.light', color: 'white' },
  },
  // warning variant: used for cautionary actions (e.g., Congelar / Reponer)
  warning: {
    color: 'warning',
    hover: { backgroundColor: 'warning.light', color: 'white' },
  },
  primary: {
    color: 'primary',
    hover: { backgroundColor: 'primary.light', color: 'white' },
  },
  info: {
    color: 'info',
    hover: { backgroundColor: 'info.light', color: 'white' },
  },
  default: {
    color: 'default',
    hover: { backgroundColor: 'action.hover' },
  },
};

const ActionIconButton = ({
  tooltip,
  variant = 'default',
  onClick,
  children,
  sx = {},
  ariaLabel,
  ...otherProps
}) => {
  const colorConfig = COLOR_VARIANTS[variant] || COLOR_VARIANTS.default;

  let iconToRender = children;
  if (React.isValidElement(children)) {
    iconToRender = React.cloneElement(children, { fontSize: 'medium' });
  }

  return (
    <Tooltip title={tooltip}>
      <IconButton
        size="small"
        color={colorConfig.color}
        onClick={onClick}
        aria-label={ariaLabel || tooltip}
        sx={{
          '&:hover': colorConfig.hover,
          '&:focus': { outline: 'none', boxShadow: 'none' },
          '&.Mui-focusVisible': { outline: 'none', boxShadow: 'none' },
          ...sx,
        }}
        {...otherProps}
      >
        {iconToRender}
      </IconButton>
    </Tooltip>
  );
};

export default ActionIconButton;
