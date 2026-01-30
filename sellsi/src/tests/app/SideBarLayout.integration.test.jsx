import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock UnifiedAuthProvider so LayoutProvider's useAuth won't throw
jest.mock('../../infrastructure/providers/UnifiedAuthProvider', () => ({ useAuth: jest.fn(), useRole: jest.fn() }));
import { useAuth, useRole } from '../../infrastructure/providers/UnifiedAuthProvider';


import { LayoutProvider, useLayout } from '../../infrastructure/providers/LayoutProvider';
import { MemoryRouter } from 'react-router-dom';
import SideBar from '../../shared/components/navigation/SideBar/SideBar';

const Reader = () => {
  const { currentSideBarWidth, sideBarCollapsed } = useLayout();
  return (
    <div>
      <div data-testid="width">{JSON.stringify(currentSideBarWidth)}</div>
      <div data-testid="collapsed">{String(sideBarCollapsed)}</div>
    </div>
  );
};

describe('SideBar + LayoutProvider integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Provide a logged-in session so SideBar renders
    const authVal = { session: { user: { id: 'u-1' } }, userProfile: { main_supplier: true } };
    useAuth.mockReturnValue(authVal);
    useRole.mockReturnValue({ currentAppRole: 'supplier', isDashboardRoute: true, isBuyer: false, handleRoleChange: () => {} });
  });

  test('toggling collapse does not overwrite canonical provider width', async () => {
    render(
      <MemoryRouter>
        <LayoutProvider>
          <SideBar role="supplier" />
          <Reader />
        </LayoutProvider>
      </MemoryRouter>
    );

    const widthNode = await screen.findByTestId('width');
    const before = widthNode.textContent;

    // The toggle button has aria-label 'Contraer menú' when expanded
    const toggleButton = screen.getByRole('button', { name: /Contraer menú|Expandir menú/ });

    // Collapse
    fireEvent.click(toggleButton);

    // After collapse, provider width must remain the same canonical expanded value
    const afterCollapse = screen.getByTestId('width').textContent;
    expect(afterCollapse).toBe(before);

    // Expand back
    const toggle2 = screen.getByRole('button', { name: /Contraer menú|Expandir menú/ });
    fireEvent.click(toggle2);

    // No change in canonical width
    expect(screen.getByTestId('width').textContent).toBe(before);
  });

  test('rapid toggles do not cause maximum update depth or changes', async () => {
    render(
      <MemoryRouter>
        <LayoutProvider>
          <SideBar role="supplier" />
          <Reader />
        </LayoutProvider>
      </MemoryRouter>
    );

    const before = screen.getByTestId('width').textContent;
    const toggleButton = screen.getByRole('button', { name: /Contraer menú|Expandir menú/ });

    // Rapid toggles
    for (let i = 0; i < 10; i++) {
      fireEvent.click(toggleButton);
    }

    expect(screen.getByTestId('width').textContent).toBe(before);
  });
});
