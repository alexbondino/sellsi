import { useState } from 'react';

// Hook simple con 3 mocks (pendiente, aceptada, rechazada)
export const useSupplierOffers = () => {
  const [offers, setOffers] = useState([
    {
      id: 'mock-1',
      product: { name: 'Pack 6 Botellas Agua 1.5L', stock: 50, previousPrice: 1350 },
      quantity: 10,
      price: 1250, // precio unitario ofertado
      buyer: { name: 'Comercial Andes SPA' },
  status: 'pending',
  // expira en 48 horas desde ahora (valor inicial para pendientes)
  expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'mock-2',
      product: { name: 'Caja Snacks Mixtos 24u', stock: 4, previousPrice: 7090 },
      quantity: 5,
      price: 6890,
      buyer: { name: 'Distribuciones Sur Ltda.' },
  status: 'approved',
    },
    {
      id: 'mock-3',
      product: { name: 'Bolsa Café Molido Premium 1Kg', stock: 2, previousPrice: 9290 },
      quantity: 3,
      price: 8990,
      buyer: { name: 'Mercado Urbano' },
      status: 'rejected',
    },
    {
      id: 'mock-4',
      product: { name: 'Lata Bebida Energética 330ml', stock: 5, previousPrice: 920 },
      quantity: 20,
      price: 850,
      buyer: { name: 'Distribuidora Central' },
  status: 'pending',
  // expira en 48 horas desde ahora (valor inicial para pendientes)
  expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    },
  ]);

  return { offers, setOffers };
};
