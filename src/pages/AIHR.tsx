import { useState } from 'react';
import { AlertCircle, Bot, Calendar, CheckCircle2, DollarSign, Filter, MoreHorizontal, Plus, Search, UserX } from 'lucide-react';
import { IconFrame, PageShell, SectionHeader, StatusBadge, Surface } from '@/components/AppPrimitives';

interface Worker {
  id: string;
  name: string;
  role: string;
  client: string;
  status: 'Active' | 'On Leave' | 'Terminated';
  startDate: string;
  avatar: string;
}

const workers: Worker[] = [
  { id: '1', name: 'Ramesh Patel', role: 'Nurse', client: 'Apollo Hospitals', status: 'Active', startDate: 'Jan 15, 2026', avatar: 'RP' },
  { id: '2', name: 'Sunita Devi', role: 'Caregiver', client: 'Fortis Healthcare', status: 'Active', startDate: 'Feb 1, 2026', avatar: 'SD' },
  { id: '3', name: 'Arjun Kumar', role: 'Physiotherapist', client: 'Max Hospital', status: 'On Leave', startDate: 'Mar 10, 2026', avatar: 'AK' },
  { id: '4', name: 'Lakshmi Rao', role: 'Nurse', client: 'Apollo Hospitals', status: 'Active', startDate: 'Dec 5, 2025', avatar: 'LR' },
  { id: '5', name: 'Mohammed Ali', role: 'Ward Boy', client: 'Narayana Health', status: 'Terminated', startDate: 'Nov 20, 2025', avatar: 'MA' },
  { id: '6', name: 'Priya Nair', role: 'Caregiver', client: 'Cloudnine Care', status: 'Active', startDate: 'Apr 1, 2026', avatar: 'PN' },
];

const statusStyles = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  'On Leave': 'bg-amber-50 text-amber-700 border-amber-100',
  Terminated: 'bg-rose-50 text-rose-700 border-rose-100',
};

export default function AIHR() {
  const [search, setSearch] = useState('');

  const filteredWorkers = workers.filter(
    (worker) =>
      worker.name.toLowerCase().includes(search.toLowerCase()) ||
      worker.client.toLowerCase().includes(search.toLowerCase()) ||
      worker.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageShell>
      <Surface className="bg-gradient-to-br from-white via-cyan-50/40 to-emerald-50/60">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-cyan-700">Workforce intelligence</p>
            <h2 className="mt-1 text-2xl font-extrabold text-slate-950">AI HR deployment center</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Match workers, monitor staffing readiness, and process payroll actions with clear status context.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { value: '18', label: 'Active workers' },
              { value: '3', label: 'Ready to deploy' },
              { value: '2', label: 'Onboarding' },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-white/80 bg-white/75 px-4 py-3 shadow-sm">
                <p className="text-xl font-extrabold text-slate-950">{item.value}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Surface>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_0.8fr]">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search workers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="field-control w-full pl-10 pr-4"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className="btn-secondary">
                <Filter className="h-4 w-4" />
                Filter
              </button>
              <button type="button" className="btn-primary">
                <Plus className="h-4 w-4" />
                Add Worker
              </button>
            </div>
          </div>

          <div className="table-shell">
            <div className="clinical-content overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="table-heading px-6 py-4">Worker</th>
                    <th className="table-heading px-6 py-4">Role</th>
                    <th className="table-heading px-6 py-4">Client</th>
                    <th className="table-heading px-6 py-4">Status</th>
                    <th className="table-heading px-6 py-4">Start Date</th>
                    <th className="table-heading px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorkers.map((worker) => (
                    <tr key={worker.id} className="border-b border-slate-100/80 transition-colors hover:bg-cyan-50/40">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-600 to-emerald-500 text-xs font-extrabold text-white shadow-sm">
                            {worker.avatar}
                          </div>
                          <span className="text-sm font-bold text-slate-950">{worker.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">{worker.role}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">{worker.client}</td>
                      <td className="px-6 py-4">
                        <StatusBadge className={statusStyles[worker.status]}>
                          {worker.status === 'Active' && <CheckCircle2 className="h-3.5 w-3.5" />}
                          {worker.status === 'On Leave' && <AlertCircle className="h-3.5 w-3.5" />}
                          {worker.status === 'Terminated' && <UserX className="h-3.5 w-3.5" />}
                          {worker.status}
                        </StatusBadge>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">{worker.startDate}</td>
                      <td className="px-6 py-4 text-right">
                        <button type="button" className="rounded-md p-1 text-slate-300 transition-colors hover:bg-white hover:text-slate-500" aria-label="Worker actions">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <Surface>
            <SectionHeader
              title="AI Auto-Deploy"
              description="3 workers are ready for deployment based on demand and skill matching."
              action={<IconFrame icon={Bot} tone="cyan" className="h-10 w-10" />}
            />
            <button type="button" className="btn-primary mt-5 w-full">
              Review & Deploy
            </button>
          </Surface>

          <Surface>
            <SectionHeader
              title="Process Payroll"
              description="Auto-payroll is prepared for the active workforce."
              action={<IconFrame icon={DollarSign} tone="emerald" className="h-10 w-10" />}
            />
            <div className="mt-5 flex items-center justify-between rounded-lg bg-emerald-50/70 p-4">
              <span className="text-sm font-semibold text-slate-600">Active workers</span>
              <span className="text-2xl font-extrabold text-slate-950">18</span>
            </div>
            <button type="button" className="btn-primary mt-4 w-full">
              Run Auto-Payroll
            </button>
          </Surface>

          <Surface>
            <SectionHeader
              title="Upcoming Onboarding"
              action={<IconFrame icon={Calendar} tone="amber" className="h-10 w-10" />}
            />
            <div className="mt-5 space-y-3">
              {[
                { name: 'Vikram Singh', role: 'Nurse', date: 'Apr 28', client: 'Apollo Hospitals' },
                { name: 'Ananya Gupta', role: 'Caregiver', date: 'Apr 30', client: 'Fortis Healthcare' },
                { name: 'Karthik Iyer', role: 'Physiotherapist', date: 'May 2', client: 'Max Hospital' },
              ].map((item) => (
                <div key={item.name} className="flex items-start gap-3 rounded-lg border border-slate-100 bg-white/75 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-xs font-extrabold text-cyan-700">
                    {item.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-950">{item.name}</p>
                    <p className="truncate text-xs font-medium text-slate-500">{item.role} - {item.client}</p>
                  </div>
                  <span className="text-xs font-bold text-cyan-700">{item.date}</span>
                </div>
              ))}
            </div>
          </Surface>
        </div>
      </div>
    </PageShell>
  );
}
