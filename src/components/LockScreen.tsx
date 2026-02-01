import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import PinInput from "@/components/PinInput"
import { api } from "@/lib/api"

interface LockScreenProps {
  isLocked: boolean
  onUnlock: () => void
}

export default function LockScreen({ isLocked, onUnlock }: LockScreenProps) {
  const [pin, setPin] = useState("")
  const [error, setError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (isLocked) {
      setPin("")
      setError(false)
      setErrorMessage("")
    }
  }, [isLocked])

  const handlePinComplete = async (completedPin: string) => {
    if (isVerifying) return

    setIsVerifying(true)
    setError(false)
    setErrorMessage("")

    try {
      const isValid = await api.settings.verifyPin(completedPin)
      if (isValid) {
        onUnlock()
      } else {
        setError(true)
        setErrorMessage("Incorrect PIN")
        setPin("")
        if (errorTimeoutRef.current) {
          clearTimeout(errorTimeoutRef.current)
        }
        errorTimeoutRef.current = setTimeout(() => setError(false), 600)
      }
    } catch (err) {
      setError(true)
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes("Too many failed attempts")) {
        setErrorMessage(message)
      } else {
        setErrorMessage("Incorrect PIN")
      }
      setPin("")
    } finally {
      setIsVerifying(false)
    }
  }

  const handlePinChange = (newPin: string) => {
    setPin(newPin)
    if (error) {
      setError(false)
      setErrorMessage("")
    }
  }

  return (
    <AnimatePresence>
      {isLocked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
        >
          <div className="absolute inset-0 bg-vignette pointer-events-none" />

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="relative flex flex-col items-center gap-8"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center shadow-lg">
                <span className="text-4xl font-bold text-accent font-serif">F</span>
              </div>
              <h1 className="text-3xl font-bold text-accent font-serif">Fortuna</h1>
            </div>

            <div className="flex flex-col items-center gap-4">
              <p className="text-muted-foreground text-sm">Enter your PIN to unlock</p>

              <motion.div
                animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
              >
                <PinInput
                  value={pin}
                  onChange={handlePinChange}
                  onComplete={handlePinComplete}
                  error={error}
                  disabled={isVerifying}
                  autoFocus
                />
              </motion.div>

              <div role="alert" aria-live="polite" className="min-h-[20px]">
                {errorMessage && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm text-center"
                  >
                    {errorMessage}
                  </motion.p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
