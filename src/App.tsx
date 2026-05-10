import { Navigate, Routes, Route } from 'react-router'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import AICRM from './pages/AICRM'
import Clients from './pages/Clients'
import AIHR from './pages/AIHR'
import Finance from './pages/Finance'
import AccessControl from './pages/AccessControl'
import CallReviewInbox from './pages/CallReviewInbox'
import ManualAttendance from './pages/ManualAttendance'
import SystemStatus from './pages/SystemStatus'
import LoginPage from './pages/LoginPage.tsx'
import PublicStaffIDCard from './pages/PublicStaffIDCard.tsx'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200" style={{ borderTopColor: '#00A859' }} />
          <p className="text-sm font-semibold text-slate-500">Loading SS Health Care OS...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/staff-id/:token" element={<PublicStaffIDCard />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Primary SS Healthcare admin routes */}
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/crm" element={<AICRM />} />
        <Route path="/admin/calls" element={<CallReviewInbox />} />
        <Route path="/admin/clients" element={<Clients />} />
        <Route path="/admin/hr" element={<AIHR />} />
        <Route path="/admin/attendance" element={<ManualAttendance />} />
        <Route path="/admin/billing" element={<Finance />} />
        <Route path="/admin/settings" element={<AccessControl />} />
        <Route path="/admin/system" element={<SystemStatus />} />

        {/* Backward-compatible routes from the current SS app */}
        <Route path="/ai-crm" element={<Navigate to="/admin/crm" replace />} />
        <Route path="/call-review" element={<Navigate to="/admin/calls" replace />} />
        <Route path="/clients" element={<Navigate to="/admin/clients" replace />} />
        <Route path="/ai-hr" element={<Navigate to="/admin/hr" replace />} />
        <Route path="/manual-attendance" element={<Navigate to="/admin/attendance" replace />} />
        <Route path="/finance" element={<Navigate to="/admin/billing" replace />} />
        <Route path="/access-control" element={<Navigate to="/admin/settings" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}
