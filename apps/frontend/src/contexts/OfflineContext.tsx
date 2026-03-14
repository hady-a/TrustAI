import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

export interface QueuedAction {
  id: string
  type: "upload" | "analysis" | "profile-update"
  timestamp: number
  data: any
  status: "pending" | "synced" | "failed"
  retryCount: number
}

interface OfflineContextType {
  isOnline: boolean
  queue: QueuedAction[]
  addToQueue: (action: Omit<QueuedAction, "id" | "status" | "timestamp" | "retryCount">) => void
  removeFromQueue: (id: string) => void
  processQueue: () => Promise<void>
  clearQueue: () => void
  updateQueueItemStatus: (id: string, status: "pending" | "synced" | "failed") => void
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined)

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine)
  const [queue, setQueue] = useState<QueuedAction[]>(() => {
    const saved = localStorage.getItem("offlineQueue")
    return saved ? JSON.parse(saved) : []
  })

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log("✅ Back online - syncing queued actions...")
      setIsOnline(true)
    }

    const handleOffline = () => {
      console.log("📵 Offline - actions will be queued")
      setIsOnline(false)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Persist queue to localStorage
  useEffect(() => {
    localStorage.setItem("offlineQueue", JSON.stringify(queue))
  }, [queue])

  const addToQueue = useCallback(
    (action: Omit<QueuedAction, "id" | "status" | "timestamp" | "retryCount">) => {
      const queuedAction: QueuedAction = {
        ...action,
        id: `${action.type}-${Date.now()}-${Math.random()}`,
        status: "pending",
        timestamp: Date.now(),
        retryCount: 0,
      }

      setQueue((prev) => [...prev, queuedAction])
      console.log(`📦 Action queued: ${queuedAction.id}`)
    },
    []
  )

  const removeFromQueue = useCallback((id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const updateQueueItemStatus = useCallback(
    (id: string, status: "pending" | "synced" | "failed") => {
      setQueue((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status, retryCount: status === "failed" ? item.retryCount + 1 : item.retryCount }
            : item
        )
      )
    },
    []
  )

  const processQueue = useCallback(async () => {
    if (!isOnline) {
      console.log("📵 Still offline - cannot process queue")
      return
    }

    const pendingActions = queue.filter((item) => item.status === "pending")

    if (pendingActions.length === 0) {
      console.log("✅ Queue is empty")
      return
    }

    console.log(`🔄 Processing ${pendingActions.length} queued action(s)...`)

    for (const action of pendingActions) {
      try {
        // Simulate API call based on action type
        await new Promise((resolve) => setTimeout(resolve, 1000))

        console.log(`✅ Synced: ${action.id}`)
        updateQueueItemStatus(action.id, "synced")
      } catch (error) {
        console.error(`❌ Failed to sync ${action.id}:`, error)
        updateQueueItemStatus(action.id, "failed")
      }
    }
  }, [isOnline, queue, updateQueueItemStatus])

  // Auto-process queue when coming back online
  useEffect(() => {
    if (isOnline && queue.some((item) => item.status === "pending")) {
      const timer = setTimeout(() => {
        processQueue()
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [isOnline, queue, processQueue])

  const clearQueue = useCallback(() => {
    setQueue([])
    localStorage.removeItem("offlineQueue")
  }, [])

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        queue,
        addToQueue,
        removeFromQueue,
        processQueue,
        clearQueue,
        updateQueueItemStatus,
      }}
    >
      {children}
    </OfflineContext.Provider>
  )
}

export const useOffline = () => {
  const context = useContext(OfflineContext)
  if (!context) {
    throw new Error("useOffline must be used within OfflineProvider")
  }
  return context
}
