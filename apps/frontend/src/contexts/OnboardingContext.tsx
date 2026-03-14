import React, { createContext, useContext, useState, useEffect } from 'react'

interface OnboardingContextType {
  showOnboarding: boolean
  completedSteps: string[]
  completeStep: (stepId: string) => void
  dismissOnboarding: () => void
  initializeOnboardingForNewUser: () => void
  resetOnboarding: () => void
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<string[]>(() => {
    const saved = localStorage.getItem('onboardingCompleted')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    // Only show onboarding if explicitly initialized for new user signup
    const shouldShowOnboarding = localStorage.getItem('showOnboardingForNewUser')
    
    if (shouldShowOnboarding === 'true') {
      setShowOnboarding(true)
      // Remove the flag so it doesn't trigger again on page reload
      localStorage.removeItem('showOnboardingForNewUser')
    }
  }, [])

  const completeStep = (stepId: string) => {
    setCompletedSteps((prev) => {
      const updated = [...prev, stepId]
      localStorage.setItem('onboardingCompleted', JSON.stringify(updated))
      return updated
    })
  }

  const dismissOnboarding = () => {
    setShowOnboarding(false)
    localStorage.setItem('hasSeenOnboarding', 'true')
  }

  const initializeOnboardingForNewUser = () => {
    // This is called after signup to show onboarding for new users
    setShowOnboarding(true)
    setCompletedSteps([])
    localStorage.setItem('showOnboardingForNewUser', 'true')
    localStorage.setItem('onboardingCompleted', JSON.stringify([]))
  }

  const resetOnboarding = () => {
    // This is called on logout to reset onboarding state
    setShowOnboarding(false)
    setCompletedSteps([])
    localStorage.removeItem('hasSeenOnboarding')
    localStorage.removeItem('showOnboardingForNewUser')
    localStorage.removeItem('onboardingCompleted')
  }

  return (
    <OnboardingContext.Provider
      value={{ showOnboarding, completedSteps, completeStep, dismissOnboarding, initializeOnboardingForNewUser, resetOnboarding }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export const useOnboarding = () => {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider')
  }
  return context
}
