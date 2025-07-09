import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Button, TextField, IconButton, Fade, Slide } from '@mui/material';
import { Close as CloseIcon, WhatsApp as WhatsAppIcon, Send as SendIcon } from '@mui/icons-material';

const WhatsAppWidget = ({ isLoggedIn, userProfile }) => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [hover, setHover] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [customMsg, setCustomMsg] = useState('');

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isLoggedIn || !isDesktop) return null;

  const handleSend = () => {
    if (!customMsg.trim() || !selectedOption) return;
    // WhatsApp soporta saltos de línea con \n (que luego encodeURIComponent convierte a %0A)
    const title = selectedOption === 1 ? '*Atención comercial*' : '*Soporte técnico y sugerencias*';
    const userInfo = userProfile 
      ? `${userProfile.user_nm} - ${(userProfile.user_id ? userProfile.user_id.substring(0,8) : 'N/A')}`
      : 'Usuario - ID no disponible';
    // Usar salto de línea real (\n), encodeURIComponent lo convertirá a %0A
    const fullMessage = `${title}:\n${userInfo}\n${customMsg}`;
    const url = `https://wa.me/56963109664?text=${encodeURIComponent(fullMessage)}`;
    window.open(url, '_blank', 'noopener');
    setOpen(false);
    setSelectedOption(null);
    setCustomMsg('');
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedOption(null);
    setCustomMsg('');
  };

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 32,
        right: 32,
        zIndex: 2000,
      }}
    >
      {/* Botón flotante principal */}
      <Box
        component="a"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setOpen(!open);
        }}
        sx={{
          background: hover ? '#1ebe57' : '#25D366',
          borderRadius: '50%',
          width: 64,
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: hover
            ? '0 8px 32px rgba(37, 211, 102, 0.4)'
            : '0 4px 16px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          textDecoration: 'none',
          transform: hover ? 'scale(1.05)' : 'scale(1)',
          '&:hover': {
            transform: 'scale(1.05)',
          }
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <img
          src="/wsplogo.webp"
          alt="WhatsApp"
          style={{
            width: 36,
            height: 36,
            objectFit: 'contain',
            filter: hover
              ? 'drop-shadow(0 0 8px rgba(255,255,255,0.3)) brightness(1.1)'
              : 'drop-shadow(0 0 4px rgba(0,0,0,0.2))',
            transition: 'filter 0.3s ease',
          }}
        />
      </Box>

      {/* Widget flotante */}
      <Slide direction="up" in={open} mountOnEnter unmountOnExit>
        <Paper
          elevation={24}
          sx={{
            position: 'absolute',
            bottom: 80,
            right: 0,
            width: 380,
            maxWidth: '90vw',
            background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
            borderRadius: 3,
            overflow: 'hidden',
            border: '1px solid rgba(37, 211, 102, 0.1)',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
              color: 'white',
              p: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <WhatsAppIcon sx={{ fontSize: 24 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: 18 }}>
                Contactar por WhatsApp
              </Typography>
            </Box>
            <IconButton
              onClick={handleClose}
              sx={{
                color: 'white',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={{ p: 3 }}>
            {!selectedOption ? (
              <Fade in={!selectedOption}>
                <Box>
                  <Typography
                    variant="body1"
                    sx={{
                      mb: 3,
                      color: 'text.secondary',
                      fontSize: 16,
                      textAlign: 'center'
                    }}
                  >
                    ¿En qué podemos ayudarte?
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button
                      variant="contained"
                      onClick={() => handleOptionSelect(1)}
                      sx={{
                        background: 'linear-gradient(135deg, #25D366 0%, #1ebe57 100%)',
                        color: 'white',
                        py: 2,
                        fontSize: 16,
                        fontWeight: 600,
                        borderRadius: 2,
                        textTransform: 'none',
                        boxShadow: '0 4px 16px rgba(37, 211, 102, 0.3)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #1ebe57 0%, #128C7E 100%)',
                          boxShadow: '0 6px 20px rgba(37, 211, 102, 0.4)',
                          transform: 'translateY(-1px)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      💼 Atención comercial
                    </Button>
                    
                    <Button
                      variant="contained"
                      onClick={() => handleOptionSelect(2)}
                      sx={{
                        background: 'linear-gradient(135deg, #128C7E 0%, #075E54 100%)',
                        color: 'white',
                        py: 2,
                        fontSize: 16,
                        fontWeight: 600,
                        borderRadius: 2,
                        textTransform: 'none',
                        boxShadow: '0 4px 16px rgba(18, 140, 126, 0.3)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #075E54 0%, #054640 100%)',
                          boxShadow: '0 6px 20px rgba(18, 140, 126, 0.4)',
                          transform: 'translateY(-1px)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      🛠️ Soporte técnico y sugerencias
                    </Button>
                  </Box>
                </Box>
              </Fade>
            ) : (
              <Fade in={!!selectedOption}>
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      color: 'text.primary',
                      fontSize: 18,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    {selectedOption === 1 ? '💼' : '🛠️'}
                    {selectedOption === 1 ? 'Atención comercial' : 'Soporte técnico y sugerencias'}
                  </Typography>
                  
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={customMsg}
                    onChange={(e) => setCustomMsg(e.target.value)}
                    placeholder="Escribe tu mensaje aquí..."
                    variant="outlined"
                    sx={{
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover fieldset': {
                          borderColor: '#25D366',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#25D366',
                        },
                      },
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) {
                        handleSend();
                      }
                    }}
                  />
                  
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => setSelectedOption(null)}
                      sx={{
                        flex: 1,
                        py: 1.5,
                        borderColor: '#ddd',
                        color: 'text.secondary',
                        textTransform: 'none',
                        fontWeight: 500,
                        borderRadius: 2,
                        '&:hover': {
                          borderColor: '#bbb',
                          backgroundColor: 'rgba(0,0,0,0.04)',
                        },
                      }}
                    >
                      Volver
                    </Button>
                    
                    <Button
                      variant="contained"
                      onClick={handleSend}
                      disabled={!customMsg.trim()}
                      startIcon={<SendIcon />}
                      sx={{
                        flex: 2,
                        py: 1.5,
                        background: customMsg.trim()
                          ? 'linear-gradient(135deg, #25D366 0%, #1ebe57 100%)'
                          : '#e0e0e0',
                        color: customMsg.trim() ? 'white' : '#999',
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: 2,
                        '&:hover': customMsg.trim() ? {
                          background: 'linear-gradient(135deg, #1ebe57 0%, #128C7E 100%)',
                          boxShadow: '0 4px 16px rgba(37, 211, 102, 0.3)',
                        } : {},
                        transition: 'all 0.3s ease',
                      }}
                    >
                      Enviar mensaje
                    </Button>
                  </Box>
                  
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 2,
                      color: 'text.secondary',
                      textAlign: 'center',
                      fontSize: 12,
                    }}
                  >
                    Presiona Ctrl + Enter para enviar rápidamente
                  </Typography>
                </Box>
              </Fade>
            )}
          </Box>
        </Paper>
      </Slide>
    </Box>
  );
};

export default WhatsAppWidget;
