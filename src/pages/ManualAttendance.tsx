import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  UserCheck,
  UserMinus,
  Users,
  X,
} from 'lucide-react';
import { IconFrame, PageShell, SectionHeader, StatusBadge, Surface } from '@/components/AppPrimitives';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface Employee {
  id: string;
  full_name: string;
  username?: string;
  phone?: string;
  position?: string;
  department?: string;
}

interface AttendanceRow {
  id: string;
  employee_id: string;
  employee_name?: string;
  work_date: string;
  status: 'present' | 'absent' | 'half_day' | 'leave';
  check_in_time?: string | null;
  check_out_time?: string | null;
  hours_worked?: number | null;
  notes?: string | null;
  marked_by?: string | null;
  created_at?: string;
}

const statusStyles: Record<string, string> = {
  present: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  absent: 'bg-rose-50 text-rose-700 border-rose-100',
  half_day: 'bg-amber-50 text-amber-700 border-amber-100',
  leave: 'bg-blue-50 text-blue-700 border-blue-100',
};

function todayInIndia() {
  const now = new Date();
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

function AttendanceModal({
  employee,
  date,
  existing,
  onClose,
  onSaved,
}: {
  employee: Employee;
  date: string;
  existing?: AttendanceRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState<AttendanceRow['status']>(existing?.status || 'present');
  const [checkIn, setCheckIn] = useState(existing?.check_in_time || '09:00');
  const [checkOut, setCheckOut] = useState(existing?.check_out_time || '18:00');
  const [notes, setNotes] = useState(existing?.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const hours = useMemo(() => {
    if (status === 'absent' || status === 'leave') return 0;
    const [inH, inM] = checkIn.split(':').map(Number);
    const [outH, outM] = checkOut.split(':').map(Number);
    const diff = (outH * 60 + outM - (inH * 60 + inM)) / 60;
    return Math.max(0, Number(diff.toFixed(2)));
  }, [checkIn, checkOut, status]);

  const save = async () => {
    setSaving(true);
    setError('');

    const payload = {
      employee_id: employee.id,
      employee_name: employee.full_name,
      work_date: date,
      status,
      check_in_time: status === 'present' || status === 'half_day' ? checkIn : null,
      check_out_time: status === 'present' || status === 'half_day' ? checkOut : null,
      hours_worked: hours,
      notes,
      marked_by: 'admin',
    };

    const { error: upsertError } = await supabase
      .from('manual_attendance')
      .upsert(payload, { onConflict: 'employee_id,work_date' });

    setSaving(false);
    if (upsertError) {
      setError(upsertError.message);
      return;
    }
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="text-lg font-extrabold text-slate-950">Mark Attendance</h3>
            <p className="text-sm text-slate-500">{employee.full_name} · {date}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">Status</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(['present', 'absent', 'half_day', 'leave'] as AttendanceRow['status'][]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setStatus(item)}
                  className={cn(
                    'rounded-xl border px-3 py-2 text-sm font-bold capitalize transition-all',
                    status === item ? statusStyles[item] : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  )}
                >
                  {item.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {(status === 'present' || status === 'half_day') && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">Check In</label>
                <input type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="field-control w-full" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">Check Out</label>
                <input type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="field-control w-full" />
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500">Calculated Hours</span>
              <span className="text-2xl font-extrabold text-slate-950">{hours}</span>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="field-control w-full resize-none" placeholder="Late arrival, leave reason, client duty notes..." />
          </div>

          {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="button" onClick={save} disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving…' : 'Save Attendance'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ManualAttendance() {
  const [date, setDate] = useState(todayInIndia());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Employee | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [employeeRes, attendanceRes] = await Promise.allSettled([
      supabase.from('employees').select('id, full_name, username, phone, position, department').order('full_name', { ascending: true }),
      supabase.from('manual_attendance').select('*').eq('work_date', date),
    ]);

    setEmployees(employeeRes.status === 'fulfilled' ? ((employeeRes.value.data || []) as Employee[]) : []);
    setAttendance(attendanceRes.status === 'fulfilled' ? ((attendanceRes.value.data || []) as AttendanceRow[]) : []);
    setLoading(false);
  }, [date]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const attendanceByEmployee = useMemo(() => {
    return attendance.reduce<Record<string, AttendanceRow>>((acc, row) => {
      acc[row.employee_id] = row;
      return acc;
    }, {});
  }, [attendance]);

  const filteredEmployees = employees.filter((employee) => {
    const haystack = `${employee.full_name} ${employee.phone || ''} ${employee.position || ''} ${employee.department || ''}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const summary = useMemo(() => {
    return {
      total: employees.length,
      present: attendance.filter((row) => row.status === 'present').length,
      absent: attendance.filter((row) => row.status === 'absent').length,
      halfDay: attendance.filter((row) => row.status === 'half_day').length,
      leave: attendance.filter((row) => row.status === 'leave').length,
    };
  }, [attendance, employees.length]);

  return (
    <PageShell>
      {selected && (
        <AttendanceModal
          employee={selected}
          date={date}
          existing={attendanceByEmployee[selected.id]}
          onClose={() => setSelected(null)}
          onSaved={fetchData}
        />
      )}

      <Surface className="bg-gradient-to-br from-white via-green-50/40 to-blue-50/60" style={{ borderColor: 'rgba(0,168,89,0.12)' }}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <IconFrame icon={CalendarCheck} tone="emerald" className="h-12 w-12" />
            <div>
              <p className="text-xs font-bold uppercase" style={{ color: '#00A859' }}>Workforce control</p>
              <h2 className="mt-1 text-2xl font-extrabold text-slate-950">Manual Attendance</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                Mark daily attendance manually for caregivers and field workers before payroll automation.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field-control" />
            <button type="button" onClick={fetchData} className="btn-secondary">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>
      </Surface>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        {[
          { label: 'Total Staff', value: summary.total, icon: Users, tone: 'blue' as const },
          { label: 'Present', value: summary.present, icon: UserCheck, tone: 'emerald' as const },
          { label: 'Absent', value: summary.absent, icon: UserMinus, tone: 'rose' as const },
          { label: 'Half Day', value: summary.halfDay, icon: Clock, tone: 'amber' as const },
          { label: 'Leave', value: summary.leave, icon: CalendarCheck, tone: 'cyan' as const },
        ].map((item) => (
          <Surface key={item.label}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                <p className="mt-3 text-2xl font-extrabold text-slate-950">{item.value}</p>
              </div>
              <IconFrame icon={item.icon} tone={item.tone} />
            </div>
          </Surface>
        ))}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff..." className="field-control w-full pl-10 pr-4" />
        </div>
        <p className="text-sm font-semibold text-slate-500">{filteredEmployees.length} staff shown</p>
      </div>

      <div className="table-shell">
        <div className="clinical-content overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="table-heading px-6 py-4">Staff</th>
                <th className="table-heading px-6 py-4">Department</th>
                <th className="table-heading px-6 py-4">Phone</th>
                <th className="table-heading px-6 py-4">Status</th>
                <th className="table-heading px-6 py-4">Hours</th>
                <th className="table-heading px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">Loading attendance…</td></tr>
              )}
              {!loading && filteredEmployees.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">No employees found.</td></tr>
              )}
              {!loading && filteredEmployees.map((employee) => {
                const row = attendanceByEmployee[employee.id];
                const statusLabel = row?.status || 'not_marked';
                return (
                  <tr key={employee.id} className="border-b border-slate-100/80 transition-colors hover:bg-green-50/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-extrabold text-white shadow-sm" style={{ background: 'linear-gradient(135deg,#00A859,#004C8C)' }}>
                          {employee.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-950">{employee.full_name}</p>
                          <p className="text-xs text-slate-400">{employee.position || employee.username || 'Care Staff'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">{employee.department || '—'}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">{employee.phone || '—'}</td>
                    <td className="px-6 py-4">
                      {statusLabel === 'not_marked' ? (
                        <StatusBadge className="border-slate-200 bg-slate-50 text-slate-500">Not marked</StatusBadge>
                      ) : (
                        <StatusBadge className={statusStyles[statusLabel]}>{statusLabel.replace('_', ' ')}</StatusBadge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{row?.hours_worked ?? '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <button type="button" onClick={() => setSelected(employee)} className="btn-secondary py-2 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Mark / Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}
