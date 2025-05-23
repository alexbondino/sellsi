import { Box, Button } from '@mui/material'
import { useState } from 'react' // Importar useState
import Login from './login'
import CrearAcc from './crearacc' // <--- Agrega esto

const TopBar = () => {
  // Estado para controlar la apertura/cierre del modal
  const [openLoginModal, setOpenLoginModal] = useState(false)
  const [openRegisterModal, setOpenRegisterModal] = useState(false) // Estado para el modal de registro

  // Función para abrir el modal de login
  const handleOpenLogin = () => {
    setOpenLoginModal(true)
  }

  // Función para cerrar el modal de login
  const handleCloseLogin = () => {
    setOpenLoginModal(false)
  }

  // Función para abrir el modal de registro
  const handleOpenRegister = () => setOpenRegisterModal(true)

  // Función para cerrar el modal de registro
  const handleCloseRegister = () => setOpenRegisterModal(false)

  return (
    <Box
      sx={{
        backgroundColor: 'bars.main',
        width: '100vw',
        px: 0,
        py: 1,
        display: 'flex',
        justifyContent: 'center',
        position: 'fixed',
        top: 0,
        zIndex: 1100,
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: '1200px',
          px: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Logo + Menú */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <img src="/logo.svg" alt="SELLSI Logo" style={{ height: 28 }} />

          {/* Menú de navegación */}
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Button color="inherit" sx={{ fontWeight: 'bold' }}>
              Quiénes somos
            </Button>
            <Button color="inherit" sx={{ fontWeight: 'bold' }}>
              Servicios
            </Button>
            <Button color="inherit" sx={{ fontWeight: 'bold' }}>
              Trabaja con nosotros
            </Button>
            <Button color="inherit" sx={{ fontWeight: 'bold' }}>
              Contáctanos
            </Button>
          </Box>
        </Box>

        {/* Botones de login y register */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            sx={{ backgroundColor: 'primary.main', color: 'text.white' }}
            onClick={handleOpenLogin} // Añadir evento onClick
          >
            Iniciar sesión
          </Button>
          <Button
            variant="outlined"
            sx={{ color: 'text.white', borderColor: 'primary.main' }}
            onClick={handleOpenRegister} // <--- Agrega esto
          >
            Registrarse
          </Button>
        </Box>
      </Box>

      {/* Modal de Login */}
      <Login
        open={openLoginModal}
        handleClose={() => setOpenLoginModal(false)}
        handleOpenRegister={() => {
          setOpenLoginModal(false)
          setOpenRegisterModal(true)
        }}
      />
      {openRegisterModal && (
        <CrearAcc
          open={openRegisterModal}
          onClose={() => setOpenRegisterModal(false)}
        />
      )}
    </Box>
  )
}

export default TopBar
