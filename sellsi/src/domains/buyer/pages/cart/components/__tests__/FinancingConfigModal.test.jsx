import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FinancingConfigModal from '../FinancingConfigModal';

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
    const select = screen.getByLabelText(/Financiamiento a usar/i);
    expect(select).toBeInTheDocument();

    // Open select (MUI uses mouseDown on the button element)
    fireEvent.mouseDown(select);

    const listbox = await screen.findByRole('listbox');
    expect(listbox).toBeInTheDocument();

    // Should have mock items Fin #1 ... Fin #5
    const fin1 = screen.getByText(/Fin #1/i);
    expect(fin1).toBeInTheDocument();

    // Click Fin #3 for example
    fireEvent.click(screen.getByText(/Fin #3/i));

    // Confirm button
    fireEvent.click(screen.getByText(/Confirmar/i));

    await waitFor(() => expect(onSave).toHaveBeenCalled());

    const arg = onSave.mock.calls[0][0];
    expect(arg).toHaveProperty('financingAssignments');
    expect(arg.financingAssignments['p1']).toBeTruthy();
  });
});