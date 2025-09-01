import { useState } from 'react';

// Hook simple con 3 mocks (pendiente, aceptada, rechazada)
export const useSupplierOffers = () => {
  const [offers, setOffers] = useState([
    {
      id: 'mock-1',
      product: { name: 'Pack 6 Botellas Agua 1.5L' },
      quantity: 10,
      price: 1250, // precio unitario
      buyer: { name: 'Comercial Andes SPA' },
      status: 'pending',
    },
    {
      id: 'mock-2',
      product: { name: 'Caja Snacks Mixtos 24u' },
      quantity: 5,
      price: 6890,
      buyer: { name: 'Distribuciones Sur Ltda.' },
      status: 'approved',
    },
    {
      id: 'mock-3',
      product: { name: 'Bolsa Café Molido Premium 1Kg' },
      quantity: 3,
      price: 8990,
      buyer: { name: 'Mercado Urbano' },
      status: 'rejected',
    },
  ]);

  return { offers, setOffers };
};
