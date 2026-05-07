import { useState, useEffect, useCallback } from 'react';
import {
  AlertCircle, Bot, Briefcase, Calendar, CheckCircle2,
  CreditCard, DollarSign, Download, Filter, IdCard,
  Phone, Plus, RefreshCw, Search, UserX, X
} from 'lucide-react';
import { IconFrame, PageShell, SectionHeader, StatusBadge, Surface } from '@/components/AppPrimitives';
import { supabase } from '@/lib/supabase';

/* ─── Types ─────────────────────────────────────────────── */
interface Employee {
  id: string;
  username: string;
  full_name: string;
  role: string;
  position: string;
  department: string;
  phone?: string;
  email?: string;
  address?: string;
  experience?: string;
  gender?: string;
  shift_hours?: number;
  join_date?: string;
  photo_url?: string;
  accesses?: string[];
}

const statusStyles: Record<string, string> = {
  Active:     'bg-emerald-50 text-emerald-700 border-emerald-100',
  'On Leave': 'bg-amber-50 text-amber-700 border-amber-100',
  Terminated: 'bg-rose-50 text-rose-700 border-rose-100',
};

const DEPARTMENTS = ['General', 'Nursing', 'ICU', 'Home Care', 'Rehab', 'Pediatric', 'Administration'];
const POSITIONS   = ['Registered Nurse', 'Home Care Attendant', 'ICU Care Specialist',
                     'Physiotherapist', 'Ward Boy', 'Caregiver', 'Doctor', 'Administrator'];

/* ─── ID Card Component ──────────────────────────────────── */
function IDCardModal({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  const initials = employee.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl">
        {/* Card header */}
        <div className="relative rounded-t-3xl p-6 text-white" style={{ background: 'linear-gradient(135deg,#00A859,#004C8C)' }}>
          <button onClick={onClose} className="absolute right-4 top-4 rounded-full bg-white/20 p-1.5 hover:bg-white/30">
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-2xl font-extrabold">
              {employee.photo_url
                ? <img src={employee.photo_url} alt={employee.full_name} className="h-full w-full rounded-2xl object-cover" />
                : initials}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest opacity-80">SS Health Care</p>
              <h3 className="text-lg font-extrabold">{employee.full_name}</h3>
              <p className="text-sm opacity-80">{employee.position}</p>
            </div>
          </div>
        </div>
        {/* Card body */}
        <div className="space-y-3 p-6">
          {[
            { label: 'Employee ID', value: employee.username.toUpperCase() },
            { label: 'Department',  value: employee.department },
            { label: 'Phone',       value: employee.phone || '—' },
            { label: 'Gender',      value: employee.gender || '—' },
            { label: 'Experience',  value: employee.experience || '—' },
            { label: 'Shift',       value: employee.shift_hours ? `${employee.shift_hours} hrs/day` : '8 hrs/day' },
            { label: 'Joining',     value: employee.join_date ? new Date(employee.join_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-500">{row.label}</span>
              <span className="font-semibold text-slate-900">{row.value}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3 border-t border-slate-100 px-6 py-4">
          <button onClick={onClose} className="btn-secondary flex-1">Close</button>
          <button
            onClick={() => window.print()}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <Download className="h-4 w-4" /> Download
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Add Worker Modal ───────────────────────────────────── */
function AddWorkerModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({
    full_name: '', username: '', phone: '', email: '', gender: '',
    position: POSITIONS[0], department: DEPARTMENTS[0],
    experience: '', shift_hours: '8', address: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (field: string, val: string) => setForm(f => ({ ...f, [field]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.username.trim()) { setError('Name and username are required.'); return; }
    setSaving(true); setError('');
    const { error: err } = await supabase.from('employees').insert({
      ...form,
      shift_hours: Number(form.shift_hours) || 8,
      role: 'user',
      accesses: ['hr'],
      join_date: new Date().toISOString().split('T')[0],
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    onAdded();
    onClose();
  };

  const Field = ({ label, name, type = 'text', placeholder = '' }: { label: string; name: string; type?: string; placeholder?: string }) => (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</label>
      <input
        type={type}
        value={(form as Record<string, string>)[name]}
        onChange={e => set(name, e.target.value)}
        placeholder={placeholder}
        className="field-control w-full"
      />
    </div>
  );

  const Select = ({ label, name, options }: { label: string; name: string; options: string[] }) => (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</label>
      <select value={(form as Record<string, string>)[name]} onChange={e => set(name, e.target.value)} className="field-control w-full">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="text-lg font-extrabold text-slate-950">Add Worker</h3>
            <p className="text-sm text-slate-500">New employee to SS Health Care workforce</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full Name *"    name="full_name"   placeholder="Priya Sharma" />
            <Field label="Username *"     name="username"    placeholder="priya_sharma" />
            <Field label="Phone"          name="phone"       placeholder="+91 98765 43210" />
            <Field label="Email"          name="email"       type="email" placeholder="priya@example.com" />
            <Select label="Position"      name="position"    options={POSITIONS} />
            <Select label="Department"    name="department"  options={DEPARTMENTS} />
            <Select label="Gender"        name="gender"      options={['', 'Male', 'Female', 'Other']} />
            <Field label="Experience"     name="experience"  placeholder="2 years" />
            <Field label="Shift (hrs/day)" name="shift_hours" type="number" placeholder="8" />
            <Field label="Address"        name="address"     placeholder="City, State" />
          </div>
          {error && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
          <div className="mt-6 flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving…' : 'Add Worker'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main HR Page ───────────────────────────────────────── */
export default function AIHR() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [showAdd,   setShowAdd]   = useState(false);
  const [idCard,    setIdCard]    = useState<Employee | null>(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('employees').select('*').order('created_at', { ascending: false });
    setEmployees((data || []) as Employee[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const filtered = employees.filter(e =>
    e.full_name.toLowerCase().includes(search.toLowerCase()) ||
    e.position?.toLowerCase().includes(search.toLowerCase()) ||
    e.department?.toLowerCase().includes(search.toLowerCase()) ||
    e.phone?.includes(search)
  );

  const active     = employees.filter(e => e.role !== 'terminated').length;
  const readyCount = employees.filter(e => e.role === 'user').length;

  return (
    <PageShell>
      {showAdd && <AddWorkerModal onClose={() => setShowAdd(false)} onAdded={fetchEmployees} />}
      {idCard   && <IDCardModal  employee={idCard} onClose={() => setIdCard(null)} />}

      {/* Header */}
      <Surface style={{ borderColor: 'rgba(0,168,89,0.12)' }}
        className="bg-gradient-to-br from-white via-green-50/40 to-blue-50/60">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase" style={{ color: '#00A859' }}>Workforce intelligence</p>
            <h2 className="mt-1 text-2xl font-extrabold text-slate-950">AI HR Deployment Centre</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Manage workers, generate ID cards, and process payroll — all in one place.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { value: String(active),     label: 'Total Workers' },
              { value: String(readyCount), label: 'Active Staff' },
              { value: String(employees.filter(e => !e.join_date || new Date(e.join_date) > new Date(Date.now() - 30*86400000)).length), label: 'New this month' },
            ].map(item => (
              <div key={item.label} className="rounded-xl border border-white/80 bg-white/75 px-4 py-3 shadow-sm">
                <p className="text-xl font-extrabold text-slate-950">{item.value}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Surface>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_0.8fr]">
        {/* Workers Table */}
        <div className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search workers..." value={search}
                onChange={e => setSearch(e.target.value)} className="field-control w-full pl-10 pr-4" />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={fetchEmployees} className="btn-secondary">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button type="button" onClick={() => setShowAdd(true)} className="btn-primary">
                <Plus className="h-4 w-4" /> Add Worker
              </button>
            </div>
          </div>

          <div className="table-shell">
            <div className="clinical-content overflow-x-auto">
              {loading ? (
                <div className="flex h-40 items-center justify-center gap-2 text-slate-400">
                  <RefreshCw className="h-4 w-4 animate-spin" style={{ color: '#00A859' }} />
                  <span className="text-sm">Loading workers…</span>
                </div>
              ) : (
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="table-heading px-6 py-4">Worker</th>
                      <th className="table-heading px-6 py-4">Position</th>
                      <th className="table-heading px-6 py-4">Department</th>
                      <th className="table-heading px-6 py-4">Phone</th>
                      <th className="table-heading px-6 py-4">Status</th>
                      <th className="table-heading px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                        No workers found. Add your first worker above.
                      </td></tr>
                    )}
                    {filtered.map(emp => {
                      const initials = emp.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                      const status = emp.role === 'admin' ? 'Active' : 'Active';
                      return (
                        <tr key={emp.id} className="border-b border-slate-100/80 transition-colors hover:bg-green-50/30">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-extrabold text-white shadow-sm"
                                style={{ background: 'linear-gradient(135deg,#00A859,#004C8C)' }}>
                                {initials}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-950">{emp.full_name}</p>
                                <p className="text-xs text-slate-400">@{emp.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-600">{emp.position || '—'}</td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-600">{emp.department || '—'}</td>
                          <td className="px-6 py-4">
                            <a href={`tel:${emp.phone}`} className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-green-700">
                              <Phone className="h-3.5 w-3.5 text-slate-400" />{emp.phone || '—'}
                            </a>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge className={statusStyles[status]}>
                              <CheckCircle2 className="h-3.5 w-3.5" />{status}
                            </StatusBadge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => setIdCard(emp)}
                              title="View ID Card"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:border-green-200 hover:text-green-700"
                            >
                              <IdCard className="h-3.5 w-3.5" /> ID Card
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar panels */}
        <div className="space-y-5">
          <Surface style={{ borderColor: 'rgba(0,168,89,0.12)' }}>
            <SectionHeader
              title="AI Auto-Deploy"
              description="Match available workers to open care requests automatically."
              action={<IconFrame icon={Bot} tone="cyan" className="h-10 w-10" />}
            />
            <button type="button" className="btn-primary mt-5 w-full">Review & Deploy</button>
          </Surface>

          <Surface style={{ borderColor: 'rgba(0,168,89,0.12)' }}>
            <SectionHeader
              title="Process Payroll"
              description="Auto-payroll is prepared for the active workforce."
              action={<IconFrame icon={DollarSign} tone="emerald" className="h-10 w-10" />}
            />
            <div className="mt-5 flex items-center justify-between rounded-xl p-4" style={{ background: 'rgba(0,168,89,0.07)' }}>
              <span className="text-sm font-semibold text-slate-600">Active workers</span>
              <span className="text-2xl font-extrabold text-slate-950">{active}</span>
            </div>
            <button type="button" className="btn-primary mt-4 w-full">Run Auto-Payroll</button>
          </Surface>

          <Surface style={{ borderColor: 'rgba(0,168,89,0.12)' }}>
            <SectionHeader
              title="Quick Add"
              description="Add a new care worker to your roster."
              action={<IconFrame icon={Briefcase} tone="amber" className="h-10 w-10" />}
            />
            <button type="button" onClick={() => setShowAdd(true)} className="btn-primary mt-5 w-full">
              <Plus className="h-4 w-4" /> Add New Worker
            </button>
          </Surface>

          <Surface style={{ borderColor: 'rgba(0,168,89,0.12)' }}>
            <SectionHeader
              title="ID Cards"
              description="Click any worker's ID Card button to view and download."
              action={<IconFrame icon={CreditCard} tone="blue" className="h-10 w-10" />}
            />
            <div className="mt-4 space-y-2">
              {filtered.slice(0, 4).map(emp => (
                <button key={emp.id} type="button" onClick={() => setIdCard(emp)}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-white/80 px-3 py-2.5 text-left transition-all hover:border-green-200 hover:bg-green-50/50">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold text-white"
                    style={{ background: 'linear-gradient(135deg,#00A859,#004C8C)' }}>
                    {emp.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-950">{emp.full_name}</p>
                    <p className="truncate text-xs text-slate-400">{emp.position}</p>
                  </div>
                  <IdCard className="h-4 w-4 shrink-0 text-slate-300" />
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-3">No workers yet</p>
              )}
            </div>
          </Surface>
        </div>
      </div>
    </PageShell>
  );
}
