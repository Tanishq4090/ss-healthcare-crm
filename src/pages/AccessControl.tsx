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
      <Surface className="bg-gradient-to-br from-[#004C8C]/5 via-white to-[#00A859]/5 border-[#00A859]/20 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-40 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between relative z-10">
          <SectionHeader
            eyebrow="Security Workspace"
            title="Access Control"
            description="Manage module access from employee records used by the SS Health Care Admin OS."
            action={<div className="h-10 w-10 bg-[#004C8C]/10 rounded-xl flex items-center justify-center border border-[#004C8C]/20"><ShieldCheck className="w-5 h-5 text-[#004C8C]" /></div>}
          />
          <div className="grid grid-cols-3 gap-3 text-center self-start xl:self-center">
            {[
              { value: stats.total, label: 'Members' },
              { value: stats.admins, label: 'Admins' },
              { value: stats.inactive, label: 'Inactive' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-white/80 bg-white/75 px-5 py-3.5 shadow-sm">
                <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{item.value}</p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">{item.label}</p>
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

      <div className="premium-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Member</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Module Access</th>
                <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Admin Actions</th>
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
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl text-[14px] font-extrabold text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #00A859, #004C8C)' }}>
                          {initials(member.full_name || member.username)}
                        </div>
                        <div>
                          <p className="text-[14px] font-bold text-slate-900">{member.full_name || member.username || 'Unnamed Staff'}</p>
                          <p className="text-[11px] font-medium text-slate-500 mt-0.5">{member.email || member.username || 'No login email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge className={cn(roleColors[member.role || 'user'] || roleColors.user, 'uppercase tracking-wider text-[10px] font-bold')}>{member.role || 'user'}</StatusBadge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {isActive ? <Unlock className="h-4 w-4 text-[#00A859]" /> : <Lock className="h-4 w-4 text-slate-400" />}
                        <span className={cn('text-[13px] font-bold', isActive ? 'text-[#00A859]' : 'text-slate-500')}>
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

      <Surface className="border-[#00A859]/20 bg-slate-50/50">
        <SectionHeader title="Permission Matrix" description="Admin users receive all modules. Staff rows store explicit module access in the employees table." action={<div className="h-10 w-10 bg-[#00A859]/10 rounded-xl flex items-center justify-center border border-[#00A859]/20"><Key className="w-5 h-5 text-[#00A859]" /></div>} />
      </Surface>
    </PageShell>
  );
}
