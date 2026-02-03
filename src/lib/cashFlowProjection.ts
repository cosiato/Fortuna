import type { CashFlow, CashFlowFrequency } from '@/types/database';

export interface ProjectionPoint {
  month: string;
  balance: number;
  totalInflow: number;
  totalOutflow: number;
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

function parseYearMonth(dateStr: string): { year: number; month: number } {
  const parts = dateStr.split('-');
  return { year: parseInt(parts[0], 10), month: parseInt(parts[1], 10) - 1 };
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

export function calculateProjection(
  currentBalance: number,
  cashFlows: readonly CashFlow[],
  months: number,
): readonly ProjectionPoint[] {
  const points: ProjectionPoint[] = [];
  let balance = currentBalance;
  const now = new Date();

  for (let i = 0; i < months; i++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthLabel = monthDate.toLocaleDateString('en-US', {
      month: 'short',
      year: '2-digit',
    });

    let totalInflow = 0;
    let totalOutflow = 0;

    for (const flow of cashFlows) {
      if (!isFlowActiveInMonth(flow, monthDate)) continue;

      const monthlyAmount = normalizeToMonthly(flow.amount, flow.frequency);

      if (flow.flowType === 'inflow') {
        totalInflow += monthlyAmount;
      } else {
        totalOutflow += monthlyAmount;
      }
    }

    balance = balance + totalInflow - totalOutflow;

    points.push({
      month: monthLabel,
      balance,
      totalInflow,
      totalOutflow,
    });
  }

  return points;
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
