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

describe('Supplier Table offered chip (robust)', () => {
  const variants = [
    ['isOffered flag in items', { items: [{ name: 'A', isOffered: true, quantity: 1 }], products: [] }],
    ['metadata.isOffered in items', { items: [{ name: 'B', metadata: { isOffered: true }, quantity: 1 }], products: [] }],
    ['offer_id only in items', { items: [{ name: 'C', offer_id: 'o1', quantity: 1 }], products: [] }],
    ['offered_price only in items', { items: [{ name: 'D', offered_price: 100, quantity: 1 }], products: [] }],
    ['present in products only', { items: [], products: [{ name: 'E', isOffered: true, quantity: 1 }] }],
  ];

  it.each(variants)('%s -> muestra chip', (label, data) => {
    render(<MemoryRouter><Table orders={[baseOrder({ ...data })]} onActionClick={()=>{}} /></MemoryRouter>);
    expect(screen.getByTestId('supplier-chip-ofertado')).toBeTruthy();
  });

  it('muestra solo un chip aun con multiples items ofertados', () => {
    const data = { items: [ { name: 'X', isOffered: true }, { name: 'Y', isOffered: true } ], products: [] };
    render(<MemoryRouter><Table orders={[baseOrder({ ...data })]} onActionClick={()=>{}} /></MemoryRouter>);
    const chips = screen.getAllByTestId('supplier-chip-ofertado');
    expect(chips.length).toBe(1);
  });

  it('no muestra chip si campos son falsy o null', () => {
    const data = { items: [ { name: 'Z', isOffered: false, offered_price: null } ], products: [] };
    render(<MemoryRouter><Table orders={[baseOrder({ ...data })]} onActionClick={()=>{}} /></MemoryRouter>);
    expect(screen.queryByTestId('supplier-chip-ofertado')).toBeNull();
  });
});
