import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return
      }

      // Cmd/Ctrl + K: Search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        // Dispatch event that can be listened to
        window.dispatchEvent(new CustomEvent('open-search'))
      }

      // Cmd/Ctrl + Shift + P: Profile
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault()
        navigate('/profile')
      }

      // Cmd/Ctrl + H: Home/Modes
      if ((e.metaKey || e.ctrlKey) && e.key === 'h') {
        e.preventDefault()
        navigate('/modes')
      }

      // Cmd/Ctrl + Shift + D: Dashboard
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault()
        navigate('/dashboard')
      }

      // ? : Show shortcuts help
      if (e.key === '?') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('open-shortcuts-help'))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])
}

export const KEYBOARD_SHORTCUTS = [
  { keys: ['⌘', 'K'], description: 'Search analyses', os: 'mac' },
  { keys: ['Ctrl', 'K'], description: 'Search analyses', os: 'win' },
  { keys: ['⌘', 'Shift', 'P'], description: 'Go to profile', os: 'mac' },
  { keys: ['Ctrl', 'Shift', 'P'], description: 'Go to profile', os: 'win' },
  { keys: ['⌘', 'H'], description: 'Go to home', os: 'mac' },
  { keys: ['Ctrl', 'H'], description: 'Go to home', os: 'win' },
  { keys: ['⌘', 'Shift', 'D'], description: 'Go to dashboard', os: 'mac' },
  { keys: ['Ctrl', 'Shift', 'D'], description: 'Go to dashboard', os: 'win' },
  { keys: ['?'], description: 'Show this help', os: 'all' },
]
