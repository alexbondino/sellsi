import React, { useState, useEffect } from 'react';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { supabase } from '../../../../services/supabase';
import { formatCurrency } from '../../../../shared/utils/formatters';
import { LinePlot } from '../../../../shared/components/display/graphs';

/**
 * Gráfico de ventas diarias para el dashboard del proveedor
 * Usa el componente LinePlot compartido
 */
const DailySalesChart = () => {
  const [salesData, setSalesData] = useState([]);
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
    fetchDailySales();
  }, [supplierId, period]);

  const fetchDailySales = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - period);

      let { data, error } = await supabase
        .from('product_sales_confirmed')
        .select('amount, trx_date')
        .eq('supplier_id', supplierId)
        .gte('trx_date', startDate.toISOString())
        .lte('trx_date', endDate.toISOString())
        .order('trx_date', { ascending: true });

      if (error) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('product_sales')
          .select(
            'amount, trx_date, orders!inner(status, payment_status, cancelled_at)'
          )
          .eq('supplier_id', supplierId)
          .eq('orders.payment_status', 'paid')
          .in('orders.status', ['accepted', 'in_transit', 'delivered'])
          .is('orders.cancelled_at', null)
          .gte('trx_date', startDate.toISOString())
          .lte('trx_date', endDate.toISOString())
          .order('trx_date', { ascending: true });

        if (fallbackError) {
          console.error('Error fetching sales:', fallbackError);
          setSalesData([]);
          setLoading(false);
          return;
        }
        data = fallbackData;
      }

      const dailyTotals = {};
      for (let i = 0; i < period; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (period - 1 - i));
        const dateStr = date.toISOString().split('T')[0];
        dailyTotals[dateStr] = 0;
      }

      (data || []).forEach(sale => {
        const dateStr = sale.trx_date.split('T')[0];
        const amount = Number(sale.amount) || 0;
        const SERVICE_RATE = 0.03;
        const IVA_RATE = 0.19;
        const netMultiplier =
          (1 - SERVICE_RATE) * (1 - IVA_RATE * SERVICE_RATE);
        dailyTotals[dateStr] =
          (dailyTotals[dateStr] || 0) + amount * netMultiplier;
      });

      const chartData = Object.entries(dailyTotals)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, total]) => ({
          date: new Date(date),
          dateLabel: formatDateLabel(date),
          total: Math.round(total),
        }));

      setSalesData(chartData);
    } catch (err) {
      console.error('Error loading daily sales:', err);
      setSalesData([]);
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

  const totalSales = salesData.reduce((sum, d) => sum + d.total, 0);
  const avgDaily = salesData.length > 0 ? totalSales / salesData.length : 0;
  const maxSale = Math.max(...salesData.map(d => d.total), 0);

  // Transformar datos para LinePlot (espera 'value' en vez de 'total')
  const chartData = salesData.map(d => ({
    ...d,
    value: d.total,
  }));

  const summaryItems = [
    {
      label: 'Total período',
      value: totalSales,
      color: 'primary.main',
    },
    {
      label: 'Promedio diario',
      value: Math.round(avgDaily),
      color: 'text.primary',
    },
    {
      label: 'Mejor día',
      value: maxSale,
      color: 'success.main',
    },
  ];

  return (
    <LinePlot
      data={chartData}
      loading={loading}
      title="Ventas Diarias"
      icon={<TrendingUpIcon sx={{ color: 'primary.main', fontSize: 28 }} />}
      period={period}
      onPeriodChange={handlePeriodChange}
      valueLabel="Ventas"
      color="#2E52B2"
      isCurrency={true}
      summaryItems={summaryItems}
      emptyMessage="No hay ventas registradas en este período"
    />
  );
};

export default DailySalesChart;
