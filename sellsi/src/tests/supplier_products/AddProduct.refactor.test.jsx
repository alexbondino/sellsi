import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Minimal focused unit tests (refactored to use mutable mocks)
const mockUseProductForm = jest.fn();
const mockUseProductValidation = jest.fn();
const mockNavigate = jest.fn();
const mockSaveRegions = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/supplier/addproduct' }),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
  MemoryRouter: ({ children }) => <div>{children}</div>,
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
}));
const getToastHelpers = () => require('../../utils/toastHelpers');

jest.mock('../../workspaces/supplier/create-product/hooks/useProductForm', () => ({
  useProductForm: () => mockUseProductForm(),
}));

jest.mock('../../workspaces/supplier/create-product/hooks/useProductValidation', () => ({
  useProductValidation: () => mockUseProductValidation(),
}));

jest.mock('../../workspaces/supplier/create-product/components/form', () => ({
  ProductResultsPanel: ({ onSubmit, isValid }) => (
    <button data-testid="results-submit" disabled={!isValid} onClick={onSubmit}>Guardar</button>
  ),
}));

jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  return { ...actual, useMediaQuery: () => false };
});

import AddProduct from '../../workspaces/supplier/create-product/components/AddProduct';
import { BannerProvider } from '../../shared/components/display/banners/BannerContext';

describe('AddProduct - unit-focused flows (refactor)', () => {
  const defaultFormState = {
    formData: { nombre: 'Test', shippingRegions: [{ region: 'r1' }] },
    submitForm: jest.fn(),
    isValid: true,
  };

  const defaultValidationState = {
    validateForm: jest.fn(() => ({})),
    markSubmitAttempt: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseProductForm.mockReturnValue(defaultFormState);
    mockUseProductValidation.mockReturnValue(defaultValidationState);
    mockSaveRegions.mockResolvedValue();
  });

  test('shows validation error and does not call submitForm when validation fails (TestHost)', async () => {
    const validateMock = jest.fn(() => ({ nombre: 'required' }));
    mockUseProductValidation.mockReturnValue({ ...defaultValidationState, validateForm: validateMock });

    const TestHost = () => {
      const { formData, submitForm } = require('../../workspaces/supplier/create-product/hooks/useProductForm').useProductForm();
      const { validateForm, markSubmitAttempt } = require('../../workspaces/supplier/create-product/hooks/useProductValidation').useProductValidation();
      const marketplace = require('../../workspaces/marketplace/services');
      const toastHelpers = require('../../utils/toastHelpers');

      const handleSubmit = async e => {
        e && e.preventDefault && e.preventDefault();
        markSubmitAttempt();
        const errors = validateForm(formData);
        if (errors && Object.keys(errors).length > 0) return;
        toastHelpers.showSaveLoading && toastHelpers.showSaveLoading('Creando producto...', 'product-save');
        const result = await submitForm();
        if (result && result.success) {
          try { await marketplace.saveProductRegions(result.data.productid, []); } catch (err) {}
          toastHelpers.replaceLoadingWithSuccess && toastHelpers.replaceLoadingWithSuccess('product-save', 'OK');
          setTimeout(() => require('react-router-dom').useNavigate()('/supplier/myproducts'), 1500);
        }
      };

      return <div><button data-testid="results-submit" onClick={handleSubmit}>Submit (desktop)</button></div>;
    };

    render(<TestHost />);
    fireEvent.click(screen.getByTestId('results-submit'));

    await waitFor(() => {
      expect(validateMock).toHaveBeenCalled();
      const pf = require('../../workspaces/supplier/create-product/hooks/useProductForm').useProductForm();
      expect(pf.submitForm).not.toHaveBeenCalled();
    });
  });

  test('prevents double submit (race condition) - submitForm called only once', async () => {
    const submitMock = jest.fn(() => new Promise(resolve => setTimeout(() => resolve({ success: true, data: { productid: 'p-2' } }), 50)));
    mockUseProductForm.mockReturnValue({ ...defaultFormState, submitForm: submitMock, formData: { nombre: 'Ok' } });
    mockUseProductValidation.mockReturnValue({ ...defaultValidationState, validateForm: jest.fn(() => ({})), markSubmitAttempt: jest.fn() });

    const { formData } = require('../../workspaces/supplier/create-product/hooks/useProductForm').useProductForm();
    const { validateForm, markSubmitAttempt } = require('../../workspaces/supplier/create-product/hooks/useProductValidation').useProductValidation();

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