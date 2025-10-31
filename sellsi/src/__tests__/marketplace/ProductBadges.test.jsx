import React from 'react';
import { render, screen } from '@testing-library/react';
import ProductBadges, { createProductBadges } from '../../shared/components/display/product-card/ProductBadges';

describe('ProductBadges', () => {
  test('shows Nuevo badge when createdAt is recent', () => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const recent = new Date(now - (oneDayMs * 1)).toISOString();
  const product = { id: 'p1', createdAt: recent, activo: true };
  const badges = createProductBadges(product);
  render(<ProductBadges badges={badges} showBadges />);
  expect(screen.getByText(/nuevo/i)).toBeInTheDocument();
  });

  test('does not show Nuevo badge when createdAt is old', () => {
    const now = Date.now();
    const tenDaysMs = 24 * 60 * 60 * 1000 * 10;
    const old = new Date(now - tenDaysMs).toISOString();
  const product = { id: 'p2', createdAt: old, activo: true };
  const badges = createProductBadges(product);
  render(<ProductBadges badges={badges} showBadges />);
  expect(screen.queryByText(/nuevo/i)).toBeNull();
  });

  test('does not error when product has no createdAt', () => {
  const product = { id: 'p3', activo: true };
  const badges = createProductBadges(product);
  render(<ProductBadges badges={badges} showBadges />);
  expect(screen.queryByText(/nuevo/i)).toBeNull();
  });
});