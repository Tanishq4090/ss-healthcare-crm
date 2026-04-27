import { useState } from 'react';
import { CheckCircle2, Key, Lock, MoreHorizontal, Search, ShieldCheck, Unlock, UserPlus } from 'lucide-react';
import { IconFrame, PageShell, SectionHeader, StatusBadge, Surface } from '@/components/AppPrimitives';
import { cn } from '@/lib/utils';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
  lastActive: string;
  avatar: string;
}

const teamMembers: TeamMember[] = [
  { id: '1', name: 'Amit Sharma', email: 'amit@sshealthcare.com', role: 'Super Admin', status: 'Active', lastActive: 'Now', avatar: 'AS' },
  { id: '2', name: 'Neha Reddy', email: 'neha@sshealthcare.com', role: 'Admin', status: 'Active', lastActive: '2 hrs ago', avatar: 'NR' },
  { id: '3', name: 'Rahul Kumar', email: 'rahul@sshealthcare.com', role: 'Finance Manager', status: 'Active', lastActive: '5 hrs ago', avatar: 'RK' },
  { id: '4', name: 'Priya Patel', email: 'priya@sshealthcare.com', role: 'HR Manager', status: 'Active', lastActive: '1 day ago', avatar: 'PP' },
  { id: '5', name: 'Vikram Singh', email: 'vikram@sshealthcare.com', role: 'Sales Rep', status: 'Inactive', lastActive: '7 days ago', avatar: 'VS' },
  { id: '6', name: 'Ananya Gupta', email: 'ananya@sshealthcare.com', role: 'Sales Rep', status: 'Active', lastActive: '3 hrs ago', avatar: 'AG' },
];

const roleColors: Record<string, string> = {
  'Super Admin': 'bg-violet-50 text-violet-700 border-violet-100',
  Admin: 'bg-blue-50 text-blue-700 border-blue-100',
  'Finance Manager': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  'HR Manager': 'bg-cyan-50 text-cyan-700 border-cyan-100',
  'Sales Rep': 'bg-slate-50 text-slate-600 border-slate-200',
};

const modules = ['Dashboard', 'AI CRM', 'Clients', 'AI HR', 'Finance', 'Settings'];

const rolePermissions: Record<string, boolean[]> = {
  'Super Admin': [true, true, true, true, true, true],
  Admin: [true, true, true, true, true, false],
  'Finance Manager': [true, false, false, false, true, false],
  'HR Manager': [true, false, false, true, false, false],
  'Sales Rep': [true, true, true, false, false, false],
};

export default function AccessControl() {
  const [search, setSearch] = useState('');
  const [showMatrix, setShowMatrix] = useState(false);

  const filtered = teamMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(search.toLowerCase()) ||
      member.email.toLowerCase().includes(search.toLowerCase()) ||
      member.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageShell>
      <Surface className="bg-gradient-to-br from-white via-cyan-50/40 to-emerald-50/60">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <IconFrame icon={ShieldCheck} tone="cyan" className="h-12 w-12" />
            <div>
              <p className="text-xs font-bold uppercase text-cyan-700">Security workspace</p>
              <h2 className="text-2xl font-extrabold text-slate-950">Access Control</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                Review team access, role status, and permission coverage across care operations modules.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { value: '6', label: 'Members' },
              { value: '5', label: 'Roles' },
              { value: '1', label: 'Inactive' },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-white/80 bg-white/75 px-4 py-3 shadow-sm">
                <p className="text-xl font-extrabold text-slate-950">{item.value}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Surface>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search team members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field-control w-full pl-10 pr-4"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowMatrix(!showMatrix)}
            className="btn-secondary"
          >
            <Key className="h-4 w-4" />
            {showMatrix ? 'Hide' : 'Show'} Permission Matrix
          </button>
          <button type="button" className="btn-primary">
            <UserPlus className="h-4 w-4" />
            Add Member
          </button>
        </div>
      </div>

      <div className="table-shell">
        <div className="clinical-content overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="table-heading px-6 py-4">Name</th>
                <th className="table-heading px-6 py-4">Email</th>
                <th className="table-heading px-6 py-4">Role</th>
                <th className="table-heading px-6 py-4">Status</th>
                <th className="table-heading px-6 py-4">Last Active</th>
                <th className="table-heading px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((member) => (
                <tr key={member.id} className="border-b border-slate-100/80 transition-colors hover:bg-cyan-50/40">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-600 to-emerald-500 text-xs font-extrabold text-white shadow-sm">
                        {member.avatar}
                      </div>
                      <span className="text-sm font-bold text-slate-950">{member.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-500">{member.email}</td>
                  <td className="px-6 py-4">
                    <StatusBadge className={roleColors[member.role]}>{member.role}</StatusBadge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {member.status === 'Active' ? (
                        <Unlock className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Lock className="h-4 w-4 text-slate-400" />
                      )}
                      <span className={cn('text-sm font-bold', member.status === 'Active' ? 'text-emerald-700' : 'text-slate-500')}>
                        {member.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-500">{member.lastActive}</td>
                  <td className="px-6 py-4 text-right">
                    <button type="button" className="rounded-md p-1 text-slate-300 transition-colors hover:bg-white hover:text-slate-500" aria-label="Member actions">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showMatrix && (
        <Surface>
          <SectionHeader
            title="Permission Matrix"
            description="Module-level access by role."
            action={<IconFrame icon={ShieldCheck} tone="emerald" className="h-10 w-10" />}
          />
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="table-heading px-4 py-4">Role / Module</th>
                  {modules.map((module) => (
                    <th key={module} className="table-heading px-4 py-4 text-center">
                      {module}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(rolePermissions).map(([role, permissions]) => (
                  <tr key={role} className="border-b border-slate-100/80 transition-colors hover:bg-cyan-50/40">
                    <td className="px-4 py-4">
                      <StatusBadge className={roleColors[role]}>{role}</StatusBadge>
                    </td>
                    {permissions.map((hasAccess, index) => (
                      <td key={`${role}-${modules[index]}`} className="px-4 py-4 text-center">
                        {hasAccess ? (
                          <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-500" />
                        ) : (
                          <div className="mx-auto h-5 w-5 rounded-full border-2 border-slate-200 bg-white" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Surface>
      )}
    </PageShell>
  );
}
