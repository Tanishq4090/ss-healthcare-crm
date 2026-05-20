import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import StaffIDCard from '@/components/StaffIDCard';
import type { StaffIDCardEmployee } from '@/components/StaffIDCard';
import { supabase } from '@/lib/supabase';

export default function PublicStaffIDCard() {
  const { token } = useParams();
  const [employee, setEmployee] = useState<StaffIDCardEmployee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      if (!token) {
        setError('Missing ID card token.');
        setLoading(false);
        return;
      }
      const { data, error: err } = await supabase
        .from('employees')
        .select('id, employee_code, username, full_name, job_title, position, gender, experience, payment_scheme, photo_url, service_skills, status')
        .eq('id_card_token', token)
        .maybeSingle();

      if (err) setError(err.message);
      else if (!data) setError('ID card not found or expired.');
      else setEmployee(data as StaffIDCardEmployee);
      setLoading(false);
    }
    load();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#004C8C]/5 via-white to-[#00A859]/5 px-4 py-10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00A859] opacity-5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
      <div className="mx-auto max-w-3xl relative z-10">
        <div className="mb-10 text-center">
          <img src="/logo.png" alt="SS Health Care" className="mx-auto h-16 w-16 object-contain drop-shadow-sm" />
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">SS Health Care Verification</h1>
          <p className="mt-2 text-[13px] font-medium text-slate-500">Official Staff Identification Portal</p>
        </div>

        {loading && <div className="rounded-3xl bg-white p-12 text-center text-slate-500 shadow-sm border border-slate-100 font-bold animate-pulse">Loading secure ID record…</div>}
        {error && !loading && <div className="rounded-3xl border border-rose-200 bg-rose-50 p-12 text-center font-bold text-rose-700 shadow-sm">{error}</div>}
        {employee && !loading && <StaffIDCard employee={employee} showActions={false} />}

        {employee && (
          <div className="mx-auto mt-8 max-w-xl premium-card p-6 text-[13px] leading-relaxed text-slate-600 border border-[#00A859]/20 shadow-md">
            <p className="font-extrabold text-[#00A859] tracking-tight uppercase mb-1 flex items-center justify-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00A859]"></span>
              Verified Assignment
            </p>
            <p className="text-center font-medium mt-2">This staff member is officially deployed by SS Health Care. Please verify their physical appearance matches this digital record before allowing service entry.</p>
          </div>
        )}
      </div>
    </div>
  );
}
