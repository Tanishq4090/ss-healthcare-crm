import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Key, Lock, RefreshCw, Search, ShieldCheck, Unlock, UserRoundCog } from 'lucide-react';
import { IconFrame, PageShell, SectionHeader, StatusBadge, Surface } from '@/components/AppPrimitives';
import type { AccessModule } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

type EmployeeAccessRow = {
  id: string;
  username?: string | null;
  full_name?: string | null;
  email?: string | null;
  role?: 'admin' | 'user' | string | null;
  accesses?: string[] | null;
  status?: string | null;
  availability_status?: string | null;
  updated_at?: string | null;
};

const modules: Array<{ id: AccessModule; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'crm', label: 'CRM' },
  { id: 'calls', label: 'Calls' },
  { id: 'clients', label: 'Clients' },
  { id: 'hr', label: 'Staff' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'finance', label: 'Finance' },
  { id: 'settings', label: 'Settings' },
];

const roleColors: Record<string, string> = {
  admin: 'bg-blue-50 text-blue-700 border-blue-100',
  user: 'bg-slate-50 text-slate-600 border-slate-200',
};

function initials(name?: string | null) {
  return (name || 'SS')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function normalizedAccesses(row: EmployeeAccessRow) {
  const values = new Set(row.accesses || []);
  if (values.has('call_review')) values.add('calls');
  if (row.role === 'admin') modules.forEach((module) => values.add(module.id));
  return values;
}

export default function AccessControl() {
  const [members, setMembers] = useState<EmployeeAccessRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: fetchError } = await supabase
      .from('employees')
      .select('id, username, full_name, email, role, accesses, status, availability_status, updated_at')
      .order('created_at', { ascending: false });

    if (fetchError) setError(fetchError.message);
    setMembers((data || []) as EmployeeAccessRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMembers();
    const channel = supabase.channel('access-control-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, fetchMembers)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchMembers]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return members.filter((member) => `${member.full_name || ''} ${member.username || ''} ${member.email || ''} ${member.role || ''}`.toLowerCase().includes(q));
  }, [members, search]);

  const stats = {
    total: members.length,
    admins: members.filter((member) => member.role === 'admin').length,
    inactive: members.filter((member) => (member.status || member.availability_status || 'active') !== 'active' && (member.availability_status || '') !== 'available').length,
  };

  const toggleAccess = async (member: EmployeeAccessRow, moduleId: AccessModule) => {
    if (member.role === 'admin') return;
    setSavingId(member.id);
    setError('');
    const current = normalizedAccesses(member);
    if (current.has(moduleId)) current.delete(moduleId);
    else current.add(moduleId);
    current.delete('call_review');

    const { error: updateError } = await supabase
      .from('employees')
      .update({ accesses: Array.from(current) })
      .eq('id', member.id);

    if (updateError) setError(updateError.message);
    await fetchMembers();
    setSavingId('');
  };

  const toggleRole = async (member: EmployeeAccessRow) => {
    setSavingId(member.id);
    setError('');
    const nextRole = member.role === 'admin' ? 'user' : 'admin';
    const { error: updateError } = await supabase
      .from('employees')
      .update({
        role: nextRole,
        accesses: nextRole === 'admin' ? modules.map((module) => module.id) : (member.accesses?.length ? member.accesses : ['dashboard', 'crm', 'clients']),
      })
      .eq('id', member.id);

    if (updateError) setError(updateError.message);
    await fetchMembers();
    setSavingId('');
  };

  return (
    <PageShell>
      <Surface className="bg-gradient-to-br from-white via-green-50/40 to-blue-50/60" style={{ borderColor: 'rgba(0,168,89,0.12)' }}>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <SectionHeader
            eyebrow="Security workspace"
            title="Access Control"
            description="Manage module access from employee records used by the SS Health Care Admin OS."
            action={<IconFrame icon={ShieldCheck} tone="cyan" className="h-12 w-12" />}
          />
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { value: stats.total, label: 'Members' },
              { value: stats.admins, label: 'Admins' },
              { value: stats.inactive, label: 'Inactive' },
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
            onChange={(event) => setSearch(event.target.value)}
            className="field-control w-full pl-10 pr-4"
          />
        </div>
        <button type="button" onClick={fetchMembers} className="btn-secondary">
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /> Refresh
        </button>
      </div>

      {error && <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}

      <div className="table-shell">
        <div className="clinical-content overflow-x-auto">
          <table className="w-full min-w-[1080px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="table-heading px-6 py-4">Member</th>
                <th className="table-heading px-6 py-4">Role</th>
                <th className="table-heading px-6 py-4">Status</th>
                <th className="table-heading px-6 py-4">Module Access</th>
                <th className="table-heading px-6 py-4 text-right">Admin</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">Loading access records...</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">No employees found.</td></tr>}
              {!loading && filtered.map((member) => {
                const accesses = normalizedAccesses(member);
                const isActive = ['active', 'available'].includes(member.status || member.availability_status || 'active');
                return (
                  <tr key={member.id} className="border-b border-slate-100/80 transition-colors hover:bg-green-50/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-700 to-blue-700 text-xs font-extrabold text-white shadow-sm">
                          {initials(member.full_name || member.username)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-950">{member.full_name || member.username || 'Unnamed Staff'}</p>
                          <p className="text-xs text-slate-500">{member.email || member.username || 'No login email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge className={roleColors[member.role || 'user'] || roleColors.user}>{member.role || 'user'}</StatusBadge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {isActive ? <Unlock className="h-4 w-4 text-emerald-500" /> : <Lock className="h-4 w-4 text-slate-400" />}
                        <span className={cn('text-sm font-bold', isActive ? 'text-emerald-700' : 'text-slate-500')}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {modules.map((module) => {
                          const enabled = accesses.has(module.id);
                          return (
                            <button
                              key={`${member.id}-${module.id}`}
                              type="button"
                              disabled={savingId === member.id || member.role === 'admin'}
                              onClick={() => toggleAccess(member, module.id)}
                              className={cn(
                                'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition',
                                enabled ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-400',
                                member.role !== 'admin' && 'hover:border-teal-200 hover:text-teal-700'
                              )}
                            >
                              {enabled && <CheckCircle2 className="h-3.5 w-3.5" />}
                              {module.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button type="button" onClick={() => toggleRole(member)} disabled={savingId === member.id} className="btn-secondary py-2 text-xs">
                        <UserRoundCog className="h-3.5 w-3.5" /> {member.role === 'admin' ? 'Make User' : 'Make Admin'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Surface>
        <SectionHeader title="Permission Matrix" description="Admin users receive all modules. Staff rows store explicit module access in the employees table." action={<IconFrame icon={Key} tone="emerald" />} />
      </Surface>
    </PageShell>
  );
}
