import OnboardingStepLayout from "./OnboardingStepLayout"
import step3Src from "@/assets/step3.png"

export default function OnboardingStepEntities() {
  return (
    <OnboardingStepLayout
      icon="solar:users-group-rounded-linear"
      title="Choose Your Path"
      subtitle="One hero. Many allegiances."
      description="Organize wealth under Personal or Company entities. Switch between realms instantly and see each one's total power at a glance."
      screenshotSrc={step3Src}
      screenshotAlt="Entities overview screenshot"
    />
  )
}
