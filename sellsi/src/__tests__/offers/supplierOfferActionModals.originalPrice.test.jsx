import React from 'react';
import { render, screen, within } from '@testing-library/react';
import SupplierOfferActionModals from '../../workspaces/supplier/my-offers/components/SupplierOfferActionModals';

// NOTE: avoid mirror-formatting logic (Intl) in tests to be CI-safe; use explicit literals
describe('SupplierOfferActionModals - Original vs Offered Price', () => {
  const baseBuyer = { id: 'b1', name: 'Comprador Test' };

  const renderModal = (partial = {}) => {
    const def = {
      id: 'offer_x',
      price: 18000, // precio ofertado inferior al original
      quantity: 10,
      buyer: baseBuyer,
      product: {
        id: 'p1',
        name: 'Producto Demo',
        price: 25000,
        previousPrice: 25000,
        stock: 40,
      },
    };
    const offer = {
      ...def,
      ...partial,
      product: { ...def.product, ...(partial.product || {}) },
    };
    render(
      <SupplierOfferActionModals
        open
        mode="accept"
        offer={offer}
        onClose={() => {}}
      />
    );
    return offer;
  };

  test('muestra precio original distinto al precio ofertado cuando previousPrice > offer.price (literal check)', () => {
    const offer = renderModal();
    // Scope to modal to avoid accidental matches elsewhere
    const modal = screen.getByRole('dialog');
    expect(modal).toBeVisible();
    const line = within(modal).getByTestId('original-unit-price-line');

    // Use literal strings to avoid Intl locale differences in CI
    expect(line).toHaveTextContent('$25.000');
    expect(line).not.toHaveTextContent('$18.000');
  });

  test('cuando falta previousPrice usa product.price como original (literal check)', () => {
    renderModal({ product: { previousPrice: null } });
    const modal = screen.getByRole('dialog');
    expect(modal).toBeVisible();
    const line = within(modal).getByTestId('original-unit-price-line');
    expect(line).toHaveTextContent('$25.000');
  });

  test('stock se muestra desde product.stock o productqty (scoped)', () => {
    renderModal({ product: { stock: null, productqty: 55 } });
    const modal = screen.getByRole('dialog');
    expect(modal).toBeVisible();
    const stockLine = within(modal).getByTestId('stock-line');
    expect(stockLine).toHaveTextContent('55');
  });

  test('usa offer.current_stock cuando está presente (scoped)', () => {
    renderModal({ current_stock: 5 });
    const modal = screen.getByRole('dialog');
    expect(modal).toBeVisible();
    const stockLine = within(modal).getByTestId('stock-line');
    expect(stockLine).toHaveTextContent('5');
  });

  test('muestra "—" cuando stock legacy es 999999 (scoped & visible)', () => {
    renderModal({ product: { stock: 999999 } });
    const modal = screen.getByRole('dialog');
    expect(modal).toBeVisible();
    const stockLine = within(modal).getByTestId('stock-line');
    expect(stockLine).toHaveTextContent('—');
  });

  test('prefiere offer.base_price_at_offer sobre product.previousPrice (literal check, scoped)', () => {
    renderModal({ base_price_at_offer: 22000, product: { previousPrice: 25000 } });
    const modal = screen.getByRole('dialog');
    expect(modal).toBeVisible();
    const line = within(modal).getByTestId('original-unit-price-line');
    expect(line).toHaveTextContent('$22.000');
    expect(line).not.toHaveTextContent('$25.000');
  });

  test('muestra "—" si no hay precio original disponible (scoped & visible)', () => {
    renderModal({ product: { previousPrice: null, base_price: null, price: null, price_tiers: [] } });
    const modal = screen.getByRole('dialog');
    expect(modal).toBeVisible();
    const line = within(modal).getByTestId('original-unit-price-line');
    expect(line).toHaveTextContent('—');
  });

  test('maneja previousPrice como string numérico (literal check)', () => {
    renderModal({ product: { previousPrice: '25000' } });
    const modal = screen.getByRole('dialog');
    expect(modal).toBeVisible();
    const line = within(modal).getByTestId('original-unit-price-line');
    expect(line).toHaveTextContent('$25.000');
  });
});
