import React, { useState, useEffect } from 'react';
import { Avatar, IconButton, Tooltip } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';

/**
 * ProfileAvatarButton
 * Extraído desde TopBar.jsx (Fase 1)
 * Props:
 *  - logoUrl?: string
 *  - onClick: () => void
 */
export function ProfileAvatarButton({ logoUrl, onClick, expanded = false, id }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setLoaded(false); }, [logoUrl]);
  return (
    <Tooltip title="Opciones perfil" arrow>
      <IconButton
        onClick={onClick}
        id={id}
        sx={{ color: 'white', p: 0, display: { xs: 'none', md: 'inline-flex' } }}
        aria-label="Abrir menú de perfil"
        aria-haspopup="true"
        aria-expanded={expanded ? 'true' : 'false'}
        aria-controls={expanded ? 'topbar-profile-menu' : undefined}
      >
      {logoUrl && typeof logoUrl === 'string' && logoUrl.trim() !== '' ? (
        <Avatar
          src={logoUrl}
            key={logoUrl}
            sx={{
              transition: 'none !important',
              opacity: loaded ? 1 : 0,
              background: 'transparent !important',
            }}
            imgProps={{
              onLoad: () => setLoaded(true),
              onError: () => setLoaded(true),
              style: { transition: 'opacity 0.5s', opacity: loaded ? 1 : 0 },
              alt: 'Avatar de usuario'
            }}
          />
        ) : (
          <Avatar sx={{ background: '#fff !important', color: '#111 !important' }}>
            <PersonIcon sx={{ color: '#111 !important', fontSize: 32 }} />
          </Avatar>
        )}
      </IconButton>
    </Tooltip>
  );
}
