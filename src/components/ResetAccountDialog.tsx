import { useState, useEffect } from "react"
import { Icon } from "@iconify/react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ResetAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

const CONFIRMATION_WORD = "RESET"

export default function ResetAccountDialog({
  open,
  onOpenChange,
  onConfirm,
}: ResetAccountDialogProps) {
  const [confirmText, setConfirmText] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setConfirmText("")
      setIsLoading(false)
    }
  }, [open])

  const isConfirmed = confirmText === CONFIRMATION_WORD

  const handleConfirm = async () => {
    if (!isConfirmed) return
    setIsLoading(true)
    try {
      await onConfirm()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={isLoading ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
              <Icon
                icon="solar:trash-bin-trash-linear"
                width={20}
                height={20}
                className="text-red-500"
              />
            </div>
            <div>
              <DialogTitle className="text-red-500">Reset All Data</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
            <div className="flex items-start gap-3">
              <Icon
                icon="solar:danger-triangle-linear"
                width={18}
                height={18}
                className="text-red-500 mt-0.5 flex-shrink-0"
              />
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-500">
                  All data will be permanently deleted
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <Icon icon="solar:box-linear" width={14} height={14} />
                    <span>All assets</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon icon="solar:safe-2-linear" width={14} height={14} />
                    <span>All vaults and cash flows</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon icon="solar:chart-linear" width={14} height={14} />
                    <span>All snapshots and activity history</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon icon="solar:buildings-linear" width={14} height={14} />
                    <span>All entities (except Individual)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon icon="solar:settings-linear" width={14} height={14} />
                    <span>All settings including PIN</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Type <span className="font-mono font-bold text-foreground">{CONFIRMATION_WORD}</span> to confirm
            </p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRMATION_WORD}
              className="font-mono"
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="flex-1"
              onClick={handleConfirm}
              disabled={!isConfirmed || isLoading}
            >
              {isLoading ? "Resetting..." : "Reset All Data"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
