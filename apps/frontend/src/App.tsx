import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { GoogleOAuthProvider } from "@react-oauth/google"
import { useSessionTimeout } from "./hooks/useSessionTimeout"
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts"
import { useServiceWorker } from "./hooks/useServiceWorker"
import { ThemeProvider } from "./contexts/ThemeContext"
import { NotificationsProvider } from "./contexts/NotificationsContext"
import { OnboardingProvider } from "./contexts/OnboardingContext"
import { OfflineProvider } from "./contexts/OfflineContext"
import SessionWarning from "./components/SessionWarning"
import KeyboardShortcutsHelp from "./components/KeyboardShortcutsHelp"
import OnboardingTutorial from "./components/OnboardingTutorial"
import PWAUpdateNotif from "./components/PWAUpdateNotif"
import OfflineIndicator from "./components/OfflineIndicator"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import UserProfile from "./pages/UserProfile"
import ModeSelection from "./pages/ModeSelection"
import UploadAnalysis from "./pages/UploadAnalysis"
import CriminalAnalysis from "./pages/CriminalAnalysis"
import InterviewAnalysis from "./pages/InterviewAnalysis"
import BusinessAnalysis from "./pages/BusinessAnalysis"
import ResultsPage from "./pages/ResultsPage"
import Help from "./pages/Help"
import AdvancedFeaturesDemo from "./pages/AdvancedFeaturesDemo"
import MainLayout from "./layouts/MainLayout"
import PublicLayout from "./layouts/PublicLayout"
import AdminLayout from "./layouts/AdminLayout"
import AdminDashboard from "./pages/admin/AdminDashboard"
import AdminUsers from "./pages/admin/AdminUsers"
import AdminLogs from "./pages/admin/AdminLogs"
import AdminBackups from "./pages/admin/AdminBackups"
import AdminSettings from "./pages/admin/AdminSettings"

function AppRoutes() {
  useSessionTimeout()
  useKeyboardShortcuts()
  useServiceWorker()

  return (
    <>
      <SessionWarning />
      <KeyboardShortcutsHelp />
      <OnboardingTutorial />
      <PWAUpdateNotif />
      <OfflineIndicator />
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
        <Route path="/admin/users" element={<AdminLayout><AdminUsers /></AdminLayout>} />
        <Route path="/admin/logs" element={<AdminLayout><AdminLogs /></AdminLayout>} />
        <Route path="/admin/backups" element={<AdminLayout><AdminBackups /></AdminLayout>} />
        <Route path="/admin/settings" element={<AdminLayout><AdminSettings /></AdminLayout>} />

        {/* Public Routes - No Navbar */}
        <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
        <Route path="/signup" element={<PublicLayout><Signup /></PublicLayout>} />

        {/* Authenticated Routes with Navbar */}
        <Route path="/profile" element={<MainLayout><UserProfile /></MainLayout>} />
        <Route path="/modes" element={<MainLayout><ModeSelection /></MainLayout>} />
        <Route path="/upload" element={<MainLayout><UploadAnalysis /></MainLayout>} />
        <Route path="/analysis/criminal" element={<MainLayout><CriminalAnalysis /></MainLayout>} />
        <Route path="/analysis/interview" element={<MainLayout><InterviewAnalysis /></MainLayout>} />
        <Route path="/analysis/business" element={<MainLayout><BusinessAnalysis /></MainLayout>} />
        
        {/* Results Pages */}
        <Route path="/analysis/business/result/:id" element={<MainLayout><ResultsPage mode="BUSINESS" /></MainLayout>} />
        <Route path="/analysis/criminal/result/:id" element={<MainLayout><ResultsPage mode="CRIMINAL" /></MainLayout>} />
        <Route path="/analysis/interview/result/:id" element={<MainLayout><ResultsPage mode="INTERVIEW" /></MainLayout>} />
        
        <Route path="/help" element={<MainLayout><Help /></MainLayout>} />
        <Route path="/features" element={<MainLayout><AdvancedFeaturesDemo /></MainLayout>} />

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
  
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <ThemeProvider>
        <NotificationsProvider>
          <OnboardingProvider>
            <OfflineProvider>
              <Router>
                <AppRoutes />
              </Router>
            </OfflineProvider>
          </OnboardingProvider>
        </NotificationsProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  )
}
