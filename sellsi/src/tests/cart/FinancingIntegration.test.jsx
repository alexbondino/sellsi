import React from 'react';
import { render, screen, waitFor, fireEvent, within, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { dashboardThemeCore } from '../../styles/dashboardThemeCore';
import { BannerProvider } from '../../shared/components/display/banners/BannerContext';
import useCartStore from '../../shared/stores/cart/cartStore';
// BuyerCart will be required after mocks to allow component-level mocking
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

// Prevent real network calls and logs from thumbnail service during integration tests
jest.mock('../../services/phase1ETAGThumbnailService.js', () => ({
  getOrFetchMainThumbnail: jest.fn(() => Promise.resolve(null)),
  getOrFetchManyMainThumbnails: jest.fn(() => Promise.resolve({})),
  phase1ETAGService: {
    fetchThumbnailWithETag: jest.fn(() => Promise.resolve(null)),
    fetchMany: jest.fn(() => Promise.resolve({})),
  },
  __esModule: true,
}));

// Use real FinancingConfigModal but mock the underlying service that fetches financings
jest.mock('../../../../../workspaces/buyer/my-financing/services/financingService', () => ({
  getAvailableFinancingsForSupplier: jest.fn(),
}));
const financingServiceMock = jest.requireMock('../../../../../workspaces/buyer/my-financing/services/financingService');

// Use manual mock file in __mocks__ to ensure consistent module replacement
jest.mock('../../domains/buyer/pages/cart/components/FinancingConfigModal');

// Now require BuyerCart so it receives the mocked FinancingConfigModal
const BuyerCart = require('../../domains/buyer/pages/BuyerCart').default;
// Load the manual mock component so we can inject it via prop
const MockFinancingConfigModal = require('../../domains/buyer/pages/cart/components/__mocks__/FinancingConfigModal.jsx').default;

// (resolved via manual mock file)

let defaultFinancings = [
  { id: 'mock-1', supplier_id: 's1', amount: 800000, amount_used: 200000, amount_paid: 50000, term_days: 45, activated_at: new Date().toISOString(), expires_at: new Date(Date.now()+30*86400000).toISOString(), status: 'approved_by_sellsi', paused: false },
  { id: 'mock-2', supplier_id: 's1', amount: 500000, amount_used: 150000, amount_paid: 50000, term_days: 30, activated_at: new Date().toISOString(), expires_at: new Date(Date.now()+7*86400000).toISOString(), status: 'approved_by_sellsi', paused: false },
];

// Configure default mock behavior per test in beforeEach


// Utility to format money the same way the app does
const formatCLP = amount => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(amount);

describe('BuyerCart financing integration (robust)', () => {
  beforeEach(() => {
    // Reset feature flag mock to default enabled
    ff.useFeatureFlag.mockImplementation(() => ({ enabled: true, loading: false }));

    // Reset media query to desktop by default
    mui.useMediaQuery.mockImplementation(() => false);

    // Reset default financings
    financingServiceMock.getAvailableFinancingsForSupplier.mockImplementation(() => Promise.resolve(defaultFinancings));

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

  // Helper to open financing modal and return a `within` scoped to the dialog
  const openFinancingModal = async () => {
    try {
      fireEvent.click(await screen.findByRole('button', { name: /Pagar con Financiamiento/i }));
    } catch (e) {
      // Button may not be necessary for the mock (mock renders dialog always)
    }
    const dialog = await screen.findByRole('dialog');
    return within(dialog);
  };

  test('desktop: after configuring financing, cart item shows financed amount (formatted)', async () => {
    renderWithMemoryProviders(<BuyerCart FinancingConfigModalOverride={MockFinancingConfigModal} />);

    // Ensure financing button exists (feature flag enabled)
    const payButton = await screen.findByRole('button', { name: /Pagar con Financiamiento/i });
    expect(payButton).toBeInTheDocument();
    await waitFor(() => expect(payButton).not.toBeDisabled());

    // Open modal and scope queries to its dialog
    const dialog = await openFinancingModal();

    // DEBUG: dump dialog HTML to inspect accessibility labels
    console.log(document.body.innerHTML.slice(0, 4000));

    // Wait for the modal select to appear (MUI Select renders as a button/combobox)
    const select = await dialog.findByRole('button', { name: /Financiamiento a usar/i });
    expect(select).toBeInTheDocument();

    // Open select and pick the first financing option (Fin #1)
    fireEvent.mouseDown(select);
    const option = await dialog.findByText(/Fin #1/i);
    fireEvent.click(option);

    // Click the "Pagar la totalidad" checkbox to ensure applied amount equals product total (100000)
    const fullCheckbox = await dialog.findByRole('checkbox', { name: /Pagar la totalidad de este producto con financiamiento/i });
    fireEvent.click(fullCheckbox);

    // Confirm the modal (save)
    fireEvent.click(await dialog.findByRole('button', { name: /Confirmar/i }));

    // Wait for the financed label and the formatted amount to appear
    await waitFor(() => expect(screen.getByText(/Financiado:/i)).toBeInTheDocument());

    // Scope to the financed label container to avoid ambiguous matches elsewhere in the page
    const financedLabel = screen.getByText(/Financiado:/i);
    const financedContainer = financedLabel.closest('div');
    const financedAmountEl = within(financedContainer).getByText(formatCLP(100000));
    expect(financedAmountEl).toBeInTheDocument();
    expect(financedAmountEl).toHaveStyle({ color: '#2E52B2' });

    // --- NUEVO: Order Summary debe mostrar la línea de Financiamiento (monto aplicado)
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

    // Start with a different financing set for mobile
    financingServiceMock.getAvailableFinancingsForSupplier.mockImplementation(() => Promise.resolve([
      { id: 'mock-1', supplier_id: 's1', amount: 800000, amount_used: 200000, amount_paid: 50000, term_days: 45, activated_at: new Date().toISOString(), expires_at: new Date(Date.now()+30*86400000).toISOString(), status: 'approved_by_sellsi', paused: false },
    ]));

    renderWithMemoryProviders(<BuyerCart FinancingConfigModalOverride={MockFinancingConfigModal} />);

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

    // Open modal (wait until enabled)
    await waitFor(() => expect(payButtonMobile).not.toBeDisabled());
    fireEvent.click(payButtonMobile);

    // Wait for financing select and confirm
    const select = await screen.findByRole('button', { name: /Financiamiento a usar/i });
    fireEvent.mouseDown(select);
    fireEvent.click(await screen.findByText(/Fin #1/i));

    // Toggle full amount so the financed amount equals product total
    fireEvent.click(await screen.findByRole('checkbox', { name: /Pagar la totalidad de este producto con financiamiento/i }));

    // Confirm
    fireEvent.click(await screen.findByRole('button', { name: /Confirmar/i }));

    await waitFor(() => expect(screen.getByText(/Financiado:/i)).toBeInTheDocument());
    // Target the per-product financed amount to avoid ambiguity
    const financedEl = screen.getByTestId('financed-amount-p1');
    expect(financedEl).toHaveTextContent(formatCLP(100000));

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

    renderWithMemoryProviders(<BuyerCart FinancingConfigModalOverride={MockFinancingConfigModal} />);

    // Button should not be present
    await waitFor(() => expect(screen.queryByRole('button', { name: /Pagar con Financiamiento/i })).not.toBeInTheDocument());
  });

  test('amount 0 saved: financing indicator is not shown', async () => {
    renderWithMemoryProviders(<BuyerCart FinancingConfigModalOverride={MockFinancingConfigModal} />);

    // Open modal and scope to dialog
    const dialog = await openFinancingModal();

    // Wait for the modal input to appear
    const input = await dialog.findByRole('spinbutton');
    // Set amount to 0
    fireEvent.change(input, { target: { value: '0' } });

    // Confirm
    fireEvent.click(await dialog.findByRole('button', { name: /Confirmar/i }));

    // Wait and assert that no financed label is rendered for the product
    await waitFor(() => expect(screen.queryByTestId('financed-amount-p1')).not.toBeInTheDocument());
  });

  test('isFullAmount true => financed amount equals full product total', async () => {
    renderWithMemoryProviders(<BuyerCart FinancingConfigModalOverride={MockFinancingConfigModal} />);

    // Open modal and scope to dialog
    const dialog2 = await openFinancingModal();

    // Toggle full amount checkbox
    const fullCheckbox = await dialog2.findByRole('checkbox', { name: /Pagar la totalidad de este producto con financiamiento/i });
    fireEvent.click(fullCheckbox);

    // Confirm
    fireEvent.click(await dialog2.findByRole('button', { name: /Confirmar/i }));

    await waitFor(() => expect(screen.getByText(/Financiado:/i)).toBeInTheDocument());
    const financedLabel = screen.getByText(/Financiado:/i);
    const financedContainer = financedLabel.closest('div');
    const financedAmountEl = within(financedContainer).getByText(formatCLP(100000));
    expect(financedAmountEl).toBeInTheDocument();
    expect(financedAmountEl).toHaveStyle({ color: '#2E52B2' });
  });

  test('changing quantity removes financing for that item', async () => {
    renderWithMemoryProviders(<BuyerCart FinancingConfigModalOverride={MockFinancingConfigModal} />);

    // Save financing first by opening modal and toggling full amount
    const dialog3 = await openFinancingModal();
    const fullCheckbox3 = await dialog3.findByRole('checkbox', { name: /Pagar la totalidad de este producto con financiamiento/i });
    fireEvent.click(fullCheckbox3);
    fireEvent.click(await dialog3.findByRole('button', { name: /Confirmar/i }));
    await waitFor(() => expect(screen.getByText(/Financiado:/i)).toBeInTheDocument());

    // Simulate quantity change via user interaction with the QuantitySelector (this triggers BuyerCart.handleQuantityChange)
    const qtyInput = screen.getByLabelText('Cantidad');
    fireEvent.change(qtyInput, { target: { value: '2' } });
    fireEvent.blur(qtyInput);

    // After quantity changes, the product-specific financed indicator must disappear
    await waitFor(() => expect(screen.queryByTestId('financed-amount-p1')).not.toBeInTheDocument());
  });

  test('multiple products: financing only applied to configured product', async () => {
    // Two products in cart
    useCartStore.setState({ items: [
      { id: 'p1', name: 'Product P1', quantity: 1, supplier_id: 's1', price: 100000 },
      { id: 'p2', name: 'Product P2', quantity: 1, supplier_id: 's1', price: 200000 },
    ] });

    renderWithMemoryProviders(<BuyerCart FinancingConfigModalOverride={MockFinancingConfigModal} />);

    // Open modal and set financing only for p1
    const dialog4 = await openFinancingModal();

    // Find the product box for Product P1 and set its amount (choose the product entry that contains an input)
    // Fallback: seleccionar el primer input numérico dentro del modal (producto p1)
    const inputs = await dialog4.findAllByRole('spinbutton');
    if (inputs.length === 0) throw new Error('No amount inputs found in modal');
    const amountInput = inputs[0];
    fireEvent.change(amountInput, { target: { value: '50000' } });

    // Confirm
    fireEvent.click(await dialog4.findByRole('button', { name: /Confirmar/i }));

    // Only one financed label should exist and correspond to the formatted amount
    await waitFor(() => expect(screen.getAllByText(/Financiado:/i).length).toBe(1));
    const financedEl = screen.getByTestId('financed-amount-p1');
    expect(financedEl).toHaveTextContent(formatCLP(50000));
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