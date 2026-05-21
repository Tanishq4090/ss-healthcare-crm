import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Bot, Briefcase, Calendar, CheckCircle2, ChevronDown, ChevronRight, CreditCard, FileText, IdCard, Mail, MessageCircle, Phone, PhoneCall, Plus, RefreshCw, Send, Star, Trash2, UserCheck, X } from 'lucide-react';
import { IconFrame, PageShell, SectionHeader, StatusBadge, Surface } from '@/components/AppPrimitives';
import StaffIDCard from '@/components/StaffIDCard';
import type { StaffIDCardEmployee } from '@/components/StaffIDCard';
import { CRM_PIPELINE_STAGES, CRM_PIPELINE_VIEW_STAGES, CRM_CLIENT_VIEW_STAGES, CRM_STAGE_LABELS, normalizeCrmStage } from '@/config/crmStages';
import { fetchCallInquiries, markCallAsAddedToPipeline, formatCallDuration, isCallConvertible, type CallInquiry } from '@/lib/domain/callLeads';
import { absoluteStaffIdUrl, buildStaffAssignedMessage, logTemplateMessage, toWhatsAppPhone } from '@/lib/staffIdentity';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

type Lead = {
  id: string;
  client_name?: string | null;
  company_name?: string | null;
  name?: string | null;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  stage?: string | null;
  priority?: string | null;
  value?: number | null;
  deal_value?: number | null;
  assignee?: string | null;
  assigned_staff_id?: string | null;
  assigned_staff_name?: string | null;
  assigned_staff_phone?: string | null;
  assigned_staff_code?: string | null;
  staff_id_card_url?: string | null;
  service_type?: string | null;
  source?: string | null;
  notes?: string | null;
  tags?: string[] | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
  last_template_sent?: string | null;
};

type Employee = StaffIDCardEmployee & {
  id: string;
  email?: string | null;
  availability_status?: string | null;
};

type WhatsAppMessage = {
  id: string;
  direction: 'inbound' | 'outbound';
  message_type: string;
  template_name?: string | null;
  content: string;
  status: string;
  sent_by?: string | null;
  created_at: string;
};

const priorityColors: Record<string, string> = {
  'Very High': 'bg-rose-50 text-rose-700 border-rose-100',
  High: 'bg-orange-50 text-orange-700 border-orange-100',
  Medium: 'bg-amber-50 text-amber-700 border-amber-100',
  Low: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

function leadName(lead: Lead) {
  return lead.client_name || lead.company_name || lead.name || 'Unknown Client';
}

function leadContact(lead: Lead) {
  return lead.contact_person || leadName(lead);
}

function leadValue(lead: Lead) {
  return Number(lead.value || lead.deal_value || 0);
}

function sourceBadges(lead: Lead) {
  const labels = new Set<string>();
  const source = String(lead.source || '').toLowerCase();
  if (source.includes('manual')) labels.add('Manual');
  if (source.includes('call')) labels.add('Call Lead');
  if (source.includes('callyzer')) labels.add('Callyzer-ready');
  if (!labels.size) labels.add('Manual');
  return Array.from(labels);
}

function templateText(template: string, lead: Lead) {
  const name = leadContact(lead).split(' ')[0] || 'there';
  const service = lead.service_type || 'Home Healthcare Service';
  switch (template) {
    case 'inquiry_received':
      return `Namaste ${name} ji, thank you for contacting SS Health Care. We have received your inquiry for ${service}. Our team will contact you shortly.`;
    case 'quotation_sent':
      return `Namaste ${name} ji, your quotation for ${service} is ready. Please reply here if you would like to proceed.`;
    case 'form_submitted':
      return `Namaste ${name} ji, we have received your form. Our care coordinator will verify the details and move to staff assignment.`;
    case 'staff_assigned':
      return `Namaste ${name} ji, your assigned SS Health Care staff profile is ready. Please verify the ID card link shared by our care coordinator before service starts.`;
    case 'deposit_pending':
      return `Namaste ${name} ji, your deposit is pending. Once deposit is completed, we will confirm your service start.`;
    case 'monthly_billing':
      return `Namaste ${name} ji, your monthly bill is ready. Please contact SS Health Care for payment details.`;
    case 'general_follow_up':
      return `Namaste ${name} ji, this is a general follow-up from SS Health Care regarding your ${service} requirement. Please let us know how we can help further.`;
    default:
      return `Namaste ${name} ji, this is a follow-up from SS Health Care regarding your home healthcare service.`;
  }
}

async function openLoggedTemplateMessage(lead: Lead, templateName: string, content: string, payload?: Record<string, unknown>) {
  if (!lead.phone) throw new Error('Lead phone number is missing.');
  await logTemplateMessage({
    leadId: lead.id,
    phone: lead.phone,
    templateName,
    content,
    payload,
  });
  const waPhone = toWhatsAppPhone(lead.phone);
  if (waPhone) window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(content)}`, '_blank');
}

function StaffAssignmentModal({
  lead,
  employees,
  onClose,
  onAssigned,
}: {
  lead: Lead;
  employees: Employee[];
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [selected, setSelected] = useState<Employee | null>(employees[0] || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const assign = async () => {
    if (!selected) return setError('Select one staff member.');
    setSaving(true);
    setError('');
    try {
      const { data, error: rpcError } = await supabase.rpc('assign_staff_to_lead', {
        p_lead_id: lead.id,
        p_employee_id: selected.id,
        p_sent_by: 'admin',
      });
      if (rpcError) throw rpcError;

      const idCardUrl = absoluteStaffIdUrl((data as { id_card_url?: string } | null)?.id_card_url || selected.id_card_url);
      const content = buildStaffAssignedMessage({
        clientName: leadContact(lead),
        staffName: selected.full_name || selected.username || 'Assigned Staff',
        staffRole: selected.job_title || selected.position || 'Care Specialist',
        idCardUrl,
      });

      if (lead.phone) {
        await openLoggedTemplateMessage(lead, 'staff_assigned', content, {
          employee_id: selected.id,
          employee_code: selected.employee_code,
          id_card_url: idCardUrl,
        });
      }

      onAssigned();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign staff.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-5xl rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-teal-600">Staff assignment</p>
            <h3 className="text-2xl font-black text-slate-950">Assign staff to {leadName(lead)}</h3>
            <p className="mt-1 text-sm text-slate-500">Only available or active staff are shown here. The selected ID card link will be included in the WhatsApp template message.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        <div className="mt-5 grid max-h-[68vh] grid-cols-1 gap-5 overflow-y-auto lg:grid-cols-[1fr_420px]">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {employees.map((emp) => {
              const isActive = selected?.id === emp.id;
              return (
                <button key={emp.id} type="button" onClick={() => setSelected(emp)} className={`rounded-2xl border p-4 text-left transition ${isActive ? 'border-teal-300 bg-teal-50 ring-2 ring-teal-100' : 'border-slate-200 bg-white hover:border-teal-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-teal-700 to-blue-700 text-sm font-black text-white">
                      {emp.photo_url ? <img src={emp.photo_url} className="h-full w-full object-cover" alt="" /> : (emp.full_name || 'S').split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-950">{emp.full_name}</p>
                      <p className="truncate text-xs font-bold text-teal-700">{emp.employee_code} · {emp.job_title || emp.position || 'Care Specialist'}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-500">{emp.gender || 'Unspecified'} · {emp.phone || 'No phone'}</span>
                    <span className={cn('rounded-full px-2 py-1', (emp.availability_status || 'available') === 'available' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700')}>
                      {emp.availability_status || 'available'}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(emp.service_skills || []).slice(0, 3).map((skill) => <span key={skill} className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-500">{skill}</span>)}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-3xl border border-slate-100 bg-slate-50/50 p-4">
            {selected ? <StaffIDCard employee={selected} showActions={false} /> : <p className="text-sm text-slate-400">Select staff to preview ID card.</p>}
          </div>
        </div>

        {error && <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary px-6">Cancel</button>
          <button onClick={assign} disabled={saving || !selected} className="btn-primary px-6">
            <UserCheck className="h-4 w-4" /> {saving ? 'Assigning...' : 'Assign Staff + Send ID Card Template'}
          </button>
        </div>
      </div>
    </div>
  );
}

function WhatsAppHistoryDrawer({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const phone = (lead.phone || '').replace(/\D/g, '').slice(-10);
      let query = supabase.from('whatsapp_messages').select('*').order('created_at', { ascending: true });
      if (lead.id) query = query.or(`lead_id.eq.${lead.id},phone.ilike.%${phone}%`);
      const { data } = await query;
      setMessages((data || []) as WhatsAppMessage[]);
      setLoading(false);
    }
    load();
  }, [lead]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 backdrop-blur-sm">
      <div className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-teal-600">WhatsApp History</p>
            <h3 className="text-xl font-black text-slate-950">{leadName(lead)}</h3>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3 p-6">
          {loading && <p className="text-sm text-slate-400">Loading conversation...</p>}
          {!loading && !messages.length && <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-400">No WhatsApp history yet. Send a template from the lead card.</p>}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.direction === 'outbound' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                {msg.template_name && <p className="mb-1 text-[10px] font-black uppercase tracking-widest opacity-70">{msg.template_name}</p>}
                <p className="whitespace-pre-wrap leading-6">{msg.content}</p>
                <p className="mt-2 text-[10px] font-semibold opacity-70">{new Date(msg.created_at).toLocaleString()} · {msg.status}{msg.sent_by ? ` · ${msg.sent_by}` : ''}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LeadDetailsDrawer({
  lead,
  onClose,
  onRefresh,
  onShowHistory,
  onAssignStaff,
}: {
  lead: Lead;
  onClose: () => void;
  onRefresh: () => void;
  onShowHistory: () => void;
  onAssignStaff: () => void;
}) {
  const [notes, setNotes] = useState(lead.notes || '');
  const [phone, setPhone] = useState(lead.phone || '');
  const [email, setEmail] = useState(lead.email || '');
  const [source, setSource] = useState(lead.source || 'Manual Add');
  const [value, setValue] = useState(lead.value || 0);
  const [priority, setPriority] = useState(lead.priority || 'Medium');
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setNotes(lead.notes || '');
    setPhone(lead.phone || '');
    setEmail(lead.email || '');
    setSource(lead.source || 'Manual Add');
    setValue(lead.value || 0);
    setPriority(lead.priority || 'Medium');
  }, [lead]);

  const updateField = async (fieldName: string, fieldValue: any) => {
    try {
      const { error: err } = await supabase
        .from('crm_leads')
        .update({ [fieldName]: fieldValue })
        .eq('id', lead.id);
      if (err) throw err;
      onRefresh();
    } catch (e) {
      console.error(`Failed to update ${fieldName}:`, e);
      setError(`Failed to save ${fieldName}`);
    }
  };

  const saveNotes = async () => {
    setSaving(true);
    setError('');
    const { error: updateError } = await supabase.from('crm_leads').update({ notes }).eq('id', lead.id);
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    onRefresh();
  };

  const approveQuotation = async () => {
    try {
      await supabase.from('crm_leads').update({ stage: 'form-submitted' }).eq('id', lead.id);
      onRefresh();
    } catch (e) {
      console.error(e);
      setError('Failed to approve quotation');
    }
  };

  const deleteLead = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete lead "${leadName(lead)}"?`)) return;
    try {
      const { error: err } = await supabase.from('crm_leads').delete().eq('id', lead.id);
      if (err) throw err;
      onClose();
      onRefresh();
    } catch (e) {
      console.error(e);
      setError('Failed to delete lead.');
    }
  };

  const sendMessage = async (templateName: string, content?: string) => {
    try {
      await openLoggedTemplateMessage(lead, templateName, content || templateText(templateName, lead), { source: 'lead_details_drawer' });
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open WhatsApp.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      saveNotes();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 backdrop-blur-sm">
      <div className="h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#EC4899] text-white flex items-center justify-center font-bold text-lg">
              {leadName(lead).charAt(0).toUpperCase()}
            </div>
            <h3 className="text-xl font-bold text-slate-900">{leadName(lead)}</h3>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100 border border-slate-200 text-slate-500"><X className="h-4 w-4" /></button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Pipeline Stage */}
          <div className="space-y-2 text-left">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">Pipeline Stage</label>
            <select
              value={normalizeCrmStage(lead.stage)}
              onChange={(e) => updateField('stage', e.target.value)}
              className="w-full text-sm font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#00A859]/20 cursor-pointer shadow-sm"
            >
              <optgroup label="— Pipeline —">
                {CRM_PIPELINE_VIEW_STAGES.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </optgroup>
              <optgroup label="— Clients —">
                {CRM_CLIENT_VIEW_STAGES.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Contact Details */}
          <div className="space-y-2 text-left">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">Contact Details</label>
            <div className="border border-slate-100 rounded-2xl bg-slate-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone</span>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={() => updateField('phone', phone)}
                  className="text-sm font-bold text-slate-800 text-right bg-transparent border-0 focus:ring-0 outline-none p-0 w-48 focus:border-b focus:border-slate-200"
                  placeholder="Add phone"
                />
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</span>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => updateField('email', email)}
                  className="text-sm font-bold text-[#004C8C] text-right bg-transparent border-0 focus:ring-0 outline-none p-0 w-48 placeholder:italic placeholder:font-normal placeholder:text-slate-400 focus:border-b focus:border-slate-200"
                  placeholder="Add email"
                />
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Source</span>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  onBlur={() => updateField('source', source)}
                  className="text-sm font-bold text-slate-800 text-right bg-transparent border-0 focus:ring-0 outline-none p-0 w-48 focus:border-b focus:border-slate-200"
                  placeholder="Add source"
                />
              </div>
            </div>
          </div>

          {/* Lead Value */}
          <div className="space-y-2 text-left">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">Lead Value</label>
            <div className="border border-slate-100 rounded-2xl bg-slate-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly value</span>
                <div className="flex items-center justify-end text-right">
                  <span className="text-sm font-bold text-[#00A859]">₹</span>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    onBlur={() => updateField('value', value)}
                    className="text-sm font-bold text-[#00A859] text-right bg-transparent border-0 focus:ring-0 outline-none p-0 w-24 focus:border-b focus:border-slate-200"
                  />
                  <span className="text-sm font-bold text-[#00A859]">/mo</span>
                </div>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Est. annual</span>
                <span className="text-sm font-bold text-slate-800">₹{(value * 12).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Priority</span>
                <select
                  value={priority}
                  onChange={(e) => {
                    setPriority(e.target.value);
                    updateField('priority', e.target.value);
                  }}
                  className="text-sm font-bold text-slate-800 text-right bg-transparent border-0 focus:ring-0 outline-none p-0 cursor-pointer"
                >
                  <option value="Very High">Very High</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="space-y-4 text-left">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">Activity Timeline</label>
            <div className="relative pl-6 border-l border-slate-100 space-y-5">
              <div className="relative">
                <span className="absolute -left-[30px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white ring-4 ring-white">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {lead.source === 'call_lead' ? 'Lead created from Call' : 'Lead created manually'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {lead.created_at ? new Date(lead.created_at).toLocaleString() : 'Just now'}
                  </p>
                </div>
              </div>
              
              {lead.stage && lead.stage !== 'new-lead' && (
                <div className="relative">
                  <span className="absolute -left-[30px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white ring-4 ring-white">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Pipeline moved: New Inquiry → {CRM_STAGE_LABELS[normalizeCrmStage(lead.stage)]}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {lead.created_at ? new Date(lead.created_at).toLocaleString() : 'Just now'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Add Note */}
          <div className="space-y-3 text-left">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">Add Note</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={4}
              className="w-full text-sm bg-white border border-slate-200 text-slate-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#00A859]/20 resize-none shadow-sm placeholder:text-slate-400"
              placeholder="Write a note... (Ctrl+Enter to save)"
            />
            <button
              onClick={saveNotes}
              disabled={saving}
              className="w-full py-2.5 bg-[#E8F8F0] border border-[#D1F2E1] text-[#00A859] rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#DDF5E9] transition"
            >
              + {saving ? 'Saving...' : 'Save Note'}
            </button>
          </div>

          {/* Actions & Processing */}
          <div className="space-y-3 text-left">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">Actions & Processing</label>
            <div className="space-y-2">
              <button
                onClick={onShowHistory}
                className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition shadow-sm"
              >
                <Bot className="h-4 w-4 text-slate-400" /> View AI Chat History
              </button>
              <button
                onClick={() => sendMessage('quotation_sent')}
                className="w-full py-2.5 bg-[#FFFDF5] border border-[#FFF3D1] text-amber-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#FFF9E5] transition"
              >
                <Send className="h-4 w-4" /> Send Quotation
              </button>
              <button
                onClick={approveQuotation}
                className="w-full py-2.5 bg-[#F5FBFF] border border-[#DCEFFF] text-[#004C8C] rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#EBF7FF] transition"
              >
                <CheckCircle2 className="h-4 w-4" /> Quotation Approved
              </button>
            </div>
          </div>

          {/* Delete Lead */}
          <div className="pt-2">
            <button
              onClick={deleteLead}
              className="w-full py-3 bg-[#FFF5F5] border border-[#FFE3E3] text-[#E53E3E] rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#FFF0F0] transition"
            >
              <Trash2 className="h-4 w-4" /> Delete Lead Permanently
            </button>
          </div>

          {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">{error}</p>}
        </div>
      </div>
    </div>
  );
}

function AddLeadModal({
  crmTab,
  onClose,
  onCreated,
}: {
  crmTab: 'pipeline' | 'clients';
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [stage, setStage] = useState(crmTab === 'pipeline' ? 'new-inquiry' : 'active-client');
  const [value, setValue] = useState(0);
  const [priority, setPriority] = useState('Medium');
  const [source, setSource] = useState('Manual Add');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Please enter a name');
    setSaving(true);
    setError('');

    try {
      const { error: insertError } = await supabase.from('crm_leads').insert([
        {
          client_name: name,
          phone,
          email,
          stage,
          value,
          priority,
          source,
        },
      ]);

      if (insertError) throw insertError;
      onCreated();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create lead');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200 text-left">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-xl font-black text-slate-950">Create New Lead</h3>
            <p className="mt-0.5 text-xs text-slate-500">Add a new record to your CRM database</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleCreate} className="mt-4 space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Client / Company Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm font-semibold border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#00A859]/20"
              placeholder="e.g. Tanishq Aggarwal"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-sm font-semibold border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#00A859]/20"
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm font-semibold border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#00A859]/20"
                placeholder="client@email.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pipeline Stage</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full text-sm font-semibold border border-slate-200 bg-white rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#00A859]/20 cursor-pointer"
              >
                <optgroup label="— Pipeline —">
                  {CRM_PIPELINE_VIEW_STAGES.map((item) => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                  ))}
                </optgroup>
                <optgroup label="— Clients —">
                  {CRM_CLIENT_VIEW_STAGES.map((item) => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full text-sm font-semibold border border-slate-200 bg-white rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#00A859]/20 cursor-pointer"
              >
                <option value="Very High">Very High</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Monthly Value (₹)</label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="w-full text-sm font-semibold border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#00A859]/20"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Source</label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full text-sm font-semibold border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#00A859]/20"
              />
            </div>
          </div>

          {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 mt-4">
            <button type="button" onClick={onClose} className="btn-secondary px-5">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary px-5">
              {saving ? 'Creating...' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AICRM() {
  const navigate = useNavigate();
  const [crmTab, setCrmTab] = useState<'pipeline' | 'clients' | 'automations' | 'call-leads'>('pipeline');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [callInquiries, setCallInquiries] = useState<CallInquiry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignmentLead, setAssignmentLead] = useState<Lead | null>(null);
  const [historyLead, setHistoryLead] = useState<Lead | null>(null);
  const [detailsLead, setDetailsLead] = useState<Lead | null>(null);
  const [showAddLead, setShowAddLead] = useState(false);
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    CRM_PIPELINE_STAGES.forEach((s) => { init[s.id] = true; });
    return init;
  });
  const toggleStage = (id: string) => setExpandedStages((prev) => ({ ...prev, [id]: !prev[id] }));

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [leadRes, empRes, callData] = await Promise.all([
      supabase.from('crm_leads').select('*').order('created_at', { ascending: false }),
      supabase.from('employees').select('*').order('created_at', { ascending: false }),
      fetchCallInquiries(),
    ]);
    setLeads((leadRes.data || []) as Lead[]);
    setEmployees(((empRes.data || []) as Employee[]).filter((employee) => ['available', 'active', 'assigned'].includes(String(employee.availability_status || 'available'))));
    setCallInquiries(callData);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('ai_crm_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crm_leads' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const grouped = useMemo(() => {
    const base: Record<string, Lead[]> = {};
    CRM_PIPELINE_STAGES.forEach((stage) => { base[stage.id] = []; });
    leads.forEach((lead) => {
      const stage = normalizeCrmStage(lead.stage);
      base[stage].push(lead);
    });
    return base;
  }, [leads]);

  const updateStage = async (lead: Lead, stage: string) => {
    await supabase.from('crm_leads').update({ stage }).eq('id', lead.id);
    fetchData();
  };

  const sendTemplate = async (lead: Lead, templateName: string) => {
    try {
      await openLoggedTemplateMessage(lead, templateName, templateText(templateName, lead), { source: 'ai_crm_template_button' });
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unable to open WhatsApp.');
    }
  };

  const totalValue = leads.reduce((sum, lead) => sum + leadValue(lead), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
      {assignmentLead && <StaffAssignmentModal lead={assignmentLead} employees={employees} onClose={() => setAssignmentLead(null)} onAssigned={fetchData} />}
      {historyLead && <WhatsAppHistoryDrawer lead={historyLead} onClose={() => setHistoryLead(null)} />}
      {detailsLead && (
        <LeadDetailsDrawer
          lead={leads.find((l) => l.id === detailsLead.id) || detailsLead}
          onClose={() => setDetailsLead(null)}
          onRefresh={fetchData}
          onShowHistory={() => setHistoryLead(detailsLead)}
          onAssignStaff={() => setAssignmentLead(detailsLead)}
        />
      )}
      {showAddLead && (
        <AddLeadModal
          crmTab={crmTab === 'clients' ? 'clients' : 'pipeline'}
          onClose={() => setShowAddLead(false)}
          onCreated={fetchData}
        />
      )}

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-['Plus_Jakarta_Sans']">AI CRM Center</h1>
          <p className="text-slate-500 mt-1">Manage leads, pipelines, and WhatsApp communication workflows.</p>
        </div>

        {/* Module Tabs */}
        <div className="segmented-control shrink-0">
          {([['pipeline','Pipeline'],['clients','Clients'],['automations','AI Auto'],['call-leads','Call Leads']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setCrmTab(key)} className={cn('segmented-item', crmTab === key && 'segmented-item-active')}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Live sync bar + action buttons */}
      {(crmTab === 'pipeline' || crmTab === 'clients') && (
        <div className="flex items-center justify-between mb-4">
          <div className="status-pill status-pill-green bg-white shadow-sm border-0">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00A859] animate-pulse" /> Live Sync Active
          </div>
          <div className="flex gap-3">
            <button className="btn-secondary">
              Export CSV
            </button>
            <button onClick={() => setShowAddLead(true)} className="btn-primary">
              <Plus className="h-4 w-4" /> Add Lead
            </button>
          </div>
        </div>
      )}

      {/* Tab content */}
      {(crmTab === 'pipeline' || crmTab === 'clients') && (
        <div className="flex-1 overflow-y-auto space-y-3 pb-4">
          {(crmTab === 'pipeline' ? CRM_PIPELINE_VIEW_STAGES : CRM_CLIENT_VIEW_STAGES).map((stage) => {
            const stageLeads = grouped[stage.id] || [];
            const isOpen = expandedStages[stage.id];
            return (
              <div key={stage.id} className="premium-card overflow-hidden">
                <button onClick={() => toggleStage(stage.id)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50/50 transition-colors bg-slate-50/30 border-b border-slate-100/60">
                  <div className="flex items-center gap-3">
                    {isOpen ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                    <span className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ backgroundColor: stage.color }} />
                    <h3 className="font-bold text-slate-900">{stage.label}</h3>
                  </div>
                  <span className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shadow-sm">
                    {stageLeads.length}
                  </span>
                </button>
                {isOpen && (
                  <div className="border-t border-slate-100">
                    {stageLeads.length === 0 ? (
                      <div className="py-8 text-center text-sm text-slate-400">No leads in this stage</div>
                    ) : (
                      <div className="flex gap-4 p-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                        {stageLeads.map((lead) => (
                          <div key={lead.id} onClick={() => setDetailsLead(lead)} className="w-[320px] shrink-0 bg-white p-5 rounded-xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,76,140,0.08)] hover:border-slate-200 transition-all cursor-pointer group">
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="font-bold text-slate-900 group-hover:text-[#00A859] transition-colors">{leadName(lead)}</h4>
                              <select value={normalizeCrmStage(lead.stage)} onChange={(event) => { event.stopPropagation(); updateStage(lead, event.target.value); }} onClick={(e) => e.stopPropagation()} className="text-[11px] font-bold uppercase tracking-wider bg-slate-50 border border-slate-200 text-slate-600 rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-[#00A859]/20 cursor-pointer shadow-sm">
                                <optgroup label="— Pipeline —">
                                  {CRM_PIPELINE_VIEW_STAGES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                                </optgroup>
                                <optgroup label="— Clients —">
                                  {CRM_CLIENT_VIEW_STAGES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                                </optgroup>
                              </select>
                            </div>
                            <div className="flex items-center gap-3 text-[13px] text-slate-500 mb-3">
                              <span className="font-medium">{leadContact(lead)}</span>
                              <span className="font-bold text-[#00A859] bg-[#00A859]/10 border border-[#00A859]/20 px-2 py-0.5 rounded-md">₹{leadValue(lead).toLocaleString()}/mo</span>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-3">
                              <span className={cn('inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border', priorityColors[lead.priority || 'Medium'] || priorityColors.Medium)}>{lead.priority || 'Medium'}</span>
                              {lead.service_type && <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-[#00A859]/20 bg-[#00A859]/10 text-[#00A859]">{lead.service_type}</span>}
                            </div>
                            <div className="text-xs font-medium text-slate-500 space-y-1.5 mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              {lead.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-400" /> {lead.phone}</p>}
                              <p className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-slate-400" /> {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '—'}</p>
                            </div>
                            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                              <button onClick={(e) => { e.stopPropagation(); setDetailsLead(lead); }} className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"><FileText className="mr-1 inline h-3.5 w-3.5" /> Details</button>
                              <button onClick={(e) => { e.stopPropagation(); setAssignmentLead(lead); }} className="rounded-lg border border-[#00A859]/20 bg-[#00A859]/5 px-2 py-2 text-xs font-bold text-[#00A859] shadow-sm hover:bg-[#00A859]/10 transition-colors"><UserCheck className="mr-1 inline h-3.5 w-3.5" /> Staff</button>
                              <button onClick={(e) => { e.stopPropagation(); setHistoryLead(lead); }} className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"><MessageCircle className="mr-1 inline h-3.5 w-3.5" /> WhatsApp</button>
                              <button onClick={(e) => { e.stopPropagation(); sendTemplate(lead, 'quotation_sent'); }} className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-2 text-xs font-bold text-amber-700 shadow-sm hover:bg-amber-100 transition-colors"><Send className="mr-1 inline h-3.5 w-3.5" /> Quote</button>
                            </div>
                            {lead.notes && <p className="mt-3 line-clamp-2 rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2 text-[11px] font-medium text-amber-800">{lead.notes}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Dash Card for Creating Lead */}
          <div
            onClick={() => setShowAddLead(true)}
            className="w-full max-w-[320px] rounded-2xl border-2 border-dashed border-slate-200/80 bg-white hover:border-[#00A859] hover:bg-slate-50/40 p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group mt-4 mx-4"
          >
            <div className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center group-hover:border-[#00A859] group-hover:bg-[#00A859]/5 transition-all">
              <Plus className="h-4 w-4 text-slate-400 group-hover:text-[#00A859]" />
            </div>
            <span className="text-xs font-bold text-slate-500 group-hover:text-[#00A859] transition-all">
              + Create a new one
            </span>
          </div>
        </div>
      )}

      {crmTab === 'automations' && (
        <div className="flex-1 grid lg:grid-cols-3 gap-6 pb-4">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="font-bold text-slate-900 text-lg">WhatsApp Automation Workflows</h2>
            <p className="text-sm text-slate-500">Post-inquiry automated message sequences.</p>
            {[
              { key: 'greeting', label: 'Auto-Greeting on New Lead', desc: 'Sends a welcome message when a new inquiry is received.', active: true, icon: '🌟' },
              { key: 'quotation', label: 'Auto-Quotation Follow-up', desc: 'Sends quotation link 24h after initial discussion.', active: false, icon: '📋' },
              { key: 'consent', label: 'Consent Form Dispatch', desc: 'Automatically sends consent form after quotation approval.', active: false, icon: '✅' },
            ].map((wf) => (
              <div key={wf.key} className={`p-4 rounded-lg border transition-colors ${wf.active ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{wf.icon}</span>
                    <h3 className={`font-semibold ${wf.active ? 'text-emerald-700' : 'text-slate-600'}`}>{wf.label}</h3>
                  </div>
                  <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${wf.active ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 shadow-sm transition-all ${wf.active ? 'right-0.5' : 'left-0.5'}`} />
                  </div>
                </div>
                <p className="text-sm text-slate-500">{wf.desc}</p>
              </div>
            ))}
          </div>
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-3"><Star className="w-5 h-5 text-amber-500" /> Recent Automations</h3>
            <div className="space-y-3">
              <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                <p className="text-sm text-slate-700">Auto-greeting sent to new lead</p>
                <p className="text-xs text-slate-400 mt-1">2 minutes ago</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                <p className="text-sm text-slate-500 italic">No more recent activity.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {crmTab === 'call-leads' && (
        <div className="flex-1 premium-card flex flex-col">
          <div className="p-6 border-b border-slate-100/60 flex items-center justify-between bg-slate-50/30">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2"><PhoneCall className="h-5 w-5 text-[#004C8C]" /> Call Leads</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">Incoming call inquiries — review and convert qualified calls to CRM leads.</p>
            </div>
            <button className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Manual Call
            </button>
          </div>
          {callInquiries.length === 0 ? (
            <div className="flex-1 p-8 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                <PhoneCall className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">No Call Leads Yet</h3>
              <p className="text-slate-500 max-w-sm">Call logs will appear here when received. Use "Add Manual Call" to create entries, or connect Callyzer for automated sync in Phase 2.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100/60 overflow-y-auto flex-1 p-2">
              {callInquiries.map((call) => (
                <div key={call.id} className="p-5 flex items-start gap-5 hover:bg-slate-50/80 transition-colors rounded-xl mx-2 my-1 border border-transparent hover:border-slate-100 group">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100/50 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                    <Phone className="w-5 h-5 text-[#004C8C]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <h4 className="font-bold text-slate-900 text-base">{call.caller_name || 'Unknown Caller'}</h4>
                      {call.status === 'added_to_pipeline' && <span className="text-[10px] font-bold uppercase tracking-wider text-[#00A859] bg-[#00A859]/10 px-2.5 py-1 rounded-md border border-[#00A859]/20 shadow-sm">✓ Added to CRM</span>}
                      {call.intent && <span className="text-[10px] font-bold uppercase tracking-wider text-[#004C8C] bg-[#004C8C]/5 px-2.5 py-1 rounded-md border border-[#004C8C]/10">{call.intent}</span>}
                    </div>
                    <div className="flex items-center gap-4 text-[13px] font-medium text-slate-500 mb-3 bg-slate-50/50 inline-flex px-3 py-1.5 rounded-lg border border-slate-100">
                      <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {call.caller_phone || '—'}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {call.call_date ? new Date(call.call_date).toLocaleString() : '—'}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span className="flex items-center gap-1.5">⏱ {formatCallDuration(call.duration_seconds)}</span>
                    </div>
                    {call.summary && <p className="text-sm font-medium text-slate-600 mb-3 line-clamp-2 leading-relaxed">{call.summary}</p>}
                    {call.transcript && <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-4 py-3 line-clamp-2 italic leading-relaxed">{call.transcript}</p>}
                  </div>
                  <div className="shrink-0 flex flex-col gap-2.5 items-end ml-4">
                    {isCallConvertible(call) ? (
                      <button
                        onClick={async () => {
                          const { data: newLead, error } = await supabase.from('crm_leads').insert([{
                            full_name: call.caller_name || 'Call Lead',
                            phone: call.caller_phone || '',
                            stage: 'new-lead',
                            source: 'call_lead',
                            notes: `Call summary: ${call.summary || 'N/A'}`,
                            priority: 'Medium',
                          }]).select().single();
                          if (!error && newLead) {
                            await markCallAsAddedToPipeline(call.id, newLead.id);
                            fetchData();
                          }
                        }}
                        className="btn-primary py-2 px-4 shadow-md"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add to CRM
                      </button>
                    ) : (
                      <span className="text-xs text-[#00A859] font-bold bg-[#00A859]/10 px-3 py-1.5 rounded-lg border border-[#00A859]/20">In Pipeline ✓</span>
                    )}
                    {call.recording_url && (
                      <button className="btn-secondary py-2 px-4">▶ Play Recording</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

