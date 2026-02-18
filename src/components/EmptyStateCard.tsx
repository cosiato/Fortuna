import { Icon } from "@iconify/react"

interface EmptyStateCardProps {
  icon: string
  title: string
  subtitle: string
  className?: string
}

export default function EmptyStateCard({
  icon,
  title,
  subtitle,
  className,
}: EmptyStateCardProps) {
  return (
    <div
      className={`rounded-xl bg-background border border-border p-5 flex flex-col items-center justify-center text-center min-h-[140px] ${className ?? ""}`}
    >
      <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center mb-3">
        <Icon icon={icon} className="text-muted-foreground/50" width={22} height={22} />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-xs text-muted-foreground/60 mt-1">{subtitle}</p>
    </div>
  )
}
