import { Navigate, Routes, Route } from 'react-router'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import AICRM from './pages/AICRM'
import Clients from './pages/Clients'
import AIHR from './pages/AIHR'
import Finance from './pages/Finance'
import AccessControl from './pages/AccessControl'
import LoginPage from './pages/LoginPage.tsx'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200" style={{ borderTopColor: '#00A859' }} />
          <p className="text-sm font-semibold text-slate-500">Loading...</p>
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
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/ai-crm" element={<AICRM />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/ai-hr" element={<AIHR />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/access-control" element={<AccessControl />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
