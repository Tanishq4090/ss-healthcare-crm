import { useCallback, useEffect, useMemo, useState } from 'react';
import { BadgeIndianRupee, Briefcase, CheckCircle2, ChevronDown, Clock, CreditCard, FileText, IdCard, Link2, Plus, RefreshCw, Search, Send, Trash2, Upload, UserPlus, Users, X } from 'lucide-react';
import StaffIDCard from '@/components/StaffIDCard';
import type { StaffIDCardEmployee } from '@/components/StaffIDCard';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { SS_HEALTHCARE_SERVICES } from '@/config/ssHealthcareServices';

type Employee = StaffIDCardEmployee & {
  id: string;
  email?: string | null;
  aadhaar?: string | null;
  daily_rate?: number | null;
  availability_status?: string | null;
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
          availability_status: 'available',
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
  const [activeTab, setActiveTab] = useState<'allocation' | 'attendance' | 'payroll'>('allocation');
  const [hrSubTab, setHrSubTab] = useState<'workers' | 'deployments' | 'directory' | 'trash'>('workers');
  const [dirFilter, setDirFilter] = useState<'all' | 'available' | 'assigned' | 'inactive'>('all');
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [payslipForm, setPayslipForm] = useState({ workerId: '', daysWorked: '', serviceMonth: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), advance: '' });

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

  const filtered = useMemo(() => {
    let list = employees;
    if (hrSubTab === 'workers') {
      list = list.filter((e) => (e.availability_status || 'available') === 'available');
    }
    const term = search.toLowerCase();
    return list.filter((e) =>
      [e.full_name, e.username, e.job_title, e.position, e.phone, e.employee_code].some((v) => String(v || '').toLowerCase().includes(term))
    );
  }, [employees, search, hrSubTab]);

  const activeCount = employees.filter((e) => (e.status || 'active') === 'active').length;

  const toggleAvailability = async (employee: Employee) => {
    const nextStatus = (employee.availability_status || 'available') === 'available' ? 'inactive' : 'available';
    await supabase.from('employees').update({ availability_status: nextStatus, status: nextStatus === 'available' ? 'active' : 'inactive' }).eq('id', employee.id);
    fetchEmployees();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {showAdd && <AddEmployeeModal services={services} onClose={() => setShowAdd(false)} onCreated={(emp) => { setShowAdd(false); setSelectedCard(emp); fetchEmployees(); }} />}
      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-7 shadow-2xl">
            <StaffIDCard employee={selectedCard} onClose={() => setSelectedCard(null)} />
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-['Plus_Jakarta_Sans']">AI HR &amp; Billing</h1>
          <p className="text-slate-500 mt-1">Manage worker allocation, automated attendance, and payroll dispatch.</p>
        </div>
        <div className="flex items-center p-1 bg-slate-100 rounded-lg shrink-0">
          <button onClick={() => setActiveTab('allocation')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'allocation' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Allocation</button>
          <button onClick={() => setActiveTab('attendance')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'attendance' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Attendance</button>
          <button onClick={() => setActiveTab('payroll')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'payroll' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Payroll</button>
        </div>
      </div>

      {activeTab === 'allocation' ? (
        <>
          {/* Sub-tabs + Add Employee */}
          <div className="flex items-center justify-between">
            <div className="segmented-control shrink-0">
              <button onClick={() => setHrSubTab('workers')} className={cn('segmented-item flex items-center gap-2', hrSubTab === 'workers' && 'segmented-item-active')}>
                <Users className="h-4 w-4" /> AVAILABLE WORKERS
              </button>
              <button onClick={() => setHrSubTab('deployments')} className={cn('segmented-item flex items-center gap-2', hrSubTab === 'deployments' && 'segmented-item-active')}>
                <Briefcase className="h-4 w-4" /> DEPLOYMENTS
              </button>
              <button onClick={() => setHrSubTab('directory')} className={cn('segmented-item flex items-center gap-2', hrSubTab === 'directory' && 'segmented-item-active')}>
                <IdCard className="h-4 w-4" /> DIRECTORY
              </button>
              <button onClick={() => setHrSubTab('trash')} className={cn('segmented-item flex items-center gap-2', hrSubTab === 'trash' && 'segmented-item-active')}>
                <Trash2 className="h-4 w-4" /> TRASH
              </button>
            </div>
            <button onClick={() => setShowAdd(true)} className="btn-primary">
              <Plus className="h-4 w-4" /> Add Employee
            </button>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-[#00A859] focus:outline-none focus:ring-2 focus:ring-[#00A859]/20" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, role, or ID..." />
            </div>
            <button onClick={fetchEmployees} className="p-2.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Worker cards grid — Available Workers sub-tab */}
          {hrSubTab === 'workers' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((emp) => (
                <div key={emp.id} className="premium-card p-6 group">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-base font-bold text-white shadow-sm transition-transform group-hover:scale-105" style={{ background: 'linear-gradient(135deg, #00A859, #004C8C)' }}>
                      {emp.photo_url ? <img src={emp.photo_url} className="h-full w-full object-cover" alt="" /> : (emp.full_name || 'S').split(' ').map((n) => n[0]).join('').slice(0,2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 text-base">{emp.full_name}</p>
                      <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-wider">{emp.job_title || emp.position || 'Care Specialist'}</p>
                      <span className={`inline-flex items-center gap-1.5 mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${(emp.availability_status || 'available') === 'available' ? 'text-[#00A859] bg-[#00A859]/10 border-[#00A859]/20' : 'text-slate-500 bg-slate-100 border-slate-200'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${(emp.availability_status || 'available') === 'available' ? 'bg-[#00A859]' : 'bg-slate-400'}`} />
                        {(emp.availability_status || 'available')}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2.5 text-[13px] bg-slate-50/50 p-3 rounded-xl border border-slate-100/60 mb-5">
                    <div className="flex justify-between items-center"><span className="text-slate-500 font-medium flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> Skills</span><span className="text-slate-700 font-bold">{(emp.service_skills || []).slice(0,2).join(', ') || '—'}</span></div>
                    <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Contact</span><span className="text-slate-700 font-bold">{emp.phone || '—'}</span></div>
                    <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Joined</span><span className="text-slate-700 font-bold">{emp.created_at ? new Date(emp.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}</span></div>
                  </div>
                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <button onClick={() => setSelectedCard(emp)} className="btn-secondary flex-1 py-2 shadow-none border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 hover:text-slate-700">
                      ID Card
                    </button>
                    <button onClick={() => toggleAvailability(emp)} className="btn-primary flex-1 py-2 text-[13px]">
                      <Briefcase className="h-3.5 w-3.5" /> Assign
                    </button>
                  </div>
                </div>
              ))}
              {!filtered.length && !loading && (
                <div className="col-span-full py-12 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100"><Users className="w-8 h-8 text-slate-300" /></div>
                  <p className="text-base font-bold text-slate-900">No available workers found</p>
                  <p className="text-sm font-medium text-slate-500 mt-1">Try adjusting your search or add a new employee.</p>
                </div>
              )}
            </div>
          )}

          {/* Deployments sub-tab */}
          {hrSubTab === 'deployments' && (
            <div className="premium-card overflow-hidden">
              <div className="p-6 border-b border-slate-100/60 flex items-center justify-between bg-slate-50/30">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2"><Briefcase className="h-5 w-5 text-[#00A859]" /> {employees.filter(e => (e.availability_status || 'available') === 'assigned').length} ACTIVE DEPLOYMENT{employees.filter(e => (e.availability_status || 'available') === 'assigned').length !== 1 ? 'S' : ''}</h3>
                <button onClick={fetchEmployees} className="btn-secondary py-1.5 px-3 text-xs"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
              </div>
              {employees.filter(e => (e.availability_status || 'available') === 'assigned').length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100"><Briefcase className="w-8 h-8 text-slate-300" /></div>
                  <p className="text-base font-bold text-slate-900">No active deployments</p>
                  <p className="text-sm font-medium text-slate-500 mt-1">Assign workers to clients from the Available Workers tab.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="bg-slate-50/80 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <th className="px-6 py-4">Staff Member</th>
                    <th className="px-6 py-4">ID No.</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Deployment Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {employees.filter(e => (e.availability_status || 'available') === 'assigned').map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #00A859, #004C8C)' }}>
                            {emp.photo_url ? <img src={emp.photo_url} className="h-full w-full rounded-full object-cover" alt="" /> : (emp.full_name || 'S')[0]}
                          </div>
                          <div><p className="font-semibold text-slate-900">{emp.full_name}</p><p className="text-xs text-slate-500">{emp.job_title || 'Specialist'}</p></div>
                        </td>
                        <td className="px-5 py-4"><span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{emp.employee_code || '—'}</span></td>
                        <td className="px-5 py-4 text-slate-600">{emp.job_title || '—'}</td>
                        <td className="px-5 py-4"><span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">● CONFIRMED</span></td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <button onClick={() => setSelectedCard(emp)} className="text-xs font-medium text-[#00A859] hover:underline flex items-center gap-1"><IdCard className="h-3.5 w-3.5" /> ID Card</button>
                            <button className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1"><Link2 className="h-3.5 w-3.5" /> Resend Link</button>
                            <button onClick={() => toggleAvailability(emp)} className="text-xs font-medium text-slate-500 hover:underline">Release</button>
                            <button className="text-xs font-medium text-red-500 hover:underline">Terminate</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Directory sub-tab — Table view matching 99Care */}
          {hrSubTab === 'directory' && (
            <div className="premium-card overflow-hidden">
              <div className="p-5 border-b border-slate-100/60 flex items-center justify-between bg-slate-50/30">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm focus:border-[#00A859] focus:outline-none focus:ring-2 focus:ring-[#00A859]/20" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, role, or ID..." />
                </div>
                <div className="segmented-control shrink-0 ml-4">
                  {(['all','available','assigned','inactive'] as const).map((f) => (
                    <button key={f} onClick={() => setDirFilter(f)} className={cn('segmented-item', dirFilter === f && 'segmented-item-active')}>{f.toUpperCase()}</button>
                  ))}
                </div>
                <button onClick={fetchEmployees} className="ml-3 btn-secondary p-2"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50/80 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-4">Worker Info</th>
                  <th className="px-6 py-4">Services & Payment</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Quick Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.filter((e) => {
                    const status = (e.availability_status || 'available');
                    if (dirFilter !== 'all' && status !== dirFilter) return false;
                    if (!search) return true;
                    const t = search.toLowerCase();
                    return [e.full_name, e.job_title, e.employee_code, e.phone].some(v => String(v||'').toLowerCase().includes(t));
                  }).map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #00A859, #004C8C)' }}>
                            {emp.photo_url ? <img src={emp.photo_url} className="h-full w-full rounded-full object-cover" alt="" /> : (emp.full_name || 'S')[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{emp.full_name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {emp.employee_code && <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{emp.employee_code}</span>}
                              <span className="text-xs text-slate-500">{emp.job_title || 'Specialist'}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(emp.service_skills || []).slice(0,2).map((s, i) => <span key={i} className="text-[10px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">{s}</span>)}
                          <span className="text-[10px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">{emp.daily_rate ? 'HOURLY' : 'MONTHLY BASE'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                          (emp.availability_status || 'available') === 'available' ? 'text-emerald-600' :
                          (emp.availability_status || 'available') === 'assigned' ? 'text-amber-600' : 'text-slate-400'
                        }`}>
                          <span className={`h-2 w-2 rounded-full ${
                            (emp.availability_status || 'available') === 'available' ? 'bg-emerald-500' :
                            (emp.availability_status || 'available') === 'assigned' ? 'bg-amber-500' : 'bg-slate-300'
                          }`} />
                          {(emp.availability_status || 'available').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setSelectedCard(emp)} className="text-xs font-medium text-[#00A859] hover:underline flex items-center gap-1"><IdCard className="h-3.5 w-3.5" /> ID CARD</button>
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {employees.filter((e) => {
                    const status = (e.availability_status || 'available');
                    if (dirFilter !== 'all' && status !== dirFilter) return false;
                    if (!search) return true;
                    const t = search.toLowerCase();
                    return [e.full_name, e.job_title, e.employee_code, e.phone].some(v => String(v||'').toLowerCase().includes(t));
                  }).length === 0 && (
                    <tr><td colSpan={4} className="py-12 text-center">
                      <Users className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                      <p className="text-sm text-slate-400 uppercase tracking-wide">No employees found in directory</p>
                    </td></tr>
                  )}
                </tbody>
              </table>
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>DIRECTORY SUMMARY</span>
                <span>{employees.filter((e) => {
                  const status = (e.availability_status || 'available');
                  if (dirFilter !== 'all' && status !== dirFilter) return false;
                  if (!search) return true;
                  const t = search.toLowerCase();
                  return [e.full_name, e.job_title, e.employee_code, e.phone].some(v => String(v||'').toLowerCase().includes(t));
                }).length} Staff Members | {dirFilter.toUpperCase()}</span>
              </div>
            </div>
          )}

          {/* Trash sub-tab */}
          {hrSubTab === 'trash' && (
            <div className="premium-card p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                <Trash2 className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Trash is Empty</h3>
              <p className="text-sm font-medium text-slate-500 mt-1 max-w-sm">Deactivated or terminated staff members will appear here. They can be restored or permanently deleted.</p>
            </div>
          )}
        </>
      ) : activeTab === 'attendance' ? (
        /* Attendance View – matching 99Care pattern */
        /* Attendance View – matching 99Care pattern */
        <div className="premium-card flex-1 flex flex-col">
          <div className="p-6 border-b border-slate-100/60 flex items-center justify-between bg-slate-50/30">
            <div>
              <h2 className="text-base font-bold text-slate-900">Live Attendance Log</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">Track daily attendance for all active staff members.</p>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary py-2 px-4 shadow-none">Filter: Today</button>
            </div>
          </div>
          <div className="flex-1 p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-blue-50 border border-blue-100/50 rounded-2xl flex items-center justify-center mb-5">
              <Clock className="w-8 h-8 text-[#004C8C]" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Awaiting Duty Starts</h3>
            <p className="text-sm font-medium text-slate-500 max-w-sm">No duty starts logged for today yet. Staff or clients can use their unique tracking links to submit attendance automatically.</p>
            <button className="mt-8 btn-secondary border border-slate-200">
              <FileText className="w-4 h-4" /> Generate Attendance Report
            </button>
          </div>
        </div>
      ) : (
        /* Payroll & Invoicing View – matching 99Care pattern */
        <div className="grid lg:grid-cols-3 gap-6 flex-1">
          {/* Main Payroll List */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-gradient-to-br from-[#004C8C] via-[#004C8C]/90 to-[#00A859]/80 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
              <h2 className="font-extrabold text-2xl tracking-tight relative z-10">Financial Execution Center</h2>
              <p className="text-white/80 text-sm font-medium mt-1.5 relative z-10">Auto-calculate and pattern all invoices for active deployments.</p>
              <div className="flex gap-3 mt-6 relative z-10">
                <button onClick={() => setShowPayslipModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-white/10 border border-white/20 hover:bg-white/20 backdrop-blur rounded-xl text-sm font-bold transition-all shadow-sm">
                  <FileText className="h-4 w-4" /> Manual Payslip
                </button>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#004C8C] rounded-xl text-sm font-extrabold hover:bg-slate-50 transition-all shadow-md">
                  <Send className="h-4 w-4" /> Generate & Dispatch All
                </button>
              </div>
            </div>
            <div className="premium-card overflow-hidden flex-1">
              <div className="p-6 border-b border-slate-100/60 flex items-center justify-between bg-slate-50/30">
                <h2 className="text-base font-bold text-slate-900">Current Billing Cycle</h2>
                <span className="text-[11px] font-bold text-slate-500 border border-slate-200/60 px-3 py-1.5 rounded-md bg-white uppercase tracking-wider shadow-sm">Auto-calculating from active hours</span>
              </div>
              <div className="divide-y divide-slate-100/60">
                {employees.filter(e => (e.availability_status || 'available') !== 'available').length === 0 ? (
                  <div className="p-12 text-center text-sm font-medium text-slate-500">No active payroll entries found for this cycle. Assign workers to generate billing.</div>
                ) : (
                  employees.filter(e => (e.availability_status || 'available') !== 'available').map((emp) => (
                    <div key={emp.id} className="p-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                          <Users className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">{emp.full_name}</h4>
                          <div className="flex items-center gap-3 text-[13px] font-medium text-slate-500 mt-1">
                            <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md"><Clock className="w-3.5 h-3.5 text-slate-400" /> ₹{emp.daily_rate || 0}/day</span>
                            <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md"><Briefcase className="w-3.5 h-3.5 text-slate-400" /> {emp.job_title || 'Assigned'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-extrabold text-[#00A859] tracking-tight">₹{((emp.daily_rate || 0) * 26).toLocaleString()}</p>
                        <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md uppercase tracking-wider font-bold mt-1 inline-block">PENDING</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Action Panel */}
          <div className="flex flex-col gap-6">
            <div className="premium-card p-8 text-center group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500"><Send className="w-48 h-48 -mt-12 -mr-12 text-[#00A859]" /></div>
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 relative z-10 shadow-sm border border-[#00A859]/20" style={{ background: 'linear-gradient(135deg, rgba(0,168,89,0.1), rgba(0,168,89,0.02))' }}>
                <Send className="w-10 h-10 ml-1 text-[#00A859]" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-3 tracking-tight relative z-10">Run Automation</h3>
              <p className="text-[13px] font-medium text-slate-500 mb-8 leading-relaxed relative z-10 max-w-[250px] mx-auto">
                Clicking this will generate <strong>Worker Payslips</strong> and <strong>Client Monthly Bills</strong> based on verified attendance hours.
              </p>
              <button className="w-full py-4 px-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 relative z-10" style={{ background: 'linear-gradient(135deg, #00A859, #008f4c)' }}>
                <FileText className="w-5 h-5" /> Dispatch All Documents
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Automation Checklist
              </h3>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-700">Attendance manually verified by HR</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-700">Salary rates verified</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-700">Client billing active</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Manual Payslip Generator Modal */}
      {showPayslipModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-200 overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white border border-[#00A859]/20 shadow-sm rounded-xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#00A859]/10 to-transparent"></div>
                  <FileText className="w-6 h-6 relative z-10" style={{ color: '#00A859' }} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 leading-tight">Manual Payslip</h2>
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">Custom Worker Generation</p>
                </div>
              </div>
              <button onClick={() => setShowPayslipModal(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5 bg-white">
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Select Worker</label>
                <select value={payslipForm.workerId} onChange={(e) => setPayslipForm({ ...payslipForm, workerId: e.target.value })} className="field-control">
                  <option value="">-- Choose Worker --</option>
                  {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Total Days Worked</label>
                <input type="number" placeholder="e.g. 21.5" value={payslipForm.daysWorked} onChange={(e) => setPayslipForm({ ...payslipForm, daysWorked: e.target.value })} className="field-control" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Service Month</label>
                  <input type="text" value={payslipForm.serviceMonth} onChange={(e) => setPayslipForm({ ...payslipForm, serviceMonth: e.target.value })} className="field-control" />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Advance (₹)</label>
                  <input type="number" placeholder="e.g. 2000" value={payslipForm.advance} onChange={(e) => setPayslipForm({ ...payslipForm, advance: e.target.value })} className="field-control" />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowPayslipModal(false)} className="btn-secondary flex-1 py-3">Cancel</button>
                <button type="button" onClick={() => { setShowPayslipModal(false); }} className="btn-primary flex-1 py-3">Generate PDF</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
