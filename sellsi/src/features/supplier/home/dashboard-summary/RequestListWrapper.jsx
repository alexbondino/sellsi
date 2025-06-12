import React from 'react';
import { Box } from '@mui/material';
import RequestList from '../../../ui/RequestList';

const RequestListWrapper = ({ weeklyRequests }) => (
  <Box
    sx={{
      flex: {
        xs: '1 1 100%',
        sm: '1 1 100%',
        md: '1 1 100%',
        lg: '1 1 calc(24% - 4px)',
      },
      maxWidth: { lg: '22%' },
      minWidth: { lg: '180px' },
    }}
  >
    <Box sx={{ transform: { lg: 'scale(0.8)' }, transformOrigin: 'center' }}>
      <RequestList weeklyRequests={weeklyRequests} />
    </Box>
  </Box>
);

export default RequestListWrapper;
