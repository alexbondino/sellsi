import React from 'react'
import { Box, Typography, Button } from '@mui/material'

const ContactSection = ({ contactanosRef }) => {
  return (
    <Box
      ref={contactanosRef}
      sx={{
        px: { xs: 2, sm: 4, md: 8, lg: 15, xl: 30 },
        py: { xs: 6, sm: 8, md: 10, lg: 10, xl: 10 },
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Typography
        variant="h3"
        fontWeight="bold"
        gutterBottom
        sx={{
          fontSize: {
            xs: '2rem',
            sm: '2.2rem',
            md: '2.5rem',
            lg: '2.5rem',
            xl: '2.5rem',
          },
          textAlign: 'center',
          mb: { xs: 2, sm: 2.5, md: 3, lg: 3, xl: 3 },
        }}
      >
        Contáctanos
      </Typography>
      <Typography
        variant="h6"
        sx={{
          mb: { xs: 4, sm: 5, md: 6, lg: 6, xl: 6 },
          textAlign: 'center',
          maxWidth: { xs: 500, sm: 550, md: 600, lg: 600, xl: 600 },
          fontSize: {
            xs: '1rem',
            sm: '1.1rem',
            md: '1.2rem',
            lg: '1.2rem',
            xl: '1.2rem',
          },
          color: 'text.secondary',
          lineHeight: { xs: 1.5, sm: 1.6, md: 1.6, lg: 1.6, xl: 1.6 },
        }}
      >
        ¿Tienes alguna pregunta o quieres formar parte de nuestra comunidad?
        Envíanos un mensaje y nos pondremos en contacto contigo.
      </Typography>

      <Box
        component="form"
        noValidate
        autoComplete="off"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 2.5, sm: 3, md: 3, lg: 3, xl: 3 },
          width: '100%',
          maxWidth: { xs: 500, sm: 600, md: 700, lg: 700, xl: 700 },
          backgroundColor: 'white',
          p: { xs: 3, sm: 4, md: 5, lg: 5, xl: 5 },
          borderRadius: { xs: 3, sm: 3, md: 4, lg: 4, xl: 4 },
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          border: '1px solid #f0f0f0',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: {
              xs: 'column',
              sm: 'row',
              md: 'row',
              lg: 'row',
              xl: 'row',
            },
            gap: { xs: 2.5, sm: 3, md: 3, lg: 3, xl: 3 },
          }}
        >
          <input
            type="text"
            placeholder="Nombre completo"
            style={{
              flex: 1,
              padding: '14px 16px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '1rem',
              width: '100%',
              backgroundColor: 'white',
              transition: 'border-color 0.3s ease',
              outline: 'none',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#1976d2')}
            onBlur={(e) => (e.target.style.borderColor = '#e0e0e0')}
          />
          <input
            type="email"
            placeholder="Correo electrónico"
            style={{
              flex: 1,
              padding: '14px 16px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '1rem',
              width: '100%',
              backgroundColor: 'white',
              transition: 'border-color 0.3s ease',
              outline: 'none',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#1976d2')}
            onBlur={(e) => (e.target.style.borderColor = '#e0e0e0')}
          />
        </Box>

        <textarea
          placeholder="Cuéntanos sobre tu proyecto o consulta..."
          rows={6}
          style={{
            padding: '14px 16px',
            border: '2px solid #e0e0e0',
            borderRadius: '8px',
            fontSize: '1rem',
            width: '100%',
            resize: 'vertical',
            backgroundColor: 'white',
            fontFamily: 'inherit',
            transition: 'border-color 0.3s ease',
            outline: 'none',
          }}
          onFocus={(e) => (e.target.style.borderColor = '#1976d2')}
          onBlur={(e) => (e.target.style.borderColor = '#e0e0e0')}
        />

        <Button
          variant="contained"
          color="primary"
          size="large"
          sx={{
            mt: { xs: 1.5, sm: 2, md: 2, lg: 2, xl: 2 },
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: {
              xs: '1rem',
              sm: '1.05rem',
              md: '1.1rem',
              lg: '1.1rem',
              xl: '1.1rem',
            },
            textTransform: 'none',
            py: { xs: 1.8, sm: 2, md: 2, lg: 2, xl: 2 },
            px: { xs: 3, sm: 4, md: 4, lg: 4, xl: 4 },
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(25, 118, 210, 0.3)',
            },
          }}
        >
          Enviar Mensaje
        </Button>
      </Box>
    </Box>
  )
}

export default ContactSection
