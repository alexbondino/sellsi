import React from 'react';
import { Tooltip, Popover, Dialog, DialogContent, useMediaQuery, Box, IconButton as MuiIconButton, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import { NotificationBell, NotificationListPanel } from '../../../../../domains/notifications';
import { useBodyScrollLock } from '../../../../hooks/useBodyScrollLock';

/**
 * NotificationsMenu - REMAKE OPTIMIZADO
 * 
 * ANÁLISIS PROFUNDO MÓVIL (XS/SM):
 * - Popover en móvil = problemático (anclaje, viewport overflow, posicionamiento)
 * - Solución: XS/SM = Solo Dialog fullScreen optimizado
 * - MD+ = Popover + Dialog centrado
 * - Content constraints: truncado 2 líneas, max-width estricto, overflow hidden
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
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // xs, sm = mobile
  const mobileBarHeight = 95;
  // Mobile: Solo Dialog, Desktop: Popover + Dialog
  const shouldShowPopover = !isMobile && Boolean(anchorEl);
  const shouldShowMobileDialog = isMobile && Boolean(anchorEl);

  // ✅ Bloquear scroll cuando el Popover o Dialog mobile está abierto
  useBodyScrollLock(Boolean(anchorEl) || dialogOpen);

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

      {/* DESKTOP: Popover compacto */}
      {shouldShowPopover && (
        <Popover
          open={true}
          anchorEl={anchorEl}
          onClose={onClose}
          disableScrollLock={true}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          container={document.body}
          PaperProps={{
            sx: {
              mt: 1,
              boxShadow: 6,
              borderRadius: 2,
              overflow: 'hidden',
              minWidth: 360,
              maxWidth: 480,
              zIndex: theme.zIndex.modal + 100,
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
      )}

      {/* MOBILE XS/SM: Dialog directo (sin Popover) */}
      {shouldShowMobileDialog && (
        <Dialog
          open={true}
          onClose={onClose}
          fullScreen={true}
          disableScrollLock={true}
          sx={{ zIndex: theme.zIndex.modal + 300 }}
          PaperProps={{
            sx: {
              width: '100vw',
              height: `calc(100vh - ${mobileBarHeight}px)`,
              maxWidth: '100vw',
              maxHeight: `calc(100vh - ${mobileBarHeight}px)`,
              margin: 0,
              borderRadius: 0,
              overflow: 'hidden',
              zIndex: theme.zIndex.modal + 301,
            }
          }}
        >
          <Box sx={{ 
            height: `calc(100vh - ${mobileBarHeight}px)`, 
            display: 'flex', 
            flexDirection: 'column',
          }}>
            {/* Header con close */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              p: 2, 
              borderBottom: 1, 
              borderColor: 'divider' 
            }}>
              <Typography variant="h6">Notificaciones</Typography>
              <MuiIconButton onClick={onClose} size="small">
                <CloseIcon />
              </MuiIconButton>
            </Box>
            {/* Content */}
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <NotificationListPanel
                notifications={notifications || []}
                activeTab={activeTab || 'all'}
                onTabChange={onTabChange}
                onItemClick={onItemClick}
                onViewAll={onClose}
                compact={false}
              />
            </Box>
          </Box>
        </Dialog>
      )}
      {/* DESKTOP: Dialog "Ver todas" */}
      {dialogOpen && !isMobile && (
        <Dialog
          open={true}
          onClose={onCloseDialog}
          maxWidth="sm"
          fullWidth={false}
          disableScrollLock={true}
          container={document.body}
          PaperProps={{
            sx: {
              width: 480,
              maxWidth: 480,
              height: 700,
              maxHeight: '90vh',
              borderRadius: 2,
              overflow: 'hidden',
              zIndex: theme.zIndex.modal + 200,
            }
          }}
        >
          <DialogContent sx={{ p: 0, height: '100%' }}>
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
      )}

      {/* MOBILE: Dialog "Ver todas" fullScreen */}
      {dialogOpen && isMobile && (
        <Dialog
          open={true}
          onClose={onCloseDialog}
          fullScreen={true}
          disableScrollLock={true}
          sx={{ zIndex: theme.zIndex.modal + 300 }}
          PaperProps={{
            sx: {
              width: '100vw',
              height: `calc(100vh - ${mobileBarHeight}px)`,
              maxWidth: '100vw',
              maxHeight: `calc(100vh - ${mobileBarHeight}px)`,
              margin: 0,
              borderRadius: 0,
              zIndex: theme.zIndex.modal + 301,
            }
          }}
        >
          <Box sx={{ 
            height: `calc(100vh - ${mobileBarHeight}px)`, 
            display: 'flex', 
            flexDirection: 'column',
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              p: 2, 
              borderBottom: 1, 
              borderColor: 'divider' 
            }}>
              <Typography variant="h6">Todas las Notificaciones</Typography>
              <MuiIconButton onClick={onCloseDialog} size="small">
                <CloseIcon />
              </MuiIconButton>
            </Box>
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <NotificationListPanel
                notifications={notifications || []}
                activeTab={activeTab || 'all'}
                onTabChange={onTabChange}
                onItemClick={onItemClick}
                onViewAll={onCloseDialog}
                compact={false}
              />
            </Box>
          </Box>
        </Dialog>
      )}
    </>
  );
}

export const NotificationsMenu = React.memo(NotificationsMenuBase);
