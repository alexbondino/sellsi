import React from 'react';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { Badge, IconButton } from '@mui/material';

// NotificationBell ahora replica el estilo y comportamiento del IconButton del carrito
export const NotificationBell = ({ count, onClick, sx = {} }) => {
  const display = count > 99 ? '99+' : count;
  return (
    <IconButton
      onClick={onClick}
      aria-label={`Notificaciones ${display}`}
      size="large"
      sx={{
        color: 'white',
        p: 0.4,
        mr: 1,
        minWidth: 36,
        minHeight: 36,
        boxShadow: 'none',
        outline: 'none',
        border: 'none',
        transition: 'background 0.2s',
        '&:focus': { outline: 'none', border: 'none', boxShadow: 'none' },
        '&:active': { outline: 'none', border: 'none', boxShadow: 'none' },
        '&:hover': {
          background: theme => theme.palette.primary.main,
          boxShadow: 'none',
          outline: 'none',
          border: 'none',
        },
        ...sx,
      }}
      disableFocusRipple
      disableRipple
    >
      <Badge badgeContent={display} color="error" invisible={count===0} max={99} overlap="circular">
        <NotificationsIcon sx={{ color: '#fff !important' }} />
      </Badge>
    </IconButton>
  );
};

export default NotificationBell;
