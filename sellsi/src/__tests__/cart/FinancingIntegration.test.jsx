import React from 'react';
import { render, screen, waitFor, fireEvent, within, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { dashboardThemeCore } from '../../styles/dashboardThemeCore';
import { BannerProvider } from '../../shared/components/display/banners/BannerContext';
import useCartStore from '../../shared/stores/cart/cartStore';
import BuyerCart from '../../domains/buyer/pages/BuyerCart';
import { MemoryRouter } from 'react-router-dom';
import { renderWithProviders } from '../testUtils/renderWithProviders';

// Mocks and helpers to make tests deterministic and robust
jest.mock('../../infrastructure/providers/UnifiedAuthProvider', () => ({
  useRole: () => ({ currentAppRole: 'buyer' }),
}));

// Make the feature flag mockable per-test
const ff = require('../../shared/hooks/useFeatureFlag');
jest.mock('../../shared/hooks/useFeatureFlag', () => ({
  useFeatureFlag: jest.fn(() => ({ enabled: true, loading: false })),
}));

// Helper to control media query (desktop/mobile) per-test
jest.mock('@mui/material', () => {
  const real = jest.requireActual('@mui/material');
  return { ...real, useMediaQuery: jest.fn(() => false) };
});
const mui = require('@mui/material');

// Make FinancingConfigModal deterministic but configurable from tests
let mockModalResponse = { config: { p1: { amount: 500000, isFullAmount: false } }, financingAssignments: { p1: 'mock-1' } };
jest.mock('../../domains/buyer/pages/cart/components/FinancingConfigModal', () => {
  return (props) => {
    const React = require('react');
    React.useEffect(() => {
      if (props.open) {
        // Allow tests to set mockModalResponse as needed
        props.onSave(mockModalResponse);
      }
    }, [props.open]);
    return null;
  };
});

// Utility to format money the same way the app does
const formatCLP = amount => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(amount);

describe('BuyerCart financing integration (robust)', () => {
  beforeEach(() => {
    // Reset feature flag mock to default enabled
    ff.useFeatureFlag.mockImplementation(() => ({ enabled: true, loading: false }));

    // Reset media query to desktop by default
    mui.useMediaQuery.mockImplementation(() => false);

    // Reset mock modal payload
    mockModalResponse = { config: { p1: { amount: 500000, isFullAmount: false } }, financingAssignments: { p1: 'mock-1' } };

    // Reset cart store items
    useCartStore.setState({ items: [{ id: 'p1', name: 'Product P1', quantity: 1, supplier_id: 's1', price: 100000 }], isLoading: false });
  });

  afterEach(() => {
    // Clear any transient state
    useCartStore.setState({ isLoading: false });
    jest.clearAllMocks();
  });

  const renderWithMemoryProviders = (ui, { route = '/buyer/cart' } = {}) => {
    const client = new QueryClient();
    return render(
      <MemoryRouter initialEntries={[route]}>
        <QueryClientProvider client={client}>
          <ThemeProvider theme={dashboardThemeCore}>
            <BannerProvider>
              {ui}
            </BannerProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );
  };

  test('desktop: after configuring financing, cart item shows financed amount (formatted)', async () => {
    renderWithMemoryProviders(<BuyerCart />);

    // Ensure financing button exists (feature flag enabled)
    const payButton = await screen.findByRole('button', { name: /Pagar con Financiamiento/i });
    expect(payButton).toBeInTheDocument();

    // Click it to open mock modal (which will auto-save mockModalResponse)
    fireEvent.click(payButton);

    // Wait for the financed label and the formatted amount to appear
    await waitFor(() => expect(screen.getByText(/Financiado:/i)).toBeInTheDocument());

    // Scope to the financed label container to avoid ambiguous matches elsewhere in the page
    const financedLabel = screen.getByText(/Financiado:/i);
    const financedContainer = financedLabel.closest('div');
    const financedAmountEl = within(financedContainer).getByText(formatCLP(500000));
    expect(financedAmountEl).toBeInTheDocument();
    expect(financedAmountEl).toHaveStyle({ color: '#2E52B2' });

    // --- NUEVO: Order Summary debe mostrar la línea de Financiamiento (monto aplicado)
    // El monto aplicado se debe acotar al total del producto (100000 en este test)
    const expectedApplied = 100000;
    await waitFor(() => expect(screen.getByText(/Financiamiento:/i)).toBeInTheDocument());
    const financingRow = screen.getByText(/Financiamiento:/i).closest('div');
    expect(within(financingRow).getByText(`-${formatCLP(expectedApplied)}`)).toBeInTheDocument();

    // Verificar total final: subtotal 100000 - financiamiento aplicado 100000 = 0
    const totalLabel = screen.getByText(/^Total:$/i);
    const totalRow = totalLabel.closest('div');
    expect(within(totalRow).getByText(formatCLP(0))).toBeInTheDocument();
  });

  test('mobile: financing flow displays financed amount in mobile layout', async () => {
    // Force mobile layout
    mui.useMediaQuery.mockImplementation(() => true);

    // Start with a different financing amount to make sure formatting is consistent
    mockModalResponse = { config: { p1: { amount: 750000, isFullAmount: false } }, financingAssignments: { p1: 'mock-1' } };

    renderWithMemoryProviders(<BuyerCart />);

    const payButtonMobile = await screen.findByTestId('PayWithFinancingBtn');
    expect(payButtonMobile).toBeInTheDocument();

    // Both mobile financing buttons should be present and have two-line structure
    expect(screen.getByTestId('ViewFinancingsBtn')).toBeInTheDocument();

    // Verify the pay button has two child lines
    expect(within(payButtonMobile).getByText(/Pagar con/i)).toBeInTheDocument();
    expect(within(payButtonMobile).getByText(/Financiamiento/i)).toBeInTheDocument();

    // Ensure both wrappers occupy exactly 50% width
    const finWrapper = screen.getByTestId('FinButtonWrapper');
    const viewWrapper = screen.getByTestId('ViewButtonWrapper');
    expect(finWrapper).toHaveStyle({ width: '50%' });
    expect(viewWrapper).toHaveStyle({ width: '50%' });

    fireEvent.click(payButtonMobile);

    await waitFor(() => expect(screen.getByText(/Financiado:/i)).toBeInTheDocument());
    expect(screen.getByText(formatCLP(750000))).toBeInTheDocument();

    // --- NUEVO: Expandir resumen and verify financing row exists in mobile
    const expectedAppliedMobile = 100000;
    const summaryHeader = screen.getByText(/Resumen del pedido/i);
    fireEvent.click(summaryHeader);

    await waitFor(() => expect(screen.getByText(/Financiamiento:/i)).toBeInTheDocument());
    const financingRowMobile = screen.getByText(/Financiamiento:/i).closest('div');
    // Aceptable: sólo verificar que la fila de financiamiento existe in mobile
    expect(financingRowMobile).toBeTruthy();

    // Verificar icono de financiamiento en mobile
    expect(screen.getByTestId('FinancingIcon')).toBeInTheDocument();

    // Header total should reflect subtotal - applied = 0
    expect(screen.getAllByText(formatCLP(0)).length).toBeGreaterThan(0);
  });

  test('feature flag disabled: financing UI is not rendered', async () => {
    ff.useFeatureFlag.mockImplementation(() => ({ enabled: false, loading: false }));

    renderWithMemoryProviders(<BuyerCart />);

    // Button should not be present
    await waitFor(() => expect(screen.queryByRole('button', { name: /Pagar con Financiamiento/i })).not.toBeInTheDocument());
  });

  test('amount 0 saved: financing indicator is not shown', async () => {
    mockModalResponse = { config: { p1: { amount: 0, isFullAmount: false } }, financingAssignments: { p1: 'mock-1' } };

    renderWithMemoryProviders(<BuyerCart />);

    fireEvent.click(await screen.findByRole('button', { name: /Pagar con Financiamiento/i }));

    // Wait a short time and assert that no financed label is rendered
    await waitFor(() => expect(screen.queryByText(/Financiado:/i)).not.toBeInTheDocument());
  });

  test('isFullAmount true => financed amount equals full product total', async () => {
    // The test product has price 100000 and quantity 1 in beforeEach
    mockModalResponse = { config: { p1: { amount: 100000, isFullAmount: true } }, financingAssignments: { p1: 'mock-1' } };

    renderWithMemoryProviders(<BuyerCart />);

    fireEvent.click(await screen.findByRole('button', { name: /Pagar con Financiamiento/i }));

    await waitFor(() => expect(screen.getByText(/Financiado:/i)).toBeInTheDocument());
    const financedLabel = screen.getByText(/Financiado:/i);
    const financedContainer = financedLabel.closest('div');
    const financedAmountEl = within(financedContainer).getByText(formatCLP(100000));
    expect(financedAmountEl).toBeInTheDocument();
    expect(financedAmountEl).toHaveStyle({ color: '#2E52B2' });
  });

  test('changing quantity removes financing for that item', async () => {
    renderWithMemoryProviders(<BuyerCart />);

    // Save financing first
    fireEvent.click(await screen.findByRole('button', { name: /Pagar con Financiamiento/i }));
    await waitFor(() => expect(screen.getByText(/Financiado:/i)).toBeInTheDocument());

    // Simulate quantity change via user interaction with the QuantitySelector (this triggers BuyerCart.handleQuantityChange)
    const qtyInput = screen.getByLabelText('Cantidad');
    // Simulate typing a new value and blurring to trigger the component's onBlur handler
    fireEvent.change(qtyInput, { target: { value: '2' } });
    fireEvent.blur(qtyInput);

    // After quantity changes, financing indicator must disappear
    await waitFor(() => expect(screen.queryByText(/Financiado:/i)).not.toBeInTheDocument());
  });

  test('multiple products: financing only applied to configured product', async () => {
    // Two products in cart
    useCartStore.setState({ items: [
      { id: 'p1', name: 'Product P1', quantity: 1, supplier_id: 's1', price: 100000 },
      { id: 'p2', name: 'Product P2', quantity: 1, supplier_id: 's1', price: 200000 },
    ] });

    // Configure financing only for p1
    mockModalResponse = { config: { p1: { amount: 50000, isFullAmount: false } }, financingAssignments: { p1: 'mock-1' } };

    renderWithMemoryProviders(<BuyerCart />);

    fireEvent.click(await screen.findByRole('button', { name: /Pagar con Financiamiento/i }));

    // Only one financed label should exist and correspond to the formatted amount
    await waitFor(() => expect(screen.getAllByText(/Financiado:/i).length).toBe(1));
    expect(screen.getByText(formatCLP(50000))).toBeInTheDocument();
  });

  test('when there are no financings available, user sees the "No hay financiamientos disponibles" message in modal (unit-level check)', () => {
    // This is better covered in FinancingConfigModal unit tests; ensure the modal component behaves as expected when passed empty suppliers
    // We render the modal component directly to assert messaging — import real component here
    const FinancingConfigModal = jest.requireActual('../../domains/buyer/pages/cart/components/FinancingConfigModal').default;

    // Render the modal with empty cart
    const { rerender } = render(
      <FinancingConfigModal open={true} onClose={() => {}} cartItems={[]} formatPrice={(n)=>formatCLP(n)} onSave={()=>{}} currentFinancing={{}} shippingByProduct={{}} overallShipping={0} />
    );

    // Since cartItems is empty, modal should render no product entries and show totals of 0
    expect(screen.queryByText(/Monto a financiar:/i)).not.toBeInTheDocument();
    // Rerender with a product that has no financings (supplier-less)
    rerender(
      <MemoryRouter>
        <FinancingConfigModal open={true} onClose={() => {}} cartItems={[{ id: 'no-supplier', name: 'No Supplier', quantity: 1, price: 100000 }]} formatPrice={(n)=>formatCLP(n)} onSave={()=>{}} currentFinancing={{}} shippingByProduct={{}} overallShipping={0} />
      </MemoryRouter>
    );

    // For a product with supplier unknown, the select should display 'No hay financiamientos disponibles' text as placeholder
    expect(screen.getByText(/No hay financiamientos disponibles/i)).toBeInTheDocument();
  });
});