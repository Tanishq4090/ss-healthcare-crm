import { Navigate, Routes, Route } from 'react-router'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/layout/Layout'
import AdminLayout from './admin/AdminLayout'
import Dashboard from './admin/Dashboard'
import CRM from './admin/CRM'
import Clients from './admin/Clients'
import HR from './admin/HR'
import Finance from './admin/Billing'
import AccessControl from './admin/AccessControl'

import LoginPage from './pages/LoginPage.tsx'
import PublicStaffIDCard from './pages/PublicStaffIDCard.tsx'
import HomePage from './pages/public/HomePage.tsx'
import AboutPage from './pages/public/AboutPage.tsx'
import ServicesPage from './pages/public/ServicesPage.tsx'
import BlogPage from './pages/public/BlogPage.tsx'
import ContactPage from './pages/public/ContactPage.tsx'
import AppointmentPage from './pages/public/AppointmentPage.tsx'
import PrivacyPolicyPage from './pages/public/PrivacyPolicyPage.tsx'
import TermsPage from './pages/public/TermsPage.tsx'

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

      {/* Public Pages */}
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/appointment" element={<AppointmentPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
      </Route>

      {/* Admin Pages */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="crm" element={<CRM />} />
        <Route path="calls" element={<Navigate to="/admin/crm" replace />} />
        <Route path="clients" element={<Clients />} />
        <Route path="hr" element={<HR />} />
        <Route path="attendance" element={<Navigate to="/admin/hr" replace />} />
        <Route path="billing" element={<Finance />} />
        <Route path="settings" element={<AccessControl />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>

      {/* Legacy Fallbacks */}
      <Route path="/ai-crm" element={<Navigate to="/admin/crm" replace />} />
      <Route path="/call-review" element={<Navigate to="/admin/crm" replace />} />
      <Route path="/clients" element={<Navigate to="/admin/clients" replace />} />
      <Route path="/ai-hr" element={<Navigate to="/admin/hr" replace />} />
      <Route path="/manual-attendance" element={<Navigate to="/admin/hr" replace />} />
      <Route path="/finance" element={<Navigate to="/admin/billing" replace />} />
      <Route path="/access-control" element={<Navigate to="/admin/settings" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
