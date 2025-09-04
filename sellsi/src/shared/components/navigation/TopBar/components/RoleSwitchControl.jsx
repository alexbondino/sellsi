import React from 'react';
import Switch from '../../Switch';
import { Tooltip } from '@mui/material';

/**
 * RoleSwitchControl - Wrapper del Switch de rol para aislar props.
 * Props:
 *  - role: 'buyer'|'supplier'|null
 *  - disabled: boolean
 *  - onChange: (event, newRole) => void
 *  - size?: string
 */
function RoleSwitchControlBase({ role, disabled, onChange, sx }) {
  if (!role) return null;
  return (
    <Switch
      value={role}
      onChange={onChange}
      disabled={disabled}
      sx={sx}
      inputProps={{ 'aria-label': 'Cambiar rol buyer/supplier' }}
    />
  );
}

export const RoleSwitchControl = React.memo(RoleSwitchControlBase);
