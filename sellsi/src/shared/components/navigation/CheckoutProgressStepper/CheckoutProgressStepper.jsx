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
  showLabels = true,
  isFinancingMode = false // Nuevo prop para detectar modo financiamiento
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  // Convertir a array de pasos y modificar el primer paso si es financiamiento
  const steps = React.useMemo(() => {
    const baseSteps = Object.values(CHECKOUT_STEPS);
    
    if (isFinancingMode) {
      // Crear una copia del primer paso con nombre modificado
      return baseSteps.map((step, index) => {
        if (index === 0 && step.id === 'cart') {
          return {
            ...step,
            name: 'Mis Financiamientos'
          };
        }
        return step;
      });
    }
    
    return baseSteps;
  }, [isFinancingMode]);
  
  // Determinar paso activo - manejar tanto objeto como string/ID
  const currentStepId = React.useMemo(() => {
    if (typeof currentStep === 'object' && currentStep?.id) {
      return currentStep.id
    }
    return currentStep
  }, [currentStep])
  
  // Normalizar completedSteps - asegurar que sean IDs
  const completedStepIds = React.useMemo(() => {
    return completedSteps.map(step => {
      if (typeof step === 'object' && step?.id) {
        return step.id
      }
      return step
    }).filter(Boolean) // Filtrar valores nulos/undefined
  }, [completedSteps])
  
  const activeStep = steps.findIndex(step => step.id === currentStepId)
  
  // Función para determinar si un paso está completado
  const isStepCompleted = (step) => {
    return completedStepIds.includes(step.id)
  }
  
  // Función para determinar si un paso está activo
  const isStepActive = (step) => {
    return currentStepId === step.id
  }

  // Validar que steps es un array válido
  if (!Array.isArray(steps) || steps.length === 0) {
    console.warn('CheckoutProgressStepper: No valid steps found')
    return null
  }

  // Precrear componentes de ícono estables para cada paso
  const stepIconComponents = useMemo(() => {
    return steps.reduce((acc, s) => {
      // Convertir todas las propiedades a primitivos para evitar objetos
      const safeIcon = String(s?.icon || 'CheckCircle')
      const safeOrder = Number(s?.order || 0)
      
      // MUI pasará props.active y props.completed; las reenviamos sin cerrar sobre valores potencialmente obsoletos
      acc[s.id] = (iconProps) => (
        <CustomStepIcon
          active={Boolean(iconProps.active)}
          completed={Boolean(iconProps.completed)}
          icon={safeIcon}
          order={safeOrder}
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
          // Validar que el step tiene las propiedades requeridas
          if (!step || typeof step !== 'object' || !step.id || !step.name) {
            console.warn('CheckoutProgressStepper: Invalid step at index', index, step)
            return null
          }
          
          // Extraer valores como primitivos para evitar renderizar objetos
          const stepId = String(step.id || '')
          const stepName = String(step.name || '')
          
          const isCompleted = isStepCompleted(step)
          const isActive = isStepActive(step)
          
          return (
            <Step key={stepId} completed={isCompleted}>
              <StepLabel
                StepIconComponent={stepIconComponents[step.id]}
              >
                {showLabels && stepName ? stepName : null}
              </StepLabel>
            </Step>
          )
        }).filter(Boolean)}
      </Stepper>
    </Box>
  )
}

export default CheckoutProgressStepper
