import { useState } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Eye, EyeOff, Stethoscope, Lock, User } from 'lucide-react'

const ADMIN_USERNAME = 'admin'
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Try Supabase email/password auth first (for non-admin users)
      if (username !== ADMIN_USERNAME) {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: `${username}@ss-healthcare.com`,
          password,
        })
        if (authError) throw new Error('Invalid credentials.')
        login()
        navigate('/', { replace: true })
        return
      }

      const response = await fetch(`${BACKEND_URL}/api/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) throw new Error('Invalid username or password.')

      const data = await response.json()
      login(data?.user?.name || 'System Admin')
      navigate('/', { replace: true })
      return
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 clinical-canvas">
      {/* Decorative blobs */}
      <div className="pointer-events-none fixed left-[-80px] top-[-80px] h-96 w-96 rounded-full opacity-[0.15] blur-3xl bg-[#00A859]" />
      <div className="pointer-events-none fixed bottom-[-80px] right-[-80px] h-[30rem] w-[30rem] rounded-full opacity-[0.12] blur-3xl bg-[#004C8C]" />

      <div className="relative w-full max-w-md animate-slide-in">
        <div className="clinical-surface p-8 sm:p-10">
          {/* Logo & Brand */}
          <div className="mb-10 flex flex-col items-center gap-5 text-center">
            <div className="h-16 flex items-center justify-center">
              <img 
                src="/logo.png" 
                alt="SS Health Care" 
                className="h-full object-contain drop-shadow-sm" 
                onError={(e) => { 
                  e.currentTarget.style.display = 'none'; 
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.className = 'flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg';
                    parent.style.background = 'linear-gradient(135deg, #00A859, #004C8C)';
                    parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-stethoscope"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>';
                  }
                }} 
              />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">SS Health Care</h1>
              <p className="mt-1.5 text-sm font-medium text-slate-500">Admin Operations System</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1" htmlFor="username">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400" />
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                  className="field-control w-full pl-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400" />
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="field-control w-full pl-11 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-[#00A859]/20"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600 animate-slide-in font-medium flex items-start gap-2">
                <svg className="w-4 h-4 shrink-0 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-12 text-base mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Authenticating...
                </span>
              ) : (
                'Secure Login'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Protected by SS Health Care Operations OS
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
