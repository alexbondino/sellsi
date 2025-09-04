import React from 'react';
import { Menu, MenuItem, Divider } from '@mui/material';

/**
 * MobileMenu - encapsula el menú móvil.
 * Props:
 *  - anchorEl
 *  - open: boolean
 *  - onClose
 *  - items: array de ReactNode (ya construidos)
 */
export function MobileMenu({ anchorEl, open, onClose, items, ariaLabel = 'Menú', menuId = 'mobile-menu', labelledBy }) {
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
  id={menuId}
  MenuListProps={{ 'aria-label': ariaLabel, 'aria-labelledby': labelledBy }}
      PaperProps={{
        sx: {
          backgroundColor: '#2C2C2C',
          color: '#FFFFFF',
          '& .MuiMenuItem-root': {
            color: '#FFFFFF',
            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
          },
          '& .MuiDivider-root': { borderColor: 'rgba(255,255,255,0.1)' },
        },
      }}
    >
      {items}
    </Menu>
  );
}
