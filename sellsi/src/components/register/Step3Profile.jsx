import React from 'react'
import { Box, TextField, Typography, Divider } from '@mui/material'
import { CustomButton, LogoUploader, CountrySelector } from '../shared'

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
          mb: 8,
          mt: 2,
          fontWeight: 700,
          textAlign: 'center',
          fontSize: 22,
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
                  onChange={(e) =>
                    onFieldChange('telefonoContacto', e.target.value)
                  }
                  placeholder="Ej: 912345678"
                  type="tel"
                />
              </Box>
            </Box>

            <Box
              sx={{
                flex: 1,
                minWidth: 240,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 1.5,
              }}
            >
              <Typography
                sx={{
                  mb: 0.5,
                  fontWeight: 500,
                  textAlign: 'center',
                  fontSize: 14,
                }}
              >
                Sube la imagen con el logo de tu empresa
              </Typography>

              <LogoUploader
                logoPreview={logoEmpresa}
                onLogoSelect={onLogoChange}
                size="large"
              />

              {logoError && (
                <Typography
                  sx={{
                    color: 'red',
                    fontSize: 12,
                    textAlign: 'center',
                  }}
                >
                  {logoError}
                </Typography>
              )}

              <Typography
                sx={{ fontSize: 11, color: '#888', textAlign: 'center' }}
              >
                Tamaño máximo del archivo: 300 KB.
              </Typography>
            </Box>
          </>
        ) : (
          <>
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
                onChange={(e) =>
                  onFieldChange('telefonoContacto', e.target.value)
                }
                placeholder="Ej: 912345678"
                type="tel"
              />
            </Box>
          </>
        )}
      </Box>{' '}
      <Box sx={{ width: '100%', maxWidth: 520 }}>
        <CustomButton
          onClick={onNext}
          fullWidth
          sx={{ mb: 0.5, mt: isProvider ? 15.5 : 24.5 }}
          disabled={!isFormValid()} // ✅ DESHABILITAR botón
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
  )
}

export default Step3Profile
