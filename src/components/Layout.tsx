import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import {
  Bell,
  BellRing,
  Briefcase,
  ChevronLeft,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  PhoneCall,
  Search,
  Server,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { AccessModule } from '@/contexts/AuthContext';

/* ── Navigation config ─────────────────────────────────────── */
const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true, requiredModule: null },
  { name: 'CRM', href: '/admin/crm', icon: Users, requiredModule: 'crm' as AccessModule },
  { name: 'Clients', href: '/admin/clients', icon: Users, requiredModule: 'clients' as AccessModule },
  { name: 'HR', href: '/admin/hr', icon: Briefcase, requiredModule: 'hr' as AccessModule },
  { name: 'Finance', href: '/admin/billing', icon: Landmark, requiredModule: 'finance' as AccessModule },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

const SS_NOTIFICATIONS = [
  {
    id: 1,
    title: 'System Update',
    body: 'SS Health Care OS has been updated with new CRM features.',
    time: 'Just now',
  },
  {
    id: 2,
    title: 'Callyzer Weekly Report',
    body: 'Your team handled incoming calls and logged new leads this week.',
    time: '2 hours ago',
  },
  {
    id: 3,
    title: 'Payment Received',
    body: 'A new deposit has been recorded for an active worker deployment.',
    time: 'Yesterday',
  },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasAccess } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(SS_NOTIFICATIONS.length);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [notifOpen]);

  const filteredNav = navItems.filter((item) => {
    if (!item.requiredModule) return true;
    return hasAccess(item.requiredModule);
  });

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* ── Mobile overlay ───────────────────────────────── */}
      <button
        type="button"
        aria-label="Close navigation"
        onClick={() => setMobileOpen(false)}
        className={`fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm transition-opacity lg:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* ── Sidebar ──────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo bar */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-6">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'linear-gradient(135deg, #00A859, #004C8C)' }}
          >
            <img src="/logo.png" alt="" className="h-5 w-5 object-contain brightness-0 invert" />
          </div>
          <span className="text-lg font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
            SS Health Care
          </span>
          {/* Mobile close */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="ml-auto p-1 text-slate-400 hover:text-slate-600 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Live status card */}
        <div className="mx-4 mt-4 rounded-xl border px-4 py-3" style={{ borderColor: 'rgba(0,168,89,0.2)', background: 'rgba(0,168,89,0.05)' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm" style={{ color: '#00A859' }}>
              <BellRing className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Care Ops Live</p>
              <p className="text-[11px] text-slate-500">Callyzer, CRM and workforce sync</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
          {filteredNav.map((item) => {
            const active = isActive(location.pathname, item.href, item.exact);
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[#00A859]/10 text-[#004C8C]'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon className={`h-5 w-5 ${active ? 'text-[#00A859]' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Settings link (admin only) */}
        {user?.role === 'admin' && (
          <div className="px-4 pb-2 space-y-1">
            <Link
              to="/admin/settings"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive(location.pathname, '/admin/settings')
                  ? 'bg-[#00A859]/10 text-[#004C8C]'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className={`h-5 w-5 ${isActive(location.pathname, '/admin/settings') ? 'text-[#00A859]' : 'text-slate-400'}`} />
              Access Control
            </Link>
            <Link
              to="/admin/system"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive(location.pathname, '/admin/system')
                  ? 'bg-[#00A859]/10 text-[#004C8C]'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Server className={`h-5 w-5 ${isActive(location.pathname, '/admin/system') ? 'text-[#00A859]' : 'text-slate-400'}`} />
              System Status
            </Link>
          </div>
        )}

        {/* User info & logout */}
        <div className="border-t border-slate-100 p-4">
          <div className="mb-2 flex items-center gap-3 px-3 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200">
              <span className="text-sm font-semibold text-slate-600">{user?.avatar || 'U'}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{user?.name || 'User'}</p>
              <p className="truncate text-xs capitalize text-slate-500">{user?.role?.replace('_', ' ') || 'Guest'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content area ────────────────────────────── */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
          {/* Mobile menu */}
          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex items-center gap-2 rounded-lg p-2 text-slate-600 hover:bg-slate-50"
            >
              <Menu className="h-5 w-5" />
              <span className="text-sm font-bold" style={{ color: '#00A859' }}>SS HC</span>
            </button>
          </div>

          {/* Search */}
          <div className="mx-auto hidden max-w-lg flex-1 sm:flex lg:mx-0">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search patients, appointments, revenues..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm transition-all focus:border-[#00A859] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00A859]/20"
              />
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3 ml-auto">
            <span
              className="hidden rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider sm:inline-flex"
              style={{ background: 'rgba(0,168,89,0.10)', color: '#004C8C' }}
            >
              Live
            </span>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                id="notification-bell-btn"
                onClick={() => setNotifOpen((o) => !o)}
                className="relative p-2 text-slate-400 transition-colors hover:text-slate-600 rounded-lg hover:bg-slate-50"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
                )}
              </button>

              {/* Dropdown panel */}
              {notifOpen && (
                <div
                  id="notification-dropdown"
                  className="absolute right-0 top-full mt-2 w-[340px] rounded-2xl border border-slate-100 bg-white shadow-xl z-50 overflow-hidden"
                  style={{ boxShadow: '0 20px 40px -8px rgba(0,76,140,0.12)' }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <span className="text-sm font-bold text-slate-900">Notifications</span>
                    {unreadCount > 0 && (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold"
                        style={{ background: 'rgba(0,168,89,0.12)', color: '#00A859' }}
                      >
                        {unreadCount} New
                      </span>
                    )}
                  </div>

                  {/* Notification items */}
                  <div className="divide-y divide-slate-50">
                    {SS_NOTIFICATIONS.map((n, i) => (
                      <div
                        key={n.id}
                        className="flex gap-3 px-5 py-4 hover:bg-slate-50 transition-colors cursor-default"
                        style={i === 0 ? { borderLeft: '3px solid #00A859' } : { borderLeft: '3px solid transparent' }}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-bold text-slate-900">{n.title}</p>
                          <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">{n.body}</p>
                          <p className="text-[11px] font-medium text-slate-400 mt-1.5">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="px-5 py-3.5 border-t border-slate-100">
                    <button
                      id="mark-all-read-btn"
                      onClick={() => { setUnreadCount(0); setNotifOpen(false); }}
                      className="text-sm font-semibold transition-colors"
                      style={{ color: '#00A859' }}
                    >
                      Mark all as read
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
