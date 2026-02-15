import { useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"

interface PinInputProps {
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  error?: boolean
  masked?: boolean
  disabled?: boolean
  autoFocus?: boolean
}

export default function PinInput({
  value,
  onChange,
  onComplete,
  error = false,
  masked = true,
  disabled = false,
  autoFocus = true,
}: PinInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const PIN_LENGTH = 4

  const inputDigits = value.split("").slice(0, PIN_LENGTH)
  const digits = [...inputDigits, ...Array(PIN_LENGTH - inputDigits.length).fill("")]

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [autoFocus])

  useEffect(() => {
    const nextIndex = Math.min(inputDigits.length, PIN_LENGTH - 1)
    inputRefs.current[nextIndex]?.focus()
  }, [inputDigits.length])

  const focusInput = useCallback((index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, PIN_LENGTH - 1))
    inputRefs.current[clampedIndex]?.focus()
  }, [])

  const handleChange = (index: number, inputValue: string) => {
    if (disabled) return
    if (index > inputDigits.length) return

    const digit = inputValue.replace(/\D/g, "").slice(-1)
    if (!digit && inputValue !== "") return

    const newDigits = [...digits]
    newDigits[index] = digit

    const newValue = newDigits.join("")
    onChange(newValue)

    if (newValue.length === PIN_LENGTH && onComplete) {
      onComplete(newValue)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return

    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        e.preventDefault()
        focusInput(index - 1)
        const newDigits = [...digits]
        newDigits[index - 1] = ""
        onChange(newDigits.join(""))
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault()
      focusInput(index - 1)
    } else if (e.key === "ArrowRight" && index < PIN_LENGTH - 1 && index < inputDigits.length) {
      e.preventDefault()
      focusInput(index + 1)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled) return

    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, PIN_LENGTH)
    if (pastedData) {
      onChange(pastedData)
      if (pastedData.length === PIN_LENGTH && onComplete) {
        onComplete(pastedData)
      }
    }
  }

  return (
    <div className="flex gap-3 justify-center">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={masked && digit ? "\u2022" : digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => {
            const nextIndex = Math.min(inputDigits.length, PIN_LENGTH - 1)
            if (index > nextIndex) {
              focusInput(nextIndex)
              return
            }
            e.target.select()
          }}
          disabled={disabled}
          className={cn(
            "w-14 h-16 text-center text-2xl font-bold rounded-lg",
            "bg-slate-800/60 border-2 transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-accent/50",
            error
              ? "border-red-500 focus:border-red-500"
              : "border-slate-600/50 focus:border-accent",
            disabled && "opacity-50 cursor-not-allowed",
          )}
          aria-label={`PIN digit ${index + 1}`}
        />
      ))}
    </div>
  )
}
