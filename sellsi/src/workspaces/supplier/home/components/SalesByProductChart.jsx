import React, { useState, useEffect } from 'react';
import InventoryIcon from '@mui/icons-material/Inventory';
import { HorizontalBarChart } from '../../../../shared/components/display/graphs';
import { useHomeQueries } from '../hooks';

/**
 * Gráfico de ventas por producto para el dashboard del proveedor
 * Muestra los productos con mayores ventas en el período seleccionado
 */
const SalesByProductChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(7);

  const { supplierId, fetchSalesByProduct } = useHomeQueries();

  useEffect(() => {
    if (!supplierId) return;

    const loadData = async () => {
      setLoading(true);
      const result = await fetchSalesByProduct(period);
      setData(result.data || []);
      setLoading(false);
    };

    loadData();
  }, [supplierId, fetchSalesByProduct, period]);

  const handlePeriodChange = newPeriod => {
    setPeriod(newPeriod);
  };

  return (
    <HorizontalBarChart
      data={data}
      loading={loading}
      title="Ventas por producto"
      icon={<InventoryIcon sx={{ color: '#E65100', fontSize: 22 }} />}
      isCurrency={true}
      maxItems={6}
      showOthers={true}
      barColor="#FF9800"
      totalColor="#E65100"
      emptyMessage="No hay ventas de productos en este período"
      period={period}
      onPeriodChange={handlePeriodChange}
    />
  );
};

export default SalesByProductChart;
