import React from 'react'
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto'

const LogoUploader = ({
  logoPreview,
  onLogoSelect,
  size = 'large',
  showText = true,
  textVariant = 'default',
}) => {
  const theme = useTheme()
  const isXsOrSm = useMediaQuery(theme.breakpoints.down('md'))
  const isLarge = size === 'large'
  const avatarSize = isLarge ? 120 : 80

  const getUploadText = () => {
    if (logoPreview) return 'Clic para cambiar logo'
    if (textVariant === 'responsive') {
      return isXsOrSm ? 'Adjuntar logo aqui' : 'Clic para subir logo'
    }
    return 'Clic para subir logo'
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      onLogoSelect(file)
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: isLarge ? 2 : 1,
      }}
    >
      <input
        accept="image/*"
        style={{ display: 'none' }}
        id="logo-upload"
        type="file"
        onChange={handleFileSelect}
      />
      <label htmlFor="logo-upload">
        <IconButton
          component="span"
          sx={{
            p: 0,
            '&:hover': {
              transform: 'scale(1.05)',
            },
            transition: 'transform 0.2s ease',
          }}
        >
          <Avatar
            src={logoPreview}
            sx={{
              width: avatarSize,
              height: avatarSize,
              bgcolor: '#f5f5f5',
              border: '2px dashed #ccc',
              cursor: 'pointer',
              '&:hover': {
                borderColor: '#41B6E6',
                bgcolor: '#f0f8ff',
              },
            }}
          >
            {!logoPreview && (
              <InsertPhotoIcon
                sx={{
                  fontSize: isLarge ? 40 : 30,
                  color: '#999',
                }}
              />
            )}
          </Avatar>
        </IconButton>
      </label>{' '}
      {showText && (
        <Typography
          variant="body2"
          sx={{
            textAlign: 'center',
            color: '#666',
            fontSize: isLarge ? 14 : 12,
            mb: { xs: 0 }, // Reduced margin for xs/sm
          }}
        >
          {getUploadText()}
        </Typography>
      )}
    </Box>
  )
}

export default LogoUploader
