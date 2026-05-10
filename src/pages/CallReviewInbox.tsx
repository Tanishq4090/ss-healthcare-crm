import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  FileAudio,
  FileText,
  Headphones,
  MessageSquareText,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Upload,
  UserPlus,
  X,
} from 'lucide-react';
import { IconFrame, PageShell, SectionHeader, StatusBadge, Surface } from '@/components/AppPrimitives';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

type CallInquiry = {
  id: string;
  external_call_id?: string | null;
  caller_number?: string | null;
  employee_name?: string | null;
  employee_number?: string | null;
  call_type?: string | null;
  call_direction?: string | null;
  call_status?: string | null;
  call_started_at?: string | null;
  duration_seconds?: number | null;
  recording_url?: string | null;
  recording_path?: string | null;
  recording_storage_path?: string | null;
  recording_public_url?: string | null;
  transcript?: string | null;
  summary?: string | null;
  intent?: string | null;
  captured_name?: string | null;
  captured_phone?: string | null;
  captured_service?: string | null;
  captured_location?: string | null;
  captured_urgency?: string | null;
  captured_priority?: string | null;
  captured_budget?: string | null;
  captured_timing?: string | null;
  captured_notes?: string | null;
  extracted_data?: Record<string, unknown> | null;
  review_status?: string | null;
  added_to_pipeline?: boolean | null;
  lead_id?: string | null;
  pipeline_lead_id?: string | null;
  created_at?: string | null;
};

const statusStyles: Record<string, string> = {
  new: 'border-blue-100 bg-blue-50 text-blue-700',
  review: 'border-amber-100 bg-amber-50 text-amber-700',
  reviewed: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  added_to_pipeline: 'border-green-100 bg-green-50 text-green-700',
  rejected: 'border-rose-100 bg-rose-50 text-rose-700',
};

const filterTabs = [
  { id: 'all', label: 'All Calls' },
  { id: 'new', label: 'New' },
  { id: 'review', label: 'Review' },
  { id: 'added_to_pipeline', label: 'Added to CRM' },
  { id: 'rejected', label: 'Rejected' },
];

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function formatDuration(seconds?: number | null) {
  if (!seconds) return '0s';
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  if (!min) return `${sec}s`;
  return `${min}m ${sec}s`;
}

function safePhone(phone?: string | null) {
  return phone || 'Unknown number';
}

function initials(name?: string | null) {
  return (name || 'SS')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function extractFallback(call: CallInquiry) {
  const data = call.extracted_data || {};
  return {
    captured_name: call.captured_name || String(data.name || data.client_name || ''),
    captured_phone: call.captured_phone || call.caller_number || String(data.phone || ''),
    captured_service: call.captured_service || String(data.service || data.service_type || call.intent || ''),
    captured_location: call.captured_location || String(data.location || data.area || ''),
    captured_urgency: call.captured_urgency || String(data.urgency || ''),
    captured_priority: call.captured_priority || 'Medium',
    captured_budget: call.captured_budget || String(data.budget || ''),
    captured_timing: call.captured_timing || String(data.timing || data.start_date || ''),
    captured_notes: call.captured_notes || '',
    summary: call.summary || String(data.summary || ''),
    intent: call.intent || String(data.intent || ''),
    transcript: call.transcript || '',
  };
}

function CallDetailsDrawer({ call, onClose, onSaved }: { call: CallInquiry; onClose: () => void; onSaved: () => void }) {
  const fallback = extractFallback(call);
  const [form, setForm] = useState(fallback);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setSaving(true);
    setError('');
    const { error: updateError } = await supabase
      .from('call_inquiries')
      .update({
        ...form,
        review_status: call.added_to_pipeline ? 'added_to_pipeline' : 'review',
      })
      .eq('id', call.id);
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    onSaved();
  };

  const addToPipeline = async () => {
    setAdding(true);
    setError('');
    await save();
    const { error: rpcError } = await supabase.rpc('add_call_inquiry_to_pipeline', { p_call_id: call.id });
    setAdding(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    onSaved();
    onClose();
  };

  const uploadRecording = async (file: File) => {
    setUploading(true);
    setError('');
    const ext = file.name.split('.').pop() || 'mp3';
    const phone = (call.caller_number || 'unknown').replace(/[^0-9+]/g, '') || 'unknown';
    const now = new Date();
    const path = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${phone}/${call.id}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('call-recordings').upload(path, file, { upsert: true });
    if (uploadError) {
      setUploading(false);
      setError(uploadError.message);
      return;
    }
    const { error: updateError } = await supabase
      .from('call_inquiries')
      .update({ recording_storage_path: path, recording_path: path })
      .eq('id', call.id);
    setUploading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30 backdrop-blur-sm">
      <div className="h-full w-full max-w-3xl overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#00A859' }}>Call Lead Review</p>
              <h3 className="mt-1 text-2xl font-extrabold text-slate-950">{safePhone(call.caller_number)}</h3>
              <p className="mt-1 text-sm text-slate-500">{formatDate(call.call_started_at || call.created_at)} · {formatDuration(call.duration_seconds)}</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button>
          </div>
        </div>

        <div className="space-y-6 p-6">
          {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

          <Surface>
            <SectionHeader title="Call Log" description="Raw Callyzer call metadata captured from the employee phone call." action={<IconFrame icon={Phone} tone="cyan" />} />
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                ['Caller', call.caller_number],
                ['Employee', call.employee_name || call.employee_number],
                ['Call Type', call.call_type || call.call_direction],
                ['Call Status', call.call_status],
                ['Duration', formatDuration(call.duration_seconds)],
                ['External Call ID', call.external_call_id],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</p>
                  <p className="mt-1 break-words text-sm font-semibold text-slate-800">{value || '—'}</p>
                </div>
              ))}
            </div>
          </Surface>

          <Surface>
            <SectionHeader title="Summary & Intent" description="Human-reviewable summary fields for lead qualification." action={<IconFrame icon={MessageSquareText} tone="emerald" />} />
            <div className="mt-5 grid gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">Intent</label>
                <input className="field-control w-full" value={form.intent} onChange={(event) => setForm((current) => ({ ...current, intent: event.target.value }))} placeholder="Baby care, old age care, nursing, physiotherapy..." />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">Summary</label>
                <textarea className="field-control w-full resize-none" rows={4} value={form.summary} onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))} placeholder="Short call summary for staff review..." />
              </div>
            </div>
          </Surface>

          <Surface>
            <SectionHeader title="Lead Data Captured" description="These fields decide what gets created in the CRM pipeline." action={<IconFrame icon={ClipboardList} tone="blue" />} />
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              {[
                ['Client / Patient Name', 'captured_name'],
                ['Phone Number', 'captured_phone'],
                ['Service Required', 'captured_service'],
                ['Location / Area', 'captured_location'],
                ['Urgency', 'captured_urgency'],
                ['Budget / Rate Discussed', 'captured_budget'],
                ['Preferred Timing', 'captured_timing'],
              ].map(([label, key]) => (
                <div key={key}>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</label>
                  <input className="field-control w-full" value={(form as Record<string, string>)[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} />
                </div>
              ))}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">Priority</label>
                <select className="field-control w-full" value={form.captured_priority} onChange={(event) => setForm((current) => ({ ...current, captured_priority: event.target.value }))}>
                  {['Very High', 'High', 'Medium', 'Low'].map((priority) => <option key={priority}>{priority}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">Review Notes</label>
                <textarea className="field-control w-full resize-none" rows={3} value={form.captured_notes} onChange={(event) => setForm((current) => ({ ...current, captured_notes: event.target.value }))} />
              </div>
            </div>
          </Surface>

          <Surface>
            <SectionHeader title="Recording" description="Callyzer Basic + API does not require Callyzer recording storage. Upload only important recordings to Supabase." action={<IconFrame icon={FileAudio} tone="amber" />} />
            <div className="mt-5 space-y-4">
              {(call.recording_storage_path || call.recording_path || call.recording_url) ? (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
                  Recording available: {call.recording_storage_path || call.recording_path || call.recording_url}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
                  No recording uploaded yet.
                </div>
              )}
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 hover:border-green-200 hover:text-green-700">
                {uploading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? 'Uploading…' : 'Upload Recording'}
                <input type="file" accept="audio/*" className="hidden" onChange={(event) => event.target.files?.[0] && uploadRecording(event.target.files[0])} />
              </label>
            </div>
          </Surface>

          <Surface>
            <SectionHeader title="Full Transcript" description="Paste manual transcript here, or store future transcription output here." action={<IconFrame icon={FileText} tone="slate" />} />
            <textarea className="field-control mt-5 w-full resize-none font-mono text-sm" rows={10} value={form.transcript} onChange={(event) => setForm((current) => ({ ...current, transcript: event.target.value }))} placeholder="Full transcript will appear here or can be pasted manually..." />
          </Surface>

          <div className="sticky bottom-0 -mx-6 flex flex-col gap-3 border-t border-slate-100 bg-white/95 px-6 py-4 backdrop-blur-xl sm:flex-row">
            <button type="button" onClick={save} disabled={saving} className="btn-secondary flex-1">
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Save Review
            </button>
            <button type="button" onClick={addToPipeline} disabled={adding || Boolean(call.added_to_pipeline)} className="btn-primary flex-1 disabled:opacity-60">
              {adding ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {call.added_to_pipeline ? 'Already Added to CRM' : 'Add to CRM Pipeline'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CallReviewInbox() {
  const [calls, setCalls] = useState<CallInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedCall, setSelectedCall] = useState<CallInquiry | null>(null);

  const fetchCalls = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('call_inquiries')
      .select('*')
      .order('created_at', { ascending: false });
    setCalls((data || []) as CallInquiry[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCalls(); }, [fetchCalls]);

  useEffect(() => {
    const channel = supabase
      .channel('call_inquiries_live_v4')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'call_inquiries' }, fetchCalls)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchCalls]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return calls.filter((call) => {
      const status = call.review_status || 'new';
      const matchesFilter = filter === 'all' || status === filter;
      const text = `${call.caller_number || ''} ${call.employee_name || ''} ${call.intent || ''} ${call.summary || ''} ${call.captured_service || ''} ${call.captured_name || ''}`.toLowerCase();
      return matchesFilter && text.includes(q);
    });
  }, [calls, filter, query]);

  const stats = {
    total: calls.length,
    newCalls: calls.filter((c) => (c.review_status || 'new') === 'new').length,
    converted: calls.filter((c) => c.added_to_pipeline).length,
    withTranscript: calls.filter((c) => !!c.transcript).length,
  };

  const quickAddToCrm = async (call: CallInquiry) => {
    await supabase.rpc('add_call_inquiry_to_pipeline', { p_call_id: call.id });
    fetchCalls();
  };

  return (
    <PageShell>
      {selectedCall && <CallDetailsDrawer call={selectedCall} onClose={() => setSelectedCall(null)} onSaved={fetchCalls} />}

      <Surface className="bg-gradient-to-br from-white via-green-50/40 to-blue-50/60" style={{ borderColor: 'rgba(0,168,89,0.12)' }}>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <IconFrame icon={Headphones} tone="cyan" className="h-12 w-12" />
            <div>
              <p className="text-xs font-bold uppercase" style={{ color: '#00A859' }}>Callyzer manual-call workflow</p>
              <h2 className="text-2xl font-extrabold text-slate-950">Call Leads Review Inbox</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                Review call logs, summary, intent, captured lead data, full transcript, and manually add qualified inquiries to the CRM pipeline.
              </p>
            </div>
          </div>
          <button type="button" onClick={fetchCalls} className="btn-secondary self-start xl:self-auto">
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /> Refresh
          </button>
        </div>
      </Surface>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {[
          ['Total Call Logs', stats.total, Phone],
          ['New Reviews', stats.newCalls, AlertCircle],
          ['Added to CRM', stats.converted, UserPlus],
          ['With Transcript', stats.withTranscript, FileText],
        ].map(([label, value, Icon]) => (
          <Surface key={String(label)}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{String(label)}</p>
                <p className="mt-3 text-2xl font-extrabold text-slate-950">{String(value)}</p>
              </div>
              <IconFrame icon={Icon as typeof Phone} tone="emerald" />
            </div>
          </Surface>
        ))}
      </div>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full xl:max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="field-control w-full pl-10" placeholder="Search calls, caller, employee, intent, or service..." value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <div className="segmented-control w-full overflow-x-auto xl:w-auto">
          {filterTabs.map((tab) => (
            <button type="button" key={tab.id} onClick={() => setFilter(tab.id)} className={cn('segmented-item whitespace-nowrap', filter === tab.id && 'segmented-item-active')}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center gap-3 text-slate-400">
          <RefreshCw className="h-5 w-5 animate-spin" style={{ color: '#00A859' }} />
          <span className="text-sm font-semibold">Loading live Callyzer call leads…</span>
        </div>
      ) : filtered.length === 0 ? (
        <Surface>
          <div className="py-16 text-center">
            <Activity className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <h3 className="text-lg font-extrabold text-slate-800">No call leads found</h3>
            <p className="mt-2 text-sm text-slate-500">Send a Callyzer webhook or run a call sync to populate this inbox.</p>
          </div>
        </Surface>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((call) => {
            const status = call.review_status || 'new';
            const fallback = extractFallback(call);
            return (
              <article key={call.id} className="clinical-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="clinical-content">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white shadow-md" style={{ background: 'linear-gradient(135deg,#00A859,#004C8C)' }}>
                        {initials(call.employee_name || 'Call')}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-extrabold text-slate-950">{safePhone(call.caller_number)}</h3>
                        <p className="mt-1 truncate text-xs font-medium text-slate-500">{call.employee_name || 'Unknown employee'} · {formatDate(call.call_started_at || call.created_at)}</p>
                      </div>
                    </div>
                    <StatusBadge className={statusStyles[status] || 'border-slate-200 bg-slate-50 text-slate-600'}>
                      {status.replaceAll('_', ' ')}
                    </StatusBadge>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Intent</p>
                      <p className="mt-1 truncate text-sm font-extrabold text-slate-900">{fallback.intent || 'Not captured'}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Duration</p>
                      <p className="mt-1 text-sm font-extrabold text-slate-900">{formatDuration(call.duration_seconds)}</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Summary</p>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{fallback.summary || 'No summary yet. Open review and add summary before pushing to CRM.'}</p>
                  </div>

                  <div className="mt-4 space-y-2 rounded-2xl border border-green-100 bg-green-50/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-green-700">Lead Data Captured</p>
                    <div className="grid gap-1 text-xs font-semibold text-slate-700">
                      <span>Name: {fallback.captured_name || '—'}</span>
                      <span>Service: {fallback.captured_service || '—'}</span>
                      <span>Location: {fallback.captured_location || '—'}</span>
                      <span>Urgency: {fallback.captured_urgency || '—'}</span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setSelectedCall(call)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:border-green-200 hover:text-green-700">
                      <FileText className="mr-1 inline h-3.5 w-3.5" /> Full Transcript
                    </button>
                    <button type="button" onClick={() => setSelectedCall(call)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:border-green-200 hover:text-green-700">
                      <ClipboardList className="mr-1 inline h-3.5 w-3.5" /> Review
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => quickAddToCrm(call)}
                    disabled={!!call.added_to_pipeline}
                    className="btn-primary mt-3 w-full disabled:opacity-60"
                  >
                    {call.added_to_pipeline ? <CheckCircle2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {call.added_to_pipeline ? 'Added to CRM' : 'Add to CRM'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
