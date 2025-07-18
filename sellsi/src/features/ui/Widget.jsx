import React from 'react'
import { Paper, Typography } from '@mui/material'

const cardStyle = {
  p: 2,
  height: '235px',
  width: '235px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  textAlign: 'center',
}

const DashboardCard = ({ icon, title, value, color }) => (
  <Paper sx={cardStyle}>
    {React.cloneElement(icon, { sx: { fontSize: 80, color } })}
    <Typography variant="h6">{title}</Typography>
    <Typography variant="h1">{value}</Typography>
  </Paper>
)

export default DashboardCard
