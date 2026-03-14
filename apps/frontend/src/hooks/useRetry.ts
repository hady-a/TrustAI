import { useState, useCallback, useRef } from "react"

interface RetryConfig {
  maxRetries?: number
  delay?: number
  backoffMultiplier?: number
  onRetry?: (attempt: number, error: Error) => void
  onMaxRetriesExceeded?: (error: Error) => void
}

interface RetryState {
  isRetrying: boolean
  retryCount: number
  lastError: Error | null
}

export const useRetry = () => {
  const [retryState, setRetryState] = useState<RetryState>({
    isRetrying: false,
    retryCount: 0,
    lastError: null,
  })

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const executeWithRetry = useCallback(
    async <T,>(
      fn: () => Promise<T>,
      config: RetryConfig = {}
    ): Promise<T> => {
      const {
        maxRetries = 3,
        delay = 1000,
        backoffMultiplier = 2,
        onRetry,
        onMaxRetriesExceeded,
      } = config

      let lastError: Error | null = null
      let attempt = 0

      setRetryState({
        isRetrying: false,
        retryCount: 0,
        lastError: null,
      })

      while (attempt <= maxRetries) {
        try {
          const result = await fn()
          setRetryState({
            isRetrying: false,
            retryCount: 0,
            lastError: null,
          })
          return result
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error))
          attempt++

          if (attempt <= maxRetries) {
            const waitTime = delay * Math.pow(backoffMultiplier, attempt - 1)
            
            setRetryState({
              isRetrying: true,
              retryCount: attempt,
              lastError,
            })

            onRetry?.(attempt, lastError)

            await new Promise((resolve) => {
              timeoutRef.current = setTimeout(resolve, waitTime)
            })
          } else {
            setRetryState({
              isRetrying: false,
              retryCount: attempt - 1,
              lastError,
            })
            onMaxRetriesExceeded?.(lastError)
            throw lastError
          }
        }
      }

      throw lastError
    },
    []
  )

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
      setRetryState((prev) => ({
        ...prev,
        isRetrying: false,
      }))
    }
  }, [])

  const reset = useCallback(() => {
    cancel()
    setRetryState({
      isRetrying: false,
      retryCount: 0,
      lastError: null,
    })
  }, [cancel])

  return {
    executeWithRetry,
    cancel,
    reset,
    retryState,
  }
}

// Utility function for simple retry logic with retry button
export const useFileUploadRetry = () => {
  const { executeWithRetry, retryState, reset } = useRetry()

  const uploadWithRetry = useCallback(
    async (
      uploadFn: () => Promise<any>,
      onSuccess?: () => void,
      onError?: (error: string) => void
    ) => {
      try {
        const result = await executeWithRetry(uploadFn, {
          maxRetries: 3,
          delay: 2000,
          backoffMultiplier: 1.5,
          onRetry: (attempt) => {
            console.log(`Upload retry attempt ${attempt}...`)
          },
          onMaxRetriesExceeded: (error) => {
            console.error("Upload failed after max retries:", error)
            onError?.(error.message)
          },
        })
        onSuccess?.()
        return result
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed"
        onError?.(message)
        throw error
      }
    },
    [executeWithRetry]
  )

  return {
    uploadWithRetry,
    isRetrying: retryState.isRetrying,
    retryCount: retryState.retryCount,
    lastError: retryState.lastError,
    reset,
  }
}
