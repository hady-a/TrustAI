import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { lazy, Suspense } from "react"
import { GoogleOAuthProvider } from "@react-oauth/google"
import { useSessionTimeout } from "./hooks/useSessionTimeout"
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts"
import { useServiceWorker } from "./hooks/useServiceWorker"
import { ThemeProvider } from "./contexts/ThemeContext"
import { NotificationsProvider } from "./contexts/NotificationsContext"
import MainLayout from "./layouts/MainLayout"
import PublicLayout from "./layouts/PublicLayout"
import AdminLayout from "./layouts/AdminLayout"

// Lazy load pages for code splitting
const UserProfile = lazy(() => import("./pages/UserProfile"))
const UploadAnalysis = lazy(() => import("./pages/UploadAnalysis"))
const CriminalAnalysis = lazy(() => import("./pages/CriminalAnalysis"))
const InterviewAnalysis = lazy(() => import("./pages/InterviewAnalysis"))
const BusinessAnalysis = lazy(() => import("./pages/BusinessAnalysis"))
const MicrophoneStream = lazy(() => import("./pages/MicrophoneStream"))
const ResultsPage = lazy(() => import("./pages/ResultsPage"))
const Help = lazy(() => import("./pages/Help"))
const AdvancedFeaturesDemo = lazy(() => import("./pages/AdvancedFeaturesDemo"))
const AdminDashboardNew = lazy(() => import("./pages/admin/AdminDashboardNew"))
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"))
const AdminLogs = lazy(() => import("./pages/admin/AdminLogs"))
const AdminBackups = lazy(() => import("./pages/admin/AdminBackups"))
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"))
const LoginNew = lazy(() => import("./pages/LoginNew"))
const SignupNew = lazy(() => import("./pages/SignupNew"))
const ModeSelectionNew = lazy(() => import("./pages/ModeSelectionNew"))

// Loading component
const PageLoader = () => <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>

function AppRoutes() {
  useSessionTimeout()
  useKeyboardShortcuts()
  useServiceWorker()

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout><AdminDashboardNew /></AdminLayout>} />
        <Route path="/admin/users" element={<AdminLayout><AdminUsers /></AdminLayout>} />
        <Route path="/admin/logs" element={<AdminLayout><AdminLogs /></AdminLayout>} />
        <Route path="/admin/backups" element={<AdminLayout><AdminBackups /></AdminLayout>} />
        <Route path="/admin/settings" element={<AdminLayout><AdminSettings /></AdminLayout>} />

        {/* Public Routes - No Navbar */}
        <Route path="/login" element={<PublicLayout><LoginNew /></PublicLayout>} />
        <Route path="/signup" element={<PublicLayout><SignupNew /></PublicLayout>} />

        {/* Authenticated Routes with Navbar */}
        <Route path="/profile" element={<MainLayout><UserProfile /></MainLayout>} />
        <Route path="/modes" element={<MainLayout><ModeSelectionNew /></MainLayout>} />
        <Route path="/upload" element={<MainLayout><UploadAnalysis /></MainLayout>} />
        <Route path="/analysis/criminal" element={<MainLayout><CriminalAnalysis /></MainLayout>} />
        <Route path="/analysis/interview" element={<MainLayout><InterviewAnalysis /></MainLayout>} />
        <Route path="/analysis/business" element={<MainLayout><BusinessAnalysis /></MainLayout>} />
        <Route path="/microphone" element={<MainLayout><MicrophoneStream /></MainLayout>} />
        
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
    </Suspense>
  )
}

export default function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
  
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <ThemeProvider>
        <NotificationsProvider>
          <Router>
            <AppRoutes />
          </Router>
        </NotificationsProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  )
}
