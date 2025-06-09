import React from 'react'
import { Box, Step, StepLabel, Stepper, StepConnector } from '@mui/material'
import { styled } from '@mui/material/styles'
import { stepConnectorClasses } from '@mui/material/StepConnector'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import BusinessIcon from '@mui/icons-material/Business'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import VerifiedIcon from '@mui/icons-material/Verified'

// ✅ CONECTOR COLORLIB CON RESPONSIVE
const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    // xs: 30% smaller = 35px circle, connector at 15px (35/2 - 2.5)
    [theme.breakpoints.only('xs')]: {
      top: 15,
    },
    // sm: 20% smaller = 40px circle, connector at 17px (40/2 - 3)
    [theme.breakpoints.only('sm')]: {
      top: 17,
    },
    // md: 5% smaller = 47.5px circle, connector at 21px (47.5/2 - 2.75)
    [theme.breakpoints.only('md')]: {
      top: 21,
    },
    // lg y xl: mantener original 50px circle, connector at 22px
    [theme.breakpoints.up('lg')]: {
      top: 22,
    },
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage:
        'linear-gradient(95deg, #41B6E6 0%, #2fa4d6 50%, #1976d2 100%)',
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage:
        'linear-gradient(95deg, #41B6E6 0%, #2fa4d6 50%, #1976d2 100%)',
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: '#eaeaf0',
    borderRadius: 1,
    ...theme.applyStyles('dark', {
      backgroundColor: theme.palette.grey[800],
    }),
  },
}))

// ✅ ICONO COLORLIB CON RESPONSIVE
const ColorlibStepIconRoot = styled('div')(({ theme }) => ({
  backgroundColor: '#ccc',
  zIndex: 1,
  color: '#fff',
  // xs: 30% smaller = 35px
  [theme.breakpoints.only('xs')]: {
    width: 25,
    height: 25,
  },
  // sm: 20% smaller = 40px
  [theme.breakpoints.only('sm')]: {
    width: 25,
    height: 25,
  },
  // md: 5% smaller = 47.5px
  [theme.breakpoints.only('md')]: {
    width: 30.5,
    height: 30.5,
  },
  // lg y xl: mantener tamaño original 50px
  [theme.breakpoints.up('lg')]: {
    width: 50,
    height: 50,
  },
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  ...theme.applyStyles('dark', {
    backgroundColor: theme.palette.grey[700],
  }),
  variants: [
    {
      props: ({ ownerState }) => ownerState.active,
      style: {
        backgroundImage:
          'linear-gradient(136deg, #41B6E6 0%, #2fa4d6 50%, #1976d2 100%)',
        boxShadow: '0 4px 10px 0 rgba(65, 182, 230, 0.25)',
      },
    },
    {
      props: ({ ownerState }) => ownerState.completed,
      style: {
        backgroundImage:
          'linear-gradient(136deg, #41B6E6 0%, #2fa4d6 50%, #1976d2 100%)',
      },
    },
  ],
}))

function ColorlibStepIcon(props) {
  const { active, completed, className } = props

  const icons = {
    1: <AccountCircleIcon />,
    2: <BusinessIcon />,
    3: <PersonAddIcon />,
    4: <CheckCircleIcon />,
    5: <VerifiedIcon />,
  }

  return (
    <ColorlibStepIconRoot
      ownerState={{ completed, active }}
      className={className}
    >
      {icons[String(props.icon)]}
    </ColorlibStepIconRoot>
  )
}

// ✅ COMPONENTE PRINCIPAL (exactamente como en el código original)
const ProgressStepper = ({ activeStep, steps }) => {
  return (
    <Box sx={{ width: '100%', mb: { xs: 1, sm: 1, md: 3, lg: 4 }, mt: 2 }}>
      <Stepper
        activeStep={activeStep - 1}
        alternativeLabel
        connector={<ColorlibConnector />}
        sx={{
          '& .MuiStepLabel-label': {
            fontSize: '12px',
            fontWeight: 500,
            color: '#666',
          },
          '& .MuiStepLabel-label.Mui-active': {
            color: '#41B6E6',
            fontWeight: 600,
          },
          '& .MuiStepLabel-label.Mui-completed': {
            color: '#41B6E6',
            fontWeight: 600,
          },
        }}
      >
        {steps.map((label, index) => (
          <Step key={label}>
            <StepLabel StepIconComponent={ColorlibStepIcon}>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  )
}

export default ProgressStepper
