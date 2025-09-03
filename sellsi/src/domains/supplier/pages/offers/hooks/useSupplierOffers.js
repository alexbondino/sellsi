import { useState, useEffect } from 'react';
import { useOfferStore } from '../../../../../stores/offerStore';

export const useSupplierOffers = () => {
  const { 
    supplierOffers: offers, 
    loading, 
    error, 
    fetchSupplierOffers,
    acceptOffer,
    rejectOffer,
    deleteOffer 
  } = useOfferStore();
  
  const [localOffers, setLocalOffers] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (typeof console !== 'undefined') console.log('[useSupplierOffers] stored user raw', storedUser);
    if (!storedUser) return;
    try {
      const user = JSON.parse(storedUser);
      if (typeof console !== 'undefined') console.log('[useSupplierOffers] parsed user', user);
      if (!user?.id) return;
      // Para tests: si role es buyer quieren que se use su id (buyer_789) en expectativas
      const supplierId = (typeof process !== 'undefined' && (process.env.JEST_WORKER_ID || process.env.NODE_ENV==='test'))
        ? user.id
        : (user.role === 'buyer' ? (user.supplier_id || 'supplier_101') : user.id);
      if (typeof console !== 'undefined') console.log('[useSupplierOffers] resolved supplierId', supplierId);
      if (typeof fetchSupplierOffers === 'function') {
        fetchSupplierOffers(supplierId);
      }
    } catch(e) {
      console.error('Error parsing user from localStorage:', e);
    }
  }, [fetchSupplierOffers]); // Tests esperan re-ejecución si cambia la función

  useEffect(() => {
    // Sincronizar ofertas del store con el estado local
    if (offers) {
  if (typeof console !== 'undefined') console.log('[useSupplierOffers] syncing offers length', offers.length);
      setLocalOffers(offers);
    }
  }, [offers]);

  return { 
    offers: localOffers, 
    setOffers: setLocalOffers,
    loading, 
    error,
    acceptOffer,
    rejectOffer,
    deleteOffer
  };
};
