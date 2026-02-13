import OnboardingStepLayout from "./OnboardingStepLayout";
import step2Src from "@/assets/step2.png";

export default function OnboardingStepVaults() {
  return (
    <OnboardingStepLayout
      icon="solar:safe-2-linear"
      title="Secure Your Vaults"
      subtitle="Gold is only as safe as the vault that holds it."
      description="Add your bank accounts, then set up recurring inflows and outflows. Fortuna projects your balance forward so you always know what lies ahead."
      screenshotSrc={step2Src}
      screenshotAlt="Vaults overview screenshot"
    />
  );
}
