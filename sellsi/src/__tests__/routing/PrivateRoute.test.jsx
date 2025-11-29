import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Import the component under test
import PrivateRoute from '../../workspaces/auth/guards/components/PrivateRoute';

describe('PrivateRoute - routing rules and edge cases', () => {
  test('shows loading UI when loading=true', () => {
    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route
            path="/protected"
            element={
              <PrivateRoute isAuthenticated={false} needsOnboarding={false} loading={true}>
                <div>protected</div>
              </PrivateRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    // The PrivateRoute loading UI includes the text 'Verificando sesión...'
    expect(screen.getByText(/Verificando sesión/i)).toBeInTheDocument();
  });

  test('redirects to login when not authenticated', () => {
    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route
            path="/protected"
            element={
              <PrivateRoute isAuthenticated={false} needsOnboarding={false} loading={false}>
                <div>protected</div>
              </PrivateRoute>
            }
          />
          <Route path="/login" element={<div>login</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('login')).toBeInTheDocument();
    expect(screen.queryByText('protected')).not.toBeInTheDocument();
  });

  test('authenticated user already onboarded is redirected away from /onboarding to home', () => {
    render(
      <MemoryRouter initialEntries={["/onboarding"]}>
        <Routes>
          <Route
            path="/onboarding"
            element={
              <PrivateRoute isAuthenticated={true} needsOnboarding={false} loading={false}>
                <div>onboarding</div>
              </PrivateRoute>
            }
          />
          <Route path="/" element={<div>home</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Should redirect to home immediately
    expect(screen.getByText('home')).toBeInTheDocument();
    expect(screen.queryByText('onboarding')).not.toBeInTheDocument();
  });

  test('authenticated user that needs onboarding is forced to /onboarding when accessing other routes', () => {
    render(
      <MemoryRouter initialEntries={["/buyer/cart"]}>
        <Routes>
          <Route
            path="/buyer/cart"
            element={
              <PrivateRoute isAuthenticated={true} needsOnboarding={true} loading={false}>
                <div>buyercart</div>
              </PrivateRoute>
            }
          />
          <Route path="/onboarding" element={<div>onboarding</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('onboarding')).toBeInTheDocument();
    expect(screen.queryByText('buyercart')).not.toBeInTheDocument();
  });
});
