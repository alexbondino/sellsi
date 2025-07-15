import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { PrimaryButton } from '../../landing_page/hooks';

const Step2AccountType = ({ selectedType, onTypeSelect, onNext, onBack }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight={300}
    >
      <Typography
        variant="h5"
        sx={{
          mb: { xs: 1, sm: 1, md: 1, lg: 6 },
          mt: 2,
          fontWeight: 700,
          textAlign: 'center',
          fontSize: { xs: 18, sm: 18, lg: 22 },
        }}
      >
        Elige el tipo de cuenta predeterminado
      </Typography>{' '}
      {/* Versión para pantallas xs y sm - Botones elegantes arriba */}
      <Box
        sx={{
          display: { xs: 'block', sm: 'block', md: 'none' },
          width: '100%',
          maxWidth: 480,
          mb: 3,
        }}
      >
        {/* Botones de selección elegantes */}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            mb: 3,
            p: 0.5,
            backgroundColor: '#f5f5f5',
            borderRadius: 2,
          }}
        >
          <Button
            onClick={() => onTypeSelect('proveedor')}
            sx={{
              flex: 1,
              py: 1.5,
              borderRadius: 1.5,
              fontWeight: 600,
              fontSize: { xs: 13, sm: 14 },
              textTransform: 'none',
              backgroundColor:
                selectedType === 'proveedor' ? '#41B6E6' : 'transparent',
              color: selectedType === 'proveedor' ? '#fff' : '#666',
              boxShadow:
                selectedType === 'proveedor'
                  ? '0 2px 8px rgba(65, 182, 230, 0.3)'
                  : 'none',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor:
                  selectedType === 'proveedor' ? '#2fa4d6' : '#e0e0e0',
              },
            }}
          >
            Cuenta Proveedor
          </Button>
          <Button
            onClick={() => onTypeSelect('comprador')}
            sx={{
              flex: 1,
              py: 1.5,
              borderRadius: 1.5,
              fontWeight: 600,
              fontSize: { xs: 13, sm: 14 },
              textTransform: 'none',
              backgroundColor:
                selectedType === 'comprador' ? '#41B6E6' : 'transparent',
              color: selectedType === 'comprador' ? '#fff' : '#666',
              boxShadow:
                selectedType === 'comprador'
                  ? '0 2px 8px rgba(65, 182, 230, 0.3)'
                  : 'none',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor:
                  selectedType === 'comprador' ? '#2fa4d6' : '#e0e0e0',
              },
            }}
          >
            Cuenta Comprador
          </Button>
        </Box>{' '}
        {/* Contenido dinámico basado en selección */}
        {selectedType ? (
          <Box
            sx={{
              p: 1,
              backgroundColor: '#fafbfc',
              borderRadius: 2,
              border: `2px solid ${selectedType ? '#41B6E6' : '#eee'}`,
              background: selectedType ? '#f0fbff' : '#fafbfc',
              transition: 'all 0.3s ease',
              height: { xs: 210, sm: 240 }, // Altura fija para evitar cambios de layout
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden', // Previene desbordamiento
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 1,
                color: '#222',
                fontSize: { xs: 16, sm: 18 },
                textAlign: 'center',
              }}
            >
              {selectedType === 'proveedor'
                ? 'Cuenta Proveedor'
                : 'Cuenta Comprador'}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#888',
                mb: 2,
                fontSize: { xs: 12, sm: 13 },
                textAlign: 'center',
              }}
            >
              {selectedType === 'proveedor'
                ? 'Regístrate como proveedor para:'
                : 'Regístrate como comprador para:'}
            </Typography>{' '}
            <Box
              component="ul"
              sx={{
                m: 0,
                p: 0,
                pl: 0,
                fontSize: { xs: 11, sm: 12 },
                color: '#444',
                lineHeight: 1.4,
                listStyle: 'none',
                flex: 1, // Ocupa el espacio restante
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start', // Alinea los elementos al inicio
              }}
            >
              {selectedType === 'proveedor' ? (
                <>
                  <Box
                    component="li"
                    sx={{ mb: 1, display: 'flex', alignItems: 'flex-start' }}
                  >
                    <Box
                      component="span"
                      sx={{ mr: 1.5, color: '#41B6E6', fontWeight: 'bold' }}
                    >
                      •
                    </Box>
                    <Box component="span">
                      Crear el perfil de tu empresa y promocionar tus productos
                    </Box>
                  </Box>
                  <Box
                    component="li"
                    sx={{ mb: 1, display: 'flex', alignItems: 'flex-start' }}
                  >
                    <Box
                      component="span"
                      sx={{ mr: 1.5, color: '#41B6E6', fontWeight: 'bold' }}
                    >
                      •
                    </Box>
                    <Box component="span">
                      Recibir solicitudes de compradores
                    </Box>
                  </Box>
                  <Box
                    component="li"
                    sx={{ mb: 1, display: 'flex', alignItems: 'flex-start' }}
                  >
                    <Box
                      component="span"
                      sx={{ mr: 1.5, color: '#41B6E6', fontWeight: 'bold' }}
                    >
                      •
                    </Box>
                    <Box component="span">
                      Acceder a una base de datos de compradores
                    </Box>
                  </Box>
                  <Box
                    component="li"
                    sx={{ mb: 1, display: 'flex', alignItems: 'flex-start' }}
                  >
                    <Box
                      component="span"
                      sx={{ mr: 1.5, color: '#41B6E6', fontWeight: 'bold' }}
                    >
                      •
                    </Box>
                    <Box component="span">
                      Ofrecer productos a leads de compradores
                    </Box>
                  </Box>
                  <Box
                    component="li"
                    sx={{ display: 'flex', alignItems: 'flex-start' }}
                  >
                    <Box
                      component="span"
                      sx={{ mr: 1.5, color: '#41B6E6', fontWeight: 'bold' }}
                    >
                      •
                    </Box>
                    <Box component="span">Comerciar carga no reclamada</Box>
                  </Box>
                </>
              ) : (
                <>
                  <Box
                    component="li"
                    sx={{ mb: 1, display: 'flex', alignItems: 'flex-start' }}
                  >
                    <Box
                      component="span"
                      sx={{ mr: 1.5, color: '#41B6E6', fontWeight: 'bold' }}
                    >
                      •
                    </Box>
                    <Box component="span">
                      Buscar productos y solicitar cotizaciones a proveedores
                    </Box>
                  </Box>
                  <Box
                    component="li"
                    sx={{ mb: 1, display: 'flex', alignItems: 'flex-start' }}
                  >
                    <Box
                      component="span"
                      sx={{ mr: 1.5, color: '#41B6E6', fontWeight: 'bold' }}
                    >
                      •
                    </Box>
                    <Box component="span">
                      Crear solicitudes para que proveedores te contacten
                    </Box>
                  </Box>
                  <Box
                    component="li"
                    sx={{ display: 'flex', alignItems: 'flex-start' }}
                  >
                    <Box
                      component="span"
                      sx={{ mr: 1.5, color: '#41B6E6', fontWeight: 'bold' }}
                    >
                      •
                    </Box>
                    <Box component="span">Acceder a carga no reclamada</Box>
                  </Box>
                </>
              )}
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              p: 4,
              backgroundColor: '#f9f9f9',
              borderRadius: 2,
              border: '2px dashed #ddd',
              textAlign: 'center',
            }}
          >
            <Typography
              sx={{
                color: '#999',
                fontSize: { xs: 14, sm: 15 },
                fontStyle: 'italic',
              }}
            >
              Selecciona un tipo de cuenta para ver los beneficios
            </Typography>
          </Box>
        )}
      </Box>
      {/* Versión para pantallas md y superiores - Cards originales */}
      <Box
        display={{ xs: 'none', sm: 'none', md: 'flex' }}
        gap={{ md: 3, lg: 4 }}
        width="100%"
        justifyContent="center"
        flexWrap="wrap"
        sx={{ px: { md: 1, lg: 2 } }}
      >
        {/* Cuenta Proveedor */}
        <Paper
          elevation={3}
          sx={{
            p: { xs: 1, sm: 1, md: 2 },
            minWidth: { xs: 280, sm: 300, md: 330, lg: 350 },
            maxWidth: { xs: 350, sm: 400 },
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: { xs: 180, sm: 200, md: 240, lg: 280 },
            border:
              selectedType === 'proveedor'
                ? `2px solid #41B6E6`
                : `2px solid #eee`,
            background: selectedType === 'proveedor' ? '#f0fbff' : '#fafbfc',
          }}
        >
          <Box flexGrow={1} width="100%">
            {' '}
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: { xs: 0, sm: 0, md: 0.5 },
                color: '#222',
                fontSize: { xs: 16, sm: 16, lg: 18 },
              }}
            >
              Cuenta Proveedor
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#888',
                mb: 1,
                fontSize: { xs: 9, sm: 11, lg: 13 },
              }}
            >
              Regístrate como proveedor para:
            </Typography>
            <Box
              component="ul"
              sx={{
                m: 0,
                p: 0,
                pl: 0,
                fontSize: { xs: 7, sm: 9, md: 10, lg: 13 },
                color: '#444',
                lineHeight: 1.3,
                listStyle: 'none',
              }}
            >
              {' '}
              <Box
                component="li"
                sx={{ mb: '3px', display: 'flex', alignItems: 'flex-start' }}
              >
                <Box component="span" sx={{ mr: 1 }}>
                  •
                </Box>
                <Box component="span">
                  Crear el perfil de tu empresa y promocionar tus productos
                </Box>
              </Box>
              <Box
                component="li"
                sx={{ mb: '3px', display: 'flex', alignItems: 'flex-start' }}
              >
                <Box component="span" sx={{ mr: 1 }}>
                  •
                </Box>
                <Box component="span">Recibir solicitudes de compradores</Box>
              </Box>
              <Box
                component="li"
                sx={{ mb: '3px', display: 'flex', alignItems: 'flex-start' }}
              >
                <Box component="span" sx={{ mr: 1 }}>
                  •
                </Box>
                <Box component="span">
                  Acceder a una base de datos de compradores
                </Box>
              </Box>
              <Box
                component="li"
                sx={{ mb: '3px', display: 'flex', alignItems: 'flex-start' }}
              >
                <Box component="span" sx={{ mr: 1 }}>
                  •
                </Box>
                <Box component="span">
                  Ofrecer productos a leads de compradores
                </Box>
              </Box>
              <Box
                component="li"
                sx={{ display: 'flex', alignItems: 'flex-start' }}
              >
                <Box component="span" sx={{ mr: 1 }}>
                  •
                </Box>
                <Box component="span">Comerciar carga no reclamada</Box>
              </Box>
            </Box>
          </Box>
          <Button
            sx={{
              width: '100%',
              backgroundColor:
                selectedType === 'proveedor' ? '#41B6E6' : '#b0c4cc',
              color: '#fff',
              fontWeight: 700,
              textTransform: 'none',
              mt: 1.5,
              height: 36,
              fontSize: 14,
              '&:hover': { backgroundColor: '#2fa4d6' },
            }}
            onClick={() => onTypeSelect('proveedor')}
          >
            Elegir
          </Button>
        </Paper>

        {/* Cuenta Comprador */}
        <Paper
          elevation={3}
          sx={{
            p: { xs: 1.5, sm: 2 },
            minWidth: { xs: 280, sm: 300, md: 330, lg: 350 },
            maxWidth: { xs: 350, sm: 400 },
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: { xs: 180, sm: 200, md: 240, lg: 280 },
            border:
              selectedType === 'comprador'
                ? `2px solid #41B6E6`
                : `2px solid #eee`,
            background: selectedType === 'comprador' ? '#f0fbff' : '#fafbfc',
          }}
        >
          <Box flexGrow={1} width="100%">
            {' '}
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: { xs: 0, sm: 0, md: 0.5 },
                color: '#222',
                fontSize: { xs: 16, sm: 16, lg: 18 },
              }}
            >
              Cuenta Comprador
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: '#888', mb: 1, fontSize: { xs: 9, sm: 11, lg: 13 } }}
            >
              Regístrate como comprador para:
            </Typography>
            <Box
              component="ul"
              sx={{
                m: 0,
                p: 0,
                pl: 0,
                color: '#444',
                fontSize: { xs: 7, sm: 9, md: 10, lg: 13 },
                lineHeight: 1.3,
                listStyle: 'none',
              }}
            >
              {' '}
              <Box
                component="li"
                sx={{ mb: '3px', display: 'flex', alignItems: 'flex-start' }}
              >
                <Box component="span" sx={{ mr: 1 }}>
                  •
                </Box>
                <Box component="span">
                  Buscar productos y solicitar cotizaciones a proveedores
                </Box>
              </Box>
              <Box
                component="li"
                sx={{ mb: '3px', display: 'flex', alignItems: 'flex-start' }}
              >
                <Box component="span" sx={{ mr: 1 }}>
                  •
                </Box>
                <Box component="span">
                  Crear solicitudes para que proveedores te contacten
                </Box>
              </Box>
              <Box
                component="li"
                sx={{ display: 'flex', alignItems: 'flex-start' }}
              >
                <Box component="span" sx={{ mr: 1 }}>
                  •
                </Box>
                <Box component="span">Acceder a carga no reclamada</Box>
              </Box>
            </Box>
          </Box>
          <Button
            variant="contained"
            sx={{
              width: '100%',
              backgroundColor:
                selectedType === 'comprador' ? '#41B6E6' : '#b0c4cc',
              color: '#fff',
              fontWeight: 700,
              textTransform: 'none',
              mt: 1.5,
              height: 36,
              fontSize: 14,
              '&:hover': { backgroundColor: '#2fa4d6' },
            }}
            onClick={() => onTypeSelect('comprador')}
          >
            Elegir
          </Button>
        </Paper>
      </Box>
      <Box
        mt={4}
        display="flex"
        flexDirection="column"
        alignItems="center"
        width="100%"
      >
        {' '}
        <Typography
          sx={{
            color: '#888',
            fontSize: 12,
            mb: { xs: 1, sm: 1.5, md: 2.9, lg: 3.22, xl: 3.35 },
            mt: { xs: -6.5, sm: -4, md: 3, lg: 3, xl: 3 },
            textAlign: 'center',
          }}
        >
          *Podrás cambiar el tipo de cuenta más adelante desde la configuración
          de tu perfil.
        </Typography>
        <Box sx={{ width: '100%', maxWidth: 520 }}>
          <PrimaryButton
            type="submit"
            disabled={!selectedType}
            onClick={onNext}
            fullWidth
            sx={{ mb: 0.5, height: { md: '32px', lg: '44px' } }}
          >
            Continuar
          </PrimaryButton>
          <PrimaryButton
            variant="text"
            onClick={onBack}
            fullWidth
            sx={{ mt: 0.5, height: { md: '32px', lg: '44px' } }}
          >
            Volver
          </PrimaryButton>
        </Box>
      </Box>
    </Box>
  );
};

export default Step2AccountType;
