import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FinancingConfigModal from '../FinancingConfigModal';

// Mock the service that fetches financings so the component behaves deterministically in tests
jest.mock('../../../../../workspaces/buyer/my-financing/services/financingService', () => ({
  getAvailableFinancingsForSupplier: jest.fn(() => Promise.resolve([
    { id: 'mock-1', supplier_id: 's1', amount: 800000, amount_used: 200000, amount_paid: 50000, term_days: 45, activated_at: new Date().toISOString(), expires_at: new Date(Date.now() + 30*86400000).toISOString(), status: 'approved_by_sellsi', paused: false },
    { id: 'mock-2', supplier_id: 's1', amount: 500000, amount_used: 150000, amount_paid: 50000, term_days: 30, activated_at: new Date().toISOString(), expires_at: new Date(Date.now() + 7*86400000).toISOString(), status: 'approved_by_sellsi', paused: false },
    { id: 'mock-3', supplier_id: 's1', amount: 300000, amount_used: 280000, amount_paid: 100000, term_days: 15, activated_at: new Date().toISOString(), expires_at: new Date(Date.now() + 10*86400000).toISOString(), status: 'approved_by_sellsi', paused: true },
  ]))
}));

const cartItems = [
  {
    id: 'p1',
    name: 'Producto A',
    quantity: 2,
    supplier_id: 's1',
  },
];

const formatPrice = (v) => `$${(v / 1000).toFixed(0)}k`;

describe('FinancingConfigModal', () => {
  test('renders financing select and allows selecting an option and saving assignment', async () => {
    const onSave = jest.fn();
    const onClose = jest.fn();

    render(
      <FinancingConfigModal
        open={true}
        onClose={onClose}
        cartItems={cartItems}
        formatPrice={formatPrice}
        onSave={onSave}
      />
    );

    // Find select by label
    const select = await screen.findByLabelText(/Financiamiento a usar/i);
    expect(select).toBeInTheDocument();

    // Open select (MUI uses mouseDown on the button element)
    fireEvent.mouseDown(select);

    const listbox = await screen.findByRole('listbox');
    expect(listbox).toBeInTheDocument();

    // Should have the dynamic items (Fin #1 ...)
    const fin1 = screen.getByText(/Fin #1/i);
    expect(fin1).toBeInTheDocument();

    // Click Fin #2 for example (should be available)
    fireEvent.click(screen.getByText(/Fin #2/i));

    // Confirm button
    fireEvent.click(screen.getByText(/Confirmar/i));

    await waitFor(() => expect(onSave).toHaveBeenCalled());

    const arg = onSave.mock.calls[0][0];
    expect(arg).toHaveProperty('financingAssignments');
    expect(arg.financingAssignments['p1']).toBeTruthy();
  });
});