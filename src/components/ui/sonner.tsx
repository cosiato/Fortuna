import { Toaster as Sonner } from "sonner"

export function Toaster() {
  return (
    <Sonner
      position="bottom-center"
      theme="dark"
      toastOptions={{
        style: {
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
          color: "hsl(var(--foreground))",
        },
        classNames: {
          error: "!border-destructive/50 !bg-destructive/10 !text-destructive-foreground",
        },
      }}
    />
  )
}
