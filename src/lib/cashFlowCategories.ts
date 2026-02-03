import type { CashFlowCategory, CashFlowType } from '@/types/database';

export interface CategoryInfo {
  label: string;
  icon: string;
  type: CashFlowType;
}

export const CASH_FLOW_CATEGORIES: Record<CashFlowCategory, CategoryInfo> = {
  salary: { label: 'Salary', icon: 'solar:wallet-money-linear', type: 'inflow' },
  freelance: { label: 'Freelance', icon: 'solar:laptop-linear', type: 'inflow' },
  investment_income: { label: 'Investment', icon: 'solar:chart-linear', type: 'inflow' },
  rental_income: { label: 'Rental', icon: 'solar:home-linear', type: 'inflow' },
  other_income: { label: 'Other Income', icon: 'solar:add-circle-linear', type: 'inflow' },
  rent: { label: 'Rent', icon: 'solar:home-linear', type: 'outflow' },
  mortgage: { label: 'Mortgage', icon: 'solar:buildings-linear', type: 'outflow' },
  subscription: { label: 'Subscription', icon: 'solar:repeat-linear', type: 'outflow' },
  utilities: { label: 'Utilities', icon: 'solar:bolt-linear', type: 'outflow' },
  insurance: { label: 'Insurance', icon: 'solar:shield-check-linear', type: 'outflow' },
  groceries: { label: 'Groceries', icon: 'solar:cart-linear', type: 'outflow' },
  transport: { label: 'Transport', icon: 'solar:bus-linear', type: 'outflow' },
  entertainment: { label: 'Entertainment', icon: 'solar:gamepad-linear', type: 'outflow' },
  savings_transfer: { label: 'Savings', icon: 'solar:safe-square-linear', type: 'outflow' },
  other_expense: { label: 'Other Expense', icon: 'solar:minus-circle-linear', type: 'outflow' },
};

export function getCategoriesByType(flowType: CashFlowType): Array<{
  key: CashFlowCategory;
  label: string;
  icon: string;
}> {
  return (Object.entries(CASH_FLOW_CATEGORIES) as Array<[CashFlowCategory, CategoryInfo]>)
    .filter(([, info]) => info.type === flowType)
    .map(([key, info]) => ({
      key,
      label: info.label,
      icon: info.icon,
    }));
}
