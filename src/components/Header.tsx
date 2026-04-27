import { Bell, ExternalLink, Menu, Search } from 'lucide-react';
import { useLocation } from 'react-router';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Centralized patient insights and care operations.' },
  '/ai-crm': { title: 'AI CRM', subtitle: 'Lead intelligence and patient engagement workflows.' },
  '/clients': { title: 'Clients', subtitle: 'Patient and provider records in one place.' },
  '/ai-hr': { title: 'AI HR', subtitle: 'Healthcare staffing, schedules and payroll.' },
  '/finance': { title: 'Finance', subtitle: 'Revenue tracking, billing and forecasts.' },
  '/access-control': { title: 'Access Control', subtitle: 'Permissions and team security settings.' },
};

export default function Header({
  sidebarCollapsed,
  onMenuClick,
}: {
  sidebarCollapsed?: boolean;
  onMenuClick?: () => void;
}) {
  const location = useLocation();
  const pageInfo = pageTitles[location.pathname] || { title: '', subtitle: '' };

  return (
    <header
      className={`clinical-header fixed left-4 right-4 top-4 z-40 flex flex-col gap-3 px-4 py-4 transition-all duration-300 sm:flex-row sm:items-center sm:justify-between ${
        sidebarCollapsed ? 'lg:left-[104px]' : 'lg:left-[304px]'
      }`}
    >
      <div className="flex flex-1 items-center gap-4 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-11 w-11 items-center justify-center rounded-3xl border border-slate-200 bg-white text-slate-600 shadow-sm lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-900/70">SS Health Care</p>
          <h1 className="truncate text-xl font-extrabold text-slate-950 sm:text-2xl">{pageInfo.title}</h1>
          <p className="mt-1 hidden text-sm text-slate-500 sm:block">{pageInfo.subtitle}</p>
        </div>
      </div>

      <div className="hidden flex-1 justify-center px-4 md:flex">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search patients, appointments, revenues..."
            className="field-control w-full pl-12 pr-4"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="rounded-full bg-cyan-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-900">
          Live
        </span>
        <button type="button" className="btn-secondary hidden items-center gap-2 sm:inline-flex">
          <ExternalLink className="h-4 w-4" />
          Customize
        </button>
        <button type="button" className="btn-primary hidden items-center gap-2 sm:inline-flex">
          Export
        </button>
        <button
          type="button"
          className="relative inline-flex h-11 w-11 items-center justify-center rounded-3xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-cyan-200 hover:text-cyan-700"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>
      </div>
    </header>
  );
}
