import React from 'react';

// Mocked offers data
const MOCK_OFFERS = [
  {
    id: 'o_1',
    product: { id: 'p1', name: 'Bomba de Agua 500L', thumbnail: null },
    status: 'pending', // pending | approved | rejected
    price: 12000,
    quantity: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: 'o_2',
    product: { id: 'p2', name: 'Juego de Tornillos M8', thumbnail: '/public/minilogo.png' },
    status: 'approved',
    price: 3000,
    quantity: 10,
    created_at: new Date().toISOString(),
  },
  {
    id: 'o_3',
    product: { id: 'p3', name: 'Filtro Industrial', thumbnail: null },
    status: 'rejected',
    price: 45000,
    quantity: 1,
    created_at: new Date().toISOString(),
  }
];

export const useBuyerOffers = () => {
  const [offers] = React.useState(MOCK_OFFERS);
  const [loading] = React.useState(false);
  const [error] = React.useState(null);

  return { offers, loading, error };
};

export default useBuyerOffers;
