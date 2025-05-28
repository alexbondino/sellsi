import React from 'react'
import { Box, Typography, Paper, Button } from '@mui/material'
import { CustomButton } from '../shared'

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
          mb: 6,
          mt: 2,
          fontWeight: 700,
          textAlign: 'center',
          fontSize: 22,
        }}
      >
        Elige el tipo de cuenta predeterminado
      </Typography>

      <Box
        display="flex"
        gap={{ xs: 2, sm: 3, md: 4 }}
        width="100%"
        justifyContent="center"
        flexWrap="wrap"
        sx={{ px: { xs: 1, sm: 2 } }}
      >
        {/* Cuenta Proveedor */}
        <Paper
          elevation={3}
          sx={{
            p: { xs: 1.5, sm: 2 },
            minWidth: { xs: 280, sm: 300 },
            maxWidth: 350,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: 280,
            border:
              selectedType === 'proveedor'
                ? `2px solid #41B6E6`
                : `2px solid #eee`,
            background: selectedType === 'proveedor' ? '#f0fbff' : '#fafbfc',
          }}
        >
          <Box flexGrow={1} width="100%">
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 0.5,
                color: '#222',
                fontSize: 18,
              }}
            >
              Cuenta Proveedor
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: '#888', mb: 1, fontSize: 13 }}
            >
              Regístrate como proveedor para:
            </Typography>
            <ul
              style={{
                margin: 0,
                paddingLeft: 16,
                color: '#444',
                fontSize: 13,
                lineHeight: 1.3,
              }}
            >
              <li style={{ marginBottom: '3px' }}>
                Crear el perfil de tu empresa y promocionar tus productos
              </li>
              <li style={{ marginBottom: '3px' }}>
                Recibir solicitudes de compradores
              </li>
              <li style={{ marginBottom: '3px' }}>
                Acceder a una base de datos de compradores
              </li>
              <li style={{ marginBottom: '3px' }}>
                Ofrecer productos a leads de compradores
              </li>
              <li>Comerciar carga no reclamada</li>
            </ul>
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
            minWidth: { xs: 280, sm: 300 },
            maxWidth: 350,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: 280,
            border:
              selectedType === 'comprador'
                ? `2px solid #41B6E6`
                : `2px solid #eee`,
            background: selectedType === 'comprador' ? '#f0fbff' : '#fafbfc',
          }}
        >
          <Box flexGrow={1} width="100%">
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 0.5,
                color: '#222',
                fontSize: 18,
              }}
            >
              Cuenta Comprador
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: '#888', mb: 1, fontSize: 13 }}
            >
              Regístrate como comprador para:
            </Typography>
            <ul
              style={{
                margin: 0,
                paddingLeft: 16,
                color: '#444',
                fontSize: 13,
                lineHeight: 1.3,
              }}
            >
              <li style={{ marginBottom: '3px' }}>
                Buscar productos y solicitar cotizaciones a proveedores
              </li>
              <li style={{ marginBottom: '3px' }}>
                Crear solicitudes para que proveedores te contacten
              </li>
              <li>Acceder a carga no reclamada</li>
            </ul>
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
            mb: 3,
            mt: 3,
            textAlign: 'center',
          }}
        >
          *Podrás cambiar el tipo de cuenta más adelante desde la configuración
          de tu perfil.
        </Typography>
        <Box sx={{ width: '100%', maxWidth: 520 }}>
          <CustomButton
            type="submit"
            disabled={!selectedType}
            onClick={onNext}
            fullWidth
            sx={{ mb: 0.5 }}
          >
            Continuar
          </CustomButton>
          <CustomButton
            variant="text"
            onClick={onBack}
            fullWidth
            sx={{ mt: 0.5 }}
          >
            Volver atrás
          </CustomButton>
        </Box>
      </Box>
    </Box>
  )
}

export default Step2AccountType
