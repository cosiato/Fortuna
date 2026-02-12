import { useRef, useEffect, useMemo, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface SlotMachineNumberProps {
  value: string
  className?: string
  duration?: number
  staggerMs?: number
}

interface CharEntry {
  char: string
  key: string
  isDigit: boolean
  digitIndex: number
}

const DIGIT_EASE: [number, number, number, number] = [0.33, 1, 0.68, 1]
const SYMBOL_TRANSITION_DURATION = 0.15

function assignKeys(chars: string[]): CharEntry[] {
  let digitCount = 0
  for (const ch of chars) {
    if (ch >= "0" && ch <= "9") digitCount++
  }

  const entries: CharEntry[] = []
  let digitsSeen = 0

  for (const ch of chars) {
    const isDigit = ch >= "0" && ch <= "9"
    if (isDigit) {
      const rightAlignedKey = digitCount - digitsSeen
      entries.push({
        char: ch,
        key: `d${rightAlignedKey}`,
        isDigit: true,
        digitIndex: digitsSeen,
      })
      digitsSeen++
    } else {
      entries.push({
        char: ch,
        key: `s-${entries.length}-${ch}`,
        isDigit: false,
        digitIndex: -1,
      })
    }
  }

  return entries
}

function SlotDigit({
  digit,
  duration,
  delay,
  shouldAnimate,
}: {
  digit: number
  duration: number
  delay: number
  shouldAnimate: boolean
}) {
  const durationSec = duration / 1000
  const delaySec = delay / 1000

  return (
    <span
      className="inline-block relative overflow-hidden align-bottom"
      style={{ height: "1.2em", lineHeight: "1.2em", fontVariantNumeric: "tabular-nums" }}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={digit}
          className="block"
          style={{ lineHeight: "1.2em" }}
          initial={shouldAnimate ? { y: "1.2em" } : false}
          animate={{ y: 0 }}
          exit={{ y: "-1.2em" }}
          transition={{
            y: { duration: durationSec, ease: DIGIT_EASE, delay: delaySec },
          }}
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

const MemoSlotDigit = memo(SlotDigit)

function SlotMachineNumber({
  value,
  className = "",
  duration = 600,
  staggerMs = 30,
}: SlotMachineNumberProps) {
  const prevValueRef = useRef<string | null>(null)
  const hasMountedRef = useRef(false)

  const currentEntries = useMemo(() => assignKeys(value.split("")), [value])

  const prevValue = prevValueRef.current
  const shouldAnimate = hasMountedRef.current && prevValue !== null && prevValue !== value

  useEffect(() => {
    hasMountedRef.current = true
    prevValueRef.current = value
  }, [value])

  return (
    <span
      className={`inline-flex ${className}`}
      style={{ fontVariantNumeric: "tabular-nums" }}
      aria-label={value}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {currentEntries.map((entry) => {
          if (!entry.isDigit) {
            return (
              <motion.span
                key={entry.key}
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: SYMBOL_TRANSITION_DURATION }}
                aria-hidden="true"
              >
                {entry.char}
              </motion.span>
            )
          }

          const currentDigit = parseInt(entry.char, 10)

          return (
            <motion.span
              key={entry.key}
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: SYMBOL_TRANSITION_DURATION }}
              aria-hidden="true"
            >
              <MemoSlotDigit
                digit={currentDigit}
                duration={duration}
                delay={entry.digitIndex * staggerMs}
                shouldAnimate={shouldAnimate}
              />
            </motion.span>
          )
        })}
      </AnimatePresence>
    </span>
  )
}

export default memo(SlotMachineNumber)
