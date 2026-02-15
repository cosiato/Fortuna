import { useTranslation } from "react-i18next";
import OnboardingStepLayout from "./OnboardingStepLayout";
import step2Src from "@/assets/step2.png";

export default function OnboardingStepVaults() {
  const { t } = useTranslation("onboarding");

  return (
    <OnboardingStepLayout
      icon="solar:safe-2-linear"
      title={t("step2.title")}
      subtitle={t("step2.subtitle")}
      description={t("step2.description")}
      screenshotSrc={step2Src}
      screenshotAlt="Vaults overview screenshot"
    />
  );
}
