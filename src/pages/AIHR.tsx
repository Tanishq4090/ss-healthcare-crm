import { useCallback, useEffect, useMemo, useState } from 'react';
import { BadgeIndianRupee, Briefcase, CreditCard, IdCard, Plus, RefreshCw, Search, Upload, UserPlus, X } from 'lucide-react';
import { IconFrame, PageShell, SectionHeader, StatusBadge, Surface } from '@/components/AppPrimitives';
import StaffIDCard from '@/components/StaffIDCard';
import type { StaffIDCardEmployee } from '@/components/StaffIDCard';
import { supabase } from '@/lib/supabase';
import { SS_HEALTHCARE_SERVICES } from '@/config/ssHealthcareServices';

type Employee = StaffIDCardEmployee & {
  id: string;
  email?: string | null;
  aadhaar?: string | null;
  daily_rate?: number | null;
  created_at?: string;
};

type ServiceOption = { id: string; name: string; category?: string };

const genderOptions = ['', 'Male', 'Female', 'Other'];
const paymentSchemes = ['Daily Rate', 'Monthly', 'Hourly', 'Per Visit'];

function AddEmployeeModal({
  services,
  onClose,
  onCreated,
}: {
  services: ServiceOption[];
  onClose: () => void;
  onCreated: (employee: Employee) => void;
}) {
  const [form, setForm] = useState({
    full_name: '',
    job_title: '',
    gender: '',
    phone: '',
    email: '',
    aadhaar: '',
    date_of_birth: '',
    residential_address: '',
    experience: '',
    payment_scheme: 'Daily Rate',
    daily_rate: '0',
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleSkill = (name: string) => {
    setSkills((prev) => (prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]));
  };

  const uploadFile = async (file: File, folder: string) => {
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${folder}/${Date.now()}-${cleanName}`;
    const { error } = await supabase.storage.from('staff-assets').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('staff-assets').getPublicUrl(path);
    return { path, publicUrl: data.publicUrl };
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) return setError('Full name is required.');
    if (!form.job_title.trim()) return setError('Job title is required.');

    setSaving(true);
    setError('');

    try {
      let photo_url = '';
      const idDocs: Array<Record<string, string>> = [];

      if (photoFile) {
        const uploaded = await uploadFile(photoFile, 'staff-photos');
        photo_url = uploaded.publicUrl;
      }

      if (docFile) {
        const uploaded = await uploadFile(docFile, 'staff-documents');
        idDocs.push({ name: docFile.name, path: uploaded.path, url: uploaded.publicUrl });
      }

      const username = form.full_name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || `staff_${Date.now()}`;

      const { data, error: insertError } = await supabase
        .from('employees')
        .insert({
          username,
          full_name: form.full_name.trim(),
          job_title: form.job_title.trim(),
          position: form.job_title.trim(),
          gender: form.gender || null,
          phone: form.phone || null,
          email: form.email || null,
          aadhaar: form.aadhaar || null,
          date_of_birth: form.date_of_birth || null,
          residential_address: form.residential_address || null,
          address: form.residential_address || null,
          experience: form.experience || null,
          payment_scheme: form.payment_scheme,
          daily_rate: Number(form.daily_rate) || 0,
          service_skills: skills,
          id_documents: idDocs,
          photo_url,
          role: 'user',
          accesses: ['hr'],
          status: 'active',
        })
        .select('*')
        .single();

      if (insertError) throw insertError;
      onCreated(data as Employee);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create employee.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="my-6 w-full max-w-3xl rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200">
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl border-b border-slate-100 bg-white/95 px-7 py-5 backdrop-blur">
          <div className="flex items-center gap-3">
            <UserPlus className="h-5 w-5 text-teal-600" />
            <h3 className="text-2xl font-black text-slate-950">Add New Employee</h3>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleCreate} className="space-y-6 p-7">
          <label className="block cursor-pointer rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/70 px-6 py-8 text-center transition hover:border-teal-300 hover:bg-teal-50/40">
            <Upload className="mx-auto h-9 w-9 text-slate-300" />
            <p className="mt-3 text-lg text-slate-500">Drag & drop or <span className="font-bold text-teal-600">click to upload</span></p>
            <p className="mt-1 text-sm text-slate-400">Staff photo — JPEG, PNG, WebP · max 5 MB</p>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
            {photoFile && <p className="mt-3 text-sm font-bold text-teal-700">Selected: {photoFile.name}</p>}
          </label>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Full Name <span className="text-rose-500">*</span></label>
              <input className="field-control w-full" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} placeholder="e.g. Anita Sharma" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Job Title <span className="text-rose-500">*</span></label>
              <input className="field-control w-full" value={form.job_title} onChange={(e) => set('job_title', e.target.value)} placeholder="e.g. Registered Nurse" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Gender</label>
              <select className="field-control w-full" value={form.gender} onChange={(e) => set('gender', e.target.value)}>
                {genderOptions.map((g) => <option key={g} value={g}>{g || 'Select Gender'}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-3 block text-sm font-semibold text-slate-700">Services & Skills</label>
            <div className="flex flex-wrap gap-2">
              {services.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => toggleSkill(service.name)}
                  className={`rounded-full border px-4 py-2 text-sm font-bold transition ${skills.includes(service.name) ? 'border-teal-300 bg-teal-50 text-teal-700' : 'border-slate-200 bg-white text-slate-500 hover:border-teal-200'}`}
                >
                  {service.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Phone</label>
              <input className="field-control w-full" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="98765 43210" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Aadhaar</label>
              <input className="field-control w-full" value={form.aadhaar} onChange={(e) => set('aadhaar', e.target.value)} placeholder="0000 0000 0000" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Date of Birth</label>
              <input type="date" className="field-control w-full" value={form.date_of_birth} onChange={(e) => set('date_of_birth', e.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Residential Address</label>
              <input className="field-control w-full" value={form.residential_address} onChange={(e) => set('residential_address', e.target.value)} placeholder="Full Address" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Experience</label>
              <input className="field-control w-full" value={form.experience} onChange={(e) => set('experience', e.target.value)} placeholder="e.g. 5 Years" />
            </div>
          </div>

          <label className="block cursor-pointer rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/70 px-6 py-7 text-center transition hover:border-teal-300 hover:bg-teal-50/40">
            <Upload className="mx-auto h-7 w-7 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">Click to upload Aadhaar, PAN, or other proofs</p>
            <input type="file" className="hidden" onChange={(e) => setDocFile(e.target.files?.[0] || null)} />
            {docFile && <p className="mt-3 text-sm font-bold text-teal-700">Selected: {docFile.name}</p>}
          </label>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-700">Payment Scheme</label>
              <select className="field-control w-full" value={form.payment_scheme} onChange={(e) => set('payment_scheme', e.target.value)}>
                {paymentSchemes.map((scheme) => <option key={scheme} value={scheme}>{scheme}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-700">Daily Rate (₹)</label>
              <input className="field-control w-full" value={form.daily_rate} onChange={(e) => set('daily_rate', e.target.value)} placeholder="0" />
            </div>
          </div>

          {error && <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}

          <div className="sticky bottom-0 -mx-7 -mb-7 flex justify-end gap-3 rounded-b-3xl border-t border-slate-100 bg-white/95 px-7 py-5 backdrop-blur">
            <button type="button" onClick={onClose} className="btn-secondary px-8">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary px-8">
              <UserPlus className="h-4 w-4" /> {saving ? 'Creating…' : 'Create Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AIHR() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<ServiceOption[]>(SS_HEALTHCARE_SERVICES);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Employee | null>(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('employees').select('*').order('created_at', { ascending: false });
    setEmployees((data || []) as Employee[]);
    setLoading(false);
  }, []);

  const fetchServices = useCallback(async () => {
    const { data } = await supabase.from('service_catalog').select('id, name, category').eq('active', true).order('display_order');
    if (data?.length) setServices(data as ServiceOption[]);
  }, []);

  useEffect(() => { fetchEmployees(); fetchServices(); }, [fetchEmployees, fetchServices]);

  const filtered = useMemo(() => employees.filter((e) => {
    const term = search.toLowerCase();
    return [e.full_name, e.username, e.job_title, e.position, e.phone, e.employee_code].some((v) => String(v || '').toLowerCase().includes(term));
  }), [employees, search]);

  const activeCount = employees.filter((e) => (e.status || 'active') === 'active').length;

  return (
    <PageShell>
      {showAdd && <AddEmployeeModal services={services} onClose={() => setShowAdd(false)} onCreated={(emp) => { setShowAdd(false); setSelectedCard(emp); fetchEmployees(); }} />}
      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-7 shadow-2xl">
            <StaffIDCard employee={selectedCard} onClose={() => setSelectedCard(null)} />
          </div>
        </div>
      )}

      <Surface className="bg-gradient-to-br from-white via-green-50/40 to-blue-50/60" style={{ borderColor: 'rgba(0,168,89,0.12)' }}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <SectionHeader
            eyebrow="Workforce intelligence"
            title="AI HR Deployment Centre"
            description="Add staff, generate SS Healthcare ID cards, assign services, and prepare staff profiles for client verification."
            action={<IconFrame icon={Briefcase} tone="emerald" />}
          />
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-white/80 p-4 shadow-sm"><p className="text-2xl font-black text-slate-950">{employees.length}</p><p className="text-xs font-bold text-slate-400">Total Staff</p></div>
            <div className="rounded-2xl bg-white/80 p-4 shadow-sm"><p className="text-2xl font-black text-slate-950">{activeCount}</p><p className="text-xs font-bold text-slate-400">Active</p></div>
            <div className="rounded-2xl bg-white/80 p-4 shadow-sm"><p className="text-2xl font-black text-slate-950">{services.length}</p><p className="text-xs font-bold text-slate-400">Services</p></div>
          </div>
        </div>
      </Surface>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="field-control w-full pl-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff, code, service..." />
        </div>
        <div className="flex gap-3">
          <button onClick={fetchEmployees} className="btn-secondary"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
          <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus className="h-4 w-4" /> Add Employee</button>
        </div>
      </div>

      <div className="table-shell">
        <div className="clinical-content overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="table-heading px-6 py-4">Employee</th>
                <th className="table-heading px-6 py-4">Role</th>
                <th className="table-heading px-6 py-4">Services</th>
                <th className="table-heading px-6 py-4">Rate</th>
                <th className="table-heading px-6 py-4">Status</th>
                <th className="table-heading px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <tr key={emp.id} className="border-b border-slate-100 hover:bg-teal-50/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-teal-700 to-blue-700 text-sm font-black text-white">
                        {emp.photo_url ? <img src={emp.photo_url} className="h-full w-full object-cover" alt="" /> : (emp.full_name || 'S').split(' ').map((n) => n[0]).join('').slice(0,2)}
                      </div>
                      <div>
                        <p className="font-black text-slate-950">{emp.full_name}</p>
                        <p className="text-xs font-bold text-teal-700">{emp.employee_code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-600">{emp.job_title || emp.position || 'Care Specialist'}</td>
                  <td className="px-6 py-4">
                    <div className="flex max-w-md flex-wrap gap-1.5">
                      {(emp.service_skills || []).slice(0, 3).map((skill) => <span key={skill} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-500">{skill}</span>)}
                      {(emp.service_skills || []).length > 3 && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">+{(emp.service_skills || []).length - 3}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-700"><BadgeIndianRupee className="mr-1 inline h-3.5 w-3.5" />{Number(emp.daily_rate || 0).toLocaleString()}</td>
                  <td className="px-6 py-4"><StatusBadge className="border-emerald-100 bg-emerald-50 text-emerald-700">Active</StatusBadge></td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => setSelectedCard(emp)} className="inline-flex items-center gap-2 rounded-xl border border-teal-100 bg-white px-3 py-2 text-xs font-black text-teal-700 shadow-sm hover:bg-teal-50">
                      <IdCard className="h-4 w-4" /> ID Card
                    </button>
                  </td>
                </tr>
              ))}
              {!filtered.length && !loading && <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">No staff found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Surface>
        <SectionHeader title="ID Card Workflow" description="When staff is assigned from AI CRM, the generated staff ID card link is included in the Staff Assigned WhatsApp template." action={<IconFrame icon={CreditCard} tone="blue" />} />
      </Surface>
    </PageShell>
  );
}
