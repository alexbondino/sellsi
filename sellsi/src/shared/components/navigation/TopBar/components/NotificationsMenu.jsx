import React from 'react';
import { Tooltip, IconButton, Popover, Dialog, DialogContent } from '@mui/material';
// Ajuste de ruta: este archivo está en shared/components/navigation/TopBar/components
// Para llegar a src/domains/notifications necesitamos subir 7 niveles relativos a src:
// components -> TopBar -> navigation -> components -> shared -> src -> (root) -> domains
// Simplificamos calculando: desde este archivo: ../../../..../../../../domains/notifications
// Ruta corregida: TopBar.jsx usa '../../../../domains/notifications'. Este archivo está un nivel más profundo (components) ⇒ añadir un ../ adicional.
// TopBar.jsx depth desde src: shared/components/navigation/TopBar (4 niveles) => ../../../../
// Aquí: shared/components/navigation/TopBar/components (5 niveles) => ../../../../../
import { NotificationBell, NotificationListPanel } from '../../../../../domains/notifications';

/**
 * NotificationsMenu
 * Encapsula campana, popover, y dialog de notificaciones.
 * Props:
 *  - unreadCount: number
 *  - notifications: array
 *  - activeTab: string
 *  - onTabChange: (tab) => void
 *  - onItemClick: (notif) => void
 *  - onViewAll: () => void (abre dialog)
 *  - onCloseDialog: () => void
 *  - anchorEl: HTMLElement | null
 *  - onOpen: (event) => void
 *  - onClose: () => void
 *  - dialogOpen: boolean
 */
function NotificationsMenuBase({
  unreadCount,
  notifications,
  activeTab,
  onTabChange,
  onItemClick,
  onViewAll,
  onCloseDialog,
  anchorEl,
  onOpen,
  onClose,
  dialogOpen,
  showBell = true,
}) {
  return (
    <>
      {showBell && (
        <Tooltip title="Notificaciones" arrow>
          <span role="button" aria-label={`Abrir notificaciones, ${unreadCount||0} sin leer`} aria-haspopup="true" aria-expanded={Boolean(anchorEl) ? 'true':'false'}>
            <NotificationBell
              count={unreadCount || 0}
              onClick={onOpen}
            />
          </span>
        </Tooltip>
      )}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={onClose}
        disableScrollLock={true}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { mt: 1, boxShadow: 6, borderRadius: 2, overflow: 'hidden' } }}
      >
        <NotificationListPanel
          notifications={notifications || []}
          activeTab={activeTab || 'all'}
          onTabChange={onTabChange}
          onItemClick={onItemClick}
          onViewAll={onViewAll}
          compact
        />
      </Popover>
      <Dialog open={dialogOpen} onClose={onCloseDialog} fullWidth maxWidth="sm">
        <DialogContent sx={{ p: 0 }}>
          <NotificationListPanel
            notifications={notifications || []}
            activeTab={activeTab || 'all'}
            onTabChange={onTabChange}
            onItemClick={onItemClick}
            onViewAll={onCloseDialog}
            compact={false}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

export const NotificationsMenu = React.memo(NotificationsMenuBase);
