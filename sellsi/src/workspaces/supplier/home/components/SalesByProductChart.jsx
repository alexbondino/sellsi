import React, { useState, useEffect } from 'react';
import InventoryIcon from '@mui/icons-material/Inventory';
import { HorizontalBarChart } from '../../../../shared/components/display/graphs';
import { useHomeQueries } from '../hooks';

/**
 * Gráfico de ventas por producto para el dashboard del proveedor
 * Muestra los productos con mayores ventas en el mes actual
 */
const SalesByProductChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const { supplierId, fetchSalesByProduct } = useHomeQueries();

  useEffect(() => {
    if (!supplierId) return;

    const loadData = async () => {
      setLoading(true);
      const result = await fetchSalesByProduct();
      setData(result.data || []);
      setLoading(false);
    };

    loadData();
  }, [supplierId, fetchSalesByProduct]);

  return (
    <HorizontalBarChart
      data={data}
      loading={loading}
      title="Ventas por producto"
      icon={<InventoryIcon sx={{ color: '#2E7D32', fontSize: 28 }} />}
      isCurrency={true}
      maxItems={6}
      showOthers={true}
      barColor="#5B8DEF"
      emptyMessage="No hay ventas de productos este mes"
    />
  );
};

export default SalesByProductChart;
