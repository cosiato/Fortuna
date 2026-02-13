import OnboardingStepLayout from "./OnboardingStepLayout";
import step1Src from "@/assets/step1.png";

export default function OnboardingStepAssets() {
  return (
    <OnboardingStepLayout
      icon="solar:widget-4-linear"
      title="Build Your Inventory"
      subtitle="Every fortune starts with what you own."
      description="Track stocks, crypto, real estate and more. Fortuna fetches live prices automatically -- your power level stays current without lifting a finger."
      screenshotSrc={step1Src}
      screenshotAlt="Assets overview screenshot"
    />
  );
}
