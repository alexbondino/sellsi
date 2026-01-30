import {
  FINANCING_STATES,
  getAvailableActions,
  stateMatchesFilter,
  getStateFilterCategory,
  getApprovedFinancingStatus,
  getApprovedFinancingChip,
  approvedFinancingMatchesFilter,
  FILTER_CATEGORIES,
  APPROVED_FILTER_CATEGORIES,
} from '../../../shared/utils/financing/financingStates';

describe('financingStates utilities', () => {
  test('getAvailableActions returns expected actions by role', () => {
    expect(getAvailableActions(FINANCING_STATES.PENDING_SUPPLIER_REVIEW, 'supplier')).toEqual(expect.arrayContaining(['approve', 'reject']));
    expect(getAvailableActions(FINANCING_STATES.PENDING_SUPPLIER_REVIEW, 'buyer')).toEqual([]);

    expect(getAvailableActions(FINANCING_STATES.BUYER_SIGNATURE_PENDING, 'buyer')).toEqual(expect.arrayContaining(['sign', 'cancel']));
    expect(getAvailableActions(FINANCING_STATES.SUPPLIER_SIGNATURE_PENDING, 'supplier')).toEqual(expect.arrayContaining(['sign', 'cancel']));
  });

  test('stateMatchesFilter includes proper states for IN_PROCESS', () => {
    expect(stateMatchesFilter(FINANCING_STATES.PENDING_SUPPLIER_REVIEW, FILTER_CATEGORIES.IN_PROCESS)).toBe(true);
    expect(stateMatchesFilter(FINANCING_STATES.REJECTED_BY_SELLSI, FILTER_CATEGORIES.IN_PROCESS)).toBe(false);
  });

  test('getStateFilterCategory maps states to categories', () => {
    const cat = getStateFilterCategory(FINANCING_STATES.REJECTED_BY_SUPPLIER);
    expect(cat.category).toBe(FILTER_CATEGORIES.REJECTED);
    expect(cat.label.toLowerCase()).toContain('rechaz');
  });

  test('getApprovedFinancingStatus: non-expired returns approved', () => {
    const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const f = { status: FINANCING_STATES.APPROVED_BY_SELLSI, expires_at: future, amount_used: 100, amount_paid: 0 };
    expect(getApprovedFinancingStatus(f)).toBe(FINANCING_STATES.APPROVED_BY_SELLSI);
  });

  test('getApprovedFinancingStatus: expired and paid becomes PAID', () => {
    const past = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const f = { status: FINANCING_STATES.APPROVED_BY_SELLSI, expires_at: past, amount_used: 100, amount_paid: 100 };
    expect(getApprovedFinancingStatus(f)).toBe(FINANCING_STATES.PAID);
  });

  test('getApprovedFinancingStatus: expired with debt becomes EXPIRED', () => {
    const past = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const f = { status: FINANCING_STATES.APPROVED_BY_SELLSI, expires_at: past, amount_used: 100, amount_paid: 50 };
    expect(getApprovedFinancingStatus(f)).toBe(FINANCING_STATES.EXPIRED);
  });

  test('getApprovedFinancingChip: paused overrides normal chip', () => {
    const f = { paused: true };
    expect(getApprovedFinancingChip(f)).toEqual(expect.objectContaining({ label: 'Pausado', color: 'warning' }));
  });

  test('approvedFinancingMatchesFilter works for all/active/expired/paid', () => {
    const today = new Date();
    const expiresFuture = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const expiresPast = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const active = { status: FINANCING_STATES.APPROVED_BY_SELLSI, expires_at: expiresFuture, amount_used: 100, amount_paid: 0 };
    const expired = { status: FINANCING_STATES.APPROVED_BY_SELLSI, expires_at: expiresPast, amount_used: 100, amount_paid: 0 };
    const paid = { status: FINANCING_STATES.APPROVED_BY_SELLSI, expires_at: expiresPast, amount_used: 100, amount_paid: 100 };

    expect(approvedFinancingMatchesFilter(active, APPROVED_FILTER_CATEGORIES.ACTIVE)).toBe(true);
    expect(approvedFinancingMatchesFilter(expired, APPROVED_FILTER_CATEGORIES.EXPIRED)).toBe(true);
    expect(approvedFinancingMatchesFilter(paid, APPROVED_FILTER_CATEGORIES.PAID)).toBe(true);
    expect(approvedFinancingMatchesFilter(active, APPROVED_FILTER_CATEGORIES.ALL)).toBe(true);
  });
});
