import { validateProfileUpdate } from '../../services/user/profileService';

describe('validateProfileUpdate (server-side parity)', () => {
  test('passes for empty payload', () => {
    const res = validateProfileUpdate({});
    expect(res.ok).toBe(true);
    expect(res.errors).toEqual({});
  });

  test('shipping region provided without commune/address fails', () => {
    const res = validateProfileUpdate({ shippingRegion: 'metropolitana' });
    expect(res.ok).toBe(false);
    expect(res.errors).toHaveProperty('shipping');
  });

  test('shipping snake_case payload also validated', () => {
    const res = validateProfileUpdate({ shipping_region: 'valparaiso', shipping_commune: '', shipping_address: ' ' });
    expect(res.ok).toBe(false);
    expect(res.errors.shipping).toMatch(/shipping commune and address/);
  });

  test('shipping with full fields passes', () => {
    const res = validateProfileUpdate({ shippingRegion: 'metropolitana', shippingCommune: 'Santiago', shippingAddress: 'Av. 1' });
    expect(res.ok).toBe(true);
  });

  test('billing business_name present but missing fields fails', () => {
    const res = validateProfileUpdate({ businessName: 'My Company' });
    expect(res.ok).toBe(false);
    expect(res.errors).toHaveProperty('billing');
  });

  test('billing snake_case present and partial fields fails', () => {
    const res = validateProfileUpdate({ business_name: 'X', billing_rut: '123' });
    expect(res.ok).toBe(false);
    expect(res.errors.billing).toMatch(/billing fields/);
  });

  test('billing with all fields passes', () => {
    const res = validateProfileUpdate({ business_name: 'X', billing_rut: '1-9', business_line: 'Retail', billing_address: 'Calle 1', billing_region: 'metropolitana', billing_commune: 'Santiago' });
    expect(res.ok).toBe(true);
  });

  test('mixed payload valid when both shipping and billing complete', () => {
    const res = validateProfileUpdate({ shipping_region: 'metropolitana', shipping_commune: 'Santiago', shipping_address: 'Av 1', business_name: 'X', billing_rut: '1-9', business_line: 'Retail', billing_address: 'Calle 1', billing_region: 'metropolitana', billing_commune: 'Santiago' });
    expect(res.ok).toBe(true);
  });
});
