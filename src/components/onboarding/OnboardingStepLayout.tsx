import { Icon } from "@iconify/react"

interface OnboardingStepLayoutProps {
  icon: string
  title: string
  subtitle: string
  description: string
  screenshotSrc: string
  screenshotAlt: string
}

export default function OnboardingStepLayout({
  icon,
  title,
  subtitle,
  description,
  screenshotSrc,
  screenshotAlt,
}: OnboardingStepLayoutProps) {
  return (
    <div className="flex items-center gap-8 max-w-4xl mx-auto">
      <div className="flex flex-col gap-4 flex-shrink-0 w-[320px]">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
          <Icon icon={icon} width={24} height={24} className="text-accent" />
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-accent font-serif">{title}</h2>
          <p className="text-sm text-muted-foreground italic">{subtitle}</p>
        </div>

        <p className="text-[15px] text-foreground leading-relaxed">{description}</p>
      </div>

      <div className="flex-1 min-w-0 aspect-video rounded-xl overflow-hidden border border-slate-700/40">
        <img
          src={screenshotSrc}
          alt={screenshotAlt}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover object-bottom"
        />
      </div>
    </div>
  )
}
