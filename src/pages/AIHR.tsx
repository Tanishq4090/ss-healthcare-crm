import { useCallback, useEffect, useMemo, useState } from 'react';
import { BadgeIndianRupee, Briefcase, Calendar, CheckCircle2, ChevronDown, Clock, CreditCard, Lock, Edit3, FileText, IdCard, Link2, MapPin, Phone, Plus, RefreshCw, Search, Send, Shield, Trash2, Upload, UserPlus, Users, X } from 'lucide-react';
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

function FullProfileModal({
  employee,
  onClose,
}: {
  employee: Employee;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden text-left flex flex-col max-h-[90vh]">
        {/* Banner Header */}
        <div className="bg-[#0C8C8C] p-6 relative flex items-center gap-5 shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white rounded-full p-2"><X className="h-5 w-5" /></button>
          
          <div className="w-20 h-20 rounded-full border-4 border-white/30 overflow-hidden shrink-0 shadow-md">
            {employee.photo_url ? (
              <img src={employee.photo_url} className="h-full w-full object-cover" alt="" />
            ) : (
              <div className="w-full h-full bg-teal-800 text-white flex items-center justify-center font-bold text-2xl">
                {(employee.full_name || 'S').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="text-white">
            <h3 className="text-2xl font-bold">{employee.full_name}</h3>
            <p className="text-white/85 text-sm font-medium mt-0.5">{employee.job_title || employee.position || 'Registered Doctor'}</p>
            <div className="flex gap-2 mt-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/15 border border-white/10 px-2.5 py-1 rounded text-white font-mono">
                {employee.employee_code || 'EMP-XXXXXX'}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/15 border border-white/10 px-2.5 py-1 rounded text-white">
                {employee.availability_status || 'AVAILABLE'}
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
          {/* Left Column: Verification Profile */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-black tracking-widest text-slate-400 uppercase">Verification Profile</h4>
            
            {/* Aadhaar */}
            <div className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Aadhaar Identification</p>
                <p className="text-sm font-bold text-slate-800 mt-1">{employee.aadhaar || '0000 0000 0000'}</p>
              </div>
              <Shield className="h-5 w-5 text-[#00A859]" />
            </div>

            {/* Primary Contact */}
            <div className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4 flex items-center gap-3">
              <Phone className="h-5 w-5 text-slate-400 shrink-0" />
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Primary Contact</p>
                <p className="text-sm font-bold text-slate-800 mt-1">{employee.phone || 'Not captured'}</p>
              </div>
            </div>

            {/* Address */}
            <div className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4 flex items-center gap-3">
              <MapPin className="h-5 w-5 text-slate-400 shrink-0" />
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Current Address</p>
                <p className="text-sm font-bold text-slate-800 mt-1">{employee.residential_address || employee.address || 'Not specified'}</p>
              </div>
            </div>

            {/* Financial Meta */}
            <div className="space-y-3 pt-2">
              <h4 className="text-[11px] font-black tracking-widest text-slate-400 uppercase">Financial Meta</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Rate</p>
                  <p className="text-base font-bold text-slate-800 mt-1">₹{employee.daily_rate || 0}</p>
                </div>
                <div className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Payment Scheme</p>
                  <span className="inline-block mt-1 text-xs font-bold text-[#0C8C8C] bg-[#E6F4F4] px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {employee.payment_scheme || 'Daily Rate'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Uploaded ID Proofs */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-black tracking-widest text-slate-400 uppercase">Uploaded ID Proofs</h4>
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-[260px]">
              <FileText className="h-10 w-10 text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-400 max-w-[200px]">
                {employee.id_documents && (employee.id_documents as Array<any>).length > 0 ? (
                  <span className="text-slate-700">Documents verified on file</span>
                ) : (
                  "No documents verification on file"
                )}
              </p>
              {employee.id_documents && (employee.id_documents as Array<any>).map((doc, idx) => (
                <a key={idx} href={doc.url} target="_blank" rel="noreferrer" className="mt-2 text-xs font-bold text-teal-600 hover:underline">
                  Download {doc.name || 'Proof'}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmployeeFormModal({
  employee,
  services,
  onClose,
  onSaved,
}: {
  employee?: Employee | null;
  services: ServiceOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!employee;
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

  useEffect(() => {
    if (employee) {
      setForm({
        full_name: employee.full_name || '',
        job_title: employee.job_title || employee.position || '',
        gender: employee.gender || '',
        phone: employee.phone || '',
        email: employee.email || '',
        aadhaar: employee.aadhaar || '',
        date_of_birth: employee.date_of_birth || '',
        residential_address: employee.residential_address || employee.address || '',
        experience: employee.experience || '',
        payment_scheme: employee.payment_scheme || 'Daily Rate',
        daily_rate: String(employee.daily_rate || '0'),
      });
      setSkills(employee.service_skills || []);
    }
  }, [employee]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) return setError('Full name is required.');
    if (!form.job_title.trim()) return setError('Job title is required.');

    setSaving(true);
    setError('');

    try {
      let photo_url = employee?.photo_url || '';
      let idDocs = employee?.id_documents || [];

      if (photoFile) {
        const uploaded = await uploadFile(photoFile, 'staff-photos');
        photo_url = uploaded.publicUrl;
      }

      if (docFile) {
        const uploaded = await uploadFile(docFile, 'staff-documents');
        const newDoc = { name: docFile.name, path: uploaded.path, url: uploaded.publicUrl };
        idDocs = Array.isArray(idDocs) ? [...idDocs, newDoc] : [newDoc];
      }

      const payload = {
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
      };

      if (isEdit && employee) {
        const { error: updateError } = await supabase
          .from('employees')
          .update(payload)
          .eq('id', employee.id);
        if (updateError) throw updateError;
      } else {
        const username = form.full_name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || `staff_${Date.now()}`;
        const { error: insertError } = await supabase
          .from('employees')
          .insert({
            ...payload,
            username,
            role: 'user',
            accesses: ['hr'],
            status: 'active',
            availability_status: 'available',
          });
        if (insertError) throw insertError;
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save employee.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="my-6 w-full max-w-xl rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200 text-left flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl border-b border-slate-100 bg-white/95 px-6 py-4 backdrop-blur shrink-0">
          <div className="flex items-center gap-3">
            <UserPlus className="h-5 w-5 text-teal-600" />
            <h3 className="text-xl font-bold text-slate-950">
              {isEdit ? 'Edit Employee Details' : 'Add New Employee'}
            </h3>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-5 p-6 overflow-y-auto">
          {/* Photo Drag & Drop Zone */}
          <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-center transition hover:border-teal-300 hover:bg-teal-50/40">
            <Upload className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500 font-medium">Drag & drop or <span className="font-bold text-teal-600">click to upload</span></p>
            <p className="text-xs text-slate-400 mt-0.5">JPEG, PNG, WebP · max 5 MB</p>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
            {photoFile && <p className="mt-2 text-xs font-bold text-teal-700">Selected: {photoFile.name}</p>}
            {!photoFile && employee?.photo_url && (
              <div className="mt-2 flex items-center justify-center gap-2">
                <img src={employee.photo_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                <span className="text-xs font-bold text-slate-400">Current Photo loaded</span>
              </div>
            )}
          </label>

          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Full Name *</label>
            <input
              type="text"
              required
              value={form.full_name}
              onChange={(e) => set('full_name', e.target.value)}
              className="w-full text-sm font-semibold border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#00A859]/20"
              placeholder="e.g. Anita Sharma"
            />
          </div>

          {/* Job Title and Gender */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Job Title *</label>
              <input
                type="text"
                required
                value={form.job_title}
                onChange={(e) => set('job_title', e.target.value)}
                className="w-full text-sm font-semibold border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#00A859]/20"
                placeholder="e.g. Registered Nurse"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => set('gender', e.target.value)}
                className="w-full text-sm font-semibold border border-slate-200 bg-white rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#00A859]/20 cursor-pointer"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Services & Skills Badges */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Services & Skills</label>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 border border-slate-100 rounded-xl">
              {services.map((service) => {
                const isSelected = skills.includes(service.name);
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => toggleSkill(service.name)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      isSelected
                        ? 'border-teal-300 bg-teal-50 text-teal-700'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-teal-200'
                    }`}
                  >
                    {service.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Phone</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              className="w-full text-sm font-semibold border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#00A859]/20"
              placeholder="98765 43210"
            />
          </div>

          {/* Aadhaar and Date of Birth */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Aadhaar</label>
              <input
                type="text"
                value={form.aadhaar}
                onChange={(e) => set('aadhaar', e.target.value)}
                className="w-full text-sm font-semibold border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#00A859]/20"
                placeholder="0000 0000 0000"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Date of Birth</label>
              <input
                type="date"
                value={form.date_of_birth}
                onChange={(e) => set('date_of_birth', e.target.value)}
                className="w-full text-sm font-semibold border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#00A859]/20"
              />
            </div>
          </div>

          {/* Residential Address and Experience */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Residential Address</label>
              <input
                type="text"
                value={form.residential_address}
                onChange={(e) => set('residential_address', e.target.value)}
                className="w-full text-sm font-semibold border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#00A859]/20"
                placeholder="Full Address"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Experience</label>
              <input
                type="text"
                value={form.experience}
                onChange={(e) => set('experience', e.target.value)}
                className="w-full text-sm font-semibold border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#00A859]/20"
                placeholder="e.g. 5 Years"
              />
            </div>
          </div>

          {/* ID Proofs Document upload */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">ID Proofs & Documents</label>
            <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 px-4 py-4 text-center transition hover:border-teal-300 hover:bg-teal-50/40">
              <Upload className="mx-auto h-6 w-6 text-slate-300" />
              <p className="mt-1 text-xs text-slate-500">Click to upload Aadhaar, PAN, or other proofs</p>
              <input type="file" className="hidden" onChange={(e) => setDocFile(e.target.files?.[0] || null)} />
              {docFile && <p className="mt-2 text-xs font-bold text-teal-700">Selected: {docFile.name}</p>}
            </label>
          </div>

          {/* Payment Scheme & Rate */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Payment Scheme</label>
              <select
                value={form.payment_scheme}
                onChange={(e) => set('payment_scheme', e.target.value)}
                className="w-full text-sm font-semibold border border-slate-200 bg-white rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#00A859]/20 cursor-pointer"
              >
                <option value="Daily Rate">Daily Rate</option>
                <option value="Monthly">Monthly</option>
                <option value="Hourly">Hourly</option>
                <option value="Per Visit">Per Visit</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {form.payment_scheme === 'Hourly' ? 'HOURLY RATE (₹)' :
                 form.payment_scheme === 'Monthly' ? 'MONTHLY RATE (₹)' :
                 form.payment_scheme === 'Per Visit' ? 'PER VISIT RATE (₹)' : 'DAILY RATE (₹)'}
              </label>
              <input
                type="number"
                value={form.daily_rate}
                onChange={(e) => set('daily_rate', e.target.value)}
                className="w-full text-sm font-semibold border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#00A859]/20"
              />
            </div>
          </div>

          {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">{error}</p>}

          {/* Footer Buttons */}
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-4">
            <button type="button" onClick={onClose} className="btn-secondary px-5">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary px-5 flex items-center gap-1.5">
              <UserPlus className="h-4 w-4" /> {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Employee'}
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
  const [selectedProfile, setSelectedProfile] = useState<Employee | null>(null);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'allocation' | 'attendance' | 'payroll'>('allocation');
  const [hrSubTab, setHrSubTab] = useState<'workers' | 'deployments' | 'directory' | 'trash'>('workers');
  const [dirFilter, setDirFilter] = useState<'all' | 'available' | 'assigned' | 'inactive'>('all');
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [payslipForm, setPayslipForm] = useState({ workerId: '', daysWorked: '', serviceMonth: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), advance: '' });

  useEffect(() => {
    const handleClose = () => setActiveMenuId(null);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, []);

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
      {showAdd && (
        <EmployeeFormModal
          services={services}
          onClose={() => setShowAdd(false)}
          onSaved={fetchEmployees}
        />
      )}
      {editEmployee && (
        <EmployeeFormModal
          employee={editEmployee}
          services={services}
          onClose={() => setEditEmployee(null)}
          onSaved={fetchEmployees}
        />
      )}
      {selectedProfile && (
        <FullProfileModal
          employee={selectedProfile}
          onClose={() => setSelectedProfile(null)}
        />
      )}
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
                <div key={emp.id} className="premium-card p-6 group relative">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-base font-bold text-white shadow-sm transition-transform group-hover:scale-105" style={{ background: 'linear-gradient(135deg, #00A859, #004C8C)' }}>
                      {emp.photo_url ? <img src={emp.photo_url} className="h-full w-full object-cover" alt="" /> : (emp.full_name || 'S').split(' ').map((n) => n[0]).join('').slice(0,2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between">
                        <p className="font-bold text-slate-900 text-base truncate">{emp.full_name}</p>
                        
                        {/* Dropdown Menu */}
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === emp.id ? null : emp.id);
                            }}
                            className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                          {activeMenuId === emp.id && (
                            <div className="absolute right-0 mt-1 w-48 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-20 text-left">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedProfile(emp);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Shield className="h-4 w-4 text-slate-400" /> Full Profile
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCard(emp);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <FileText className="h-4 w-4 text-slate-400" /> Preview ID Card
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditEmployee(emp);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-sm text-[#00A859] hover:bg-slate-50 flex items-center gap-2 font-semibold"
                              >
                                <Edit3 className="h-4 w-4" /> Edit Employee
                              </button>
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(null);
                                  if (window.confirm(`Are you sure you want to delete ${emp.full_name}?`)) {
                                    await supabase.from('employees').delete().eq('id', emp.id);
                                    fetchEmployees();
                                  }
                                }}
                                className="w-full px-4 py-2 text-sm text-rose-600 hover:bg-slate-50 flex items-center gap-2 font-semibold border-t border-slate-100"
                              >
                                <Trash2 className="h-4 w-4" /> Delete Member
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-wider">{emp.job_title || emp.position || 'Care Specialist'}</p>
                      <span className={`inline-flex items-center gap-1.5 mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${(emp.availability_status || 'available') === 'available' ? 'text-[#00A859] bg-[#00A859]/10 border-[#00A859]/20' : 'text-slate-500 bg-slate-100 border-slate-200'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${(emp.availability_status || 'available') === 'available' ? 'bg-[#00A859]' : 'bg-slate-400'}`} />
                        {(emp.availability_status || 'available')}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2.5 text-[13px] mb-5">
                    <div className="flex justify-between items-center"><span className="text-slate-400 font-medium">Skills</span><span className="text-slate-700 font-bold truncate max-w-[150px]">{(emp.service_skills || []).slice(0,2).join(', ') || '—'}</span></div>
                    <div className="flex justify-between items-center"><span className="text-slate-400 font-medium">Contact</span><span className="text-slate-700 font-bold">{emp.phone || '—'}</span></div>
                    <div className="flex justify-between items-center"><span className="text-slate-400 font-medium">joined</span><span className="text-slate-700 font-bold">{emp.created_at ? new Date(emp.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}</span></div>
                  </div>
                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <button onClick={() => setSelectedCard(emp)} className="btn-secondary flex-1 py-2 shadow-none border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 hover:text-slate-700">
                      ID Card
                    </button>
                    <button onClick={() => toggleAvailability(emp)} className="btn-primary flex-1 py-2 text-[13px] flex items-center justify-center gap-1.5">
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

          {/* Directory sub-tab — Table view */}
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
        /* Attendance View */
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
        /* Payroll & Invoicing View */
        <div className="flex-1 flex items-center justify-center py-20 px-4">
          <div className="max-w-md w-full text-center">
            <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Lock className="w-10 h-10 text-slate-300" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Coming Soon</h2>
            <p className="text-slate-500 mb-8 font-medium">The comprehensive Payroll module is currently locked and will be activated in a future phase according to your requirements.</p>
            
            <button type="button" disabled className="btn-secondary opacity-50 cursor-not-allowed mx-auto">
              Module Locked
            </button>
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
