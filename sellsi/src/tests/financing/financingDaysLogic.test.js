import {
  getWarningThreshold,
  calculateDaysRemaining,
  getFinancingStatus,
  getFinancingDaysStatus,
} from '../../../shared/utils/financingDaysLogic';

describe('financingDaysLogic', () => {
  test('getWarningThreshold returns expected thresholds on boundaries', () => {
    expect(getWarningThreshold(1)).toBe(1);
    expect(getWarningThreshold(7)).toBe(1);
    expect(getWarningThreshold(8)).toBe(3);
    expect(getWarningThreshold(15)).toBe(3);
    expect(getWarningThreshold(16)).toBe(7);
    expect(getWarningThreshold(44)).toBe(7);
    expect(getWarningThreshold(45)).toBe(10);
    expect(getWarningThreshold(100)).toBe(10);
    expect(getWarningThreshold(0)).toBe(0);
  });

  test('calculateDaysRemaining never returns negative', () => {
    const today = new Date();
    const approvedAt = new Date(today.getTime() - 100 * 24 * 60 * 60 * 1000); // 100 days ago
    expect(calculateDaysRemaining(approvedAt, 30)).toBe(0);
  });

  test('calculateDaysRemaining respects exact calculation', () => {
    const daysPassed = 5;
    const approvedAt = new Date(Date.now() - daysPassed * 24 * 60 * 60 * 1000);
    expect(calculateDaysRemaining(approvedAt, 7)).toBe(2);
    expect(calculateDaysRemaining(approvedAt.toISOString(), 7)).toBe(2);
  });

  test('getFinancingStatus returns error/warning/success at correct thresholds', () => {
    // Expired
    expect(getFinancingStatus(0, 30)).toBe('error');

    // Warning when <= threshold
    expect(getFinancingStatus(1, 7)).toBe('warning'); // threshold 1
    expect(getFinancingStatus(1, 10)).toBe('warning'); // threshold 7 -> 1 <= 7

    // Success otherwise
    expect(getFinancingStatus(10, 30)).toBe('success');
  });

  test('getFinancingDaysStatus integrates calculation and status', () => {
    const approvedAt = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000); // 6 days ago
    const { daysRemaining, status } = getFinancingDaysStatus(approvedAt, 7);

    // 7 - 6 = 1 day remaining, threshold for 7 days term is 1 -> warning
    expect(daysRemaining).toBe(1);
    expect(status).toBe('warning');
  });
});
