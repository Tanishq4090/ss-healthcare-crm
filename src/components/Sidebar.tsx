import { NavLink, useLocation, useNavigate } from 'react-router';
import {
  BellRing,
  Bot,
  Briefcase,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Landmark,
  LayoutDashboard,
  LogOut,
  PhoneCall,
  ShieldCheck,
  Server,
  Stethoscope,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/admin/crm', label: 'AI CRM', icon: Users },
  { path: '/admin/clients', label: 'Clients', icon: Users },
  { path: '/admin/hr', label: 'AI HR', icon: Briefcase },
  { path: '/admin/billing', label: 'Finance', icon: Landmark },
  { path: '/admin/settings', label: 'Access Control', icon: ShieldCheck },
  { path: '/admin/system', label: 'System Status', icon: Server },
];

function isActivePath(pathname: string, path: string, exact?: boolean) {
  if (exact) return pathname === path;
  return pathname === path || pathname.startsWith(`${path}/`);
}

export default function Sidebar({
  collapsed,
  mobileOpen,
  onCollapseChange,
  onMobileClose,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
  onMobileClose?: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <button
        type="button"
        aria-label="Close navigation"
        onClick={onMobileClose}
        className={cn(
          'fixed inset-0 z-40 bg-slate-950/25 backdrop-blur-sm transition-opacity lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      />

      <aside
        className={cn(
          'fixed bottom-4 left-4 top-4 z-50 flex w-[280px] flex-col rounded-[1.5rem] bg-white/95 backdrop-blur-xl transition-all duration-300',
          'border border-slate-100 shadow-[0_8px_30px_-4px_rgba(0,76,140,0.1)]',
          mobileOpen ? 'translate-x-0' : '-translate-x-[calc(100%+2rem)]',
          collapsed ? 'lg:w-[72px]' : 'lg:w-[272px]',
          'lg:translate-x-0'
        )}
      >
        <div className={cn('flex h-[84px] items-center border-b border-slate-100 px-4', collapsed ? 'lg:justify-center' : 'gap-3')}>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00A859]/10 to-[#004C8C]/5 border border-[#00A859]/20 shadow-sm">
            <img src="/logo.png" alt="SS Health Care" className="h-8 w-8 object-contain drop-shadow-sm" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.insertAdjacentHTML('beforeend', '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00A859" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-stethoscope"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>'); }} />
          </div>
          <div className={cn('min-w-0', collapsed && 'lg:hidden')}>
            <span className="block truncate text-sm font-extrabold text-slate-900 tracking-tight">SS Health Care</span>
            <span className="mt-1 inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-[#004C8C]/5 text-[#004C8C] border border-[#004C8C]/10">
              Operations CRM
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onCollapseChange?.(!collapsed)}
          className="absolute -right-3 top-[84px] hidden h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:text-[#00A859] hover:border-[#00A859]/30 lg:flex"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>

        <div className={cn('px-4 py-4', collapsed && 'lg:px-3')}>
          <div className={cn('rounded-xl p-3 border border-[#00A859]/20 bg-gradient-to-r from-[#00A859]/5 to-transparent', collapsed && 'lg:flex lg:justify-center lg:p-2')}>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm border border-slate-100 text-[#00A859]">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className={cn('min-w-0', collapsed && 'lg:hidden')}>
                <span className="block truncate text-xs font-bold text-slate-900">Secure Access</span>
                <span className="block truncate text-[10px] text-slate-500 font-medium">Verified Session</span>
              </div>
            </div>
          </div>
        </div>

        <nav className={cn('flex-1 overflow-y-auto px-3 pb-4', collapsed && 'lg:px-2')} aria-label="Sidebar">
          {navItems.map((item) => {
            const isActive = isActivePath(location.pathname, item.path, item.exact);
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onMobileClose}
                className={cn(
                  'group mb-1.5 flex items-center rounded-xl border border-transparent px-3 py-2.5 text-sm font-semibold transition-all',
                  collapsed ? 'lg:justify-center lg:px-2' : 'gap-3',
                  isActive ? 'shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                )}
                style={isActive ? { border: '1px solid rgba(0,168,89,0.2)', background: 'rgba(0,168,89,0.06)', color: '#004C8C' } : {}}
              >
                <Icon className={cn("h-[18px] w-[18px] shrink-0 transition-colors", isActive ? 'text-[#00A859]' : 'text-slate-400 group-hover:text-slate-600')} />
                <span className={cn('truncate', collapsed && 'lg:hidden')}>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="mx-4 border-t border-slate-100" />

        <div className={cn('p-4', collapsed && 'lg:px-3')}>
          <div className={cn('flex items-center gap-3 rounded-2xl p-3 bg-slate-50 border border-slate-100', collapsed && 'lg:justify-center lg:p-2')}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm bg-gradient-to-br from-[#00A859] to-[#004C8C]">
              <Stethoscope className="h-4 w-4" />
            </div>
            <div className={cn('min-w-0', collapsed && 'lg:hidden')}>
              <span className="block truncate text-sm font-bold text-slate-900">{user?.name || 'System Admin'}</span>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{user?.role === 'admin' ? 'Admin' : 'Staff'}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              'mt-3 flex w-full items-center rounded-lg px-3 py-2 text-sm font-semibold text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-600',
              collapsed ? 'justify-center gap-0 lg:px-2' : 'gap-2'
            )}
          >
            <LogOut className="h-4 w-4" />
            <span className={cn(collapsed && 'lg:hidden')}>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
