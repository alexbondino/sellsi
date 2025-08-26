// ============================================================================
// CHECKOUT PROGRESS STEPPER - COMPONENTE DE PROGRESO DEL CHECKOUT
// ============================================================================

import React, { useMemo } from 'react'
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepIcon,
  Typography,
  useTheme,
  useMediaQuery,
  CircularProgress
} from '@mui/material'
import {
  ShoppingCart as ShoppingCartIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Done as DoneIcon
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { CHECKOUT_STEPS } from '../../../constants/checkout'

// ============================================================================
// COMPONENTE DE ICONO PERSONALIZADO
// ============================================================================

const CustomStepIcon = ({ active, completed, icon, order }) => {
  const theme = useTheme()
  
  const iconComponents = {
    ShoppingCart: ShoppingCartIcon,
    Payment: PaymentIcon,
    CheckCircle: CheckCircleIcon,
    HourglassEmpty: HourglassEmptyIcon,
    Done: DoneIcon
  }
  
  const IconComponent = iconComponents[icon] || CheckCircleIcon
  
  // Determinar si es el paso de procesamiento
  const isProcessing = active && icon === 'HourglassEmpty'
  
  return (
    <Box
      sx={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: completed 
          ? theme.palette.success.main 
          : active 
            ? theme.palette.primary.main 
            : theme.palette.grey[300],
        color: completed || active ? 'white' : theme.palette.grey[600],
        transition: 'all 0.3s ease',
        boxShadow: active ? `0 0 0 4px ${theme.palette.primary.main}20` : 'none'
      }}
    >
      {completed ? (
        <DoneIcon sx={{ fontSize: 20 }} />
      ) : isProcessing ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ 
            duration: 3, // Más lento: 3 segundos por rotación
            repeat: Infinity, 
            ease: "linear" 
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transformOrigin: 'center center' // Asegurar que gire en su centro
          }}
        >
          <HourglassEmptyIcon sx={{ fontSize: 20 }} />
        </motion.div>
      ) : (
        <IconComponent sx={{ fontSize: 20 }} />
      )}
    </Box>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const CheckoutProgressStepper = ({ 
  currentStep,
  completedSteps = [],
  orientation = 'horizontal',
  showLabels = true 
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  // Convertir a array de pasos
  const steps = Object.values(CHECKOUT_STEPS)
  
  // Determinar paso activo
  const activeStep = steps.findIndex(step => step.id === currentStep?.id)
  
  // Función para determinar si un paso está completado
  const isStepCompleted = (step) => {
    return completedSteps.some(completedStep => completedStep.id === step.id)
  }
  
  // Función para determinar si un paso está activo
  const isStepActive = (step) => {
    return currentStep?.id === step.id
  }

  // Precrear componentes de ícono estables para cada paso
  const stepIconComponents = useMemo(() => {
    return steps.reduce((acc, s) => {
      // MUI pasará props.active y props.completed; las reenviamos sin cerrar sobre valores potencialmente obsoletos
      acc[s.id] = (iconProps) => (
        <CustomStepIcon
          active={iconProps.active}
          completed={iconProps.completed}
          icon={s.icon}
          order={s.order}
        />
      )
      return acc
    }, {})
  }, [steps])

  return (
    <Box sx={{ width: '100%', py: 2 }}>
      <Stepper
        activeStep={activeStep}
        orientation={isMobile ? 'vertical' : orientation}
        sx={{
          '& .MuiStepConnector-root': {
            '& .MuiStepConnector-line': {
              borderColor: theme.palette.grey[300],
              borderWidth: 2,
              borderRadius: 1
            }
          },
          '& .MuiStepConnector-active .MuiStepConnector-line': {
            borderColor: theme.palette.primary.main
          },
          '& .MuiStepConnector-completed .MuiStepConnector-line': {
            borderColor: theme.palette.success.main
          }
        }}
      >
        {steps.map((step, index) => {
          const isCompleted = isStepCompleted(step)
          const isActive = isStepActive(step)
          
          return (
            <Step key={step.id} completed={isCompleted}>
              <StepLabel
                StepIconComponent={stepIconComponents[step.id]}
                sx={{
                  '& .MuiStepLabel-label': {
                    fontWeight: isActive ? 'bold' : 'normal',
                    color: isCompleted 
                      ? theme.palette.success.main 
                      : isActive 
                        ? theme.palette.primary.main 
                        : theme.palette.text.secondary,
                    fontSize: isMobile ? '0.875rem' : '1rem'
                  }
                }}
              >
                {showLabels && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Typography
                      variant={isMobile ? 'body2' : 'body1'}
                      fontWeight={isActive ? 'bold' : 'normal'}
                      color={
                        isCompleted 
                          ? 'success.main' 
                          : isActive 
                            ? 'primary.main' 
                            : 'text.secondary'
                      }
                    >
                      {step.name}
                      {/* Mostrar indicador de procesamiento */}
                      {isActive && step.icon === 'HourglassEmpty' && (
                        <Box component="span" sx={{ ml: 1 }}>
                          <CircularProgress size={12} sx={{ color: 'primary.main' }} />
                        </Box>
                      )}
                    </Typography>
                  </motion.div>
                )}
              </StepLabel>
            </Step>
          )
        })}
      </Stepper>
    </Box>
  )
}

export default CheckoutProgressStepper
