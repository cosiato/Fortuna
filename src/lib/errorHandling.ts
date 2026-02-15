import { toast } from "sonner"

export function showErrorToast(error: unknown, fallbackMessage = "An error occurred") {
  const message =
    typeof error === "string" ? error : error instanceof Error ? error.message : fallbackMessage

  toast.error(message)
}
