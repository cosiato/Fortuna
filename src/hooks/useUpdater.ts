import { useEffect, useState, useCallback, useRef } from "react"
import { check } from "@tauri-apps/plugin-updater"
import { relaunch } from "@tauri-apps/plugin-process"

export type UpdateStatus = "idle" | "checking" | "available" | "downloading" | "error"

interface UpdateInfo {
  version: string
  body: string
}

interface UpdateProgress {
  downloaded: number
  total: number
}

interface UseUpdaterReturn {
  status: UpdateStatus
  updateInfo: UpdateInfo | null
  progress: UpdateProgress
  downloadAndInstall: () => Promise<void>
  dismiss: () => void
}

export function useUpdater(): UseUpdaterReturn {
  const [status, setStatus] = useState<UpdateStatus>("idle")
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [progress, setProgress] = useState<UpdateProgress>({ downloaded: 0, total: 0 })
  const updateRef = useRef<Awaited<ReturnType<typeof check>>>(null)

  useEffect(() => {
    let cancelled = false

    const checkForUpdate = async () => {
      try {
        setStatus("checking")
        const update = await check()

        if (cancelled) return

        if (update) {
          updateRef.current = update
          setUpdateInfo({
            version: update.version,
            body: update.body ?? "",
          })
          setStatus("available")
        } else {
          setStatus("idle")
        }
      } catch {
        if (!cancelled) {
          setStatus("error")
        }
      }
    }

    checkForUpdate()

    return () => {
      cancelled = true
    }
  }, [])

  const downloadAndInstall = useCallback(async () => {
    const update = updateRef.current
    if (!update) return

    try {
      setStatus("downloading")
      let downloaded = 0

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            setProgress({ downloaded: 0, total: event.data.contentLength ?? 0 })
            break
          case "Progress":
            downloaded += event.data.chunkLength
            setProgress((prev) => ({ ...prev, downloaded }))
            break
          case "Finished":
            break
        }
      })

      if (updateRef.current) {
        await relaunch()
      }
    } catch {
      setStatus("error")
    }
  }, [])

  const dismiss = useCallback(() => {
    setStatus("idle")
    setUpdateInfo(null)
    updateRef.current = null
  }, [])

  return {
    status,
    updateInfo,
    progress,
    downloadAndInstall,
    dismiss,
  }
}
