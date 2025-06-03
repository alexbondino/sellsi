import React from 'react'
import { Box, TextField, Typography, Divider } from '@mui/material'
import { CustomButton, LogoUploader, CountrySelector } from '../../hooks/shared'

const Step3Profile = ({
  accountType,
  formData,
  onFieldChange,
  onLogoChange,
  logoError,
  onNext,
  onBack,
}) => {
  const {
    nombreEmpresa,
    nombrePersonal,
    telefonoContacto,
    codigoPais,
    logoEmpresa,
  } = formData

  const isProvider = accountType === 'proveedor'

  // ✅ VALIDACIÓN de campos obligatorios
  const isFormValid = () => {
    if (isProvider) {
      return nombreEmpresa && nombreEmpresa.trim().length > 0
    } else {
      return nombrePersonal && nombrePersonal.trim().length > 0
    }
  }

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
          mb: { xs: 1, sm: 1, md: 6, lg: 8 },
          mt: 2,
          fontWeight: 700,
          textAlign: 'center',
          fontSize: { xs: 18, sm: 18, lg: 22 },
        }}
      >
        {isProvider
          ? 'Completa los datos de tu empresa'
          : 'Completa tus datos personales'}
      </Typography>
      <Box
        component="form"
        sx={{
          width: '100%',
          maxWidth: isProvider ? 850 : 380,
          display: 'flex',
          flexDirection: isProvider ? { xs: 'column', md: 'row' } : 'column',
          gap: { xs: 2, md: 4 },
          justifyContent: 'center',
          alignItems: 'flex-start',
          mb: 2,
        }}
        noValidate
        autoComplete="off"
      >
        {isProvider ? (
          <>
            <Box sx={{ flex: 1, minWidth: 320 }}>
              {' '}
              <TextField
                label="Nombre de Empresa *" // ✅ AGREGAR asterisco
                variant="outlined"
                fullWidth
                value={nombreEmpresa}
                onChange={(e) => onFieldChange('nombreEmpresa', e.target.value)}
                sx={{ mb: 1.5 }} // ✅ SOLO el margin, sin estilos de error
                size="small"
                required
              />
              <Box sx={{ display: 'flex', gap: 1, mb: { xs: 0, mb: 1.5 } }}>
                <CountrySelector
                  value={codigoPais}
                  onChange={(e) => onFieldChange('codigoPais', e.target.value)}
                  countries={['Chile', 'Argentina', 'México']}
                />
                <TextField
                  fullWidth
                  label="Teléfono de contacto"
                  value={telefonoContacto}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '')
                    onFieldChange('telefonoContacto', value)
                  }}
                  placeholder="Ej: 912345678"
                  type="tel"
                />
              </Box>
            </Box>{' '}
            <Box
              sx={{
                flex: 1,
                minWidth: 240,
                display: 'flex',
                flexDirection: 'column',
                alignItems: { xs: 'center', sm: 'center', md: 'center' },
                justifyContent: 'flex-start',
                gap: { xs: 0, mb: 1.5 },
                width: { xs: '100%', sm: '100%' },
                position: 'relative', // Enable absolute positioning for error
              }}
            >
              <Typography
                sx={{
                  mb: { xs: 0, mb: 0.5 },
                  fontWeight: 500,
                  textAlign: 'center',
                  fontSize: 14,
                }}
              >
                Sube la imagen con el logo de tu empresa
              </Typography>{' '}
              <Box
                sx={{
                  transform: {
                    xs: 'scale(0.75)', // 25% más pequeño para xs
                    sm: 'scale(0.90)', // 10% más pequeño para sm
                    md: 'scale(1)', // tamaño normal para md+
                  },
                  transformOrigin: 'center',
                }}
              >
                <LogoUploader
                  logoPreview={logoEmpresa}
                  onLogoSelect={onLogoChange}
                  size="large"
                  textVariant="responsive"
                />
              </Box>{' '}
              {logoError && (
                <Typography
                  sx={{
                    color: 'red',
                    fontSize: 12,
                    textAlign: 'center',
                    position: 'absolute',
                    bottom: { xs: -20, sm: -20, md: -20 }, // Moved down by reducing bottom values
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '100%',
                    zIndex: 1,
                  }}
                >
                  {logoError}
                </Typography>
              )}
              <Typography
                sx={{
                  fontSize: 11,
                  color: '#888',
                  textAlign: 'center',
                  mt: { xs: -2, sm: 0, md: 0 }, // Reduced margin for xs/sm
                }}
              >
                Tamaño máximo del archivo: 300 KB.
              </Typography>
            </Box>
          </>
        ) : (
          <>
            {' '}
            <TextField
              label="Nombre y Apellido *" // ✅ AGREGAR asterisco
              variant="outlined"
              fullWidth
              value={nombrePersonal}
              onChange={(e) => onFieldChange('nombrePersonal', e.target.value)}
              sx={{ mb: 1.5 }} // ✅ SOLO el margin, sin estilos de error
              size="small"
              required
            />
            <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
              <CountrySelector
                value={codigoPais}
                onChange={(e) => onFieldChange('codigoPais', e.target.value)}
                countries={['Chile', 'Argentina', 'México']}
              />
              <TextField
                fullWidth
                label="Teléfono de contacto"
                value={telefonoContacto}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '')
                  onFieldChange('telefonoContacto', value)
                }}
                placeholder="Ej: 948069213"
                type="tel"
              />
            </Box>
          </>
        )}
      </Box>{' '}
      <Box sx={{ width: '100%', maxWidth: 520 }}>
        {' '}
        <CustomButton
          onClick={onNext}
          fullWidth
          sx={{
            mb: 0.5,
            height: { md: '32px', lg: '44px' },
            mt: isProvider
              ? { xs: 2.4, sm: 7.35, md: 11, lg: 19.3, xl: 19.4 }
              : { xs: 23.15, sm: 30.05, md: 16.2, lg: 24.5, xl: 24.6 },
          }}
          disabled={!isFormValid()} // ✅ FIXED: Corrected function name
        >
          Continuar
        </CustomButton>
        <CustomButton
          variant="text"
          onClick={onBack}
          fullWidth
          sx={{ mt: 0.5, height: { md: '32px', lg: '44px' } }}
        >
          Volver atrás
        </CustomButton>
      </Box>
    </Box>
  )
}

export default Step3Profile
