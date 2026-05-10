import { ExternalLink, ShieldCheck } from 'lucide-react';

export type StaffIDCardEmployee = {
  id?: string;
  employee_code?: string | null;
  username?: string | null;
  full_name?: string | null;
  name?: string | null;
  job_title?: string | null;
  position?: string | null;
  department?: string | null;
  phone?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  experience?: string | null;
  residential_address?: string | null;
  address?: string | null;
  payment_scheme?: string | null;
  daily_rate?: number | string | null;
  photo_url?: string | null;
  service_skills?: string[] | null;
  status?: string | null;
  id_card_url?: string | null;
};

function ageFromDob(dob?: string | null) {
  if (!dob) return '';
  const date = new Date(dob);
  if (Number.isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  return `${Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))} yrs`;
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'SS';
}

export default function StaffIDCard({
  employee,
  showActions = true,
  onClose,
}: {
  employee: StaffIDCardEmployee;
  showActions?: boolean;
  onClose?: () => void;
}) {
  const name = employee.full_name || employee.name || employee.username || 'SS Healthcare Staff';
  const code = employee.employee_code || employee.username || 'EMP-000000';
  const role = employee.job_title || employee.position || 'Care Specialist';
  const duty = employee.payment_scheme || 'Daily Rate';
  const status = employee.status || 'active';
  const age = ageFromDob(employee.date_of_birth);
  const gender = employee.gender || '';
  const address = employee.residential_address || employee.address || 'Verified SS Healthcare staff';

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-[450px] overflow-hidden rounded-[1.4rem] bg-white shadow-2xl ring-1 ring-slate-200 print:shadow-none print:ring-0">
        <div className="relative overflow-hidden rounded-[1.4rem] border border-teal-100 bg-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20px_20px,rgba(13,148,136,0.06)_1px,transparent_1px)] [background-size:18px_18px]" />
          <div className="relative flex items-center justify-between bg-gradient-to-r from-teal-950 via-teal-800 to-teal-500 px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
                <img src="/logo.png" alt="SS Healthcare" className="h-8 w-8 object-contain" />
              </div>
              <div>
                <p className="text-lg font-black leading-tight tracking-tight">SS Health Care</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-teal-50">Employee Identification</p>
              </div>
            </div>
            <div className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-xs font-black tracking-wider">
              {code}
            </div>
          </div>

          <div className="relative grid grid-cols-[118px_1fr] gap-5 px-5 py-5">
            <div className="space-y-3">
              <div className="flex h-[112px] w-[112px] items-center justify-center overflow-hidden rounded-2xl bg-teal-700 text-4xl font-black text-white ring-4 ring-teal-100">
                {employee.photo_url ? (
                  <img src={employee.photo_url} alt={name} className="h-full w-full object-cover" />
                ) : (
                  initials(name)
                )}
              </div>
              <div className="rounded-lg border border-teal-100 bg-teal-50 px-3 py-1.5 text-center text-[11px] font-black uppercase tracking-wider text-teal-800">
                {code}
              </div>
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-xl font-black text-slate-950">{name}</h3>
              <p className="mt-1 text-xs font-black uppercase tracking-widest text-teal-600">{role}</p>

              <div className="mt-5 space-y-3 text-sm">
                <div className="grid grid-cols-[72px_1fr] items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Duty</span>
                  <span className="w-fit rounded-md border border-teal-100 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800">{duty}</span>
                </div>
                <div className="grid grid-cols-[72px_1fr] items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Exp.</span>
                  <span className="font-bold text-slate-700">{employee.experience || 'Verified'}</span>
                </div>
                <div className="grid grid-cols-[72px_1fr] items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Age</span>
                  <span className="font-bold text-slate-700">{[age, gender].filter(Boolean).join(' • ') || 'Verified'}</span>
                </div>
                <div className="grid grid-cols-[72px_1fr] gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Address</span>
                  <span className="line-clamp-2 text-xs font-semibold text-slate-600">{address}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative flex items-center justify-between bg-gradient-to-r from-teal-950 to-teal-600 px-5 py-3 text-white">
            <span className="text-[10px] font-black uppercase tracking-[0.28em]">Authorized Personnel Only</span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-300" /> {status}
            </span>
          </div>
        </div>
      </div>

      {showActions && (
        <div className="mx-auto mt-7 flex w-full max-w-[580px] flex-col gap-3 sm:flex-row">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Close</button>
          <button type="button" onClick={() => window.print()} className="btn-primary flex-1">
            <ExternalLink className="h-4 w-4" /> Print / Save
          </button>
        </div>
      )}

      {showActions && (
        <p className="mx-auto mt-5 flex max-w-[580px] items-center justify-center gap-2 text-center text-sm text-slate-400">
          <ShieldCheck className="h-4 w-4 text-teal-500" /> This ID card is generated from the verified SS Healthcare staff profile.
        </p>
      )}
    </div>
  );
}
