import React, { useState, useEffect } from 'react';
import PeopleIcon from '@mui/icons-material/People';
import { HorizontalBarChart } from '../../../../shared/components/display/graphs';
import { useHomeQueries } from '../hooks';

/**
 * Gráfico de ventas por cliente para el dashboard del proveedor
 * Muestra los clientes con mayores compras en el período seleccionado
 */
const SalesByCustomerChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(7);

  const { supplierId, fetchSalesByCustomer } = useHomeQueries();

  useEffect(() => {
    if (!supplierId) return;

    const loadData = async () => {
      setLoading(true);
      const result = await fetchSalesByCustomer(period);
      setData(result.data || []);
      setLoading(false);
    };

    loadData();
  }, [supplierId, fetchSalesByCustomer, period]);

  const handlePeriodChange = newPeriod => {
    setPeriod(newPeriod);
  };

  return (
    <HorizontalBarChart
      data={data}
      loading={loading}
      title="Ventas por cliente"
      icon={<PeopleIcon sx={{ color: '#1565C0', fontSize: 22 }} />}
      isCurrency={true}
      maxItems={6}
      showOthers={true}
      barColor="#5B8DEF"
      emptyMessage="No hay ventas a clientes en este período"
      period={period}
      onPeriodChange={handlePeriodChange}
    />
  );
};

export default SalesByCustomerChart;
