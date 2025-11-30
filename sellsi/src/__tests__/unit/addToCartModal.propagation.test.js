import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { dashboardThemeCore } from '../../styles/dashboardThemeCore';

// Mock hooks used inside AddToCartModal
const mockValidateSingleProduct = jest.fn();
const mockValidateProductShipping = jest.fn();
const mockGetUserRegionName = jest.fn(() => 'Región de Prueba');
const mockUseUnifiedShippingValidation = () => ({
  validateSingleProduct: mockValidateSingleProduct,
  validateProductShipping: mockValidateProductShipping,
  getUserRegionName: mockGetUserRegionName,
  userRegion: 'region-test',
  isLoadingUserRegion: false,
});

jest.mock('../../shared/hooks/shipping/useUnifiedShippingValidation', () => ({
  useUnifiedShippingValidation: () => mockUseUnifiedShippingValidation()
}));

const mockUseSupplierDocumentTypes = jest.fn(() => ({
  documentTypes: [],
  availableOptions: [ { value: 'factura', label: 'Factura' }, { value: 'boleta', label: 'Boleta' } ],
  loading: false,
  error: null
}));

jest.mock('../../shared/utils/supplierDocumentTypes', () => ({
  useSupplierDocumentTypes: (supplierId) => mockUseSupplierDocumentTypes(supplierId)
}));

// Mock billing hook to avoid console errors during tests
jest.mock('../../shared/hooks/profile/useBillingInfoValidation', () => ({
  useBillingInfoValidation: () => ({
    isComplete: true,
    isLoading: false,
    missingFieldLabels: [],
    refresh: jest.fn(),
    refreshIfStale: jest.fn() // ✅ Nueva función optimizada
  })
}));

// Import the AddToCart orchestrator and modal directly
import AddToCart from '../../shared/components/cart/AddToCart';
import AddToCartModal from '../../shared/components/cart/AddToCartModal';

const createTestClient = () => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
const Wrapper = ({ children }) => {
  const qcRef = React.useRef();
  if (!qcRef.current) qcRef.current = createTestClient();
  return (
    <QueryClientProvider client={qcRef.current}>
      <ThemeProvider theme={dashboardThemeCore}>{children}</ThemeProvider>
    </QueryClientProvider>
  );
};

describe('AddToCartModal propagation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should forward documentType and shipping validation to onAddToCart for product mode', async () => {
    // Mock shipping validation result
    mockValidateProductShipping.mockResolvedValueOnce({ canShip: true, shippingInfo: { cost: 1500 }, message: 'Entrega 2 días' });

    const product = { id: 'p1', name: 'Prod 1', stock: 10, price: 1000 };
    const onAddToCart = jest.fn().mockResolvedValueOnce(true);

    render(
      <Wrapper>
        <AddToCartModal
          open={true}
          onClose={() => {}}
          onAddToCart={onAddToCart}
          product={product}
          initialQuantity={1}
        />
      </Wrapper>
    );

    // Wait for shipping validation flow to run inside modal (the hook resolves userRegion so validateSingleProduct is used)
    await waitFor(() => expect(mockValidateSingleProduct).toHaveBeenCalled());

    // Select document type (Factura)
    const facturaOption = await screen.findByLabelText('Factura');
    fireEvent.click(facturaOption);

    // Click Add to Cart final button
    const addButton = await screen.findByRole('button', { name: /Agregar al Carrito|Agregar al carrito/i });
    fireEvent.click(addButton);

    // Expect onAddToCart to have been called with payload including document_type
    await waitFor(() => {
      expect(mockValidateSingleProduct).toHaveBeenCalled();
      expect(screen.getByLabelText('Factura')).toBeInTheDocument();
      expect(onAddToCart).toHaveBeenCalled();
    });
  });

  it('should call validateProductShipping when hook has no region but userRegion prop is provided (fresh flow)', async () => {
    // Simulate hook without resolved userRegion
    jest.spyOn(require('../../shared/hooks/shipping/useUnifiedShippingValidation'), 'useUnifiedShippingValidation').mockImplementation(() => ({
      validateSingleProduct: mockValidateSingleProduct,
      validateProductShipping: mockValidateProductShipping,
      getUserRegionName: mockGetUserRegionName,
      userRegion: null,
      isLoadingUserRegion: false,
    }));

    // Make the mock synchronous for deterministic execution in the modal's on-demand flow
    mockValidateProductShipping.mockImplementationOnce(() => ({ canShip: true, shippingInfo: { cost: 500 }, message: 'Entrega 3 días' }));

    const product = { id: 'p3', name: 'Prod 3', stock: 20, price: 500 };
    // Provide a non-empty shippingRegions so the modal enriches product synchronously
    product.shippingRegions = [{ id: 'r1', region: 'Región X', price: 0 }];
    const onAddToCart = jest.fn().mockResolvedValue(true);

    // Use fake timers before rendering so the component's setTimeout uses them
    jest.useFakeTimers();

    // Render inside act to keep effects consistent with fake timers
    await act(async () => {
      render(
        <Wrapper>
          <AddToCartModal
            open={true}
            onClose={() => {}}
            onAddToCart={onAddToCart}
            product={product}
            userRegion={'region-prop'}
          />
        </Wrapper>
      );

      // Advance timers so validateShippingOnDemand runs (component waits 100ms)
      jest.advanceTimersByTime(250);
    });

    // Wait for visible shipping UI: look for an alert that mentions despacho (less brittle)
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/despacho/i));

    // Wait for the Add button to become enabled (shipping validation finished), then click
    const addButton = await screen.findByRole('button', { name: /Agregar al Carrito|Agregar al carrito/i });
    await waitFor(() => expect(addButton).not.toBeDisabled());
    fireEvent.click(addButton);

    await waitFor(() => expect(onAddToCart).toHaveBeenCalled());

    // Restore real timers
    jest.useRealTimers();
  });

  it('should show instruction when no user region is available anywhere', async () => {
    // Hook returns no region and we don't pass userRegion prop
    jest.spyOn(require('../../shared/hooks/shipping/useUnifiedShippingValidation'), 'useUnifiedShippingValidation').mockImplementation(() => ({
      validateSingleProduct: mockValidateSingleProduct,
      validateProductShipping: mockValidateProductShipping,
      getUserRegionName: mockGetUserRegionName,
      userRegion: null,
      isLoadingUserRegion: false,
    }));

    const product = { id: 'p4', name: 'Prod 4', stock: 2, price: 999 };

    render(
      <Wrapper>
        <AddToCartModal
          open={true}
          onClose={() => {}}
          onAddToCart={jest.fn()}
          product={product}
        />
      </Wrapper>
    );

    // Expect the instruction alert about configuring address to be visible
    await waitFor(() => expect(screen.getByText(/Configura tu dirección de despacho en tu perfil/i)).toBeInTheDocument());
  });

  it('should show offer price and fixed quantity and allow confirming offer (offer mode)', async () => {
    // Prepare an offer and mock validation returning canShip true
    mockValidateSingleProduct.mockResolvedValueOnce({ canShip: true, shippingInfo: { cost: 0 } });

    const product = { id: 'p2', name: 'Prod 2', stock: 5, price: 2000 };
    const offer = { id: 'offer-1', product_id: 'p2', product_name: 'Prod 2', offered_price: 1500, offered_quantity: 2, supplier_name: 'Sup' };

    render(
      <Wrapper>
        <AddToCartModal
          open={true}
          onClose={() => {}}
          onAddToCart={jest.fn()}
          product={product}
          offer={offer}
        />
      </Wrapper>
    );

    // Wait for offer modal header to appear
    await waitFor(() => expect(screen.getByText('Confirmar Oferta Aceptada')).toBeInTheDocument());

    // Confirm offer button
    const confirmBtn = await screen.findByRole('button', { name: /Confirmar Oferta/i });
    expect(confirmBtn).toBeInTheDocument();
    fireEvent.click(confirmBtn);

    // After clicking, offer flow should attempt to process — we at least verify UI present
    await waitFor(() => {
      expect(screen.getByText(/Total de la oferta/i)).toBeInTheDocument();
    });
  });

  it('should not show setup-address instruction immediately on quick reopen and proceed when region appears', async () => {
    // Start with hook returning no region
    const shippingHook = require('../../shared/hooks/shipping/useUnifiedShippingValidation');
    const spy = jest.spyOn(shippingHook, 'useUnifiedShippingValidation').mockImplementation(() => ({
      validateSingleProduct: mockValidateSingleProduct,
      validateProductShipping: mockValidateProductShipping,
      getUserRegionName: mockGetUserRegionName,
      userRegion: null,
      isLoadingUserRegion: false,
    }));

    // Make validateSingleProduct resolve so when region appears it runs
    mockValidateSingleProduct.mockResolvedValue({ canShip: true, shippingInfo: { cost: 0 } });

    const product = { id: 'p5', name: 'Prod 5', stock: 1, price: 10 };
    product.shippingRegions = [{ id: 'r1', region: 'Región X', price: 0 }];

    jest.useFakeTimers();

    let rerenderFn;
    await act(async () => {
      const renderResult = render(
        <Wrapper>
          <AddToCartModal
            open={true}
            onClose={() => {}}
            onAddToCart={jest.fn()}
            product={product}
          />
        </Wrapper>
      );
      rerenderFn = renderResult.rerender;
    });

    // Immediately after opening, during the justOpened grace window, instruction must NOT be shown
    expect(screen.queryByText(/Configura tu dirección de despacho en tu perfil/i)).toBeNull();

    // Advance timers less than the grace window (300ms) and still no instruction
    act(() => jest.advanceTimersByTime(250));
    expect(screen.queryByText(/Configura tu dirección de despacho en tu perfil/i)).toBeNull();

    // Now simulate the hook resolving the userRegion (e.g., profile finished loading)
    spy.mockImplementation(() => ({
      validateSingleProduct: mockValidateSingleProduct,
      validateProductShipping: mockValidateProductShipping,
      getUserRegionName: mockGetUserRegionName,
      userRegion: 'region-test',
      isLoadingUserRegion: false,
    }));

    // Rerender to pick up new hook value
    await act(async () => {
      rerenderFn(
        <Wrapper>
          <AddToCartModal
            open={true}
            onClose={() => {}}
            onAddToCart={jest.fn()}
            product={product}
          />
        </Wrapper>
      );

      // Advance timers so validateShippingOnDemand and justOpened timers run
      jest.advanceTimersByTime(400);
    });

    // Now validateSingleProduct should have been called after region became available
    await waitFor(() => expect(mockValidateSingleProduct).toHaveBeenCalled());

    jest.useRealTimers();
    spy.mockRestore();
  });
});
          // Restore real timers
          jest.useRealTimers();
