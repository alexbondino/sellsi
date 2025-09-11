import React from 'react';
import { Tooltip, IconButton, Popover, Dialog, DialogContent, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
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
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down('sm'));
  const isXs = useMediaQuery(theme.breakpoints.down('xs'));
  // Responsividad inteligente: considerar MobileBar (zIndex: 1400) y BottomBar (zIndex: 1301)
  const mobileBarHeight = 80; // altura aproximada del MobileBar en móviles
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
        // Render the popover into document.body to avoid stacking-context clipping
        container={typeof document !== 'undefined' ? document.body : undefined}
        PaperProps={{
          sx: {
            mt: 1,
            boxShadow: 6,
            borderRadius: 2,
            overflow: 'hidden',
            minWidth: 360,
            maxWidth: 'min(720px, 92vw)',
            // Inteligente: zIndex superior a MobileBar (1400) en móviles
            zIndex: isSm ? theme.zIndex.modal + 150 : theme.zIndex.modal + 100,
            // En móviles xs/sm: limitar altura para no chocar con MobileBar
            ...(isSm && {
              maxHeight: `calc(100vh - ${mobileBarHeight + 20}px)`,
              marginBottom: `${mobileBarHeight + 10}px`,
            }),
          }
        }}
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
      {/* Dialog for "Ver todas". Full-screen on small devices, wider on desktop */}
      <Dialog
        open={dialogOpen}
        onClose={onCloseDialog}
        fullWidth={true}
        maxWidth={false}
        // ensure dialog escapes stacking contexts and sits above BottomBar
        disableScrollLock={true}
        disableRestoreFocus={true}
        sx={{ 
          zIndex: isSm ? theme.zIndex.modal + 150 : theme.zIndex.modal + 100 
        }}
        // Use ContactModal-style PaperProps so the dialog is fixed and sized by the panel
        PaperProps={{
          sx: {
            position: 'fixed',
            zIndex: isSm ? theme.zIndex.modal + 151 : theme.zIndex.modal + 101,
            borderRadius: isSm ? 0 : 2,
            overflow: 'hidden',
            // Desktop positioning (md and up)
            ...(!isSm && {
              left: '50%',
              transform: 'translateX(-50%)',
            }),
            // breakpoints: xl, lg, md exact sizes; xs/sm -> responsive mobile
            [theme.breakpoints.up('xl')]: {
              width: 480,
              minWidth: 480,
              height: 870,
              minHeight: 870,
            },
            [theme.breakpoints.up('lg')]: {
              width: 400,
              minWidth: 400,
              height: 724,
              minHeight: 724,
            },
            [theme.breakpoints.up('md')]: {
              width: 350,
              minWidth: 350,
              height: 633,
              minHeight: 633,
            },
            // Mobile fullscreen: ocupa toda la pantalla correctamente
            [theme.breakpoints.down('sm')]: {
              top: 0,
              left: 0,
              right: 0,
              bottom: `${mobileBarHeight}px`,
              width: '100vw',
              height: `calc(100vh - ${mobileBarHeight}px)`,
              maxWidth: '100vw',
              maxHeight: `calc(100vh - ${mobileBarHeight}px)`,
              transform: 'none',
            },
            // safety caps para desktop only
            ...(!isSm && {
              maxWidth: '95vw',
              maxHeight: '95vh',
            }),
          }
        }}
        // render into body to escape stacking contexts
        container={typeof document !== 'undefined' ? document.body : undefined}
        fullScreen={false} // Manejamos fullScreen manualmente con las reglas de arriba
      >
        <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center' }}>
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
