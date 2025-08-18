import React from 'react';
import { Box, Tabs, Tab, List, ListItemButton, ListItemText, Typography, Divider, Button } from '@mui/material';

export const NotificationListPanel = ({
  notifications,
  activeTab,
  onTabChange,
  onItemClick,
  onViewAll,
  compact = true,
}) => {
  const filtered = activeTab === 'unread' ? notifications.filter(n=>!n.is_read) : notifications;
  const slice = compact ? filtered.slice(0, 10) : filtered;
  return (
    <Box sx={{ width: compact ? 360 : 520, maxHeight: compact ? 460 : '70vh', overflowY: 'auto' }}>
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
          <ListItemButton key={n.id} onClick={()=>onItemClick(n)} sx={{ bgcolor: n.is_read ? 'transparent' : 'primary.light', alignItems:'flex-start' }}>
            <ListItemText
              primary={<Typography variant="subtitle2" fontWeight={n.is_read?500:700}>{n.title}</Typography>}
              secondary={<>
                <Typography variant="body2" color="text.secondary">{n.body}</Typography>
                <Typography variant="caption" color="text.disabled">{n.time_ago}</Typography>
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
