import { useState } from 'react';
import { Bot, Briefcase, Calendar, Download, MoreHorizontal, Phone, Plus, Sparkles } from 'lucide-react';
import { IconFrame, PageShell, SectionHeader, StatusBadge, Surface } from '@/components/AppPrimitives';
import { cn } from '@/lib/utils';

interface Lead {
  id: string;
  company: string;
  contact: string;
  priority: 'Very High' | 'High' | 'Medium' | 'Low';
  value: number;
  assignee: string;
  dueDate: string;
  tags: string[];
}

const initialLeads: Record<string, Lead[]> = {
  'new-lead': [
    { id: '1', company: 'Apollo Hospitals', contact: 'Rajesh Kumar', priority: 'Very High', value: 25000, assignee: 'Amit S', dueDate: 'Apr 28', tags: ['Hospital', 'Tier-1'] },
    { id: '2', company: 'Fortis Healthcare', contact: 'Priya Sharma', priority: 'High', value: 18000, assignee: 'Neha R', dueDate: 'Apr 30', tags: ['Hospital', 'Multi-city'] },
    { id: '3', company: 'Medanta Medicity', contact: 'Dr. Gupta', priority: 'Medium', value: 15000, assignee: 'Amit S', dueDate: 'May 2', tags: ['Clinic'] },
  ],
  'new-inquiry': [
    { id: '4', company: 'Max Hospital', contact: 'Suresh Verma', priority: 'High', value: 32000, assignee: 'Neha R', dueDate: 'Apr 29', tags: ['Hospital', 'Emergency'] },
    { id: '5', company: 'Narayana Health', contact: 'Anita Reddy', priority: 'Medium', value: 21000, assignee: 'Rahul K', dueDate: 'May 3', tags: ['Chain'] },
  ],
  'in-discussion': [
    { id: '6', company: 'Manipal Health', contact: 'Dr. Krishnan', priority: 'Very High', value: 45000, assignee: 'Amit S', dueDate: 'Apr 27', tags: ['Hospital', 'Enterprise'] },
    { id: '7', company: 'Cloudnine Care', contact: 'Meera Iyer', priority: 'High', value: 28000, assignee: 'Neha R', dueDate: 'May 1', tags: ['Maternity'] },
  ],
  'quotation-sent': [
    { id: '8', company: 'Rainbow Hospital', contact: 'Dr. Nair', priority: 'High', value: 35000, assignee: 'Rahul K', dueDate: 'Apr 26', tags: ['Children'] },
  ],
  'closed-won': [
    { id: '9', company: 'KIMS Hospital', contact: 'Dr. Rao', priority: 'Medium', value: 42000, assignee: 'Amit S', dueDate: 'Apr 25', tags: ['Hospital'] },
  ],
};

const stages = [
  { id: 'new-lead', label: 'New Lead', color: '#3B82F6' },
  { id: 'new-inquiry', label: 'New Inquiry', color: '#8B5CF6' },
  { id: 'in-discussion', label: 'In Discussion', color: '#F59E0B' },
  { id: 'quotation-sent', label: 'Quotation Sent', color: '#EC4899' },
  { id: 'closed-won', label: 'Closed Won', color: '#10B981' },
];

const priorityColors = {
  'Very High': 'bg-rose-50 text-rose-700 border-rose-100',
  High: 'bg-orange-50 text-orange-700 border-orange-100',
  Medium: 'bg-amber-50 text-amber-700 border-amber-100',
  Low: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

export default function AICRM() {
  const [activeTab, setActiveTab] = useState('Pipeline');
  const [leads] = useState(initialLeads);

  const tabs = ['Pipeline', 'Clients', 'AI Auto', 'Voice AI'];

  return (
    <PageShell>
      <Surface className="bg-gradient-to-br from-white via-cyan-50/40 to-emerald-50/60">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <IconFrame icon={Briefcase} tone="cyan" className="h-12 w-12" />
            <div>
              <p className="text-xs font-bold uppercase text-cyan-700">AI-powered management</p>
              <h2 className="text-2xl font-extrabold text-slate-950">Pipeline orchestration</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                Convert healthcare leads with live sync, AI nudges, and clear ownership signals.
              </p>
            </div>
          </div>
          <div className="segmented-control w-full overflow-x-auto sm:w-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn('segmented-item whitespace-nowrap', activeTab === tab && 'segmented-item-active')}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </Surface>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/80 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          Live Sync Active
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn-primary">
            <Plus className="h-4 w-4" />
            Add Lead
          </button>
          <button type="button" className="btn-secondary">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-3">
        {stages.map((stage) => (
          <div key={stage.id} className="w-[304px] shrink-0">
            <div className="mb-3 flex items-center justify-between rounded-lg border border-slate-200 bg-white/75 px-3 py-2 shadow-sm">
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                <span className="truncate text-sm font-bold text-slate-700">{stage.label}</span>
              </div>
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-bold text-slate-500">
                {leads[stage.id]?.length || 0}
              </span>
            </div>

            <div className="space-y-3">
              {(leads[stage.id] || []).map((lead) => (
                <article
                  key={lead.id}
                  className="group rounded-lg border border-slate-200 bg-white/95 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan-200 hover:shadow-glow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-extrabold text-slate-950">{lead.company}</h3>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <StatusBadge className={priorityColors[lead.priority]}>{lead.priority}</StatusBadge>
                        {lead.tags.slice(0, 1).map((tag) => (
                          <StatusBadge key={tag} className="border-cyan-100 bg-cyan-50 text-cyan-700">{tag}</StatusBadge>
                        ))}
                      </div>
                    </div>
                    <button type="button" className="rounded-md p-1 text-slate-300 transition-colors hover:bg-slate-50 hover:text-slate-500" aria-label="Lead actions">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-500">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span className="truncate">{lead.contact}</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-base font-extrabold text-slate-950">₹{lead.value.toLocaleString()}</span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                      <Calendar className="h-3.5 w-3.5" />
                      {lead.dueDate}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-600 to-emerald-500 text-[10px] font-extrabold text-white shadow-sm">
                      {lead.assignee.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <span className="text-xs font-semibold text-slate-500">{lead.assignee}</span>
                  </div>
                </article>
              ))}

              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white/50 py-3 text-sm font-semibold text-slate-400 transition-all hover:border-cyan-300 hover:bg-cyan-50/70 hover:text-cyan-700"
              >
                <Plus className="h-4 w-4" />
                Add Card
              </button>
            </div>
          </div>
        ))}
      </div>

      <Surface className="bg-gradient-to-r from-cyan-50/90 via-white to-emerald-50/90">
        <SectionHeader
          title="AI Suggestions"
          description="Smart actions based on lead age, quote status, and high-intent accounts."
          action={<IconFrame icon={Bot} tone="emerald" className="h-10 w-10" />}
        />
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {[
            { text: 'Follow up with', name: 'Apollo Hospitals', copy: '3 days since last contact', action: 'Take Action' },
            { text: '', name: 'Manipal Health', copy: 'quotation is pending approval', action: 'View Details' },
            { text: 'Schedule demo for', name: 'Max Hospital', copy: 'this week', action: 'Schedule Now' },
          ].map((item) => (
            <div key={`${item.name}-${item.action}`} className="rounded-lg border border-cyan-100 bg-white/80 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <IconFrame icon={Sparkles} tone="cyan" className="h-9 w-9" />
                <div>
                  <p className="text-sm leading-6 text-slate-700">
                    {item.text && `${item.text} `}
                    <span className="font-extrabold text-slate-950">{item.name}</span> {item.copy}
                  </p>
                  <button type="button" className="subtle-link mt-2">
                    {item.action} →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Surface>
    </PageShell>
  );
}
