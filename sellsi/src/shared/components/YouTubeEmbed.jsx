// 📁 src/shared/components/YouTubeEmbed.jsx
import React from 'react';
import { Box } from '@mui/material';

const YouTubeEmbed = ({ src, title = 'Video de YouTube' }) => {
  return (
    <Box
      sx={{
        width: { xs: '100%', md: 640, mac: 550, lg: 640 },
        height: { xs: 220, sm: 220, md: 370, mac: 320, lg: 370 },
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        bgcolor: '#000',
      }}
    >
      <Box
        component="iframe"
        src={src}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        sx={{
          width: '100%',
          height: '100%',
          border: 0,
        }}
      />
    </Box>
  );
};

export default YouTubeEmbed;
