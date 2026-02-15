import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import OnboardingStepAssets from "./OnboardingStepAssets"
import OnboardingStepVaults from "./OnboardingStepVaults"
import OnboardingStepEntities from "./OnboardingStepEntities"
import OnboardingStepIndicator from "./OnboardingStepIndicator"

interface OnboardingOverlayProps {
  show: boolean
  onComplete: () => void
}

const TOTAL_STEPS = 3

const STEP_COMPONENTS = [OnboardingStepAssets, OnboardingStepVaults, OnboardingStepEntities]

export default function OnboardingOverlay({ show, onComplete }: OnboardingOverlayProps) {
  const { t } = useTranslation(["onboarding", "common"])
  const [currentStep, setCurrentStep] = useState(1)
  const [direction, setDirection] = useState(1)

  const handleNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS) {
      setDirection(1)
      setCurrentStep((prev) => prev + 1)
    } else {
      onComplete()
    }
  }, [currentStep, onComplete])

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setDirection(-1)
      setCurrentStep((prev) => prev - 1)
    }
  }, [currentStep])

  const handleSkip = useCallback(() => {
    onComplete()
  }, [onComplete])

  useEffect(() => {
    if (!show) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
          handleNext()
          break
        case "ArrowLeft":
          handleBack()
          break
        case "Escape":
          handleSkip()
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [show, handleNext, handleBack, handleSkip])

  const StepComponent = STEP_COMPONENTS[currentStep - 1]

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
    }),
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-background"
          role="dialog"
          aria-label={t("onboarding:welcomeAriaLabel")}
          aria-modal="true"
        >
          <div className="relative flex flex-col items-center gap-6 w-full max-w-4xl px-6">
            <div className="flex flex-col items-center gap-2 -mt-12">
              <img src="/logo.png" alt="Fortuna" className="w-16 h-16 drop-shadow-lg" />
              <h1 className="text-2xl font-bold text-accent font-serif">Fortuna</h1>
            </div>

            <OnboardingStepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />

            <div className="w-full overflow-hidden mt-2">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentStep}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <StepComponent />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-between w-full mt-4">
              {currentStep > 1 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {t("common:back")}
                </Button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {t("common:skip")}
                </Button>

                <Button size="sm" onClick={handleNext} className="font-semibold px-6">
                  {currentStep === TOTAL_STEPS ? t("onboarding:beginJourney") : t("common:next")}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
