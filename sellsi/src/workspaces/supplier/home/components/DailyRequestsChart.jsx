import React, { useState, useEffect } from 'react';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { LinePlot } from '../../../../shared/components/display/graphs';
import { useHomeQueries } from '../hooks';

/**
 * Gráfico de solicitudes diarias para el dashboard del proveedor
 * Usa el hook centralizado useHomeQueries para obtener datos
 */
const DailyRequestsChart = () => {
  const [requestsData, setRequestsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(7);
  const [metrics, setMetrics] = useState({ total: 0, average: 0 });

  const { supplierId, fetchDailyRequests } = useHomeQueries();

  useEffect(() => {
    if (!supplierId) return;

    const loadData = async () => {
      setLoading(true);
      const result = await fetchDailyRequests(period);
      setRequestsData(result.data);
      setMetrics({ total: result.total, average: result.average });
      setLoading(false);
    };

    loadData();
  }, [supplierId, period, fetchDailyRequests]);

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
      data={requestsData}
      loading={loading}
      title="Solicitudes Diarias"
      icon={<AssignmentIcon sx={{ color: '#9C27B0', fontSize: 28 }} />}
      period={period}
      onPeriodChange={handlePeriodChange}
      color="#9C27B0"
      isCurrency={false}
      summaryItems={summaryItems}
      emptyMessage="No hay solicitudes registradas en este período"
    />
  );
};

export default DailyRequestsChart;
