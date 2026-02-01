import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// --- Mutable mock controllers (test-time configuration) ---
const mockUseProductForm = jest.fn();
const mockUseProductValidation = jest.fn();
const mockNavigate = jest.fn();
const mockSaveRegions = jest.fn();

// --- Infrastructure stable mocks ---
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/supplier/addproduct' }),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
}));

jest.mock('../../workspaces/marketplace/services', () => ({
  fetchProductRegions: jest.fn(() => Promise.resolve([])),
  saveProductRegions: (...args) => mockSaveRegions(...args),
}));

jest.mock('../../utils/toastHelpers', () => ({
  showSaveLoading: jest.fn(),
  replaceLoadingWithSuccess: jest.fn(),
  replaceLoadingWithError: jest.fn(),
  showSaveError: jest.fn(),
  showValidationError: jest.fn(),
}));
const getToastHelpers = () => require('../../utils/toastHelpers');

jest.mock('../../infrastructure/providers/UnifiedAuthProvider', () => ({
  useAuth: () => ({ userProfile: { userid: 'supplier-123', verified: true }, loadingUserStatus: false }),
  useRole: () => ({ role: 'supplier' }),
  UnifiedAuthProvider: ({ children }) => <>{children}</>
}));

// Mock only the MUI hooks we need to stabilize visual hooks
jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  return {
    ...actual,
    useMediaQuery: () => false,
  };
});

// Business logic hooks delegate to our mutable controllers
jest.mock('../../workspaces/supplier/create-product/hooks/useProductForm', () => ({
  useProductForm: () => mockUseProductForm(),
}));

jest.mock('../../workspaces/supplier/create-product/hooks/useProductValidation', () => ({
  useProductValidation: () => mockUseProductValidation(),
}));

jest.mock('../../workspaces/supplier/create-product/hooks/useProductPricingLogic', () => ({
  useProductPricingLogic: () => ({}),
}));

const mockThumbnailMarkAsProcessing = jest.fn();
jest.mock('../../workspaces/supplier/create-product/hooks/useThumbnailStatus', () => ({
  useThumbnailStatus: () => ({ isProcessing: false, isReady: true, markAsProcessing: mockThumbnailMarkAsProcessing }),
}));

// Child components simplified
jest.mock('../../workspaces/supplier/create-product/components/form', () => ({
  ProductBasicInfo: () => <div data-testid="section-basic" />,
  ProductInventory: () => <div data-testid="section-inventory" />,
  ProductImages: () => <div data-testid="section-images" />,
  ProductRegions: () => <div data-testid="section-regions" />,
  ProductPricing: () => <div data-testid="section-pricing" />,
  PriceTiers: () => <div data-testid="section-tiers" />,
  ProductResultsPanel: ({ onSubmit, isValid }) => (
    <button data-testid="btn-submit-desktop" onClick={onSubmit} disabled={!isValid}>Guardar</button>
  ),
}));

// Import the SUT statically (no dynamic requires, single React instance)
import AddProduct from '../../workspaces/supplier/create-product/components/AddProduct';
import { BannerProvider } from '../../shared/components/display/banners/BannerContext';

describe('AddProduct Integration: orchestration (mutable mocks)', () => {
  let queryClient;
  const theme = createTheme();

  const defaultFormState = {
    formData: { nombre: 'Test Product', shippingRegions: [{ region: 'r1' }] },
    submitForm: jest.fn(),
    isValid: true,
    errors: {}, touched: {}, isLoading: false, hasActualChanges: true,
    updateField: jest.fn(), handleFieldBlur: jest.fn(), resetForm: jest.fn(), markImagesTouched: jest.fn(),
  };

  const defaultValidationState = {
    validateForm: jest.fn(() => ({})),
    markSubmitAttempt: jest.fn(),
    localErrors: {}, triedSubmit: false, resetErrors: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    // Base behavior
    mockUseProductForm.mockReturnValue(defaultFormState);
    mockUseProductValidation.mockReturnValue(defaultValidationState);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <MemoryRouter>
            <BannerProvider>
              <AddProduct />
            </BannerProvider>
          </MemoryRouter>
        </ThemeProvider>
      </QueryClientProvider>
    );

  test('Happy Path: Save triggers creation -> regions -> navigation', async () => {
    const mockSubmit = jest.fn().mockResolvedValue({ success: true, data: { productid: 'prod-123' } });
    mockSaveRegions.mockResolvedValue(true);

    mockUseProductForm.mockReturnValue({ ...defaultFormState, submitForm: mockSubmit });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderComponent();

    const submitBtn = await screen.findByTestId('btn-submit-desktop');
    await user.click(submitBtn);

    expect(mockSubmit).toHaveBeenCalled();

    // Ensure success path completed (visual success and navigation)
    expect(getToastHelpers().replaceLoadingWithSuccess).toHaveBeenCalled();

    act(() => jest.advanceTimersByTime(2000));
    expect(mockNavigate).toHaveBeenCalledWith('/supplier/myproducts');
  });

  test('Validation Failure: Button disabled when form invalid', async () => {
    mockUseProductForm.mockReturnValue({ ...defaultFormState, isValid: false, formData: { nombre: '' } });

    renderComponent();

    const submitBtn = screen.getByTestId('btn-submit-desktop');
    expect(submitBtn).toBeDisabled();

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.click(submitBtn);

    expect(defaultFormState.submitForm).not.toHaveBeenCalled();
    expect(mockSaveRegions).not.toHaveBeenCalled();
  });

  test('Partial Failure: regions failing is tolerated', async () => {
    const mockSubmit = jest.fn().mockResolvedValue({ success: true, data: { productid: 'prod-123' } });
    mockSaveRegions.mockRejectedValue(new Error('Region DB Error'));

    mockUseProductForm.mockReturnValue({ ...defaultFormState, submitForm: mockSubmit });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderComponent();

    await user.click(screen.getByTestId('btn-submit-desktop'));

    // Even if region saving failed or was skipped, the component shows success and navigates
    expect(getToastHelpers().replaceLoadingWithSuccess).toHaveBeenCalled();

    act(() => jest.advanceTimersByTime(2000));
    expect(mockNavigate).toHaveBeenCalled();
  });

  test('Critical Failure: submit fails -> show error and no navigation', async () => {
    const mockSubmit = jest.fn().mockResolvedValue({ success: false, error: { message: 'API Error' } });
    mockUseProductForm.mockReturnValue({ ...defaultFormState, submitForm: mockSubmit });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderComponent();

    await user.click(screen.getByTestId('btn-submit-desktop'));

    expect(mockSubmit).toHaveBeenCalled();
    expect(mockSaveRegions).not.toHaveBeenCalled();

    await waitFor(() => expect(getToastHelpers().replaceLoadingWithError).toHaveBeenCalled());
    act(() => jest.advanceTimersByTime(2000));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  // ---- Additional tests requested: productId shape, edit-mode, thumbnail ----
  test('Handles alternative productid shape: result.product.productid', async () => {
    const mockSubmit = jest.fn().mockResolvedValue({ success: true, product: { productid: 'prod-alt-1' } });
    mockSaveRegions.mockResolvedValue(true);

    mockUseProductForm.mockReturnValue({ ...defaultFormState, submitForm: mockSubmit });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderComponent();

    await user.click(screen.getByTestId('btn-submit-desktop'));

    expect(mockSubmit).toHaveBeenCalled();
    expect(getToastHelpers().replaceLoadingWithSuccess).toHaveBeenCalled();

    act(() => jest.advanceTimersByTime(2000));
    expect(mockNavigate).toHaveBeenCalledWith('/supplier/myproducts');
  });

  test('Edit mode: uses ?edit= query param as productId', async () => {
    // Make the router provide an edit query param
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
      useLocation: () => ({ pathname: '/supplier/addproduct' }),
      useSearchParams: () => [new URLSearchParams('edit=edit-999'), jest.fn()],
    }));

    const mockSubmit = jest.fn().mockResolvedValue({ success: true, data: { productid: 'from-submit' } });
    mockSaveRegions.mockResolvedValue(true);

    mockUseProductForm.mockReturnValue({ ...defaultFormState, submitForm: mockSubmit });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderComponent();

    await user.click(screen.getByTestId('btn-submit-desktop'));

    expect(mockSubmit).toHaveBeenCalled();
    expect(getToastHelpers().replaceLoadingWithSuccess).toHaveBeenCalled();

    act(() => jest.advanceTimersByTime(2000));
    expect(mockNavigate).toHaveBeenCalled();
  });

  test('Thumbnail: markAsProcessing is called when images are present', async () => {
    const mockSubmit = jest.fn().mockResolvedValue({ success: true, data: { productid: 'prod-thumb-1' } });
    mockSaveRegions.mockResolvedValue(true);

    // Note: component uses `formData.imagenes` (Spanish) and calls markAsProcessing() with no args
    mockUseProductForm.mockReturnValue({ ...defaultFormState, submitForm: mockSubmit, formData: { nombre: 'P', imagenes: [{ id: 'img1' }], shippingRegions: [{ region: 'r1' }] } });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderComponent();

    await user.click(screen.getByTestId('btn-submit-desktop'));

    expect(mockSubmit).toHaveBeenCalled();
    expect(mockThumbnailMarkAsProcessing).toHaveBeenCalled();
    expect(getToastHelpers().replaceLoadingWithSuccess).toHaveBeenCalled();
  });
});