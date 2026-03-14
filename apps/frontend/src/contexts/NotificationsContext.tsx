import React, { createContext, useContext, useState } from 'react'

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: Date
  read: boolean
}

interface NotificationsContextType {
  notifications: Notification[]
  addNotification: (title: string, message: string, type: Notification['type']) => void
  markAsRead: (id: string) => void
  clearNotifications: () => void
  unreadCount: number
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = (title: string, message: string, type: Notification['type']) => {
    const id = Date.now().toString()
    const newNotification: Notification = {
      id,
      title,
      message,
      type,
      timestamp: new Date(),
      read: false,
    }
    
    setNotifications((prev) => [newNotification, ...prev])
    
    // Auto-remove after 5 seconds if not error
    if (type !== 'error') {
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
      }, 5000)
    }
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
    )
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <NotificationsContext.Provider
      value={{ notifications, addNotification, markAsRead, clearNotifications, unreadCount }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationsContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider')
  }
  return context
}
