import React from 'react';
import { Box, Tabs, Tab, List, ListItemButton, ListItemText, Typography, Divider, Button, useMediaQuery } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

export const NotificationListPanel = ({
  notifications,
  activeTab,
  onTabChange,
  onItemClick,
  onViewAll,
  compact = true,
}) => {
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down('sm'));
  const filtered = activeTab === 'unread' ? notifications.filter(n=>!n.is_read) : notifications;
  const slice = compact ? filtered.slice(0, 10) : filtered;
  // Fixed desktop dimensions to avoid CLS: width 480px, height 870px when not compact
  let width, minWidth, maxWidth, minHeight, maxHeight;
  if (compact) {
    width = 360;
    minWidth = 360;
    maxWidth = '100%';
    minHeight = 320;
    maxHeight = 460;
  } else if (isSm) {
    // small screens: full width and adaptive height (fullScreen Dialog will handle height)
    width = '100vw';
    minWidth = '100vw';
    maxWidth = '100vw';
    minHeight = '60vh';
    maxHeight = '100vh';
  } else {
    // desktop fixed size to prevent layout jumps
    width = 480;
    minWidth = 480;
    maxWidth = 480;
    minHeight = 870;
    maxHeight = 870;
  }
  return (
    <Box sx={{ width, minWidth, maxWidth, minHeight, maxHeight, overflowY: 'auto' }}>
      <Tabs value={activeTab} onChange={(_,v)=>onTabChange(v)} variant="fullWidth" size="small">
        <Tab label={`Todas (${notifications.length})`} value="all" />
        <Tab label={`No Leídas (${notifications.filter(n=>!n.is_read).length})`} value="unread" />
      </Tabs>
      <Divider />
      <List dense disablePadding>
        {slice.length === 0 && (
          <Typography variant="body2" sx={{ p:2, color: 'text.secondary' }}>Sin notificaciones</Typography>
        )}
        {slice.map(n => (
          <ListItemButton key={n.id} onClick={()=>onItemClick(n)} sx={(theme) => ({ bgcolor: n.is_read ? 'transparent' : alpha(theme.palette.primary.light, 0.15), alignItems: 'flex-start' })}>
            <ListItemText
              primary={<Typography component="span" variant="subtitle2" fontWeight={n.is_read?500:700}>{n.title}</Typography>}
              secondary={<>
                <Typography component="span" variant="body2" color="text.secondary">{n.body}</Typography>
                <Typography component="span" variant="caption" color="text.disabled" sx={{ display: 'block' }}>{n.time_ago}</Typography>
              </>}
            />
          </ListItemButton>
        ))}
      </List>
      {compact && filtered.length > 10 && (
        <Box sx={{ p:1, textAlign:'center' }}>
          <Button size="small" onClick={onViewAll}>Ver todas</Button>
        </Box>
      )}
    </Box>
  );
};

export default NotificationListPanel;
