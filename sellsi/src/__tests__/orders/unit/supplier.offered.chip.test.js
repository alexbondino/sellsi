/**
 * O-4: Supplier ve chip Ofertado en tabla cuando existe al menos un item ofertado.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
jest.mock('../../../shared/components/modals/ContactModal', () => () => null);
import Table from '../../../shared/components/display/tables/Table.jsx';

const baseOrder = (overrides={}) => ({
  order_id: 'sup-o-1',
  status: 'Aceptado',
  created_at: '2025-09-02T10:00:00.000Z',
  items: [],
  products: [],
  deliveryAddress: {},
  total_amount: 1000,
  ...overrides
});

describe('Supplier Table offered chip', () => {
  it('muestra chip ofertado si algún item es ofertado', () => {
  render(<MemoryRouter><Table orders={[baseOrder({
      items: [
        { name: 'Prod A', quantity: 1, isOffered: true, offer_id: 'off-1', offered_price: 500 },
        { name: 'Prod B', quantity: 2 }
      ],
      products: [
        { name: 'Prod A', quantity: 1, isOffered: true, offer_id: 'off-1', offered_price: 500 },
        { name: 'Prod B', quantity: 2 }
      ]
  })]} onActionClick={()=>{}} /></MemoryRouter>);
    expect(screen.getByTestId('supplier-chip-ofertado')).toBeTruthy();
  });

  it('no muestra chip si ningún item es ofertado', () => {
  render(<MemoryRouter><Table orders={[baseOrder({
      items: [ { name: 'Prod C', quantity: 3 } ],
      products: [ { name: 'Prod C', quantity: 3 } ]
  })]} onActionClick={()=>{}} /></MemoryRouter>);
    expect(screen.queryByTestId('supplier-chip-ofertado')).toBeNull();
  });
});
