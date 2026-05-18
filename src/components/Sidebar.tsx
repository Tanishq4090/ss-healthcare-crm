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
          'fixed bottom-4 left-4 top-4 z-50 flex w-[280px] flex-col rounded-[1.5rem] border border-slate-200/80 bg-white/95 shadow-soft backdrop-blur-xl transition-all duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-[calc(100%+2rem)]',
          collapsed ? 'lg:w-[72px]' : 'lg:w-[272px]',
          'lg:translate-x-0'
        )}
      >
        <div className={cn('flex h-[84px] items-center border-b border-slate-100 px-4', collapsed ? 'lg:justify-center' : 'gap-3')}>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-3xl ring-1" style={{ background: 'rgba(0,168,89,0.10)', '--tw-ring-color': 'rgba(0,168,89,0.2)' } as React.CSSProperties}>
            <img src="/logo.png" alt="SS Health Care" className="h-8 w-8 object-contain" />
          </div>
          <div className={cn('min-w-0', collapsed && 'lg:hidden')}>
            <span className="block truncate text-sm font-extrabold text-slate-950">SS Health Care</span>
            <span className="mt-1 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ background: 'rgba(0,168,89,0.10)', color: '#004C8C' }}>
              Operations CRM
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onCollapseChange?.(!collapsed)}
          className="absolute -right-3 top-[84px] hidden h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:text-cyan-700 lg:flex"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>

        <div className={cn('px-4 py-4', collapsed && 'lg:px-3')}>
          <div className={cn('rounded-lg p-3', collapsed && 'lg:flex lg:justify-center lg:p-2')} style={{ border: '1px solid rgba(0,168,89,0.18)', background: 'rgba(0,168,89,0.07)' }}>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm" style={{ color: '#00A859' }}>
                <BellRing className="h-4 w-4" />
              </div>
              <div className={cn('min-w-0', collapsed && 'lg:hidden')}>
                <p className="truncate text-xs font-bold text-slate-800">Care Ops Live</p>
                <p className="truncate text-[11px] text-slate-500">Callyzer, CRM and workforce sync</p>
              </div>
            </div>
          </div>
        </div>

        <nav className={cn('flex-1 overflow-y-auto px-3 pb-4', collapsed && 'lg:px-2')}>
          {navItems.map((item) => {
            const isActive = isActivePath(location.pathname, item.path, item.exact);
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onMobileClose}
                className={cn(
                  'group mb-1 flex items-center rounded-lg border border-transparent px-3 py-3 text-sm font-semibold transition-all',
                  collapsed ? 'lg:justify-center lg:px-2' : 'gap-3',
                  isActive ? 'shadow-sm' : 'text-slate-500 hover:border-slate-200 hover:bg-white hover:text-slate-900'
                )}
                style={isActive ? { border: '1px solid rgba(0,168,89,0.22)', background: 'rgba(0,168,89,0.08)', color: '#003d70' } : {}}
              >
                <Icon className="h-5 w-5 shrink-0" style={{ color: isActive ? '#00A859' : undefined }} />
                <span className={cn('truncate', collapsed && 'lg:hidden')}>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="mx-4 border-t border-slate-100" />

        <div className={cn('p-4', collapsed && 'lg:px-3')}>
          <div className={cn('flex items-center gap-3 rounded-2xl p-3', collapsed && 'lg:justify-center lg:p-2')} style={{ background: 'rgba(0,168,89,0.07)' }}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-3xl text-white shadow-sm" style={{ background: 'linear-gradient(135deg,#00A859,#004C8C)' }}>
              <Stethoscope className="h-4 w-4" />
            </div>
            <div className={cn('min-w-0', collapsed && 'lg:hidden')}>
              <span className="block truncate text-sm font-bold text-slate-950">{user?.name || 'System Admin'}</span>
              <span className="text-xs text-slate-500">{user?.role === 'admin' ? 'Admin' : 'Staff'}</span>
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
