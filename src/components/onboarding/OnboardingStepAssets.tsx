import { useTranslation } from "react-i18next";
import OnboardingStepLayout from "./OnboardingStepLayout";
import step1Src from "@/assets/step1.png";

export default function OnboardingStepAssets() {
  const { t } = useTranslation("onboarding");

  return (
    <OnboardingStepLayout
      icon="solar:widget-4-linear"
      title={t("step1.title")}
      subtitle={t("step1.subtitle")}
      description={t("step1.description")}
      screenshotSrc={step1Src}
      screenshotAlt="Assets overview screenshot"
    />
  );
}
