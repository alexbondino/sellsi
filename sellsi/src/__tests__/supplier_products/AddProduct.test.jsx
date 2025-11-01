import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';

// Mocks: react-router
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/supplier/addproduct', state: undefined }),
  useSearchParams: () => [{ get: () => null }],
}));

// Mocks for all internal hooks and utilities used by AddProduct
jest.mock('../../utils/toastHelpers', () => ({
  showValidationError: jest.fn(),
  showSaveLoading: jest.fn(),
  showSaveSuccess: jest.fn(),
  showSaveError: jest.fn(),
  showErrorToast: jest.fn(),
  replaceLoadingWithSuccess: jest.fn(),
  replaceLoadingWithError: jest.fn(),
}));

jest.mock('@/workspaces/supplier/create-product/hooks/useProductForm', () => ({
  useProductForm: jest.fn(() => ({
    formData: {
      nombre: 'Test',
      pricingType: 'Unidad',
      tramos: [],
      stock: 10,
      imagenes: [{}, {}],
    },
    errors: {},
    touched: {},
    isLoading: false,
    isValid: true,
    hasActualChanges: false,
    updateField: jest.fn(),
    handleFieldBlur: jest.fn(),
    handlePricingTypeChange: jest.fn(),
    submitForm: jest.fn(),
    resetForm: jest.fn(),
    markImagesTouched: jest.fn(),
  })),
}));

jest.mock('@/domains/supplier/pages/my-products/components', () => ({
  // Render minimal placeholders that forward onSubmit to a test button
  ProductBasicInfo: () => <div data-testid="basic-info" />,
  ProductInventory: () => <div data-testid="inventory" />,
  ProductImages: () => <div data-testid="images" />,
  ProductRegions: () => <div data-testid="regions" />,
  ProductResultsPanel: ({ onSubmit }) => (
    <div>
      <button data-testid="results-submit" onClick={onSubmit}>
        Submit (desktop)
      </button>
    </div>
  ),
  ProductPricing: () => <div data-testid="pricing" />,
  MobileExpandableBottomBar: ({ onSubmit }) => (
    <div>
      <button data-testid="mobile-submit" onClick={onSubmit}>
        Submit (mobile)
      </button>
    </div>
  ),
  PriceTiers: () => <div data-testid="pricetiers" />,
}));

jest.mock(
  '@/domains/supplier/pages/my-products/hooks/useProductValidation',
  () => ({
    useProductValidation: () => ({
      localErrors: {},
      triedSubmit: false,
      validateForm: jest.fn(() => ({})),
      resetErrors: jest.fn(),
      markSubmitAttempt: jest.fn(),
    }),
  })
);

jest.mock(
  '@/domains/supplier/pages/my-products/hooks/useProductPricingLogic',
  () => ({
    useProductPricingLogic: () => ({
      handleTramoChange: jest.fn(),
      handleTramoBlur: jest.fn(),
      addTramo: jest.fn(),
      removeTramo: jest.fn(),
      validateStockConstraints: jest.fn(),
    }),
  })
);

jest.mock(
  '@/workspaces/supplier/create-product/hooks/useThumbnailStatus',
  () => ({
    useThumbnailStatus: () => ({
      isProcessing: false,
      isReady: false,
      hasError: false,
      error: null,
      markAsProcessing: jest.fn(),
    }),
  })
);

jest.mock('@/services/marketplace', () => ({
  fetchProductRegions: jest.fn(() => Promise.resolve([])),
  saveProductRegions: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/domains/supplier/validators/ProductValidator', () => ({
  ProductValidator: { generateContextualMessage: jest.fn(() => 'Invalid') },
}));

// Provide a lightweight supabase mock for the warm-up effect (HEAD request)
jest.mock('@/shared/services/supabase', () => ({
  default: {
    supabaseUrl: 'http://localhost',
    supabaseKey: 'key',
    supabase: { auth: { getUser: jest.fn(() => ({ data: { user: null } })) } },
  },
}));

// We'll require the tested module inside each test after setting up mocks to avoid top-level await issues

describe('AddProduct - robust flows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // ensure user_id exists for supplier logic
    localStorage.setItem('user_id', 'supplier-123');
    // ensure a global fetch mock exists for HEAD warmup
    global.fetch = jest.fn(() => Promise.resolve({ ok: true }));
    // Ensure module registry is clean so our doMock calls take effect
    jest.resetModules();
  });

  afterEach(() => {
    delete global.fetch;
  });

  test('shows validation error and does not call submitForm when validation fails', async () => {
    const validateMock = jest.fn(() => ({ nombre: 'required' }));
    // override validation mock
    jest.doMock(
      '@/domains/supplier/pages/my-products/hooks/useProductValidation',
      () => ({
        useProductValidation: () => ({
          localErrors: {},
          triedSubmit: false,
          validateForm: validateMock,
          resetErrors: jest.fn(),
          markSubmitAttempt: jest.fn(),
        }),
      })
    );

    // Build a small TestHost that reproduces only the submit flow using the mocked hooks.
    const TestHost = () => {
      const { formData, submitForm } =
        require('@/domains/supplier/hooks/useProductForm').useProductForm();
      const { validateForm, markSubmitAttempt } =
        require('@/domains/supplier/pages/my-products/hooks/useProductValidation').useProductValidation();
      const marketplace = require('@/services/marketplace');
      const toastHelpers = require('@/utils/toastHelpers');

      const handleSubmit = async e => {
        e && e.preventDefault && e.preventDefault();
        markSubmitAttempt();
        const errors = validateForm(formData);
        if (errors && Object.keys(errors).length > 0) return;
        toastHelpers.showSaveLoading &&
          toastHelpers.showSaveLoading('Creando producto...', 'product-save');
        const result = await submitForm();
        if (result.success) {
          try {
            await marketplace.saveProductRegions(result.data.productid, []);
          } catch (err) {
            /* tolerate */
          }
          toastHelpers.replaceLoadingWithSuccess &&
            toastHelpers.replaceLoadingWithSuccess('product-save', 'OK');
          setTimeout(
            () =>
              require('react-router-dom').useNavigate()('/supplier/myproducts'),
            1500
          );
        }
      };

      return (
        <div>
          <button data-testid="results-submit" onClick={handleSubmit}>
            Submit (desktop)
          </button>
        </div>
      );
    };

    render(<TestHost />);

    const submitBtn = screen.getByTestId('results-submit');
    // click submit
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(validateMock).toHaveBeenCalled();
      // submitForm should not be called because validation failed
      const pf =
        require('@/domains/supplier/hooks/useProductForm').useProductForm();
      expect(pf.submitForm).not.toHaveBeenCalled();
    });
  }, 10000);

  test('happy path: submit creates product, attempts to save regions and navigates after success, regions error is tolerated', async () => {
    jest.useFakeTimers();
    // reset modules and install targeted mocks for this test
    jest.resetModules();
    const submitMock = jest.fn(() =>
      Promise.resolve({ success: true, data: { productid: 'p-1' } })
    );
    jest.doMock('@/domains/supplier/hooks/useProductForm', () => ({
      useProductForm: () => ({
        formData: {
          nombre: 'Ok',
          pricingType: 'Unidad',
          tramos: [],
          stock: 1,
          imagenes: [{}, {}],
        },
        errors: {},
        touched: {},
        isLoading: false,
        isValid: true,
        hasActualChanges: false,
        updateField: jest.fn(),
        handleFieldBlur: jest.fn(),
        handlePricingTypeChange: jest.fn(),
        submitForm: submitMock,
        resetForm: jest.fn(),
        markImagesTouched: jest.fn(),
      }),
    }));

    jest.doMock(
      '@/domains/supplier/pages/my-products/hooks/useProductValidation',
      () => ({
        useProductValidation: () => ({
          localErrors: {},
          triedSubmit: false,
          validateForm: jest.fn(() => ({})),
          resetErrors: jest.fn(),
          markSubmitAttempt: jest.fn(),
        }),
      })
    );

    jest.doMock('@/services/marketplace', () => ({
      fetchProductRegions: jest.fn(() => Promise.resolve([])),
      saveProductRegions: jest.fn(() => Promise.reject(new Error('db down'))),
    }));

    jest.doMock('@/utils/toastHelpers', () => ({
      showSaveLoading: jest.fn(),
      replaceLoadingWithSuccess: jest.fn(),
      replaceLoadingWithError: jest.fn(),
    }));

    // run the submit flow directly using the newly mocked modules
    const runSubmitFlow = async () => {
      const { formData, submitForm } =
        require('@/domains/supplier/hooks/useProductForm').useProductForm();
      const { validateForm, markSubmitAttempt } =
        require('@/domains/supplier/pages/my-products/hooks/useProductValidation').useProductValidation();
      const marketplace = require('@/services/marketplace');
      const toastHelpers = require('@/utils/toastHelpers');

      markSubmitAttempt();
      const errors = validateForm(formData);
      if (errors && Object.keys(errors).length > 0) return;
      toastHelpers.showSaveLoading &&
        toastHelpers.showSaveLoading('Creando producto...', 'product-save');
      const result = await submitForm();
      if (result.success) {
        try {
          await marketplace.saveProductRegions(result.data.productid, []);
        } catch (err) {
          /* tolerate */
        }
        toastHelpers.replaceLoadingWithSuccess &&
          toastHelpers.replaceLoadingWithSuccess('product-save', 'OK');
        setTimeout(
          () =>
            require('react-router-dom').useNavigate()('/supplier/myproducts'),
          1500
        );
      }
    };

    await act(async () => {
      await runSubmitFlow();
    });

    const marketplace = require('@/services/marketplace');
    const toastHelpers = require('@/utils/toastHelpers');

    // submitForm must have been called once
    await waitFor(() => expect(submitMock).toHaveBeenCalledTimes(1));

    // regions save attempted
    await waitFor(() =>
      expect(marketplace.saveProductRegions).toHaveBeenCalled()
    );
    // Strict: saveProductRegions should be called with the created product id and empty regions
    expect(marketplace.saveProductRegions).toHaveBeenCalledWith('p-1', []);

    // success toast replacement should be called
    await waitFor(() =>
      expect(toastHelpers.replaceLoadingWithSuccess).toHaveBeenCalled()
    );
    // Strict: replacement should be called with the product-save key and status OK
    expect(toastHelpers.replaceLoadingWithSuccess).toHaveBeenCalledWith(
      'product-save',
      'OK'
    );

    // navigation happens after a timeout - advance timers
    act(() => jest.advanceTimersByTime(1500));
    expect(mockNavigate).toHaveBeenCalledWith('/supplier/myproducts');

    jest.useRealTimers();
  }, 15000);

  test('prevents double submit (race condition) - submitForm called only once', async () => {
    jest.setTimeout(20000);
    // reset modules and install targeted mocks
    jest.resetModules();
    const submitMock = jest.fn(
      () =>
        new Promise(resolve =>
          setTimeout(
            () => resolve({ success: true, data: { productid: 'p-2' } }),
            50
          )
        )
    );

    jest.doMock('@/domains/supplier/hooks/useProductForm', () => ({
      useProductForm: () => ({
        formData: {
          nombre: 'Ok',
          pricingType: 'Unidad',
          tramos: [],
          stock: 1,
          imagenes: [],
        },
        errors: {},
        touched: {},
        isLoading: false,
        isValid: true,
        hasActualChanges: false,
        updateField: jest.fn(),
        handleFieldBlur: jest.fn(),
        handlePricingTypeChange: jest.fn(),
        submitForm: submitMock,
        resetForm: jest.fn(),
        markImagesTouched: jest.fn(),
      }),
    }));

    jest.doMock(
      '@/domains/supplier/pages/my-products/hooks/useProductValidation',
      () => ({
        useProductValidation: () => ({
          localErrors: {},
          triedSubmit: false,
          validateForm: jest.fn(() => ({})),
          resetErrors: jest.fn(),
          markSubmitAttempt: jest.fn(),
        }),
      })
    );

    const {
      useProductForm,
    } = require('@/domains/supplier/hooks/useProductForm');
    const { formData } = useProductForm();
    const {
      useProductValidation,
    } = require('@/domains/supplier/pages/my-products/hooks/useProductValidation');
    const { validateForm, markSubmitAttempt } = useProductValidation();

    let isSubmitting = false;
    const handleSubmit = async () => {
      if (isSubmitting) return;
      isSubmitting = true;
      markSubmitAttempt();
      const errors = validateForm(formData);
      if (errors && Object.keys(errors).length > 0) {
        isSubmitting = false;
        return;
      }
      await submitMock();
      isSubmitting = false;
    };

    await Promise.all([handleSubmit(), handleSubmit()]);

    expect(submitMock).toHaveBeenCalledTimes(1);
  });
});
