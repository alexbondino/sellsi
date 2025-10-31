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
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const filtered = activeTab === 'unread' ? notifications.filter(n=>!n.is_read) : notifications;
  const slice = compact ? filtered.slice(0, 8) : filtered;
  
  // Responsive dimensions - NO viewport units en mobile
  let width, minWidth, maxWidth, minHeight, maxHeight;
  if (compact && !isMobile) {
    // Desktop Popover
    width = 360;
    minWidth = 360;
    maxWidth = 360;
    minHeight = 320;
    maxHeight = 460;
  } else if (compact && isMobile) {
    // Mobile Dialog compact
    width = '100%';
    minWidth = '100%';
    maxWidth = '100%';
    minHeight = '60vh';
    maxHeight = '100%';
  } else if (!compact && isMobile) {
    // Mobile Dialog fullscreen
    width = '100%';
    minWidth = '100%';
    maxWidth = '100%';
    minHeight = '100%';
    maxHeight = '100%';
  } else {
    // Desktop Dialog
    width = 480;
    minWidth = 480;
    maxWidth = 480;
    minHeight = 700;
    maxHeight = 700;
  }
  // Text truncation for mobile - 2 lines max
  const textClampStyle = isMobile ? {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    wordBreak: 'break-word',
    whiteSpace: 'normal',
    lineHeight: 1.4,
  } : {};

  return (
    <Box sx={{ 
      width, 
      minWidth, 
      maxWidth, 
      minHeight, 
      maxHeight, 
      overflowY: 'auto',
      overflowX: 'hidden',
      boxSizing: 'border-box'
    }}>
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
          <ListItemButton 
            key={n.id} 
            onClick={()=>onItemClick(n)} 
            sx={{
              bgcolor: n.is_read ? 'transparent' : alpha(theme.palette.primary.light, 0.15), 
              alignItems: 'flex-start',
              width: '100%',
              maxWidth: '100%',
              overflow: 'hidden',
              boxSizing: 'border-box',
              px: 2,
              py: 1.5,
            }}
          >
            <ListItemText
              sx={{ 
                width: '100%', 
                maxWidth: '100%',
                overflow: 'hidden',
                boxSizing: 'border-box',
              }}
              primary={
                <Typography 
                  component="div" 
                  variant="subtitle2" 
                  fontWeight={n.is_read ? 500 : 700}
                  sx={{
                    ...textClampStyle,
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  {n.title}
                </Typography>
              }
              secondary={
                <Box sx={{ width: '100%', maxWidth: '100%' }}>
                  <Typography 
                    component="div" 
                    variant="body2" 
                    color="text.secondary"
                    sx={{
                      ...textClampStyle,
                      width: '100%',
                      maxWidth: '100%',
                      boxSizing: 'border-box',
                      mb: 0.5,
                    }}
                  >
                    {n.body}
                  </Typography>
                  <Typography 
                    component="span" 
                    variant="caption" 
                    color="text.disabled"
                    sx={{ 
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {n.time_ago}
                  </Typography>
                </Box>
              }
            />
          </ListItemButton>
        ))}
      </List>
      {compact && filtered.length > 8 && (
        <Box sx={{ p:1, textAlign:'center' }}>
          <Button size="small" onClick={onViewAll}>Ver todas</Button>
        </Box>
      )}
    </Box>
  );
};

export default NotificationListPanel;
