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
      const supplierId = user.role === 'buyer' ? (user.supplier_id || 'supplier_101') : user.id;
      if (typeof console !== 'undefined') console.log('[useSupplierOffers] resolved supplierId', supplierId);
      fetchSupplierOffers(supplierId);
    } catch(e) {
      console.error('Error parsing user from localStorage:', e);
    }
  }, []);

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
