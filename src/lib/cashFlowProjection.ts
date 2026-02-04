import type { CashFlow, CashFlowFrequency } from '@/types/database';

export interface ProjectionPoint {
  date: string;
  timestamp: number;
  balance: number;
  inflow: number;
  outflow: number;
}

function parseDate(dateStr: string): Date {
  const parts = dateStr.split('-');
  return new Date(
    parseInt(parts[0], 10),
    parseInt(parts[1], 10) - 1,
    parseInt(parts[2], 10),
  );
}

function parseYearMonth(dateStr: string): { year: number; month: number } {
  const parts = dateStr.split('-');
  return { year: parseInt(parts[0], 10), month: parseInt(parts[1], 10) - 1 };
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(date: Date, count: number): Date {
  const result = new Date(date);
  const targetMonth = result.getMonth() + count;
  result.setMonth(targetMonth);
  if (result.getMonth() !== ((targetMonth % 12) + 12) % 12) {
    result.setDate(0);
  }
  return result;
}

function addYears(date: Date, count: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + count);
  if (result.getMonth() !== date.getMonth()) {
    result.setDate(0);
  }
  return result;
}

export function getFlowOccurrences(
  flow: CashFlow,
  windowStart: Date,
  windowEnd: Date,
): readonly Date[] {
  if (!flow.isActive) return [];

  const flowStart = parseDate(flow.startDate);
  const flowEnd = flow.endDate ? parseDate(flow.endDate) : null;
  const occurrences: Date[] = [];

  let current = new Date(flowStart);
  current.setHours(0, 0, 0, 0);
  let iteration = 0;

  while (current <= windowEnd) {
    if (current >= windowStart && (!flowEnd || current <= flowEnd)) {
      occurrences.push(new Date(current));
    }

    iteration++;
    switch (flow.frequency) {
      case 'weekly':
        current = addDays(flowStart, iteration * 7);
        break;
      case 'monthly':
        current = addMonths(flowStart, iteration);
        break;
      case 'yearly':
        current = addYears(flowStart, iteration);
        break;
    }
    current.setHours(0, 0, 0, 0);
  }

  return occurrences;
}

export function calculateProjection(
  currentBalance: number,
  cashFlows: readonly CashFlow[],
  months: number,
): readonly ProjectionPoint[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const windowEnd = addMonths(today, months);

  const eventMap = new Map<string, { inflow: number; outflow: number }>();

  for (const flow of cashFlows) {
    const occurrences = getFlowOccurrences(flow, today, windowEnd);
    for (const date of occurrences) {
      const key = toDateKey(date);
      const existing = eventMap.get(key) ?? { inflow: 0, outflow: 0 };
      if (flow.flowType === 'inflow') {
        existing.inflow += flow.amount;
      } else {
        existing.outflow += flow.amount;
      }
      eventMap.set(key, existing);
    }
  }

  const points: ProjectionPoint[] = [];
  let balance = currentBalance;
  let cursor = new Date(today);

  while (cursor <= windowEnd) {
    const key = toDateKey(cursor);
    const events = eventMap.get(key);
    const inflow = events?.inflow ?? 0;
    const outflow = events?.outflow ?? 0;

    balance = balance + inflow - outflow;

    points.push({
      date: toLabel(cursor),
      timestamp: cursor.getTime(),
      balance,
      inflow,
      outflow,
    });

    cursor = addDays(cursor, 1);
  }

  return points;
}

export function normalizeToMonthly(amount: number, frequency: CashFlowFrequency): number {
  switch (frequency) {
    case 'weekly':
      return amount * (52 / 12);
    case 'monthly':
      return amount;
    case 'yearly':
      return amount / 12;
  }
}

export function isFlowActiveInMonth(flow: CashFlow, monthDate: Date): boolean {
  if (!flow.isActive) return false;

  const start = parseYearMonth(flow.startDate);
  const monthYear = monthDate.getFullYear();
  const monthMonth = monthDate.getMonth();

  if (monthYear < start.year || (monthYear === start.year && monthMonth < start.month)) {
    return false;
  }

  if (flow.endDate) {
    const end = parseYearMonth(flow.endDate);
    if (monthYear > end.year || (monthYear === end.year && monthMonth > end.month)) {
      return false;
    }
  }

  return true;
}

export function calculateMonthlyTotals(cashFlows: readonly CashFlow[]): {
  totalInflow: number;
  totalOutflow: number;
  net: number;
} {
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let totalInflow = 0;
  let totalOutflow = 0;

  for (const flow of cashFlows) {
    if (!isFlowActiveInMonth(flow, currentMonth)) continue;

    const monthlyAmount = normalizeToMonthly(flow.amount, flow.frequency);

    if (flow.flowType === 'inflow') {
      totalInflow += monthlyAmount;
    } else {
      totalOutflow += monthlyAmount;
    }
  }

  return {
    totalInflow,
    totalOutflow,
    net: totalInflow - totalOutflow,
  };
}
