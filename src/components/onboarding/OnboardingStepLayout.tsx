import { Icon } from "@iconify/react"

interface OnboardingStepLayoutProps {
  icon: string
  title: string
  subtitle: string
  description: string
  screenshotAlt: string
}

export default function OnboardingStepLayout({
  icon,
  title,
  subtitle,
  description,
  screenshotAlt,
}: OnboardingStepLayoutProps) {
  return (
    <div className="flex items-center gap-10 max-w-2xl mx-auto">
      <div className="flex flex-col gap-4 flex-1 min-w-0">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
          <Icon icon={icon} width={24} height={24} className="text-accent" />
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-accent font-serif">{title}</h2>
          <p className="text-sm text-muted-foreground italic">{subtitle}</p>
        </div>

        <p className="text-sm text-foreground leading-relaxed">{description}</p>
      </div>

      <div className="flex-1 min-w-0 aspect-video rounded-xl border-2 border-dashed border-slate-700/60 bg-gradient-to-br from-slate-800/40 to-slate-900/60 flex items-center justify-center">
        <span className="text-muted-foreground text-sm">{screenshotAlt}</span>
      </div>
    </div>
  )
}
