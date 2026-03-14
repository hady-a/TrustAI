import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../lib/api'

const SESSION_TIMEOUT = 15 * 60 * 1000 // 15 minutes in milliseconds
const WARNING_TIME = 1 * 60 * 1000 // Show warning 1 minute before timeout

// Custom event for session warning
export const SESSION_WARNING_EVENT = 'session-warning'
export const SESSION_EXPIRED_EVENT = 'session-expired'

export const useSessionTimeout = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) return

    let timeoutId: ReturnType<typeof setTimeout>
    let warningTimeoutId: ReturnType<typeof setTimeout>
    let warningShown = false

    const resetTimer = () => {
      // Clear existing timers
      clearTimeout(timeoutId)
      clearTimeout(warningTimeoutId)
      warningShown = false

      // Set warning timeout (show warning 1 minute before logout)
      warningTimeoutId = setTimeout(() => {
        if (!warningShown) {
          warningShown = true
          // Dispatch custom event for warning
          window.dispatchEvent(new CustomEvent(SESSION_WARNING_EVENT, {
            detail: { message: 'Your session will expire in 1 minute due to inactivity.' }
          }))
        }
      }, SESSION_TIMEOUT - WARNING_TIME)

      // Set logout timeout
      timeoutId = setTimeout(() => {
        // Dispatch custom event for expiration
        window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
        authAPI.logout()
        navigate('/login', { state: { message: 'Your session has expired. Please log in again.' } })
      }, SESSION_TIMEOUT)
    }

    // Reset timer on any user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    events.forEach(event => {
      document.addEventListener(event, resetTimer)
    })

    // Initial timer setup
    resetTimer()

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimer)
      })
      clearTimeout(timeoutId)
      clearTimeout(warningTimeoutId)
    }
  }, [navigate])
}
