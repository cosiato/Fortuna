import { describe, it, expect, vi } from 'vitest';
import {
  normalizeToMonthly,
  getFlowOccurrences,
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
    startDate: '2024-01-15',
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
    const monthDate = new Date(2024, 5, 1);
    expect(isFlowActiveInMonth(flow, monthDate)).toBe(true);
  });

  it('returns true for the start month itself', () => {
    const flow = makeCashFlow({ startDate: '2024-03-15', isActive: true });
    const monthDate = new Date(2024, 2, 1);
    expect(isFlowActiveInMonth(flow, monthDate)).toBe(true);
  });

  it('returns false for month before start date', () => {
    const flow = makeCashFlow({ startDate: '2024-06-01', isActive: true });
    const monthDate = new Date(2024, 4, 1);
    expect(isFlowActiveInMonth(flow, monthDate)).toBe(false);
  });

  it('returns false for month after end date', () => {
    const flow = makeCashFlow({
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      isActive: true,
    });
    const monthDate = new Date(2024, 7, 1);
    expect(isFlowActiveInMonth(flow, monthDate)).toBe(false);
  });

  it('returns true for the end month itself', () => {
    const flow = makeCashFlow({
      startDate: '2024-01-01',
      endDate: '2024-06-15',
      isActive: true,
    });
    const monthDate = new Date(2024, 5, 1);
    expect(isFlowActiveInMonth(flow, monthDate)).toBe(true);
  });

  it('returns false for inactive flow', () => {
    const flow = makeCashFlow({ isActive: false });
    const monthDate = new Date(2025, 0, 1);
    expect(isFlowActiveInMonth(flow, monthDate)).toBe(false);
  });
});

describe('getFlowOccurrences', () => {
  it('returns monthly occurrences on the correct day', () => {
    const flow = makeCashFlow({ startDate: '2024-01-15', frequency: 'monthly' });
    const windowStart = new Date(2024, 0, 1);
    const windowEnd = new Date(2024, 3, 30);
    const dates = getFlowOccurrences(flow, windowStart, windowEnd);
    expect(dates).toHaveLength(4);
    expect(dates[0].getDate()).toBe(15);
    expect(dates[0].getMonth()).toBe(0);
    expect(dates[1].getDate()).toBe(15);
    expect(dates[1].getMonth()).toBe(1);
    expect(dates[3].getMonth()).toBe(3);
  });

  it('returns weekly occurrences every 7 days', () => {
    const flow = makeCashFlow({ startDate: '2024-01-01', frequency: 'weekly' });
    const windowStart = new Date(2024, 0, 1);
    const windowEnd = new Date(2024, 0, 28);
    const dates = getFlowOccurrences(flow, windowStart, windowEnd);
    expect(dates).toHaveLength(4);
    expect(dates[0].getDate()).toBe(1);
    expect(dates[1].getDate()).toBe(8);
    expect(dates[2].getDate()).toBe(15);
    expect(dates[3].getDate()).toBe(22);
  });

  it('returns yearly occurrences', () => {
    const flow = makeCashFlow({ startDate: '2024-06-15', frequency: 'yearly' });
    const windowStart = new Date(2024, 0, 1);
    const windowEnd = new Date(2026, 11, 31);
    const dates = getFlowOccurrences(flow, windowStart, windowEnd);
    expect(dates).toHaveLength(3);
    expect(dates[0].getFullYear()).toBe(2024);
    expect(dates[1].getFullYear()).toBe(2025);
    expect(dates[2].getFullYear()).toBe(2026);
  });

  it('returns empty array for inactive flows', () => {
    const flow = makeCashFlow({ isActive: false });
    const dates = getFlowOccurrences(flow, new Date(2024, 0, 1), new Date(2024, 11, 31));
    expect(dates).toHaveLength(0);
  });

  it('respects end date', () => {
    const flow = makeCashFlow({
      startDate: '2024-01-15',
      endDate: '2024-03-15',
      frequency: 'monthly',
    });
    const windowStart = new Date(2024, 0, 1);
    const windowEnd = new Date(2024, 11, 31);
    const dates = getFlowOccurrences(flow, windowStart, windowEnd);
    expect(dates).toHaveLength(3);
  });

  it('handles month overflow for day 31', () => {
    const flow = makeCashFlow({ startDate: '2024-01-31', frequency: 'monthly' });
    const windowStart = new Date(2024, 0, 1);
    const windowEnd = new Date(2024, 3, 30);
    const dates = getFlowOccurrences(flow, windowStart, windowEnd);
    // Jan 31, Feb 29 (2024 is leap year), Mar 31, Apr 30
    expect(dates).toHaveLength(4);
    expect(dates[1].getMonth()).toBe(1);
    expect(dates[1].getDate()).toBe(29);
  });

  it('skips occurrences before window start', () => {
    const flow = makeCashFlow({ startDate: '2024-01-15', frequency: 'monthly' });
    const windowStart = new Date(2024, 2, 1);
    const windowEnd = new Date(2024, 4, 30);
    const dates = getFlowOccurrences(flow, windowStart, windowEnd);
    expect(dates).toHaveLength(3);
    expect(dates[0].getMonth()).toBe(2);
  });
});

describe('calculateProjection', () => {
  it('returns one point per day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 1));

    const result = calculateProjection(5000, [], 1);
    // Jan 1 to Feb 1 inclusive = 32 days
    expect(result.length).toBeGreaterThanOrEqual(30);
    expect(result.length).toBeLessThanOrEqual(32);

    vi.useRealTimers();
  });

  it('returns flat balance with no cash flows', () => {
    const result = calculateProjection(5000, [], 1);
    for (const point of result) {
      expect(point.balance).toBe(5000);
      expect(point.inflow).toBe(0);
      expect(point.outflow).toBe(0);
    }
  });

  it('applies inflow on the exact occurrence date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 1));

    const flows = [makeCashFlow({ amount: 3000, startDate: '2024-01-15', frequency: 'monthly' })];
    const result = calculateProjection(5000, flows, 1);

    // Day index 0 = Jan 1, day index 14 = Jan 15
    const dayBeforeInflow = result[13]; // Jan 14
    const dayOfInflow = result[14]; // Jan 15

    expect(dayBeforeInflow.balance).toBe(5000);
    expect(dayOfInflow.balance).toBe(8000);
    expect(dayOfInflow.inflow).toBe(3000);

    vi.useRealTimers();
  });

  it('applies outflow on the exact occurrence date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 1));

    const flows = [makeCashFlow({
      amount: 1200,
      flowType: 'outflow',
      startDate: '2024-01-10',
      frequency: 'monthly',
    })];
    const result = calculateProjection(5000, flows, 1);

    const dayBeforeOutflow = result[8]; // Jan 9
    const dayOfOutflow = result[9]; // Jan 10

    expect(dayBeforeOutflow.balance).toBe(5000);
    expect(dayOfOutflow.balance).toBe(3800);
    expect(dayOfOutflow.outflow).toBe(1200);

    vi.useRealTimers();
  });

  it('accumulates multiple events on same day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 1));

    const flows = [
      makeCashFlow({ id: '1', amount: 3000, flowType: 'inflow', startDate: '2024-01-15', frequency: 'monthly' }),
      makeCashFlow({ id: '2', amount: 1200, flowType: 'outflow', startDate: '2024-01-15', frequency: 'monthly' }),
    ];
    const result = calculateProjection(10000, flows, 1);

    const dayOfEvent = result[14]; // Jan 15
    expect(dayOfEvent.inflow).toBe(3000);
    expect(dayOfEvent.outflow).toBe(1200);
    expect(dayOfEvent.balance).toBe(11800);

    vi.useRealTimers();
  });

  it('ignores inactive flows', () => {
    const flows = [makeCashFlow({ amount: 1000, flowType: 'inflow', isActive: false })];
    const result = calculateProjection(5000, flows, 1);
    for (const point of result) {
      expect(point.balance).toBe(5000);
    }
  });

  it('handles weekly occurrences', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 1));

    const flows = [makeCashFlow({ amount: 100, flowType: 'inflow', startDate: '2024-01-01', frequency: 'weekly' })];
    const result = calculateProjection(0, flows, 1);

    // Occurrences: Jan 1, Jan 8, Jan 15, Jan 22, Jan 29
    expect(result[0].inflow).toBe(100); // Jan 1
    expect(result[0].balance).toBe(100);
    expect(result[6].inflow).toBe(0); // Jan 7 - no event
    expect(result[7].inflow).toBe(100); // Jan 8
    expect(result[7].balance).toBe(200);

    vi.useRealTimers();
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
