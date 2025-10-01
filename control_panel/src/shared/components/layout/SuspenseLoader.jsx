import React from 'react';
import { Box } from '@mui/material';
import Loader from '../../../components/Loader';

const SuspenseLoader = () => (
  <Box
    sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: 'background.default',
      zIndex: 1500,
    }}
  >
    <Loader />
  </Box>
);

export default SuspenseLoader;
