import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import PrivateRoute from '../../workspaces/auth/guards/components/PrivateRoute';

describe('PrivateRoute - extra edge cases', () => {
  test('respects custom redirectTo prop', () => {
    render(
      <MemoryRouter initialEntries={["/secret"]}>
        <Routes>
          <Route
            path="/secret"
            element={
              <PrivateRoute isAuthenticated={false} needsOnboarding={false} loading={false} redirectTo="/custom-login">
                <div>secret</div>
              </PrivateRoute>
            }
          />
          <Route path="/custom-login" element={<div>custom-login</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('custom-login')).toBeInTheDocument();
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
  });
});
