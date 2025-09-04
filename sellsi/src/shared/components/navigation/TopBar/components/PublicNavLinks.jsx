import React from 'react';
import { Button, Box } from '@mui/material';
import { navButtonBase } from '../topBar.styles';

/**
 * PublicNavLinks
 * Renderiza los botones de navegación públicos.
 * Props:
 *  - links: Array<{ label: string, ref: string }>
 *  - onNavigate: (ref: string) => void
 */
export function PublicNavLinks({ links = [], onNavigate }) {
  return (
    <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
      {links.map(({ label, ref }) => (
        <Button
          key={label}
          onClick={() => onNavigate(ref)}
          sx={navButtonBase}
          disableRipple
          disableFocusRipple
        >
          {label}
        </Button>
      ))}
    </Box>
  );
}
