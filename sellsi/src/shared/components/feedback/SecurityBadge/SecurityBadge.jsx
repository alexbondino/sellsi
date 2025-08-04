// ============================================================================
// SECURITY BADGE - COMPONENTE DE INFORMACIÓN DE SEGURIDAD
// ============================================================================

import React from 'react'
import {
  Box,
  Typography,
  Stack,
  Chip,
  Tooltip,
  Paper
} from '@mui/material'
import {
  Security as SecurityIcon,
  Https as HttpsIcon,
  Verified as VerifiedIcon,
  Shield as ShieldIcon
} from '@mui/icons-material'
import { motion } from 'framer-motion'

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const SecurityBadge = ({ 
  variant = 'compact', // 'compact' | 'detailed'
  showTooltip = true,
  sx = {}
}) => {
  
  const securityFeatures = [
    {
      icon: HttpsIcon,
      label: 'SSL 256-bit',
      description: 'Conexión encriptada de extremo a extremo',
      color: 'success'
    },
    {
      icon: VerifiedIcon,
      label: 'Verificado',
      description: 'Método de pago verificado y seguro',
      color: 'primary'
    },
    {
      icon: ShieldIcon,
      label: 'Protegido',
      description: 'Tu información está protegida',
      color: 'info'
    }
  ]

  if (variant === 'compact') {
    return (
      <Tooltip
        title="Sellsi retendrá los fondos hasta la confirmación de entrega"
        placement="right"
        arrow
        disabled={!showTooltip}
      >
        <Box sx={{ display: 'inline-flex', ...sx }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <SecurityIcon color="success" fontSize="small" />
              <Typography variant="caption" color="text.secondary">
                Pago 100% seguro
              </Typography>
            </Stack>
          </motion.div>
        </Box>
      </Tooltip>
    )
  }

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid rgba(76, 175, 80, 0.2)',
        backgroundColor: 'rgba(76, 175, 80, 0.05)',
        ...sx
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Stack spacing={2}>
          {/* Header */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <SecurityIcon color="success" />
            <Typography variant="h6" fontWeight="bold" color="success.main">
              Pago Seguro
            </Typography>
          </Stack>

          {/* Características de seguridad */}
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {securityFeatures.map((feature, index) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Tooltip title={feature.description} arrow>
                  <Chip
                    icon={<feature.icon sx={{ fontSize: 16 }} />}
                    label={feature.label}
                    size="small"
                    color={feature.color}
                    variant="outlined"
                    sx={{ 
                      fontSize: 12,
                      '& .MuiChip-icon': {
                        fontSize: 16
                      }
                    }}
                  />
                </Tooltip>
              </motion.div>
            ))}
          </Stack>

          {/* Descripción */}
          <Typography variant="body2" color="text.secondary">
            Tu información de pago está protegida con encriptación de nivel bancario.
            Nunca almacenamos datos sensibles de tarjetas.
          </Typography>
        </Stack>
      </motion.div>
    </Paper>
  )
}

export default SecurityBadge
