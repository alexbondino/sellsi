import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock the financing service module and expose the mock for per-test control
jest.mock('../../../../../workspaces/buyer/my-financing/services/financingService', () => ({
  getAvailableFinancingsForSupplier: jest.fn(),
}));
const financingServiceMock = require('../../../../../workspaces/buyer/my-financing/services/financingService');

// Stub child components to avoid their internal state updates during this unit test
jest.mock('../../domains/buyer/pages/cart/components/MobileCartItem', () => ({
  __esModule: true,
  default: ({ item }) => require('react').createElement('div', { 'data-testid': `mobile-item-${(item && item.id) || 'x'}` })
}));
jest.mock('../../domains/buyer/pages/cart/components/MobileFinancingsModal', () => ({
  __esModule: true,
  default: ({ open }) => require('react').createElement('div', { 'data-testid': open ? 'fin-modal-open' : 'fin-modal-closed' })
}));

describe('MobileCartLayout', () => {
  test('shows financing buttons when financingEnabled=true', () => {
    const MobileCartLayout = require('../../domains/buyer/pages/cart/components/MobileCartLayout').default;

    render(
      <MemoryRouter>
      <MobileCartLayout
        items={[]}
        calculations={{}}
        cartStats={{}}
        onCheckout={() => {}}
        onBack={() => {}}
        onQuantityChange={() => {}}
        onRemoveItem={() => {}}
        formatPrice={(v) => `$${v}`}
        isCheckingOut={false}
        financingEnabled={true}
        onOpenFinancingModal={() => {}}
      />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/Pagar con Financiamiento/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Financiamientos Disponibles/i)).toBeInTheDocument();
  });

  test('does not show financing buttons when financingEnabled=false', () => {
    const MobileCartLayout = require('../../domains/buyer/pages/cart/components/MobileCartLayout').default;

    render(
      <MemoryRouter>
      <MobileCartLayout
        items={[]}
        calculations={{}}
        cartStats={{}}
        onCheckout={() => {}}
        onBack={() => {}}
        onQuantityChange={() => {}}
        onRemoveItem={() => {}}
        formatPrice={(v) => `$${v}`}
        isCheckingOut={false}
        financingEnabled={false}
        onOpenFinancingModal={() => {}}
      />
      </MemoryRouter>
    );

    expect(screen.queryByLabelText(/Pagar con Financiamiento/i)).toBeNull();
    expect(screen.queryByLabelText(/Financiamientos Disponibles/i)).toBeNull();
  });

  test('disables PayWithFinancing button when no financings available', async () => {
    // Mock the financing service to return empty list
    financingServiceMock.getAvailableFinancingsForSupplier.mockImplementationOnce(() => Promise.resolve([]));

    const MobileCartLayout = require('../../domains/buyer/pages/cart/components/MobileCartLayout').default;

    render(
      <MemoryRouter>
      <MobileCartLayout
        items={[{ id: 'p1', supplier_id: 's1' }]}
        calculations={{}}
        cartStats={{}}
        onCheckout={() => {}}
        onBack={() => {}}
        onQuantityChange={() => {}}
        onRemoveItem={() => {}}
        formatPrice={(v) => `$${v}`}
        isCheckingOut={false}
        financingEnabled={true}
        onOpenFinancingModal={() => {}}
      />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByTestId('PayWithFinancingBtn')).toBeDisabled());
  });

  test('enables PayWithFinancing button when a qualifying financing exists', async () => {
    financingServiceMock.getAvailableFinancingsForSupplier.mockImplementationOnce(() => Promise.resolve([ { id: 1, supplier_id: 's1', status: 'approved_by_sellsi', paused: false, amount: 100000, amount_used: 50000 } ]));

    const MobileCartLayout = require('../../domains/buyer/pages/cart/components/MobileCartLayout').default;

    render(
      <MemoryRouter>
      <MobileCartLayout
        items={[{ id: 'p1', supplier_id: 's1' }]}
        calculations={{}}
        cartStats={{}}
        onCheckout={() => {}}
        onBack={() => {}}
        onQuantityChange={() => {}}
        onRemoveItem={() => {}}
        formatPrice={(v) => `$${v}`}
        isCheckingOut={false}
        financingEnabled={true}
        onOpenFinancingModal={() => {}}
      />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByTestId('PayWithFinancingBtn')).toBeEnabled());
  });
});