import { Box, Button } from '@mui/material';

const TopBar = () => {
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
                    <Button sx={{ backgroundColor: 'primary.main', color: 'text.white'}}>
                        Iniciar sesión
                    </Button>
                    <Button variant="outlined" sx={{ color: 'text.white', borderColor: 'primary.main' }}
        >               Registrarse
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default TopBar;
