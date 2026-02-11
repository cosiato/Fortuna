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
  const progressPercent = (currentStep / totalSteps) * 100

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-xs mx-auto">
      <div className="flex items-center gap-0 w-full justify-center">
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
                      : "bg-transparent border-slate-700 text-muted-foreground"
                }`}
                animate={isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                transition={
                  isActive
                    ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0.2 }
                }
              >
                {isCompleted ? (
                  <Icon icon="solar:check-read-linear" width={14} height={14} />
                ) : (
                  step
                )}
              </motion.div>

              {step < totalSteps && (
                <div className="w-12 h-0.5 bg-slate-700">
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

      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
        <motion.div
          className="h-full bg-gradient-to-r from-accent/80 to-accent rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent, transparent 6px, rgba(0,0,0,0.15) 6px, rgba(0,0,0,0.15) 8px)",
          }}
        />
      </div>
    </div>
  )
}
