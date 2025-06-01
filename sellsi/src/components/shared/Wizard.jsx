import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Box, IconButton, Fade } from '@mui/material'
import { ChevronLeft, ChevronRight } from '@mui/icons-material'

/**
 * Componente Wizard reutilizable que maneja la navegación entre pasos/slides
 * Soporta tanto navegación manual como auto-avance
 */
const Wizard = ({
  // Configuración básica
  steps = [],
  initialStep = 0,

  // Auto-avance
  autoAdvance = false,
  autoAdvanceInterval = 30000, // 30 segundos por defecto

  // Estilos y presentación
  showControls = true,
  showIndicators = false,
  fadeTransition = true,
  fadeTimeout = 500,

  // Callbacks
  onStepChange,

  // Renderizado
  renderStep,

  // Estilos personalizados
  containerSx = {},
  controlsSx = {},
  indicatorsSx = {},

  // Props adicionales
  className = '',
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep)
  const intervalRef = useRef()
  // Función para cambiar paso con validaciones
  const changeStep = useCallback(
    (newStep) => {
      if (newStep >= 0 && newStep < steps.length) {
        setCurrentStep(newStep)
        onStepChange?.(newStep, steps[newStep])
      }
    },
    [steps.length, onStepChange]
  )

  // Navegación
  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      const newStep = (prev + 1) % steps.length
      onStepChange?.(newStep, steps[newStep])
      return newStep
    })
  }, [steps.length, onStepChange])

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => {
      const newStep = (prev - 1 + steps.length) % steps.length
      onStepChange?.(newStep, steps[newStep])
      return newStep
    })
  }, [steps.length, onStepChange])

  const goToStep = useCallback(
    (stepIndex) => {
      changeStep(stepIndex)
    },
    [changeStep]
  )
  // Auto-avance
  useEffect(() => {
    if (autoAdvance && steps.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % steps.length)
      }, autoAdvanceInterval)

      return () => clearInterval(intervalRef.current)
    }
  }, [autoAdvance, autoAdvanceInterval, steps.length]) // ✅ REMOVIDO currentStep para evitar parpadeos

  // Limpiar interval al desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])
  // Renderizar contenido del paso actual
  const renderCurrentStep = useCallback(() => {
    if (renderStep) {
      return renderStep(currentStep, steps[currentStep], {
        nextStep,
        prevStep,
        goToStep,
        isFirst: currentStep === 0,
        isLast: currentStep === steps.length - 1,
        totalSteps: steps.length,
      })
    }
    return steps[currentStep]
  }, [currentStep, steps, renderStep, nextStep, prevStep, goToStep]) // Componente de contenido con transición
  const StepContent = ({ children }) => {
    if (fadeTransition) {
      return (
        <Fade in={true} timeout={fadeTimeout}>
          <Box sx={{ width: '100%' }} key={currentStep}>
            {children}
          </Box>
        </Fade>
      )
    }
    return <Box sx={{ width: '100%' }}>{children}</Box>
  }

  return (
    <Box
      className={className}
      sx={{
        position: 'relative',
        width: '100%',
        ...containerSx,
      }}
    >
      {/* Contenido del paso actual */}
      <StepContent>{renderCurrentStep()}</StepContent>

      {/* Controles de navegación */}
      {showControls && steps.length > 1 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 2,
            mt: 4,
            ...controlsSx,
          }}
        >
          <IconButton
            onClick={prevStep}
            sx={{
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': { backgroundColor: 'primary.dark' },
            }}
          >
            <ChevronLeft />
          </IconButton>
          <IconButton
            onClick={nextStep}
            sx={{
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': { backgroundColor: 'primary.dark' },
            }}
          >
            <ChevronRight />
          </IconButton>
        </Box>
      )}

      {/* Indicadores de punto */}
      {showIndicators && steps.length > 1 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 1,
            mt: 2,
            ...indicatorsSx,
          }}
        >
          {steps.map((_, index) => (
            <Box
              key={index}
              onClick={() => goToStep(index)}
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor:
                  index === currentStep ? 'primary.main' : 'rgba(0,0,0,0.3)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor:
                    index === currentStep ? 'primary.dark' : 'rgba(0,0,0,0.5)',
                },
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  )
}

// Hook personalizado para manejar wizard más fácilmente
export const useWizard = (steps = [], options = {}) => {
  const [currentStep, setCurrentStep] = useState(options.initialStep || 0)

  const nextStep = () => {
    setCurrentStep((prev) => (prev + 1) % steps.length)
  }

  const prevStep = () => {
    setCurrentStep((prev) => (prev - 1 + steps.length) % steps.length)
  }

  const goToStep = (stepIndex) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex)
    }
  }

  const resetWizard = () => {
    setCurrentStep(options.initialStep || 0)
  }

  return {
    currentStep,
    nextStep,
    prevStep,
    goToStep,
    resetWizard,
    isFirst: currentStep === 0,
    isLast: currentStep === steps.length - 1,
    totalSteps: steps.length,
    currentStepData: steps[currentStep],
  }
}

export default Wizard
