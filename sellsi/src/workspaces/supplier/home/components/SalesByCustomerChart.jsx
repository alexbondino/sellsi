import React, { useState, useEffect } from 'react';
import PeopleIcon from '@mui/icons-material/People';
import { HorizontalBarChart } from '../../../../shared/components/display/graphs';
import { useHomeQueries } from '../hooks';

/**
 * Gráfico de ventas por cliente para el dashboard del proveedor
 * Muestra los clientes con mayores compras en el mes actual
 */
const SalesByCustomerChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const { supplierId, fetchSalesByCustomer } = useHomeQueries();

  useEffect(() => {
    if (!supplierId) return;

    const loadData = async () => {
      setLoading(true);
      const result = await fetchSalesByCustomer();
      setData(result.data || []);
      setLoading(false);
    };

    loadData();
  }, [supplierId, fetchSalesByCustomer]);

  return (
    <HorizontalBarChart
      data={data}
      loading={loading}
      title="Ventas por cliente"
      icon={<PeopleIcon sx={{ color: '#1565C0', fontSize: 28 }} />}
      isCurrency={true}
      maxItems={6}
      showOthers={true}
      barColor="#5B8DEF"
      emptyMessage="No hay ventas a clientes este mes"
    />
  );
};

export default SalesByCustomerChart;
