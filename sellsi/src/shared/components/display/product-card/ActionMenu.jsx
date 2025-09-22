import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';

/*
  Tres puntos de la card de productos. Pasar al componente Card de producto o productCard. 
  Product Card es distintos a supplier product card. Estandarizar.

*/

/**
 * ActionMenu - Componente UI reutilizable para menús de acciones
 *
 * @param {Array} actions - Array de objetos con la estructura:
 *   - { icon: ReactElement, label: string, onClick: function, disabled?: boolean, color?: string }
 * @param {boolean} disabled - Deshabilitar el menú completo
 * @param {object} sx - Estilos personalizados para el IconButton
 * @param {string} tooltip - Tooltip para el botón
 * @param {ReactElement} icon - Icono personalizado (default: MoreVertIcon)
 */
const ActionMenu = ({
  actions = [],
  disabled = false,
  sx = {},
  tooltip = 'Más opciones',
  icon = <MoreVertIcon />,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = event => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleActionClick = action => {
    handleMenuClose();
    if (action.onClick && !action.disabled) {
      action.onClick();
    }
  };

  if (!actions.length) return null;

  return (
    <>
      <Tooltip title={tooltip}>
        <IconButton
          onClick={handleMenuOpen}
          disabled={disabled}
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(8px)',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 1)',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.2s ease',
            ...sx,
          }}
        >
          {icon}
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        onClick={e => e.stopPropagation()}
        // Evitar que MUI aplique el bloqueo del scroll y provoque shift del layout
        // (disableScrollLock evita que se añada padding-right al body)
        disableScrollLock={true}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            borderRadius: 2,
          },
        }}
      >
        {actions.map((action, index) => (
          <MenuItem
            key={index}
            onClick={() => handleActionClick(action)}
            disabled={action.disabled}
            sx={{
              minWidth: 150,
              color: action.color || 'inherit',
              '&:hover': {
                bgcolor: action.color ? `${action.color}.50` : 'action.hover',
              },
            }}
          >
            {action.icon && (
              <ListItemIcon sx={{ color: 'inherit' }}>
                {action.icon}
              </ListItemIcon>
            )}
            <ListItemText primary={action.label} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default ActionMenu;
