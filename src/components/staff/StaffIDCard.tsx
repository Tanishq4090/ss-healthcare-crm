import { ShieldCheck } from 'lucide-react';
import { SS_HEALTHCARE_BRAND } from '@/config/brand';

export type StaffIDCardData = {
  employeeCode?: string;
  fullName: string;
  jobTitle?: string;
  dutyType?: string;
  experience?: string;
  age?: string | number;
  gender?: string;
  address?: string;
  photoUrl?: string;
  status?: string;
};

export default function StaffIDCard({ staff }: { staff: StaffIDCardData }) {
  const employeeCode = staff.employeeCode || 'EMP-000001';
  const initials = (staff.fullName || 'SS')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="ss-id-card relative mx-auto w-full max-w-[450px] overflow-hidden rounded-[1.6rem] bg-white shadow-2xl ring-1 ring-[rgba(0,168,89,0.16)] print:shadow-none">
      <div className="absolute inset-0 opacity-[0.045]" aria-hidden="true">
        <div className="absolute left-10 top-24 rotate-[-18deg] text-7xl font-black tracking-widest text-[#004C8C]">
          SS HEALTH CARE
        </div>
      </div>

      <div className="relative flex items-center justify-between px-6 py-5 text-white" style={{ background: SS_HEALTHCARE_BRAND.gradients.primary }}>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
            <img src={SS_HEALTHCARE_BRAND.logoPath} alt="SS Health Care" className="h-9 w-9 object-contain" />
          </div>
          <div>
            <p className="text-lg font-extrabold leading-tight">SS Health Care</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/85">Employee Identification</p>
          </div>
        </div>
        <div className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-xs font-extrabold tracking-wide">
          {employeeCode}
        </div>
      </div>

      <div className="relative grid grid-cols-[118px_1fr] gap-5 px-5 py-5">
        <div className="space-y-3">
          <div className="flex h-[108px] w-[108px] items-center justify-center overflow-hidden rounded-2xl bg-[#008D7D] text-3xl font-black text-white ring-4 ring-[#DDF7EE]">
            {staff.photoUrl ? <img src={staff.photoUrl} alt={staff.fullName} className="h-full w-full object-cover" /> : initials}
          </div>
          <div className="rounded-lg border border-[#B7EEE0] bg-white px-2 py-1 text-center text-[11px] font-extrabold text-[#008D7D]">
            {employeeCode}
          </div>
        </div>

        <div className="min-w-0 pt-1">
          <h3 className="truncate text-xl font-extrabold text-slate-950">{staff.fullName}</h3>
          <p className="mt-1 text-xs font-extrabold uppercase tracking-[0.14em] text-[#00A859]">
            {staff.jobTitle || 'Care Specialist'}
          </p>
          <div className="mt-5 space-y-3 text-sm">
            <div className="grid grid-cols-[72px_1fr] gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Duty</span>
              <span className="w-fit rounded-md border border-[#B7EEE0] bg-[#F0FFF8] px-3 py-1 text-xs font-bold text-slate-800">{staff.dutyType || 'Monthly'}</span>
            </div>
            <div className="grid grid-cols-[72px_1fr] gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Exp.</span>
              <span className="font-bold text-slate-700">{staff.experience || '—'}</span>
            </div>
            <div className="grid grid-cols-[72px_1fr] gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Age</span>
              <span className="font-bold text-slate-700">{staff.age || '—'}{staff.gender ? ` • ${staff.gender}` : ''}</span>
            </div>
            <div className="grid grid-cols-[72px_1fr] gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Address</span>
              <span className="line-clamp-2 font-medium text-slate-600">{staff.address || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex items-center justify-between px-6 py-3 text-white" style={{ background: 'linear-gradient(135deg, #004C8C, #00A859)' }}>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.24em]">Authorized Personnel Only</p>
        <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em]">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-200" />
          {staff.status || 'Active'}
        </div>
      </div>
    </div>
  );
}
