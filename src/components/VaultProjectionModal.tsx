import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import VaultProjectionChart from '@/components/VaultProjectionChart';
import type { CashFlow } from '@/types/database';
import type { SupportedCurrency } from '@/lib/currency';

interface VaultProjectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountName: string;
  currentBalance: number;
  cashFlows: readonly CashFlow[];
  displayCurrency: SupportedCurrency;
}

export default function VaultProjectionModal({
  open,
  onOpenChange,
  accountName,
  currentBalance,
  cashFlows,
  displayCurrency,
}: VaultProjectionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Balance Projection - {accountName}</DialogTitle>
        </DialogHeader>
        <VaultProjectionChart
          currentBalance={currentBalance}
          cashFlows={cashFlows}
          displayCurrency={displayCurrency}
        />
      </DialogContent>
    </Dialog>
  );
}
