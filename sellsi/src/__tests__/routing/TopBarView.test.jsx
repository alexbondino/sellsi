import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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

  test('logo is keyboard accessible and triggers onLogoClick via Enter', () => {
    const onLogoClick = jest.fn();
    render(
      <MemoryRouter>
        <TopBarView {...baseProps} onLogoClick={onLogoClick} />
      </MemoryRouter>
    );

    const logo = screen.getByLabelText(/Ir a inicio/i);
    expect(logo).toBeInTheDocument();

    // Simulate keyboard Enter
    fireEvent.keyDown(logo, { key: 'Enter', code: 'Enter' });
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

  test('notification bell shows aria labels and toggles via click', () => {
    const onOpenNotif = jest.fn();
    render(
      <MemoryRouter>
        <TopBarView {...baseProps} isLoggedIn={true} notifBellCount={3} onOpenNotif={onOpenNotif} />
      </MemoryRouter>
    );

    const bell = screen.getByLabelText(/Abrir notificaciones/i);
    expect(bell).toBeInTheDocument();
    fireEvent.click(bell);
    expect(onOpenNotif).toHaveBeenCalled();
  });

  test('profile menu buttons are present in mobile area when provided', () => {
    render(
      <MemoryRouter>
        <TopBarView {...baseProps} isLoggedIn={true} profileMenuButton={<div data-testid="profile-menu" />} />
      </MemoryRouter>
    );

    expect(screen.getByTestId('profile-menu')).toBeInTheDocument();
  });
});
