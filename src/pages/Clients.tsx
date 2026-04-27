import { useState } from 'react';
import { Building2, Mail, MapPin, Plus, Search, TrendingUp, Upload, Users } from 'lucide-react';
import { PageShell, StatusBadge, Surface } from '@/components/AppPrimitives';
import { cn } from '@/lib/utils';

interface Client {
  id: string;
  name: string;
  location: string;
  status: 'Active' | 'Inactive' | 'Pending';
  contact: string;
  email: string;
  deployments: number;
  mrr: number;
  initials: string;
  color: string;
}

const clients: Client[] = [
  { id: '1', name: 'Apollo Hospitals', location: 'Chennai, Tamil Nadu', status: 'Active', contact: 'Rajesh Kumar', email: 'rajesh@apollo.com', deployments: 12, mrr: 25000, initials: 'AH', color: 'from-blue-500 to-cyan-500' },
  { id: '2', name: 'Fortis Healthcare', location: 'Mumbai, Maharashtra', status: 'Active', contact: 'Priya Sharma', email: 'priya@fortis.com', deployments: 8, mrr: 18000, initials: 'FH', color: 'from-cyan-500 to-teal-500' },
  { id: '3', name: 'Max Hospital', location: 'Delhi, NCR', status: 'Active', contact: 'Suresh Verma', email: 'suresh@max.com', deployments: 6, mrr: 15000, initials: 'MH', color: 'from-emerald-500 to-teal-500' },
  { id: '4', name: 'Manipal Health', location: 'Bangalore, Karnataka', status: 'Pending', contact: 'Dr. Krishnan', email: 'krishnan@manipal.com', deployments: 0, mrr: 0, initials: 'MH', color: 'from-violet-500 to-fuchsia-500' },
  { id: '5', name: 'Narayana Health', location: 'Hyderabad, Telangana', status: 'Active', contact: 'Anita Reddy', email: 'anita@narayana.com', deployments: 4, mrr: 12000, initials: 'NH', color: 'from-amber-500 to-orange-500' },
  { id: '6', name: 'Cloudnine Care', location: 'Bangalore, Karnataka', status: 'Active', contact: 'Meera Iyer', email: 'meera@cloudnine.com', deployments: 3, mrr: 9000, initials: 'CC', color: 'from-pink-500 to-rose-500' },
];

const statusStyles = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Inactive: 'bg-slate-50 text-slate-500 border-slate-200',
  Pending: 'bg-amber-50 text-amber-700 border-amber-100',
};

const filters = ['All Clients', 'Active', 'Inactive', 'Pending Onboarding'];

function filterToStatus(filter: string) {
  if (filter === 'Pending Onboarding') return 'Pending';
  if (filter === 'Active' || filter === 'Inactive') return filter;
  return 'All';
}

export default function Clients() {
  const [filter, setFilter] = useState('All Clients');
  const [search, setSearch] = useState('');

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.contact.toLowerCase().includes(search.toLowerCase()) ||
      client.location.toLowerCase().includes(search.toLowerCase());
    const selectedStatus = filterToStatus(filter);
    const matchesFilter = selectedStatus === 'All' || client.status === selectedStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <PageShell>
      <Surface className="bg-gradient-to-br from-white via-cyan-50/40 to-emerald-50/60">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-cyan-700">Client intelligence</p>
            <h2 className="mt-1 text-2xl font-extrabold text-slate-950">Care network overview</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Search, segment, and inspect healthcare accounts with deployment and revenue context.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn-primary">
              <Plus className="h-4 w-4" />
              Add Client
            </button>
            <button type="button" className="btn-secondary">
              <Upload className="h-4 w-4" />
              Import
            </button>
          </div>
        </div>
      </Surface>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full xl:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field-control w-full pl-10 pr-4"
          />
        </div>

        <div className="segmented-control w-full overflow-x-auto xl:w-auto">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={cn('segmented-item whitespace-nowrap', filter === item && 'segmented-item-active')}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
        {filteredClients.map((client) => (
          <article
            key={client.id}
            className="clinical-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow"
          >
            <div className="clinical-content">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${client.color} text-sm font-extrabold text-white shadow-glow`}>
                    {client.initials}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-extrabold text-slate-950">{client.name}</h3>
                    <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{client.location}</span>
                    </div>
                  </div>
                </div>
                <StatusBadge className={statusStyles[client.status]}>{client.status}</StatusBadge>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <Users className="h-4 w-4 shrink-0 text-cyan-600" />
                  <span className="truncate">{client.contact}</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate">{client.email}</span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                <div className="rounded-lg bg-cyan-50/60 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-cyan-700">
                    <Building2 className="h-3.5 w-3.5" />
                    Deployments
                  </div>
                  <p className="mt-2 text-lg font-extrabold text-slate-950">{client.deployments}</p>
                </div>
                <div className="rounded-lg bg-emerald-50/70 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-emerald-700">
                    <TrendingUp className="h-3.5 w-3.5" />
                    MRR
                  </div>
                  <p className="mt-2 text-lg font-extrabold text-slate-950">₹{client.mrr.toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button type="button" className="subtle-link">
                  View Profile →
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
