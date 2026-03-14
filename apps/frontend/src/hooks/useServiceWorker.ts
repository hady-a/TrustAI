import { useEffect, useState, useCallback } from "react"

interface ServiceWorkerState {
  isSupported: boolean
  isRegistered: boolean
  isUpdating: boolean
  error: string | null
}

export const useServiceWorker = () => {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: "serviceWorker" in navigator,
    isRegistered: false,
    isUpdating: false,
    error: null,
  })

  const register = useCallback(async () => {
    if (!state.isSupported) {
      console.warn("Service Workers not supported in this browser")
      return
    }

    try {
      setState((prev) => ({ ...prev, isUpdating: true }))

      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      })

      console.log("✅ Service Worker registered:", registration)

      // Check for updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "activated") {
              console.log("✅ New Service Worker activated - refresh to see updates")
              setState((prev) => ({ ...prev, isUpdating: false }))
              
              // Notify user about update
              if (typeof window !== "undefined") {
                window.dispatchEvent(
                  new CustomEvent("sw-update-available", { detail: { registration } })
                )
              }
            }
          })
        }
      })

      // Handle controller change
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("✅ New Service Worker took control")
      })

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data.type === "SYNC_OFFLINE_QUEUE") {
          console.log("📦 Service Worker requesting offline queue sync")
          window.dispatchEvent(new CustomEvent("offline-sync-requested"))
        }
      })

      setState((prev) => ({
        ...prev,
        isRegistered: true,
        isUpdating: false,
        error: null,
      }))

      return registration
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      console.error("❌ Service Worker registration failed:", errorMessage)
      setState((prev) => ({
        ...prev,
        isRegistered: false,
        isUpdating: false,
        error: errorMessage,
      }))
    }
  }, [state.isSupported])

  const unregister = useCallback(async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations()
      for (const registration of registrations) {
        await registration.unregister()
      }
      console.log("✅ Service Workers unregistered")
      setState((prev) => ({
        ...prev,
        isRegistered: false,
        error: null,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      console.error("❌ Service Worker unregistration failed:", errorMessage)
      setState((prev) => ({
        ...prev,
        error: errorMessage,
      }))
    }
  }, [])

  const clearCache = useCallback(async () => {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "CLEAR_CACHE",
      })
      console.log("🗑️ Cache clear requested")
    }
  }, [])

  const skipWaiting = useCallback(async () => {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "SKIP_WAITING",
      })
      console.log("⏭️ Skip waiting requested")
    }
  }, [])

  // Register on mount
  useEffect(() => {
    if (state.isSupported && !state.isRegistered) {
      register()
    }
  }, [state.isSupported, state.isRegistered, register])

  return {
    ...state,
    register,
    unregister,
    clearCache,
    skipWaiting,
  }
}
