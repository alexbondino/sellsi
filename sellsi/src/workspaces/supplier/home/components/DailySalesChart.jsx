import React, { useState, useEffect } from 'react';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { LinePlot } from '../../../../shared/components/display/graphs';
import { useHomeQueries } from '../hooks';

/**
 * Gráfico de ventas diarias para el dashboard del proveedor
 * Usa el hook centralizado useHomeQueries para obtener datos
 */
const DailySalesChart = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(7);
  const [metrics, setMetrics] = useState({ total: 0, average: 0 });

  const { supplierId, fetchDailySales } = useHomeQueries();

  useEffect(() => {
    if (!supplierId) return;

    const loadData = async () => {
      setLoading(true);
      const result = await fetchDailySales(period);
      setSalesData(result.data);
      setMetrics({ total: result.total, average: result.average });
      setLoading(false);
    };

    loadData();
  }, [supplierId, period, fetchDailySales]);

  const handlePeriodChange = newPeriod => {
    setPeriod(newPeriod);
  };

  const summaryItems = [
    {
      label: 'Total período',
      value: metrics.total,
      color: 'primary.main',
    },
    {
      label: 'Promedio diario',
      value: metrics.average,
      color: 'text.primary',
    },
  ];

  return (
    <LinePlot
      data={salesData}
      loading={loading}
      title="Ventas Diarias"
      icon={<TrendingUpIcon sx={{ color: 'primary.main', fontSize: 28 }} />}
      period={period}
      onPeriodChange={handlePeriodChange}
      color="#2E52B2"
      isCurrency={true}
      summaryItems={summaryItems}
      emptyMessage="No hay ventas registradas en este período"
    />
  );
};

export default DailySalesChart;
