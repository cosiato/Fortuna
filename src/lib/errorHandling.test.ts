import { describe, it, expect, vi, beforeEach } from "vitest"
import { showErrorToast } from "./errorHandling"
import { toast } from "sonner"

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}))

describe("errorHandling", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("showErrorToast", () => {
    it("should show string errors directly", () => {
      showErrorToast("Something went wrong")
      expect(toast.error).toHaveBeenCalledWith("Something went wrong")
    })

    it("should show Error instance message", () => {
      showErrorToast(new Error("Database failed"))
      expect(toast.error).toHaveBeenCalledWith("Database failed")
    })

    it("should use fallback message for non-string, non-Error values", () => {
      showErrorToast(42, "Fallback message")
      expect(toast.error).toHaveBeenCalledWith("Fallback message")
    })

    it("should use default fallback when no fallback provided", () => {
      showErrorToast({ code: 500 })
      expect(toast.error).toHaveBeenCalledWith("An error occurred")
    })

    it("should use fallback for null error", () => {
      showErrorToast(null, "Custom fallback")
      expect(toast.error).toHaveBeenCalledWith("Custom fallback")
    })

    it("should use fallback for undefined error", () => {
      showErrorToast(undefined, "Custom fallback")
      expect(toast.error).toHaveBeenCalledWith("Custom fallback")
    })

    it("should prefer string error over fallback", () => {
      showErrorToast("Actual error", "Fallback")
      expect(toast.error).toHaveBeenCalledWith("Actual error")
    })

    it("should prefer Error message over fallback", () => {
      showErrorToast(new Error("Actual error"), "Fallback")
      expect(toast.error).toHaveBeenCalledWith("Actual error")
    })
  })
})
