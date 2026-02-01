import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { TopBarView } from '../../shared/components/navigation/TopBar/TopBarView';

describe('TopBarView - presentational behaviors and edge cases', () => {
  const baseProps = {
    isLoggedIn: false,
    isBuyerRole: false,
    desktopNavLinks: null,
    desktopRightContent: null,
    mobileMenuItems: [],
    mobileMenuAnchor: null,
    onOpenMobileMenu: jest.fn(),
    onCloseMobileMenu: jest.fn(),
    profileAnchor: null,
    onOpenProfileMenu: jest.fn(),
    onCloseProfileMenu: jest.fn(),
    paddingX: { xs: 2 },
    mobileSearchInputProps: {},
    onMobileSearchButton: jest.fn(),
    mobileSearchInputRef: { current: null },
    notifBellCount: 0,
    onOpenNotif: jest.fn(),
    notifMenuOpen: false,
    onLogoClick: jest.fn(),
    onGoToProfile: jest.fn(),
    onLogout: jest.fn(),
    openLoginModal: false,
    openRegisterModal: false,
    onCloseLoginModal: jest.fn(),
    onCloseRegisterModal: jest.fn(),
    onLoginToRegister: jest.fn(),
    profileMenuButton: <div data-testid="profile-btn" />, 
  };

  test('logo is keyboard accessible and triggers onLogoClick via Enter', async () => {
    const onLogoClick = jest.fn();
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <TopBarView {...baseProps} onLogoClick={onLogoClick} />
      </MemoryRouter>
    );

    const logo = screen.getByLabelText(/Ir a inicio/i);
    expect(logo).toBeInTheDocument();

    // Simulate keyboard Enter via userEvent for realistic behavior
    logo.focus();
    await user.keyboard('{Enter}');
    expect(onLogoClick).toHaveBeenCalled();
  });

  test('mobile search is not rendered when not logged in and buyer role false', () => {
    render(
      <MemoryRouter>
        <TopBarView {...baseProps} />
      </MemoryRouter>
    );

    // mobile search region uses data-component attribute when present
    expect(screen.queryByTestId('TopBar.mobileSearch')).not.toBeInTheDocument();
  });

  test('notification bell shows aria labels and toggles via click', async () => {
    const onOpenNotif = jest.fn();
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <TopBarView {...baseProps} isLoggedIn={true} notifBellCount={3} onOpenNotif={onOpenNotif} />
      </MemoryRouter>
    );

    const bell = screen.getByLabelText(/Abrir notificaciones/i);
    expect(bell).toBeInTheDocument();
    await user.click(bell);
    expect(onOpenNotif).toHaveBeenCalled();
  });

  test('profile menu buttons are present in mobile area when provided', () => {
    render(
      <MemoryRouter>
        <TopBarView
          {...baseProps}
          isLoggedIn={true}
          mobileMenuItems={[<div data-testid="profile-menu" key="profile" />]}
          mobileMenuAnchor={{}} // simulate open mobile menu
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId('profile-menu')).toBeInTheDocument();
  });

  test('mobile search is rendered when logged in and buyer role true', () => {
    render(
      <MemoryRouter>
        <TopBarView {...baseProps} isLoggedIn={true} isBuyerRole={true} />
      </MemoryRouter>
    );

    // The mobile search is represented by a text input with aria-label 'Buscar productos'
    expect(screen.getByLabelText(/Buscar productos/i)).toBeInTheDocument();
  });

  test('mobile menu button calls onOpenMobileMenu handler', async () => {
    const onOpenMobileMenu = jest.fn();
    render(
      <MemoryRouter>
        <TopBarView {...baseProps} onOpenMobileMenu={onOpenMobileMenu} isLoggedIn={true} />
      </MemoryRouter>
    );

    const mobileBtn = screen.getByLabelText(/Abrir menú móvil/i);
    await userEvent.click(mobileBtn);
    expect(onOpenMobileMenu).toHaveBeenCalled();
  });

  test('notification bell triggers onOpenNotif on click and keyboard', async () => {
    const onOpenNotif = jest.fn();
    render(
      <MemoryRouter>
        <TopBarView {...baseProps} isLoggedIn={true} notifBellCount={2} onOpenNotif={onOpenNotif} />
      </MemoryRouter>
    );

    const bell = screen.getByLabelText(/Abrir notificaciones/i);
    // initial aria-expanded is false
    expect(bell).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(bell);
    expect(onOpenNotif).toHaveBeenCalledTimes(1);

    // keyboard activation (Enter) should also trigger
    bell.focus();
    await userEvent.keyboard('{Enter}');
    expect(onOpenNotif).toHaveBeenCalledTimes(2);
  });

  test('renders safely when optional props are missing', () => {
    const minimal = { ...baseProps };
    delete minimal.desktopNavLinks;
    delete minimal.desktopRightContent;
    minimal.mobileMenuItems = [];

    render(
      <MemoryRouter>
        <TopBarView {...minimal} />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/Ir a inicio/i)).toBeInTheDocument();
  });
});
