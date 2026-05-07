import { useState, useEffect, useCallback } from 'react';
import { Building2, Mail, MapPin, Phone, Plus, RefreshCw, Search, TrendingUp, Upload, Users, X } from 'lucide-react';
import { PageShell, StatusBadge, Surface } from '@/components/AppPrimitives';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface Lead {
  id: string;
  client_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  stage: string;
  priority: string;
  value: number;
  assignee?: string;
  tags?: string[];
  notes?: string;
  created_at: string;
}

const statusStyles: Record<string, string> = {
  'closed-won':     'bg-emerald-50 text-emerald-700 border-emerald-100',
  'new-lead':       'bg-blue-50 text-blue-700 border-blue-100',
  'new-inquiry':    'bg-violet-50 text-violet-700 border-violet-100',
  'in-discussion':  'bg-amber-50 text-amber-700 border-amber-100',
  'quotation-sent': 'bg-pink-50 text-pink-700 border-pink-100',
};

const stageLabel: Record<string, string> = {
  'new-lead':       'New Lead',
  'new-inquiry':    'New Inquiry',
  'in-discussion':  'In Discussion',
  'quotation-sent': 'Quotation Sent',
  'closed-won':     'Active Client',
};

const filters = ['All Clients', 'Active Client', 'New Lead', 'In Discussion', 'Quotation Sent'];

const COLORS = [
  'from-blue-500 to-cyan-500','from-green-500 to-emerald-500','from-violet-500 to-fuchsia-500',
  'from-amber-500 to-orange-500','from-pink-500 to-rose-500','from-cyan-500 to-teal-500',
];

function AddClientModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({
    client_name: '', contact_person: '', phone: '', email: '',
    address: '', stage: 'new-lead', priority: 'Medium', value: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_name.trim()) { setError('Client name is required.'); return; }
    setSaving(true); setError('');
    const { error: err } = await supabase.from('crm_leads').insert({
      ...form, value: Number(form.value) || 0, assignee: 'admin',
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    onAdded(); onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="text-lg font-extrabold text-slate-950">Add Client</h3>
            <p className="text-sm text-slate-500">New patient or family to your care network</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { label: 'Client / Family Name *', name: 'client_name',    placeholder: 'Sharma Family' },
              { label: 'Contact Person',         name: 'contact_person', placeholder: 'Rajesh Sharma' },
              { label: 'Phone',                  name: 'phone',          placeholder: '+91 98765 43210' },
              { label: 'Email',                  name: 'email',          placeholder: 'rajesh@email.com' },
              { label: 'Address / Location',     name: 'address',        placeholder: 'Surat, Gujarat' },
              { label: 'Est. Value (₹)',          name: 'value',          placeholder: '15000' },
            ].map(f => (
              <div key={f.name}>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">{f.label}</label>
                <input type="text" placeholder={f.placeholder}
                  value={(form as Record<string,string>)[f.name]}
                  onChange={e => setForm(x => ({ ...x, [f.name]: e.target.value }))}
                  className="field-control w-full" />
              </div>
            ))}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">Stage</label>
              <select value={form.stage} onChange={e => setForm(x => ({ ...x, stage: e.target.value }))} className="field-control w-full">
                {Object.entries(stageLabel).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">Priority</label>
              <select value={form.priority} onChange={e => setForm(x => ({ ...x, priority: e.target.value }))} className="field-control w-full">
                {['Very High','High','Medium','Low'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">Notes</label>
              <textarea value={form.notes} onChange={e => setForm(x => ({ ...x, notes: e.target.value }))}
                placeholder="Care requirements, special notes..." rows={2} className="field-control w-full resize-none" />
            </div>
          </div>
          {error && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
          <div className="mt-6 flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving…' : 'Add Client'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Clients() {
  const [leads,    setLeads]    = useState<Lead[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('All Clients');
  const [search,   setSearch]   = useState('');
  const [showAdd,  setShowAdd]  = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('crm_leads').select('*').order('created_at', { ascending: false });
    setLeads((data || []) as Lead[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const filtered = leads.filter(l => {
    const matchSearch =
      l.client_name.toLowerCase().includes(search.toLowerCase()) ||
      (l.contact_person || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.address || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All Clients' || stageLabel[l.stage] === filter || l.stage === filter;
    return matchSearch && matchFilter;
  });

  return (
    <PageShell>
      {showAdd && <AddClientModal onClose={() => setShowAdd(false)} onAdded={fetchLeads} />}

      <Surface style={{ borderColor: 'rgba(0,168,89,0.12)' }} className="bg-gradient-to-br from-white via-green-50/40 to-blue-50/60">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase" style={{ color: '#00A859' }}>Patient network</p>
            <h2 className="mt-1 text-2xl font-extrabold text-slate-950">Care Network Overview</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Manage patient families, care requests, and service pipeline in one view.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => setShowAdd(true)} className="btn-primary">
              <Plus className="h-4 w-4" /> Add Client
            </button>
            <button type="button" onClick={fetchLeads} className="btn-secondary">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>
      </Surface>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full xl:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search clients..." value={search}
            onChange={e => setSearch(e.target.value)} className="field-control w-full pl-10 pr-4" />
        </div>
        <div className="segmented-control w-full overflow-x-auto xl:w-auto">
          {filters.map(item => (
            <button key={item} type="button" onClick={() => setFilter(item)}
              className={cn('segmented-item whitespace-nowrap', filter === item && 'segmented-item-active')}>
              {item}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center gap-2 text-slate-400">
          <RefreshCw className="h-4 w-4 animate-spin" style={{ color: '#00A859' }} />
          <span className="text-sm">Loading clients…</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-400">
              <Users className="mx-auto mb-3 h-10 w-10 opacity-30" />
              <p className="text-sm">No clients found. Add your first client above.</p>
            </div>
          )}
          {filtered.map((lead, i) => {
            const initials = lead.client_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            const color = COLORS[i % COLORS.length];
            return (
              <article key={lead.id} className="clinical-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="clinical-content">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-sm font-extrabold text-white shadow-md`}>
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-extrabold text-slate-950">{lead.client_name}</h3>
                        {lead.address && (
                          <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{lead.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <StatusBadge className={statusStyles[lead.stage] || 'bg-slate-50 text-slate-600 border-slate-200'}>
                      {stageLabel[lead.stage] || lead.stage}
                    </StatusBadge>
                  </div>

                  <div className="mt-5 space-y-2">
                    {lead.contact_person && (
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                        <Users className="h-4 w-4 shrink-0" style={{ color: '#00A859' }} />
                        <span className="truncate">{lead.contact_person}</span>
                      </div>
                    )}
                    {lead.phone && (
                      <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-green-700">
                        <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                        <span className="truncate">{lead.phone}</span>
                      </a>
                    )}
                    {lead.email && (
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                        <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                        <span className="truncate">{lead.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                    <div className="rounded-xl p-3" style={{ background: 'rgba(0,168,89,0.07)' }}>
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase" style={{ color: '#00A859' }}>
                        <Building2 className="h-3.5 w-3.5" /> Priority
                      </div>
                      <p className="mt-2 text-sm font-extrabold text-slate-950">{lead.priority}</p>
                    </div>
                    <div className="rounded-xl bg-blue-50/70 p-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-blue-700">
                        <TrendingUp className="h-3.5 w-3.5" /> Value
                      </div>
                      <p className="mt-2 text-sm font-extrabold text-slate-950">₹{(lead.value || 0).toLocaleString()}</p>
                    </div>
                  </div>

                  {lead.notes && (
                    <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500 line-clamp-2">{lead.notes}</p>
                  )}

                  <div className="mt-4 flex justify-end">
                    <button type="button" className="subtle-link">View Profile →</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
