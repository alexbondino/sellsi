/**
 * 🔐 Admin Login Page Wrapper
 * 
 * Wraps the AdminLogin Dialog component to use it as a standalone page.
 * Manages the Dialog's open state and handles navigation.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLogin from './AdminLogin';
import { Box } from '@mui/material';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    // Optional: Navigate somewhere after close
    // navigate('/');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AdminLogin 
        open={open} 
        onClose={handleClose}
      />
    </Box>
  );
};

export default AdminLoginPage;
