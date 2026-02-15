import i18n from "@/lib/i18n";
import type { CashFlowCategory, CashFlowType } from "@/types/database";

interface CategoryInfo {
  labelKey: string;
  icon: string;
  type: CashFlowType;
}

export const CASH_FLOW_CATEGORIES: Record<CashFlowCategory, CategoryInfo> = {
  salary: {
    labelKey: "salary",
    icon: "solar:wallet-money-linear",
    type: "inflow",
  },
  freelance: {
    labelKey: "freelance",
    icon: "solar:laptop-linear",
    type: "inflow",
  },
  investment_income: {
    labelKey: "investment_income",
    icon: "solar:chart-linear",
    type: "inflow",
  },
  rental_income: {
    labelKey: "rental_income",
    icon: "solar:home-linear",
    type: "inflow",
  },
  other_income: {
    labelKey: "other_income",
    icon: "solar:add-circle-linear",
    type: "inflow",
  },
  rent: { labelKey: "rent", icon: "solar:home-linear", type: "outflow" },
  mortgage: {
    labelKey: "mortgage",
    icon: "solar:buildings-linear",
    type: "outflow",
  },
  subscription: {
    labelKey: "subscription",
    icon: "solar:repeat-linear",
    type: "outflow",
  },
  utilities: {
    labelKey: "utilities",
    icon: "solar:bolt-linear",
    type: "outflow",
  },
  insurance: {
    labelKey: "insurance",
    icon: "solar:shield-check-linear",
    type: "outflow",
  },
  groceries: {
    labelKey: "groceries",
    icon: "solar:cart-linear",
    type: "outflow",
  },
  transport: {
    labelKey: "transport",
    icon: "solar:bus-linear",
    type: "outflow",
  },
  entertainment: {
    labelKey: "entertainment",
    icon: "solar:gamepad-linear",
    type: "outflow",
  },
  savings_transfer: {
    labelKey: "savings_transfer",
    icon: "solar:safe-square-linear",
    type: "outflow",
  },
  other_expense: {
    labelKey: "other_expense",
    icon: "solar:minus-circle-linear",
    type: "outflow",
  },
};

export function getCategoryLabel(category: CashFlowCategory): string {
  return i18n.t(`categories:${CASH_FLOW_CATEGORIES[category].labelKey}` as any);
}

export function getCategoriesByType(flowType: CashFlowType): Array<{
  key: CashFlowCategory;
  label: string;
  icon: string;
}> {
  return (
    Object.entries(CASH_FLOW_CATEGORIES) as Array<
      [CashFlowCategory, CategoryInfo]
    >
  )
    .filter(([, info]) => info.type === flowType)
    .map(([key, info]) => ({
      key,
      label: i18n.t(`categories:${info.labelKey}` as any),
      icon: info.icon,
    }));
}
