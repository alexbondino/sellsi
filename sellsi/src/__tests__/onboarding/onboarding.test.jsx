import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../testUtils/renderWithProviders';

// Hoisted mock for Supabase - prefer module mock over mutating imports
jest.mock('../../services/supabase', () => {
  const auth = {
    getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1', email: 'test@example.com' } }, error: null }),
    refreshSession: jest.fn().mockResolvedValue(null),
  };

  const usersTable = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    upsert: jest.fn().mockResolvedValue({ error: null }),
  };

  const storageFrom = {
    upload: jest.fn().mockResolvedValue({ error: null, data: { path: 'user-1/logo.png' } }),
    getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://cdn.test/user-1/logo.png' } }),
    remove: jest.fn().mockResolvedValue({ error: null }),
  };

  const supabase = {
    auth,
    from: jest.fn().mockImplementation(table => {
      if (table === 'users') return usersTable;
      return { upsert: jest.fn().mockResolvedValue({ error: null }) };
    }),
    storage: { from: jest.fn().mockReturnValue(storageFrom) },
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  };

  return {
    supabase,
    // expose internals for tests to assert or override
    __mockUsersTable: usersTable,
    __mockStorageFrom: storageFrom,
    __mockAuth: auth,
  };
});

// Import the (now mocked) supabase client
import { supabase } from '../../services/supabase';

let Onboarding; // require dynamically in beforeEach to avoid import-time side effects

const mockRefreshUserProfile = jest.fn().mockResolvedValue(undefined);

jest.mock('../../infrastructure/providers/UnifiedAuthProvider', () => ({
  useAuth: () => ({
    refreshUserProfile: mockRefreshUserProfile,
  }),
}));

// Mock the optimized region hook (component only calls primeUserRegionCache)
jest.mock('../../hooks/useOptimizedUserShippingRegion', () => ({
  useOptimizedUserShippingRegion: () => ({
    primeUserRegionCache: jest.fn(),
  }),
}));

// Mock profile cache invalidation so we can assert it's called
jest.mock('../../services/user/profileService', () => ({
  invalidateUserProfileCache: jest.fn(),
}));

// Onboarding imports from src/shared/components (barrel) which pulls in modules
// that rely on import.meta.env (Vite). Jest in this repo isn't configured for
// import.meta, so we stub only what Onboarding needs.

// Mock the BannerContext so we can assert showBanner calls
jest.mock('../../shared/components/display/banners/BannerContext', () => {
  const mock = { showBanner: jest.fn() };
  return {
    BannerProvider: ({ children }) => children,
    useBanner: () => mock,
    // expose the mock for assertions from tests
    __mockShowBanner: mock,
  };
});

// Provide interactive stubs for TaxDocumentSelector and BillingInfoForm used by Onboarding
jest.mock('../../shared/components', () => {
  const React = require('react');
  return {
    TaxDocumentSelector: ({ documentTypes = [], onDocumentTypesChange, onChange }) =>
      React.createElement(
        'div',
        { 'data-testid': 'tax-selector' },
        React.createElement('button', {
          'data-testid': 'select-factura',
          onClick: () => {
            // Prefer the prop name used by the real component
            if (typeof onDocumentTypesChange === 'function') return onDocumentTypesChange(['factura']);
            if (typeof onChange === 'function') return onChange(['factura']);
          },
          type: 'button',
        }, 'select factura')
      ),
    BillingInfoForm: ({ formData = {}, onFieldChange = () => {} }) =>
      React.createElement(
        'div',
        { 'data-testid': 'billing-form' },
        React.createElement('input', { 'data-testid': 'business-name', value: formData.businessName || '', onChange: e => onFieldChange('businessName', e.target.value) }),
        React.createElement('input', { 'data-testid': 'billing-rut', value: formData.billingRut || '', onChange: e => onFieldChange('billingRut', e.target.value) }),
        React.createElement('input', { 'data-testid': 'business-line', value: formData.businessLine || '', onChange: e => onFieldChange('businessLine', e.target.value) }),
        React.createElement('input', { 'data-testid': 'billing-address', value: formData.billingAddress || '', onChange: e => onFieldChange('billingAddress', e.target.value) }),
        React.createElement('input', { 'data-testid': 'billing-region', value: formData.billingRegion || '', onChange: e => onFieldChange('billingRegion', e.target.value) }),
        React.createElement('input', { 'data-testid': 'billing-commune', value: formData.billingCommune || '', onChange: e => onFieldChange('billingCommune', e.target.value) })
      ),
  };
});

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Onboarding page - integration-ish tests', () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  const originalLocation = window.location;
  let usersTable;
  let storageFrom;
  let billingTable;
  let Onboarding;

  beforeAll(() => {
    // stub URL.createObjectURL used by avatar preview
    URL.createObjectURL = jest.fn(() => 'blob:mock');
    URL.revokeObjectURL = jest.fn();
  });

  afterAll(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevoke;
    window.location = originalLocation;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockRefreshUserProfile.mockClear();

    // Grab the hoisted mock handles for per-test overrides/assertions
    // eslint-disable-next-line global-require
    const supabaseModule = require('../../services/supabase');
    usersTable = supabaseModule.__mockUsersTable;
    storageFrom = supabaseModule.__mockStorageFrom;

    // Reset mock implementations to known defaults to avoid cross-test leakage
    usersTable.select.mockReturnThis();
    usersTable.eq.mockReturnThis();
    usersTable.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
    usersTable.upsert.mockResolvedValue({ error: null });

    storageFrom.upload.mockResolvedValue({ error: null, data: { path: 'user-1/logo.png' } });
    storageFrom.getPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn.test/user-1/logo.png' } });
    storageFrom.remove.mockResolvedValue({ error: null });

    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'test@example.com' } }, error: null });
    supabase.auth.refreshSession.mockResolvedValue(null);

    // Provide a billing_table mock so we can assert billing upserts
    billingTable = { upsert: jest.fn().mockResolvedValue({ error: null }) };

    // Override supabase.from to return table mocks for 'users' and 'billing_info'
    const originalFrom = supabase.from;
    supabase.from.mockImplementation(table => {
      if (table === 'users') return usersTable;
      if (table === 'billing_info') return billingTable;
      return originalFrom(table);
    });

    // Require the component after we prepared the mutated supabase client
    // eslint-disable-next-line global-require
    Onboarding = require('../../workspaces/auth/onboarding/components/Onboarding').default;
  });

  test('renders onboarding and Save button is disabled until basic fields are filled', () => {
    const { getByRole, getByText, getByLabelText } = renderWithProviders(<Onboarding />);

    const saveBtn = getByRole('button', { name: /Guardar y Finalizar/i });
    expect(saveBtn).toBeDisabled();

    // Fill minimal fields: select provider card (we simulate by typing company name)
    const nameField = getByLabelText(/Nombre de Empresa o Personal \*/i);
    fireEvent.change(nameField, { target: { value: 'ACME S.A.' } });

    // Now we still need to choose account type. Click the provider card action button
    fireEvent.click(getByRole('button', { name: /Soy Proveedor/i }));

    // After filling name and selecting type the button should be enabled
    expect(saveBtn).not.toBeDisabled();
  });

  test('shows logo error when uploading invalid file type', async () => {
    const { container, getByText, findByText } = renderWithProviders(
      <Onboarding />
    );

    const input = container.querySelector('#logo-upload');
    const badFile = new File(['hello'], 'bad.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [badFile] } });

    // Prefer findByText to wait for the error to appear in the DOM
    await findByText(/Formato no válido|Usa JPG|PNG|WEBP|Máximo 300 KB/i);
  });

  test('gracefully handles URL.createObjectURL throwing', async () => {
    // make createObjectURL throw for this test
    const original = URL.createObjectURL;
    URL.createObjectURL = jest.fn(() => { throw new Error('boom'); });

    try {
      const { container, findByText } = renderWithProviders(<Onboarding />);
      const input = container.querySelector('#logo-upload');
      const file = new File([new ArrayBuffer(100)], 'logo.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 1024 });
      fireEvent.change(input, { target: { files: [file] } });

      // Expect a friendly error message and no upload attempted
      await findByText(/No se pudo procesar la imagen|Corrige el error del logo/i);
      expect(storageFrom.upload).not.toHaveBeenCalled();
    } finally {
      // restore stubbed behavior used across the file
      URL.createObjectURL = original;
    }
  });

  test('happy path: provider without factura uploads logo and navigates home', async () => {
    const { getByRole, getByText, getByLabelText, container } = renderWithProviders(
      <Onboarding />
    );

    // Select provider (click the card action button)
    fireEvent.click(getByRole('button', { name: /Soy Proveedor/i }));

    // Fill required name
    const nameField = getByLabelText(/Nombre de Empresa o Personal \*/i);
    fireEvent.change(nameField, { target: { value: 'ACME S.A.' } });

    // Provide a valid small png file
    const input = container.querySelector('#logo-upload');
    const goodFile = new File([new ArrayBuffer(100)], 'logo.png', {
      type: 'image/png',
    });
    Object.defineProperty(goodFile, 'size', { value: 1024 });
    fireEvent.change(input, { target: { files: [goodFile] } });

    // Click save
    const saveBtn = getByRole('button', { name: /Guardar y Finalizar/i });
    expect(saveBtn).not.toBeDisabled();
    fireEvent.click(saveBtn);

    // wait for auth check, upload, upsert, onboarding flag and navigation
    await waitFor(() => {
      expect(supabase.auth.getUser).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(storageFrom.upload).toHaveBeenCalled();
      expect(storageFrom.getPublicUrl).toHaveBeenCalled();
      expect(usersTable.upsert).toHaveBeenCalled();
      const upsertPayload = usersTable.upsert.mock.calls[0][0];
      expect(upsertPayload).toEqual(
        expect.objectContaining({
          user_nm: 'ACME S.A.',
          logo_url: expect.stringContaining('https://cdn.test'),
        })
      );
      expect(mockRefreshUserProfile).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalled();
    });

    // Also ensure billing_table hasn't been called in the non-factura happy path
    expect(billingTable.upsert).not.toHaveBeenCalled();
  }, 10000);

  test('shows error when storage upload fails', async () => {
    // Simulate upload failure
    storageFrom.upload.mockResolvedValue({ error: { message: 'upload failed' } });

    const { getByRole, getByText, getByLabelText, container, findByText } = renderWithProviders(
      <Onboarding />
    );

    fireEvent.click(getByRole('button', { name: /Soy Proveedor/i }));
    const nameField = getByLabelText(/Nombre de Empresa o Personal \*/i);
    fireEvent.change(nameField, { target: { value: 'ACME S.A.' } });

    const input = container.querySelector('#logo-upload');
    const goodFile = new File([new ArrayBuffer(100)], 'logo.png', { type: 'image/png' });
    Object.defineProperty(goodFile, 'size', { value: 1024 });
    fireEvent.change(input, { target: { files: [goodFile] } });

    fireEvent.click(getByRole('button', { name: /Guardar y Finalizar/i }));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      // Ensure auth was checked (start of the flow)
      await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled());

      // Sanity checks: ensure storage.from returns our storageFrom mock
      expect(typeof supabase.storage.from).toBe('function');
      const resolvedStorage = supabase.storage.from('user-logos');
      expect(resolvedStorage.upload).toBe(storageFrom.upload);

      // upload should be attempted and error logged; upsert should not be called
      await waitFor(() => {
        expect(storageFrom.upload).toHaveBeenCalled();
        expect(usersTable.upsert).not.toHaveBeenCalled();
        const calls = consoleSpy.mock.calls.flat().join(' ');
        expect(calls).toMatch(/Error al subir|upload failed/i);
      });

      // billing table should not be touched for non-factura path
      expect(billingTable.upsert).not.toHaveBeenCalled();
    } finally {
      consoleSpy.mockRestore();
    }
  });

  test('shows error when upsert fails', async () => {
    // Simulate upsert failure
    usersTable.upsert.mockResolvedValue({ error: { message: 'upsert failed' } });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const { getByRole, getByText, getByLabelText, container, findByText } = renderWithProviders(
        <Onboarding />
      );

      fireEvent.click(getByRole('button', { name: /Soy Proveedor/i }));
      const nameField = getByLabelText(/Nombre de Empresa o Personal \*/i);
      fireEvent.change(nameField, { target: { value: 'ACME S.A.' } });

      const input = container.querySelector('#logo-upload');
      const goodFile = new File([new ArrayBuffer(100)], 'logo.png', { type: 'image/png' });
      Object.defineProperty(goodFile, 'size', { value: 1024 });
      fireEvent.change(input, { target: { files: [goodFile] } });

      fireEvent.click(getByRole('button', { name: /Guardar y Finalizar/i }));
      // Ensure auth was checked (start of the flow)
      await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled());

      // Sanity checks: ensure storage.from returns our storageFrom mock
      expect(typeof supabase.storage.from).toBe('function');
      const resolvedStorage = supabase.storage.from('user-logos');
      expect(resolvedStorage.upload).toBe(storageFrom.upload);

      await waitFor(() => {
        const calls = consoleSpy.mock.calls.flat().join(' ');
        expect(calls).toMatch(/Error al actualizar el perfil|upsert failed/i);
        expect(usersTable.upsert).toHaveBeenCalled();
        expect(mockRefreshUserProfile).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
      });

      // ensure billing table not touched for non-factura path
      expect(billingTable.upsert).not.toHaveBeenCalled();
    } finally {
      consoleSpy.mockRestore();
    }
  });

  test('shows error when file is too large', async () => {
    const { getByText, container, findByText } = renderWithProviders(<Onboarding />);

    const input = container.querySelector('#logo-upload');
    const bigFile = new File([new ArrayBuffer(400 * 1024)], 'big.png', { type: 'image/png' });
    Object.defineProperty(bigFile, 'size', { value: 400 * 1024 });
    fireEvent.change(input, { target: { files: [bigFile] } });

    await findByText(/Máximo 300 KB|Formato no válido/i);
    expect(storageFrom.upload).not.toHaveBeenCalled();
  });

  test('factura flow: billing_info upsert succeeds and navigates', async () => {
    const { getByRole, getByLabelText, getByTestId } = renderWithProviders(<Onboarding />);

    fireEvent.click(getByRole('button', { name: /Soy Proveedor/i }));
    fireEvent.change(getByLabelText(/Nombre de Empresa o Personal \*/i), { target: { value: 'ACME S.A.' } });

    // Select factura
    fireEvent.click(getByTestId('select-factura'));

    // Fill billing fields
    fireEvent.change(getByTestId('business-name'), { target: { value: 'ACME S.A.' } });
    fireEvent.change(getByTestId('billing-rut'), { target: { value: '12345678-9' } });
    fireEvent.change(getByTestId('business-line'), { target: { value: 'Comida' } });
    fireEvent.change(getByTestId('billing-address'), { target: { value: 'Calle 1' } });
    fireEvent.change(getByTestId('billing-region'), { target: { value: 'Region' } });
    fireEvent.change(getByTestId('billing-commune'), { target: { value: 'Comuna' } });

    fireEvent.click(getByRole('button', { name: /Guardar y Finalizar/i }));

    await waitFor(() => expect(billingTable.upsert).toHaveBeenCalled());
    expect(mockNavigate).toHaveBeenCalled();
    const bannerModule = require('../../shared/components/display/banners/BannerContext');
    expect(bannerModule.__mockShowBanner.showBanner).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
  });

  test('factura flow: billing_info upsert fails and shows error', async () => {
    // Simulate billing upsert failure
    billingTable.upsert.mockResolvedValue({ error: { message: 'billing failed' } });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const { getByRole, getByLabelText, getByTestId } = renderWithProviders(<Onboarding />);

      fireEvent.click(getByRole('button', { name: /Soy Proveedor/i }));
      fireEvent.change(getByLabelText(/Nombre de Empresa o Personal \*/i), { target: { value: 'ACME S.A.' } });

      // Select factura
      fireEvent.click(getByTestId('select-factura'));

      // Fill billing fields
      fireEvent.change(getByTestId('business-name'), { target: { value: 'ACME S.A.' } });
      fireEvent.change(getByTestId('billing-rut'), { target: { value: '12345678-9' } });
      fireEvent.change(getByTestId('business-line'), { target: { value: 'Comida' } });
      fireEvent.change(getByTestId('billing-address'), { target: { value: 'Calle 1' } });
      fireEvent.change(getByTestId('billing-region'), { target: { value: 'Region' } });
      fireEvent.change(getByTestId('billing-commune'), { target: { value: 'Comuna' } });

      fireEvent.click(getByRole('button', { name: /Guardar y Finalizar/i }));

      await waitFor(() => expect(billingTable.upsert).toHaveBeenCalled());
      const calls = consoleSpy.mock.calls.flat().join(' ');
      expect(calls).toMatch(/Billing Info Error|billing failed/i);
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockRefreshUserProfile).not.toHaveBeenCalled();
    } finally {
      consoleSpy.mockRestore();
    }
  });

  test('removes existing logo when present and no new logo uploaded', async () => {
    // Simulate existing profile with logo_url
    usersTable.single.mockResolvedValue({ data: { logo_url: 'https://cdn.test/user-logos/user-1/logo.png' }, error: null });

    const { getByRole, getByLabelText } = renderWithProviders(<Onboarding />);

    fireEvent.click(getByRole('button', { name: /Soy Proveedor/i }));
    fireEvent.change(getByLabelText(/Nombre de Empresa o Personal \*/i), { target: { value: 'ACME S.A.' } });

    // Do NOT upload a new logo; clicking save should trigger remove of old logo
    fireEvent.click(getByRole('button', { name: /Guardar y Finalizar/i }));

    await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled());
    await waitFor(() => expect(storageFrom.remove).toHaveBeenCalled());

    // upsert should be called and include null logo_url
    await waitFor(() => expect(usersTable.upsert).toHaveBeenCalled());
    const upsertPayload = usersTable.upsert.mock.calls[0][0];
    expect(upsertPayload.logo_url).toBe(null);

    // ensure success flow (banner + navigate)
    const bannerModule = require('../../shared/components/display/banners/BannerContext');
    expect(bannerModule.__mockShowBanner.showBanner).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    expect(mockNavigate).toHaveBeenCalled();
  });

  test('shows error when supabase user has no email', async () => {
    // make getUser return a user without email
    if (!supabase.auth) supabase.auth = {};
    supabase.auth.getUser = jest.fn().mockResolvedValue({ data: { user: { id: 'user-1', email: undefined } }, error: null });

    const { getByRole, getByLabelText } = renderWithProviders(<Onboarding />);

    fireEvent.click(getByRole('button', { name: /Soy Proveedor/i }));
    fireEvent.change(getByLabelText(/Nombre de Empresa o Personal \*/i), { target: { value: 'ACME S.A.' } });

    fireEvent.click(getByRole('button', { name: /Guardar y Finalizar/i }));

    const bannerModule = require('../../shared/components/display/banners/BannerContext');
    await waitFor(() => expect(bannerModule.__mockShowBanner.showBanner).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' })));
    expect(usersTable.upsert).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('shows error when removing old logo fails', async () => {
    // existing profile with logo and remove fails
    usersTable.single.mockResolvedValue({ data: { logo_url: 'https://cdn.test/user-logos/user-1/logo.png' }, error: null });
    storageFrom.remove.mockResolvedValue({ error: { message: 'remove failed' } });

    const { getByRole, getByLabelText } = renderWithProviders(<Onboarding />);

    fireEvent.click(getByRole('button', { name: /Soy Proveedor/i }));
    fireEvent.change(getByLabelText(/Nombre de Empresa o Personal \*/i), { target: { value: 'ACME S.A.' } });

    // Do NOT upload a new logo; clicking save should attempt remove and fail
    fireEvent.click(getByRole('button', { name: /Guardar y Finalizar/i }));

    const bannerModule = require('../../shared/components/display/banners/BannerContext');
    await waitFor(() => expect(storageFrom.remove).toHaveBeenCalled());
    await waitFor(() => expect(bannerModule.__mockShowBanner.showBanner).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' })));
    expect(usersTable.upsert).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('uploads new logo and does not remove existing logo when replacing', async () => {
    // existing profile with logo but user uploads a new one
    usersTable.single.mockResolvedValue({ data: { logo_url: 'https://cdn.test/user-logos/user-1/logo.png' }, error: null });
    storageFrom.upload.mockResolvedValue({ error: null, data: { path: 'user-1/logo.png' } });
    storageFrom.getPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn.test/user-logos/user-1/newlogo.png' } });

    const { getByRole, getByLabelText, container } = renderWithProviders(<Onboarding />);

    fireEvent.click(getByRole('button', { name: /Soy Proveedor/i }));
    fireEvent.change(getByLabelText(/Nombre de Empresa o Personal \*/i), { target: { value: 'ACME S.A.' } });

    const input = container.querySelector('#logo-upload');
    const goodFile = new File([new ArrayBuffer(100)], 'logo.png', { type: 'image/png' });
    Object.defineProperty(goodFile, 'size', { value: 1024 });
    fireEvent.change(input, { target: { files: [goodFile] } });

    fireEvent.click(getByRole('button', { name: /Guardar y Finalizar/i }));

    await waitFor(() => expect(storageFrom.upload).toHaveBeenCalled());
    expect(storageFrom.remove).not.toHaveBeenCalled();

    await waitFor(() => expect(usersTable.upsert).toHaveBeenCalled());
    const upsertPayload = usersTable.upsert.mock.calls[0][0];
    expect(upsertPayload.logo_url).toBe('https://cdn.test/user-logos/user-1/newlogo.png');

    const bannerModule = require('../../shared/components/display/banners/BannerContext');
    expect(bannerModule.__mockShowBanner.showBanner).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    expect(mockNavigate).toHaveBeenCalled();
  });

  test('shows banner/error when supabase.auth.getUser returns error', async () => {
    // make getUser return an error
    if (!supabase.auth) supabase.auth = {};
    supabase.auth.getUser = jest.fn().mockResolvedValue({ data: { user: undefined }, error: { message: 'Auth boom' } });

    const { getByRole, getByLabelText } = renderWithProviders(<Onboarding />);

    fireEvent.click(getByRole('button', { name: /Soy Proveedor/i }));
    fireEvent.change(getByLabelText(/Nombre de Empresa o Personal \*/i), { target: { value: 'ACME S.A.' } });

    fireEvent.click(getByRole('button', { name: /Guardar y Finalizar/i }));

    const bannerModule = require('../../shared/components/display/banners/BannerContext');
    await waitFor(() => expect(bannerModule.__mockShowBanner.showBanner).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' })));
    expect(usersTable.upsert).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('handles missing supabase user (shows console error)', async () => {
    // make getUser return no user
    if (!supabase.auth) supabase.auth = {};
    supabase.auth.getUser = jest
      .fn()
      .mockResolvedValue({ data: { user: null }, error: null });

    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    try {
      const { getByText, getByLabelText } = renderWithProviders(<Onboarding />);

      // select provider and fill name
      fireEvent.click(getByText(/Soy Proveedor/i));
      const nameField = getByLabelText(/Nombre de Empresa o Personal \*/i);
      fireEvent.change(nameField, { target: { value: 'ACME S.A.' } });

      // Click save
      const saveBtn = getByText(/Guardar y Finalizar/i);
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
        // At least one of the calls should mention 'Error al actualizar el perfil' or user not found
        const calls = consoleSpy.mock.calls.flat().join(' ');
        expect(calls).toMatch(
          /Usuario no encontrado|Error al actualizar el perfil/i
        );
      });
    } finally {
      consoleSpy.mockRestore();
    }
  });

  test('calls refreshSession and invalidation on success', async () => {
    const { invalidateUserProfileCache } = require('../../services/user/profileService');

    const { getByRole, getByLabelText, container } = renderWithProviders(<Onboarding />);

    // Select provider and set name and upload a logo to trigger full success path
    fireEvent.click(getByRole('button', { name: /Soy Proveedor/i }));
    fireEvent.change(getByLabelText(/Nombre de Empresa o Personal \*/i), { target: { value: 'ACME S.A.' } });

    const input = container.querySelector('#logo-upload');
    const goodFile = new File([new ArrayBuffer(100)], 'logo.png', { type: 'image/png' });
    Object.defineProperty(goodFile, 'size', { value: 1024 });
    fireEvent.change(input, { target: { files: [goodFile] } });

    fireEvent.click(getByRole('button', { name: /Guardar y Finalizar/i }));

    // wait for the full flow to complete
    await waitFor(() => expect(supabase.auth.refreshSession).toHaveBeenCalled());
    expect(invalidateUserProfileCache).toHaveBeenCalledWith('user-1');
    expect(mockRefreshUserProfile).toHaveBeenCalled();
  });

  test('blocks save and logs error when factura selected but billing fields incomplete', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const { getByRole, getByLabelText, getByTestId } = renderWithProviders(<Onboarding />);

      fireEvent.click(getByRole('button', { name: /Soy Proveedor/i }));
      fireEvent.change(getByLabelText(/Nombre de Empresa o Personal \*/i), { target: { value: 'ACME S.A.' } });

      // Select factura but leave billing fields empty
      fireEvent.click(getByTestId('select-factura'));

      // Wait for billing form to appear so component state updates
      await waitFor(() => expect(getByTestId('billing-form')).toBeTruthy());

      // The Save button should remain disabled because billing fields are incomplete
      const saveBtn = getByRole('button', { name: /Guardar y Finalizar/i });
      expect(saveBtn).toBeDisabled();
      // And nothing should have been upserted or navigated
      expect(usersTable.upsert).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    } finally {
      consoleSpy.mockRestore();
    }
  });

  test('handles existing logo_url without user-logos/ gracefully', async () => {
    // existing profile with logo URL that doesn't match expected path
    usersTable.single.mockResolvedValue({ data: { logo_url: 'https://cdn.test/otherpath/logo.png' }, error: null });

    const { getByRole, getByLabelText } = renderWithProviders(<Onboarding />);

    fireEvent.click(getByRole('button', { name: /Soy Proveedor/i }));
    fireEvent.change(getByLabelText(/Nombre de Empresa o Personal \*/i), { target: { value: 'ACME S.A.' } });

    // Do NOT upload a new logo; clicking save should not throw and should upsert
    fireEvent.click(getByRole('button', { name: /Guardar y Finalizar/i }));

    await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled());
    // remove should not be called since path couldn't be parsed
    expect(storageFrom.remove).not.toHaveBeenCalled();
    await waitFor(() => expect(usersTable.upsert).toHaveBeenCalled());
    const bannerModule = require('../../shared/components/display/banners/BannerContext');
    expect(bannerModule.__mockShowBanner.showBanner).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
  });
});
