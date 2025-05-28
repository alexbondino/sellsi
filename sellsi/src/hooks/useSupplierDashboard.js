import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

export const useSupplierDashboard = supplierId => {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [productStocks, setProductStocks] = useState([]);
  const [weeklyRequests, setWeeklyRequests] = useState([]);

  const getStartOfWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff)).toISOString().split('T')[0];
  };

  const getEndOfWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + 7;
    return new Date(now.setDate(diff)).toISOString().split('T')[0];
  };

  useEffect(() => {
    if (!supplierId) return;

    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('supplierid', supplierId);

      if (!error) {
        setProducts(data);
        setProductStocks(data.map(p => ({ productqty: p.productqty })));
      }
    };

    const fetchSales = async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('amount, trx_date')
        .eq('supplierid', supplierId);

      if (!error) setSales(data);
    };

    const fetchRequests = async () => {
      const start = getStartOfWeek();
      const end = getEndOfWeek();

      const { data: productData } = await supabase
        .from('products')
        .select('productid')
        .eq('supplierid', supplierId);

      const productIds = productData.map(p => p.productid);

      if (productIds.length === 0) {
        setWeeklyRequests([]);
        return;
      }

      const { data: requests } = await supabase
        .from('requests')
        .select('*, products(productnm), sellers(sellernm)')
        .in('productid', productIds)
        .gte('createddt', start)
        .lte('createddt', end);

      setWeeklyRequests(requests || []);
    };

    fetchProducts();
    fetchSales();
    fetchRequests();
  }, [supplierId]);

  const totalSales = sales.reduce((acc, s) => acc + Number(s.amount), 0);

  const groupedSales = sales.reduce((acc, sale) => {
    const date = new Date(sale.trx_date);
    const key = `${date.toLocaleString('default', {
      month: 'short',
    })} ${date.getFullYear()}`;
    acc[key] = (acc[key] || 0) + Number(sale.amount);
    return acc;
  }, {});

  const monthlyData = Object.entries(groupedSales).map(([mes, total]) => ({
    mes,
    total,
  }));

  return {
    products,
    sales,
    productStocks,
    weeklyRequests,
    monthlyData,
    totalSales,
  };
};
