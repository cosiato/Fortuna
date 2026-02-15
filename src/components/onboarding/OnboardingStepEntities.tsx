import { useTranslation } from "react-i18next"
import OnboardingStepLayout from "./OnboardingStepLayout"
import step3Src from "@/assets/step3.png"

export default function OnboardingStepEntities() {
  const { t } = useTranslation("onboarding")

  return (
    <OnboardingStepLayout
      icon="solar:users-group-rounded-linear"
      title={t("step3.title")}
      subtitle={t("step3.subtitle")}
      description={t("step3.description")}
      screenshotSrc={step3Src}
      screenshotAlt="Entities overview screenshot"
    />
  )
}
