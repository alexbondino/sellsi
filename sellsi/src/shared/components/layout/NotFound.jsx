import React from 'react'
import { Box, Typography, Container } from '@mui/material'
import { motion } from 'framer-motion'
import { Home as HomeIcon } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { PrimaryButton } from '../forms'
import { useAuth } from '../../../infrastructure/providers/AuthProvider'
import { useRole } from '../../../infrastructure/providers/RoleProvider'

const NotFound = () => {
  const navigate = useNavigate()
  const { session, userProfile } = useAuth()
  const { currentAppRole } = useRole()

  const handleGoHome = () => {
    // Navegación inteligente basada en sesión y rol
    if (!session) {
      // Sin sesión -> Home público
      navigate('/')
    } else if (userProfile?.main_supplier) {
      // Usuario es supplier -> Dashboard de supplier
      navigate('/supplier/home')
    } else {
      // Usuario es buyer -> Marketplace de buyer
      navigate('/buyer/marketplace')
    }
  }

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: 'calc(100vh - 200px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          py: 8,
        }}
      >
        {/* Logo animado */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
        >
          <Box
            component="img"
            src="/logo.svg"
            alt="Sellsi Logo"
            sx={{
              width: { xs: 120, md: 150 },
              height: 'auto',
              mb: 4,
              filter: 'drop-shadow(0 4px 12px rgba(102, 126, 234, 0.3))',
            }}
          />
        </motion.div>

        {/* Número 404 grande */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '6rem', md: '8rem' },
              fontWeight: 'bold',
              background: '#2E52B2',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1,
              mb: 2,
            }}
          >
            404
          </Typography>
        </motion.div>

        {/* Mensaje principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 'bold',
              color: 'text.primary',
              mb: 2,
              fontSize: { xs: '1.8rem', md: '2.5rem' },
            }}
          >
            Página no encontrada
          </Typography>
        </motion.div>

        {/* Mensaje secundario */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Typography
            variant="h6"
            sx={{
              color: 'text.secondary',
              mb: 4,
              maxWidth: 600,
              lineHeight: 1.6,
              fontSize: { xs: '1rem', md: '1.25rem' },
            }}
          >
            No pudimos encontrar la página que buscabas. Revisa la URL o accede desde el menú principal.
          </Typography>
        </motion.div>

        {/* Ilustración decorativa */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <Box
            sx={{
              width: { xs: 200, md: 300 },
              height: { xs: 150, md: 200 },
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 4,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Elementos decorativos flotantes */}
            <motion.div
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{
                position: 'absolute',
                top: '20%',
                left: '20%',
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
              }}
            />
            <motion.div
              animate={{ 
                y: [0, 10, 0],
                rotate: [0, -5, 5, 0]
              }}
              transition={{ 
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
              style={{
                position: 'absolute',
                bottom: '25%',
                right: '25%',
                width: 15,
                height: 15,
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #764ba2, #667eea)',
              }}
            />
            
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '3rem', md: '4rem' },
                color: 'rgba(102, 126, 234, 0.3)',
                fontWeight: 'bold',
              }}
            >
              🔍
            </Typography>
          </Box>
        </motion.div>

        {/* Botones de acción */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <PrimaryButton
                variant="primary"
                size="large"
                startIcon={<HomeIcon />}
                onClick={handleGoHome}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  minWidth: { xs: 200, sm: 'auto' },
                }}
              >
                Volver al Inicio
              </PrimaryButton>
            </motion.div>
          </Box>
        </motion.div>

        {/* Mensaje de ayuda */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              mt: 4,
              fontSize: '0.9rem',
            }}
          >
            Si crees que esto es un error, por favor contacta a nuestro equipo de soporte.
          </Typography>
        </motion.div>
      </Box>
    </Container>
  )
}

export default NotFound
