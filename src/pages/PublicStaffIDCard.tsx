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
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <img src="/logo.png" alt="SS Health Care" className="mx-auto h-14 w-14 object-contain" />
          <h1 className="mt-3 text-2xl font-black text-slate-950">SS Health Care Staff Verification</h1>
          <p className="mt-2 text-sm text-slate-500">Use this page to verify the assigned employee before service starts.</p>
        </div>

        {loading && <div className="rounded-3xl bg-white p-10 text-center text-slate-500 shadow-sm">Loading staff ID card…</div>}
        {error && !loading && <div className="rounded-3xl border border-rose-100 bg-rose-50 p-10 text-center font-semibold text-rose-700">{error}</div>}
        {employee && !loading && <StaffIDCard employee={employee} showActions={false} />}

        {employee && (
          <div className="mx-auto mt-8 max-w-xl rounded-3xl border border-teal-100 bg-white/90 p-5 text-sm leading-6 text-slate-600 shadow-sm">
            <p className="font-bold text-slate-950">Verification note</p>
            <p className="mt-1">This employee has been assigned by SS Health Care. Please verify the employee name and code before allowing service entry.</p>
          </div>
        )}
      </div>
    </div>
  );
}
