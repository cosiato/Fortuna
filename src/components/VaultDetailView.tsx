import { useMemo } from 'react';
import { Icon } from '@iconify/react';
import type { Account, CashFlow } from '@/types/database';
import type { SupportedCurrency } from '@/lib/currency';
import { formatCurrency } from '@/lib/currency';
import { calculateMonthlyTotals } from '@/lib/cashFlowProjection';
import { Button } from '@/components/ui/button';
import VaultFlowDiagram from '@/components/VaultFlowDiagram';
import VaultProjectionChart from '@/components/VaultProjectionChart';

interface VaultDetailViewProps {
  account: Account;
  cashFlows: readonly CashFlow[];
  displayCurrency: SupportedCurrency;
  displayBalance: number;
  onAddFlow: () => void;
  onEditFlow: (id: string) => void;
  onDeleteFlow: (id: string) => void;
  onToggleFlow: (id: string) => void;
}

export default function VaultDetailView({
  account,
  cashFlows,
  displayCurrency,
  displayBalance,
  onAddFlow,
  onEditFlow,
  onDeleteFlow,
  onToggleFlow,
}: VaultDetailViewProps) {
  const accountFlows = useMemo(
    () => cashFlows.filter((f) => f.accountId === account.id),
    [cashFlows, account.id],
  );

  const { totalInflow, totalOutflow, net } = useMemo(
    () => calculateMonthlyTotals(accountFlows),
    [accountFlows],
  );

  return (
    <div className="space-y-4 pt-3 pb-1">
      <div className="flex items-center gap-3 px-1">
        <div className="flex-1 grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-green-950/30 border border-green-800/30 px-3 py-2 text-center">
            <p className="text-[10px] text-muted-foreground mb-0.5">Monthly In</p>
            <p className="text-sm font-semibold text-green-400">
              +{formatCurrency(totalInflow, displayCurrency)}
            </p>
          </div>
          <div className="rounded-lg bg-red-950/30 border border-red-800/30 px-3 py-2 text-center">
            <p className="text-[10px] text-muted-foreground mb-0.5">Monthly Out</p>
            <p className="text-sm font-semibold text-red-400">
              -{formatCurrency(totalOutflow, displayCurrency)}
            </p>
          </div>
          <div
            className={`rounded-lg px-3 py-2 text-center border ${
              net >= 0
                ? 'bg-amber-950/30 border-amber-800/30'
                : 'bg-red-950/30 border-red-800/30'
            }`}
          >
            <p className="text-[10px] text-muted-foreground mb-0.5">Net</p>
            <p className={`text-sm font-semibold ${net >= 0 ? 'text-accent' : 'text-red-400'}`}>
              {net >= 0 ? '+' : ''}{formatCurrency(net, displayCurrency)}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-accent hover:text-accent/80 hover:bg-accent/10 shrink-0"
          onClick={onAddFlow}
        >
          <Icon icon="solar:add-circle-linear" width={16} height={16} className="mr-1" />
          <span className="text-xs">Add Flow</span>
        </Button>
      </div>

      <VaultFlowDiagram
        account={account}
        cashFlows={accountFlows}
        displayCurrency={displayCurrency}
        displayBalance={displayBalance}
        onEdit={onEditFlow}
        onDelete={onDeleteFlow}
        onToggle={onToggleFlow}
      />

      <VaultProjectionChart
        currentBalance={displayBalance}
        cashFlows={accountFlows}
        displayCurrency={displayCurrency}
      />
    </div>
  );
}
