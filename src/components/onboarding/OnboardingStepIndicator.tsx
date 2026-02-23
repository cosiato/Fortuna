import { motion } from "framer-motion"
import { Icon } from "@iconify/react"

interface OnboardingStepIndicatorProps {
  currentStep: number
  totalSteps: number
}

export default function OnboardingStepIndicator({
  currentStep,
  totalSteps,
}: OnboardingStepIndicatorProps) {
  return (
    <div className="flex items-center gap-0 w-full max-w-xs mx-auto justify-center">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1
        const isCompleted = step < currentStep
        const isActive = step === currentStep

        return (
          <div key={step} className="flex items-center">
            <motion.div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                isCompleted
                  ? "bg-accent border-accent text-accent-foreground"
                  : isActive
                    ? "bg-accent/20 border-accent text-accent"
                    : "bg-transparent border-border text-muted-foreground"
              }`}
              animate={isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
              transition={
                isActive
                  ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.2 }
              }
            >
              {isCompleted ? <Icon icon="solar:check-read-linear" width={14} height={14} /> : step}
            </motion.div>

            {step < totalSteps && (
              <div className="w-12 h-0.5 bg-muted">
                <motion.div
                  className="h-full bg-accent"
                  initial={{ width: "0%" }}
                  animate={{ width: step < currentStep ? "100%" : "0%" }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
