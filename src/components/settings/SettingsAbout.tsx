import { useTranslation } from "react-i18next"
import { Icon } from "@iconify/react"

const LINKS = [
  {
    key: "website" as const,
    icon: "solar:global-linear",
    url: "https://givemefortuna.com",
  },
  {
    key: "sourceCode" as const,
    icon: "solar:code-square-linear",
    url: "https://github.com/cosiato/Fortuna",
  },
  {
    key: "reportBug" as const,
    icon: "solar:bug-linear",
    url: "https://github.com/cosiato/Fortuna/issues",
  },
]

export default function SettingsAbout() {
  const { t } = useTranslation("settings")

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-1">{t("sections.about")}</h3>
        <p className="text-sm text-muted-foreground mt-2">{t("about.description")}</p>
      </div>

      <div className="border-t border-border pt-6">
        <p className="text-xs text-muted-foreground mb-3">{t("about.links")}</p>
        <div className="space-y-2">
          {LINKS.map(({ key, icon, url }) => (
            <a
              key={key}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <Icon icon={icon} width={16} height={16} />
              <span>{t(`about.${key}`)}</span>
              <Icon
                icon="solar:arrow-right-up-linear"
                width={12}
                height={12}
                className="ml-auto opacity-50"
              />
            </a>
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <p className="text-center text-sm text-muted-foreground/60">
          {t("about.madeWith")}{" "}
          <a
            href="https://github.com/cosiato"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-muted-foreground/80 transition-colors"
          >
            cosiato
          </a>{" "}
          &middot; v{__APP_VERSION__}
        </p>
      </div>
    </div>
  )
}
