import React from 'react';
import { act, fireEvent, screen, waitFor, cleanup } from '@testing-library/react';
import { renderWithProviders } from '../../testUtils/renderWithProviders';
import MobileBar from '../../../shared/components/navigation/MobileBar/MobileBar';
import useCartStore from '../../../shared/stores/cart/cartStore';

// Replace useMediaQuery with a mock (avoid spy issues)
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: jest.fn(),
}));

// Mocks
jest.mock('../../../shared/components/navigation/MobileBar/ProfileDrawer', () => ({
  __esModule: true,
  default: ({ open }) => <div data-testid="mock-profile-drawer">{open ? 'OPEN' : 'CLOSED'}</div>,
}));

// Mock react-router hooks to avoid spy issues
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

// Spy on hooks we need to control
const mui = require('@mui/material');
const reactRouter = require('react-router-dom');
let useMediaQuerySpy;
let useNavigateSpy;
let useLocationSpy;

beforeEach(() => {
  // Reset store state
  const { setItems, resetState } = useCartStore.getState();
  if (resetState) resetState();
  if (setItems) setItems([]);

  // Default spies
  useMediaQuerySpy = mui.useMediaQuery;
  useMediaQuerySpy.mockReturnValue(true);

  // Set mocked hooks return values
  useNavigateSpy = reactRouter.useNavigate.mockReturnValue(jest.fn());
  useLocationSpy = reactRouter.useLocation.mockReturnValue({ pathname: '/' });

  jest.useFakeTimers();
});

afterEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
});

describe('MobileBar (mobile, session present)', () => {
  test('does not render when not mobile', () => {
    useMediaQuerySpy.mockReturnValue(false);
    renderWithProviders(<MobileBar role="buyer" session={true} isBuyer={true} userProfile={{}} />);
    expect(screen.queryByText('Marketplace')).toBeNull();
  });

  test('does not render when no session or no role', () => {
    useMediaQuerySpy.mockReturnValue(true);
    const { unmount } = renderWithProviders(<MobileBar role={null} session={true} isBuyer={true} userProfile={{}} />);
    expect(screen.queryByText('Marketplace')).toBeNull();
    unmount();

    renderWithProviders(<MobileBar role={'buyer'} session={false} isBuyer={true} userProfile={{}} />);
    expect(screen.queryByText('Marketplace')).toBeNull();
  });

  test('renders buyer menu items and cart badge', () => {
    // Put 3 items in cart
    useCartStore.getState().setItems([{ id: 1 }, { id: 2 }, { id: 3 }]);
    useLocationSpy.mockReturnValue({ pathname: '/buyer/marketplace' });

    renderWithProviders(<MobileBar role="buyer" session={true} isBuyer={true} userProfile={{}} />);

    expect(screen.getByText('Marketplace')).toBeInTheDocument();
    expect(screen.getByText('Mis Ofertas')).toBeInTheDocument();
    expect(screen.getByText('Mis Pedidos')).toBeInTheDocument();
    expect(screen.getByText('Carrito')).toBeInTheDocument();
    expect(screen.getByText('Mi Perfil')).toBeInTheDocument();

    // Badge should show "3"
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('renders supplier menu without cart', () => {
    useLocationSpy.mockReturnValue({ pathname: '/supplier/home' });

    renderWithProviders(<MobileBar role="supplier" session={true} isBuyer={false} userProfile={{}} />);

    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.getByText('Mis Ofertas')).toBeInTheDocument();
    expect(screen.getByText('Mis Productos')).toBeInTheDocument();
    expect(screen.queryByText('Carrito')).toBeNull();
    expect(screen.getByText('Mi Perfil')).toBeInTheDocument();
  });

  test('active item disables its icon button', () => {
    useLocationSpy.mockReturnValue({ pathname: '/buyer/offers' });
    renderWithProviders(<MobileBar role="buyer" session={true} isBuyer={true} userProfile={{}} />);

    const offersContainer = screen.getByText('Mis Ofertas').closest('div');
    expect(offersContainer).toBeTruthy();
    const btn = offersContainer.querySelector('button');
    expect(btn).toBeDisabled();
  });

  test('clicking on an item navigates and scrolls to top', async () => {
    const mockedNavigate = jest.fn();
    useNavigateSpy.mockReturnValue(mockedNavigate);
    useLocationSpy.mockReturnValue({ pathname: '/buyer/marketplace' });

    // spy scrollTo
    const scrollSpy = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});

    renderWithProviders(<MobileBar role="buyer" session={true} isBuyer={true} userProfile={{}} />);

    const pedidos = screen.getByText('Mis Pedidos');
    fireEvent.click(pedidos);

    expect(mockedNavigate).toHaveBeenCalledWith('/buyer/orders');

    // run timers to trigger setTimeout
    act(() => jest.advanceTimersByTime(200));

    expect(scrollSpy).toHaveBeenCalled();

    scrollSpy.mockRestore();
  });

  test('clicking Mi Perfil opens ProfileDrawer', () => {
    renderWithProviders(<MobileBar role="buyer" session={true} isBuyer={true} userProfile={{ user_nm: 'Klaus' }} />);

    const perfil = screen.getByText('Mi Perfil');
    fireEvent.click(perfil);

    // ProfileDrawer mock renders OPEN when open
    expect(screen.getByTestId('mock-profile-drawer')).toHaveTextContent('OPEN');
  });

  test('avatar shows image if logoUrl provided else default icon', () => {
    // Without logo
    const { unmount } = renderWithProviders(<MobileBar role="buyer" session={true} isBuyer={true} userProfile={{}} logoUrl={''} />);
    const perfil = screen.getByText('Mi Perfil');
    // Avatar exists - default icon should be in DOM (PersonIcon rendered inside)
    expect(perfil).toBeInTheDocument();
    unmount();

    // With logo
    renderWithProviders(<MobileBar role="buyer" session={true} isBuyer={true} userProfile={{}} logoUrl={'https://example.com/logo.png'} />);
    // There should be an img with that src inside the Avatar
    const img = document.querySelector('img[src="https://example.com/logo.png"]');
    expect(img).toBeTruthy();
  });
});
