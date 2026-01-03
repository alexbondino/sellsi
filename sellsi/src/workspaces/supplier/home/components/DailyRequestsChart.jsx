import React, { useState, useEffect } from 'react';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { supabase } from '../../../../services/supabase';
import { LinePlot } from '../../../../shared/components/display/graphs';

/**
 * Calcula las fechas de inicio y fin según el período seleccionado
 */
const getDateRange = period => {
  const endDate = new Date();
  let startDate;

  if (period === 'ytd') {
    // Year to date: desde el 1 de enero del año actual
    startDate = new Date(endDate.getFullYear(), 0, 1);
  } else {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - period);
  }

  return { startDate, endDate };
};

/**
 * Calcula el número de días en el rango
 */
const getDaysInRange = (startDate, endDate) => {
  const diffTime = Math.abs(endDate - startDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

/**
 * Gráfico de solicitudes diarias para el dashboard del proveedor
 * Usa el componente LinePlot compartido
 */
const DailyRequestsChart = () => {
  const [requestsData, setRequestsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(7);
  const [supplierId, setSupplierId] = useState(null);

  useEffect(() => {
    const getSupplier = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setSupplierId(session.user.id);
      }
    };
    getSupplier();
  }, []);

  useEffect(() => {
    if (!supplierId) return;
    fetchDailyRequests();
  }, [supplierId, period]);

  const fetchDailyRequests = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange(period);
      const daysCount = getDaysInRange(startDate, endDate);

      // Obtener órdenes/solicitudes donde el proveedor está incluido en supplier_ids (array)
      const { data, error } = await supabase
        .from('orders')
        .select('id, created_at, status')
        .contains('supplier_ids', [supplierId])
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching requests:', error);
        setRequestsData([]);
        setLoading(false);
        return;
      }

      // Agrupar solicitudes por día
      const dailyCounts = {};

      // Inicializar todos los días del período con 0
      for (let i = 0; i < daysCount; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        dailyCounts[dateStr] = 0;
      }

      // Contar solicitudes por día
      (data || []).forEach(order => {
        const dateStr = order.created_at.split('T')[0];
        dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
      });

      // Convertir a array para el gráfico
      const chartData = Object.entries(dailyCounts)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, total]) => ({
          date: new Date(date),
          dateLabel: formatDateLabel(date),
          total: total,
        }));

      setRequestsData(chartData);
    } catch (err) {
      console.error('Error loading daily requests:', err);
      setRequestsData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDateLabel = dateStr => {
    const date = new Date(dateStr + 'T12:00:00');
    const day = date.getDate();
    const month = date.toLocaleDateString('es-CL', { month: 'short' });
    return `${day} ${month}`;
  };

  const handlePeriodChange = newPeriod => {
    setPeriod(newPeriod);
  };

  const totalRequests = requestsData.reduce((sum, d) => sum + d.total, 0);
  const avgDaily =
    requestsData.length > 0 ? totalRequests / requestsData.length : 0;

  // Transformar datos para LinePlot (espera 'value' en vez de 'total')
  const chartData = requestsData.map(d => ({
    ...d,
    value: d.total,
  }));

  const summaryItems = [
    {
      label: 'Total período',
      value: totalRequests,
      color: 'primary.main',
    },
    {
      label: 'Promedio diario',
      value: Math.round(avgDaily * 10) / 10,
      color: 'text.primary',
    },
  ];

  return (
    <LinePlot
      data={chartData}
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
