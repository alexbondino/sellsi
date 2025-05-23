import { Box, Button } from '@mui/material';

const TopBar = () => {
  return (
    <Box
      sx={theme => ({
        backgroundColor: theme.palette.bars.main,
        width: '100vw',
        px: 0,
        py: 1,
        display: 'flex',
        justifyContent: 'center',
        position: 'fixed',
        top: 0,
        zIndex: 1100,
      })}
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
            {[
              'Quiénes somos',
              'Servicios',
              'Trabaja con nosotros',
              'Contáctanos',
            ].map((item, index) => (
              <Button
                key={index}
                color="inherit"
                sx={theme => ({
                  fontWeight: 'bold',
                  color: theme.palette.common.white, // <-- texto blanco
                })}
              >
                {item}
              </Button>
            ))}
          </Box>
        </Box>

        {/* Botones de login y register */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            sx={theme => ({
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.common.white, // <-- texto blanco
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
            })}
          >
            Iniciar sesión
          </Button>
          <Button
            variant="outlined"
            sx={theme => ({
              color: theme.palette.common.white, // <-- texto blanco
              borderColor: theme.palette.primary.main,
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: theme.palette.primary.main,
                borderColor: theme.palette.primary.main,
              },
            })}
          >
            Registrarse
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default TopBar;
