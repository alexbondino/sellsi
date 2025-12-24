import React from 'react';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// Robust mock for Zustand cart store (selector-aware)
const mockCartStore = jest.fn(() => ({ cart: [] }));
jest.mock('../../shared/stores/cart/cartStore', () => ({
  __esModule: true,
  default: (selector) => {
    const state = { items: [], cart: [], length: 0, ...mockCartStore() };
    return typeof selector === 'function' ? selector(state) : state;
  }
}));

// Mock providers + hooks that TopBarContainer depends on to avoid rendering errors
jest.mock('../../infrastructure/providers', () => ({
  useAuth: () => ({ session: { user: { id: 'u1' } }, needsOnboarding: false, loadingUserStatus: false, refreshUserProfile: jest.fn() }),
  useRole: () => ({ isRoleLoading: false, isBuyer: true, handleRoleChange: jest.fn() }),
}));

jest.mock('../../shared/components/navigation/TopBar/hooks/useAuthModalBus', () => ({
  useAuthModalBus: () => ({
    loginOpen: false,
    registerOpen: false,
    openLogin: jest.fn(),
    openRegister: jest.fn(),
    closeLogin: jest.fn(),
    closeRegister: jest.fn(),
    transitionLoginToRegister: jest.fn(),
  }),
}));

jest.mock('../../shared/components/navigation/TopBar/hooks/useRoleFromRoute', () => ({
  useRoleFromRoute: () => ({ currentRole: 'buyer' }),
}));

jest.mock('../../shared/components/navigation/TopBar/hooks/useMarketplaceSearch', () => ({
  useMarketplaceSearch: () => ({ term: '', setTerm: jest.fn(), isOnBuyerMarketplace: false, inputProps: { value: '', onChange: jest.fn(), onKeyDown: jest.fn() }, submit: jest.fn() }),
}));

jest.mock('../../shared/contexts/MarketplaceSearchContext', () => ({
  useMarketplaceSearchBus: () => ({ updateExternalSearchTerm: jest.fn() }),
}));

jest.mock('../../domains/notifications/components/NotificationProvider', () => ({
  useNotificationsContext: () => ({ unreadCount: 0, notifications: [], markAsRead: jest.fn(), setActiveTab: jest.fn(), activeTab: 'all' }),
}));

const TopBarContainer = require('../../shared/components/navigation/TopBar/TopBarContainer').default;

describe('TopBarContainer - logic checks', () => {
  let originalUseNavigate;
  beforeEach(() => {
    // Spy on useNavigate so we can assert navigation path
    originalUseNavigate = jest.requireActual('react-router-dom').useNavigate;
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('logo click navigates to marketplace when role buyer', async () => {
    // Render a small router tree that shows current location so we can assert navigate() effects
    const LocationDisplay = () => {
      const { useLocation } = require('react-router-dom');
      const loc = useLocation();
      return <div data-testid="location">{loc.pathname + loc.search}</div>;
    };

    render(
      <MemoryRouter initialEntries={["/start"]}>
        <TopBarContainer session={{ user: { id: 'u1' } }} isBuyer={true} logoUrl="/logo.png" onNavigate={jest.fn()} onRoleChange={jest.fn()} />
        <LocationDisplay />
      </MemoryRouter>
    );

    const logo = screen.getByLabelText(/Ir a inicio/i);
    await userEvent.click(logo);

    // Expect memory location to reflect buyer marketplace route
    expect(screen.getByTestId('location').textContent).toBe('/buyer/marketplace');
  });

  test('logout when logged in navigates to home', async () => {
    const LocationDisplay = () => {
      const { useLocation } = require('react-router-dom');
      const loc = useLocation();
      return <div data-testid="location">{loc.pathname + loc.search}</div>;
    };

    // Render as logged-in user so mobile menu contains 'Cerrar sesión'
    render(
      <MemoryRouter initialEntries={["/start"]}>
        <TopBarContainer session={{ user: { id: 'u1' } }} isBuyer={false} logoUrl="/logo.png" />
        <LocationDisplay />
      </MemoryRouter>
    );

    // Open mobile menu and click 'Cerrar sesión'
    const mobileBtn = screen.getByLabelText(/Abrir menú móvil/i);
    await userEvent.click(mobileBtn);

    const logoutItem = await screen.findByText(/Cerrar sesión/i);
    await userEvent.click(logoutItem);

    // Should navigate to home (logout handler is async, wait for location to update)
    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/'));
  });

  test('cart badge shows number of items when present', async () => {
    // Override the cart store to simulate items present (selector expects `items`)
    mockCartStore.mockReturnValue({ items: [{ id: 1 }, { id: 2 }, { id: 3 }] });

    render(
      <MemoryRouter>
        <TopBarContainer session={{ user: { id: 'u1' } }} isBuyer={true} logoUrl="/logo.png" />
      </MemoryRouter>
    );

    // Find the tooltip-wrapped cart button
    const cartBtn = screen.getByLabelText(/Carrito/i);
    const { getByText } = within(cartBtn);

    // Badge should show the number 3
    expect(getByText('3')).toBeInTheDocument();
  });
});
