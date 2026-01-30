'use client';

import { Asset } from '@/lib/db';
import { SupportedCurrency, formatCurrency } from '@/lib/currency';
import { Button } from '@/components/ui/button';

export interface CategoryStyle {
  gradient: string;
  glowColor: string;
}

export const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  stock: {
    gradient: 'from-amber-500/30 to-amber-900/10',
    glowColor: 'hover:shadow-amber-500/20',
  },
  crypto: {
    gradient: 'from-purple-500/30 to-purple-900/10',
    glowColor: 'hover:shadow-purple-500/20',
  },
  real_estate: {
    gradient: 'from-emerald-500/30 to-emerald-900/10',
    glowColor: 'hover:shadow-emerald-500/20',
  },
  other: {
    gradient: 'from-slate-500/30 to-slate-900/10',
    glowColor: 'hover:shadow-slate-500/20',
  },
};

interface AssetTileProps {
  asset: Asset;
  displayValue: number;
  displayCurrency: SupportedCurrency;
  categoryStyle?: CategoryStyle;
  onEdit?: (asset: Asset) => void;
  onDelete?: (id: string) => void;
}

export default function AssetTile({
  asset,
  displayValue,
  displayCurrency,
  categoryStyle,
  onEdit,
  onDelete,
}: AssetTileProps) {
  const style = categoryStyle || CATEGORY_STYLES[asset.type] || CATEGORY_STYLES.other;
  const showActions = onEdit || onDelete;

  return (
    <div
      className={`group relative p-5 rounded-xl bg-gradient-to-br ${style.gradient} border border-border/40 hover:border-accent/40 transition-all duration-300 ${style.glowColor} hover:shadow-lg`}
    >
      {showActions && (
        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(asset)}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-accent hover:bg-accent/10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                <path d="m15 5 4 4"/>
              </svg>
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(asset.id)}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"/>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              </svg>
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
            <span className="text-accent font-bold text-sm">
              {asset.symbol?.slice(0, 2).toUpperCase() || asset.name.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={`font-semibold text-foreground truncate ${showActions ? 'pr-16' : ''}`}>
              {asset.name}
            </h3>
            {asset.symbol && (
              <p className="text-sm text-muted-foreground uppercase">{asset.symbol}</p>
            )}
          </div>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Quantity</span>
            <span className="text-lg font-medium text-foreground">
              {asset.quantity.toLocaleString(undefined, { maximumFractionDigits: 4 })}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Value</span>
            <span className="text-lg font-bold text-accent">
              {displayValue > 0 ? formatCurrency(displayValue, displayCurrency) : '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
