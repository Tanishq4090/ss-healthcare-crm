import { useState } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Eye, EyeOff, Stethoscope, Lock, User } from 'lucide-react'

const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'secure_demo_pass_2026'

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

      // Admin shortcut — hardcoded for robustness
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        login('admin')
        navigate('/', { replace: true })
        return
      }

      throw new Error('Invalid username or password.')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{
        background:
          'radial-gradient(circle at top right, rgba(0,168,89,0.15), transparent 40%), radial-gradient(circle at bottom left, rgba(0,76,140,0.12), transparent 40%), linear-gradient(160deg, #f0fbf5 0%, #e8f4ff 100%)',
      }}
    >
      {/* Decorative blobs */}
      <div
        className="pointer-events-none fixed left-[-80px] top-[-80px] h-80 w-80 rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, #00A859, transparent 70%)' }}
      />
      <div
        className="pointer-events-none fixed bottom-[-80px] right-[-80px] h-96 w-96 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #004C8C, transparent 70%)' }}
      />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div
          className="rounded-3xl border bg-white/95 p-8 shadow-2xl backdrop-blur-xl"
          style={{ borderColor: 'rgba(0,168,89,0.18)', boxShadow: '0 32px 80px rgba(0,76,140,0.12), 0 8px 24px rgba(0,168,89,0.08)' }}
        >
          {/* Logo & Brand */}
          <div className="mb-8 flex flex-col items-center gap-4 text-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg"
              style={{ background: 'linear-gradient(135deg, #00A859, #004C8C)' }}
            >
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-950">SS Health Care</h1>
              <p className="mt-1 text-sm font-medium text-slate-500">AI CRM — Admin Portal</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500" htmlFor="username">
                Username
              </label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: '#00A859' }}
                />
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

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: '#00A859' }}
                />
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="field-control w-full pl-11 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Signing in…
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-slate-400">
            SS Health Care AI CRM &nbsp;·&nbsp; Powered by Supabase + Callyzer
          </p>
        </div>
      </div>
    </div>
  )
}
