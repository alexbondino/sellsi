import React from 'react'
import { Box, Typography, Button } from '@mui/material'

const ContactSection = ({ contactanosRef }) => {
  return (
    <Box
      ref={contactanosRef}
      sx={{
        px: { xs: 2, sm: 4, md: 8, lg: 15, xl: 30 },
        py: { xs: 6, md: 10 },
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
          fontSize: { xs: '2rem', md: '2.5rem' },
          textAlign: 'center',
          mb: 3,
        }}
      >
        Contáctanos
      </Typography>
      <Typography
        variant="h6"
        sx={{
          mb: 6,
          textAlign: 'center',
          maxWidth: 600,
          fontSize: { xs: '1rem', md: '1.2rem' },
          color: 'text.secondary',
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
          gap: 3,
          width: '100%',
          maxWidth: 700,
          backgroundColor: 'white',
          p: { xs: 3, md: 5 },
          borderRadius: 4,
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          border: '1px solid #f0f0f0',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 3,
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
            mt: 2,
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            textTransform: 'none',
            py: 2,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(25, 118, 210, 0.3)',
            },
          }}
        >
          {' '}
          Enviar Mensaje
        </Button>
      </Box>
    </Box>
  )
}

export default ContactSection
