import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Button, TextField, IconButton, Fade, Slide } from '@mui/material';
import { Close as CloseIcon, Send as SendIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';

// Sellsi brand colors
const SELLSI_BLUE = '#2E52B2';
const SELLSI_BLUE_DARK = '#1a3a7a';
const SELLSI_BLUE_DEEPER = '#0f2456';

const WhatsAppWidget = ({ isLoggedIn, userProfile, currentPath }) => {
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

  // Don't show WhatsApp widget on admin routes
  const isAdminRoute = currentPath?.startsWith('/admin-login') || 
                      currentPath?.startsWith('/admin-panel');

  if (!isLoggedIn || !isDesktop || isAdminRoute) return null;

  const handleSend = () => {
    if (!customMsg.trim() || !selectedOption) return;
    // WhatsApp soporta saltos de línea con \n (que luego encodeURIComponent convierte a %0A)
    const title = selectedOption === 1 ? '*Atención comercial*' : '*Soporte técnico y sugerencias*';
    const userInfo = userProfile
      ? `${userProfile.user_nm} - ${userProfile.email || 'Email no disponible'}`
      : 'Usuario - Email no disponible';
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
      {/* Botón flotante principal — WhatsApp verde estándar */}
      <Box
        component="a"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setOpen(!open);
        }}
        sx={{
          background: hover
            ? `linear-gradient(135deg, #1ebe57 0%, ${SELLSI_BLUE} 100%)`
            : '#25D366',
          borderRadius: '50%',
          width: 64,
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: hover
            ? `0 8px 32px rgba(46, 82, 178, 0.45), 0 4px 16px rgba(37, 211, 102, 0.3)`
            : '0 4px 20px rgba(0,0,0,0.18)',
          cursor: 'pointer',
          transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          textDecoration: 'none',
          transform: hover ? 'scale(1.08)' : 'scale(1)',
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <img
          src="/Logos/wsplogo.webp"
          alt="WhatsApp"
          style={{
            width: 36,
            height: 36,
            objectFit: 'contain',
            filter: hover
              ? 'drop-shadow(0 0 8px rgba(255,255,255,0.4)) brightness(1.1)'
              : 'drop-shadow(0 0 4px rgba(0,0,0,0.2))',
            transition: 'filter 0.3s ease',
          }}
        />
      </Box>

      {/* Widget flotante */}
      <Slide direction="up" in={open} mountOnEnter unmountOnExit>
        <Paper
          elevation={0}
          sx={{
            position: 'absolute',
            bottom: 80,
            right: 0,
            width: 390,
            maxWidth: '92vw',
            background: '#ffffff',
            borderRadius: '16px',
            overflow: 'hidden',
            border: `1px solid rgba(46, 82, 178, 0.15)`,
            boxShadow: `0 24px 64px rgba(46, 82, 178, 0.18), 0 8px 24px rgba(0,0,0,0.08)`,
          }}
        >
          {/* ── Header con degradé Sellsi ── */}
          <Box
            sx={{
              background: `linear-gradient(135deg, ${SELLSI_BLUE_DEEPER} 0%, ${SELLSI_BLUE_DARK} 45%, ${SELLSI_BLUE} 100%)`,
              color: 'white',
              px: 2.5,
              py: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '-40%',
                right: '-10%',
                width: 180,
                height: 180,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)',
                pointerEvents: 'none',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: '-60%',
                left: '30%',
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.04)',
                pointerEvents: 'none',
              },
            }}
          >
            {/* Logo + Título */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, zIndex: 1 }}>
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: '8px',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255,255,255,0.4)',
                  flexShrink: 0,
                }}
              >
                <img
                  src="/Logos/sellsi_minilogo.webp"
                  alt="Sellsi"
                  style={{ width: 22, height: 22, objectFit: 'contain' }}
                />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    fontSize: 16,
                    lineHeight: 1.1,
                    letterSpacing: '0.01em',
                  }}
                >
                  Contacto Sellsi
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                  <Box
                    sx={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: '#25D366',
                      boxShadow: '0 0 6px rgba(37,211,102,0.8)',
                      animation: 'pulse 2s infinite',
                      '@keyframes pulse': {
                        '0%, 100%': { opacity: 1 },
                        '50%': { opacity: 0.5 },
                      },
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: 11,
                      opacity: 0.85,
                      fontWeight: 500,
                      letterSpacing: '0.02em',
                    }}
                  >
                    En Línea
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Botón cerrar */}
            <IconButton
              onClick={handleClose}
              size="small"
              sx={{
                color: 'white',
                zIndex: 1,
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: 'rgba(255,255,255,0.2)',
                  transform: 'scale(1.05)',
                },
              }}
            >
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>

          {/* ── Thin accent bar ── */}
          <Box
            sx={{
              height: 3,
              background: `linear-gradient(90deg, ${SELLSI_BLUE_DEEPER} 0%, ${SELLSI_BLUE_DARK} 40%, ${SELLSI_BLUE} 70%, #25D366 100%)`,
            }}
          />

          {/* ── Contenido ── */}
          <Box sx={{ p: 3 }}>
            {!selectedOption ? (
              <Fade in={!selectedOption}>
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 2.5,
                      color: '#64748b',
                      fontSize: 14,
                      textAlign: 'center',
                      fontWeight: 500,
                    }}
                  >
                    ¿En qué podemos ayudarte?
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {/* Opción 1 — Atención comercial */}
                    <Button
                      variant="outlined"
                      onClick={() => handleOptionSelect(1)}
                      sx={{
                        border: `1.5px solid rgba(46, 82, 178, 0.3)`,
                        color: SELLSI_BLUE,
                        py: 1.8,
                        px: 2.5,
                        fontSize: 15,
                        fontWeight: 600,
                        borderRadius: '10px',
                        textTransform: 'none',
                        justifyContent: 'flex-start',
                        gap: 1.5,
                        background: 'rgba(46, 82, 178, 0.04)',
                        transition: 'all 0.25s ease',
                        '&:hover': {
                          border: `1.5px solid ${SELLSI_BLUE}`,
                          background: `rgba(46, 82, 178, 0.09)`,
                          transform: 'translateY(-1px)',
                          boxShadow: `0 4px 14px rgba(46, 82, 178, 0.15)`,
                        },
                      }}
                    >
                      <Box
                        component="span"
                        sx={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}
                      >
                        💼
                      </Box>
                      <Box sx={{ textAlign: 'left' }}>
                        <Typography sx={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2, color: SELLSI_BLUE }}>
                          Atención comercial
                        </Typography>
                        <Typography sx={{ fontSize: 11, opacity: 0.65, fontWeight: 400, lineHeight: 1.2, color: SELLSI_BLUE }}>
                          Ventas, planes y cotizaciones
                        </Typography>
                      </Box>
                    </Button>

                    {/* Opción 2 — Soporte */}
                    <Button
                      variant="outlined"
                      onClick={() => handleOptionSelect(2)}
                      sx={{
                        border: `1.5px solid rgba(46, 82, 178, 0.3)`,
                        color: SELLSI_BLUE,
                        py: 1.8,
                        px: 2.5,
                        fontSize: 15,
                        fontWeight: 600,
                        borderRadius: '10px',
                        textTransform: 'none',
                        justifyContent: 'flex-start',
                        gap: 1.5,
                        background: 'rgba(46, 82, 178, 0.04)',
                        transition: 'all 0.25s ease',
                        '&:hover': {
                          border: `1.5px solid ${SELLSI_BLUE}`,
                          background: `rgba(46, 82, 178, 0.09)`,
                          transform: 'translateY(-1px)',
                          boxShadow: `0 4px 14px rgba(46, 82, 178, 0.15)`,
                        },
                      }}
                    >
                      <Box
                        component="span"
                        sx={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}
                      >
                        🛠️
                      </Box>
                      <Box sx={{ textAlign: 'left' }}>
                        <Typography sx={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2, color: SELLSI_BLUE }}>
                          Soporte técnico
                        </Typography>
                        <Typography sx={{ fontSize: 11, opacity: 0.65, fontWeight: 400, lineHeight: 1.2, color: SELLSI_BLUE }}>
                          Problemas, sugerencias y bugs
                        </Typography>
                      </Box>
                    </Button>
                  </Box>
                </Box>
              </Fade>
            ) : (
              <Fade in={!!selectedOption}>
                <Box>
                  {/* Pill indicador de categoría */}
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.75,
                      px: 1.5,
                      py: 0.5,
                      mb: 2,
                      borderRadius: '20px',
                      background: `linear-gradient(135deg, ${SELLSI_BLUE_DARK}18 0%, ${SELLSI_BLUE}18 100%)`,
                      border: `1px solid ${SELLSI_BLUE}30`,
                    }}
                  >
                    <span style={{ fontSize: 13 }}>
                      {selectedOption === 1 ? '💼' : '🛠️'}
                    </span>
                    <Typography
                      sx={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: SELLSI_BLUE,
                        letterSpacing: '0.02em',
                      }}
                    >
                      {selectedOption === 1 ? 'Atención comercial' : 'Soporte técnico y sugerencias'}
                    </Typography>
                  </Box>

                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={customMsg}
                    onChange={(e) => setCustomMsg(e.target.value)}
                    placeholder="Escribe tu mensaje aquí..."
                    variant="outlined"
                    sx={{
                      mb: 2.5,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                        fontSize: 14,
                        '& fieldset': {
                          borderColor: 'rgba(46, 82, 178, 0.2)',
                        },
                        '&:hover fieldset': {
                          borderColor: `rgba(46, 82, 178, 0.5)`,
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: SELLSI_BLUE,
                          borderWidth: '1.5px',
                        },
                      },
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) {
                        handleSend();
                      }
                    }}
                  />

                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button
                      variant="text"
                      onClick={() => setSelectedOption(null)}
                      startIcon={<ArrowBackIcon sx={{ fontSize: '16px !important' }} />}
                      sx={{
                        flex: '0 0 auto',
                        px: 1.5,
                        py: 1.2,
                        color: '#94a3b8',
                        textTransform: 'none',
                        fontWeight: 500,
                        fontSize: 13,
                        borderRadius: '10px',
                        '&:hover': {
                          color: SELLSI_BLUE,
                          background: `rgba(46, 82, 178, 0.06)`,
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      Volver
                    </Button>

                    <Button
                      variant="contained"
                      onClick={handleSend}
                      disabled={!customMsg.trim()}
                      startIcon={<SendIcon sx={{ fontSize: '16px !important' }} />}
                      sx={{
                        flex: 1,
                        py: 1.2,
                        background: customMsg.trim()
                          ? `linear-gradient(135deg, ${SELLSI_BLUE} 0%, ${SELLSI_BLUE_DARK} 100%)`
                          : '#e2e8f0',
                        color: customMsg.trim() ? 'white' : '#94a3b8',
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: 14,
                        borderRadius: '10px',
                        boxShadow: customMsg.trim()
                          ? `0 4px 14px rgba(46, 82, 178, 0.35)`
                          : 'none',
                        transition: 'all 0.25s ease',
                        '&:hover': customMsg.trim()
                          ? {
                              background: `linear-gradient(135deg, ${SELLSI_BLUE_DARK} 0%, ${SELLSI_BLUE_DEEPER} 100%)`,
                              boxShadow: `0 6px 20px rgba(46, 82, 178, 0.45)`,
                              transform: 'translateY(-1px)',
                            }
                          : {},
                        '&.Mui-disabled': {
                          background: '#e2e8f0',
                          color: '#94a3b8',
                        },
                      }}
                    >
                      Enviar por WhatsApp
                    </Button>
                  </Box>

                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 1.5,
                      color: '#94a3b8',
                      textAlign: 'center',
                      fontSize: 11,
                    }}
                  >
                    Ctrl + Enter para enviar rápidamente
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
