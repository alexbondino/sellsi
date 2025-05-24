import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Paper, Typography } from '@mui/material';

const MonthlySalesChart = ({ data }) => {
  return (
    <Paper sx={{ mt: 4, p: 2 }}>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
        Ventas por mes
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mes" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="total" fill="#1976d2" />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default MonthlySalesChart;
