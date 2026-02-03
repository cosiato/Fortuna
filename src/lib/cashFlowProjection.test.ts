import { describe, it, expect } from 'vitest';
import {
  normalizeToMonthly,
  isFlowActiveInMonth,
  calculateProjection,
  calculateMonthlyTotals,
} from './cashFlowProjection';
import type { CashFlow } from '@/types/database';

function makeCashFlow(overrides: Partial<CashFlow> = {}): CashFlow {
  return {
    id: 'test-id',
    accountId: 'account-1',
    name: 'Test Flow',
    amount: 1000,
    flowType: 'inflow',
    frequency: 'monthly',
    category: 'salary',
    startDate: '2024-01-01',
    endDate: null,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('normalizeToMonthly', () => {
  it('returns same amount for monthly frequency', () => {
    expect(normalizeToMonthly(1000, 'monthly')).toBe(1000);
  });

  it('converts weekly to monthly (weekly * 52/12)', () => {
    const result = normalizeToMonthly(100, 'weekly');
    expect(result).toBeCloseTo(433.33, 1);
  });

  it('converts yearly to monthly (yearly / 12)', () => {
    expect(normalizeToMonthly(12000, 'yearly')).toBe(1000);
  });
});

describe('isFlowActiveInMonth', () => {
  it('returns true for active flow with no end date and month after start', () => {
    const flow = makeCashFlow({ startDate: '2024-01-01', endDate: null, isActive: true });
    const monthDate = new Date(2024, 5, 1); // June 2024
    expect(isFlowActiveInMonth(flow, monthDate)).toBe(true);
  });

  it('returns true for the start month itself', () => {
    const flow = makeCashFlow({ startDate: '2024-03-15', isActive: true });
    const monthDate = new Date(2024, 2, 1); // March 2024
    expect(isFlowActiveInMonth(flow, monthDate)).toBe(true);
  });

  it('returns false for month before start date', () => {
    const flow = makeCashFlow({ startDate: '2024-06-01', isActive: true });
    const monthDate = new Date(2024, 4, 1); // May 2024
    expect(isFlowActiveInMonth(flow, monthDate)).toBe(false);
  });

  it('returns false for month after end date', () => {
    const flow = makeCashFlow({
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      isActive: true,
    });
    const monthDate = new Date(2024, 7, 1); // August 2024
    expect(isFlowActiveInMonth(flow, monthDate)).toBe(false);
  });

  it('returns true for the end month itself', () => {
    const flow = makeCashFlow({
      startDate: '2024-01-01',
      endDate: '2024-06-15',
      isActive: true,
    });
    const monthDate = new Date(2024, 5, 1); // June 2024
    expect(isFlowActiveInMonth(flow, monthDate)).toBe(true);
  });

  it('returns false for inactive flow', () => {
    const flow = makeCashFlow({ isActive: false });
    const monthDate = new Date(2025, 0, 1);
    expect(isFlowActiveInMonth(flow, monthDate)).toBe(false);
  });
});

describe('calculateProjection', () => {
  it('returns correct number of points', () => {
    const result = calculateProjection(5000, [], 6);
    expect(result).toHaveLength(6);
  });

  it('returns flat balance with no cash flows', () => {
    const result = calculateProjection(5000, [], 3);
    for (const point of result) {
      expect(point.balance).toBe(5000);
      expect(point.totalInflow).toBe(0);
      expect(point.totalOutflow).toBe(0);
    }
  });

  it('projects balance with monthly inflow', () => {
    const flows = [makeCashFlow({ amount: 1000, flowType: 'inflow', frequency: 'monthly' })];
    const result = calculateProjection(5000, flows, 3);
    expect(result[0].balance).toBe(6000);
    expect(result[1].balance).toBe(7000);
    expect(result[2].balance).toBe(8000);
  });

  it('projects balance with monthly outflow', () => {
    const flows = [makeCashFlow({ amount: 500, flowType: 'outflow', frequency: 'monthly' })];
    const result = calculateProjection(5000, flows, 3);
    expect(result[0].balance).toBe(4500);
    expect(result[1].balance).toBe(4000);
    expect(result[2].balance).toBe(3500);
  });

  it('projects balance with mixed flows', () => {
    const flows = [
      makeCashFlow({ id: '1', amount: 3000, flowType: 'inflow', frequency: 'monthly' }),
      makeCashFlow({ id: '2', amount: 1200, flowType: 'outflow', frequency: 'monthly' }),
    ];
    const result = calculateProjection(10000, flows, 2);
    // Month 1: 10000 + 3000 - 1200 = 11800
    expect(result[0].balance).toBe(11800);
    // Month 2: 11800 + 3000 - 1200 = 13600
    expect(result[1].balance).toBe(13600);
  });

  it('tracks inflow and outflow totals per month', () => {
    const flows = [
      makeCashFlow({ id: '1', amount: 3000, flowType: 'inflow', frequency: 'monthly' }),
      makeCashFlow({ id: '2', amount: 1200, flowType: 'outflow', frequency: 'monthly' }),
    ];
    const result = calculateProjection(0, flows, 1);
    expect(result[0].totalInflow).toBe(3000);
    expect(result[0].totalOutflow).toBe(1200);
  });

  it('ignores inactive flows', () => {
    const flows = [makeCashFlow({ amount: 1000, flowType: 'inflow', isActive: false })];
    const result = calculateProjection(5000, flows, 2);
    expect(result[0].balance).toBe(5000);
    expect(result[1].balance).toBe(5000);
  });

  it('handles weekly frequency conversion', () => {
    const flows = [makeCashFlow({ amount: 100, flowType: 'inflow', frequency: 'weekly' })];
    const result = calculateProjection(0, flows, 1);
    expect(result[0].totalInflow).toBeCloseTo(433.33, 1);
  });
});

describe('calculateMonthlyTotals', () => {
  it('returns zeros for empty flows', () => {
    const result = calculateMonthlyTotals([]);
    expect(result.totalInflow).toBe(0);
    expect(result.totalOutflow).toBe(0);
    expect(result.net).toBe(0);
  });

  it('calculates correct totals for active flows', () => {
    const flows = [
      makeCashFlow({ id: '1', amount: 5000, flowType: 'inflow', frequency: 'monthly' }),
      makeCashFlow({ id: '2', amount: 1500, flowType: 'outflow', frequency: 'monthly' }),
      makeCashFlow({ id: '3', amount: 800, flowType: 'outflow', frequency: 'monthly' }),
    ];
    const result = calculateMonthlyTotals(flows);
    expect(result.totalInflow).toBe(5000);
    expect(result.totalOutflow).toBe(2300);
    expect(result.net).toBe(2700);
  });

  it('excludes inactive flows from totals', () => {
    const flows = [
      makeCashFlow({ id: '1', amount: 5000, flowType: 'inflow', isActive: true }),
      makeCashFlow({ id: '2', amount: 1000, flowType: 'inflow', isActive: false }),
    ];
    const result = calculateMonthlyTotals(flows);
    expect(result.totalInflow).toBe(5000);
  });
});
