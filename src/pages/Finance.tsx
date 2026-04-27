import { useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Download, FileText, Landmark, MoreHorizontal, Send, TrendingUp } from 'lucide-react';
import { IconFrame, PageShell, SectionHeader, StatusBadge, Surface, TrendPill } from '@/components/AppPrimitives';

interface Invoice {
  id: string;
  number: string;
  client: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
}

const invoices: Invoice[] = [
  { id: '1', number: 'INV-2026-001', client: 'Apollo Hospitals', amount: 25000, dueDate: 'Apr 30, 2026', status: 'Paid' },
  { id: '2', number: 'INV-2026-002', client: 'Fortis Healthcare', amount: 18000, dueDate: 'May 5, 2026', status: 'Pending' },
  { id: '3', number: 'INV-2026-003', client: 'Max Hospital', amount: 15000, dueDate: 'Apr 20, 2026', status: 'Overdue' },
  { id: '4', number: 'INV-2026-004', client: 'Narayana Health', amount: 12000, dueDate: 'May 10, 2026', status: 'Pending' },
  { id: '5', number: 'INV-2026-005', client: 'Cloudnine Care', amount: 9000, dueDate: 'Apr 25, 2026', status: 'Paid' },
];

const statusStyles = {
  Paid: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Pending: 'bg-amber-50 text-amber-700 border-amber-100',
  Overdue: 'bg-rose-50 text-rose-700 border-rose-100',
};

function SummaryCard({
  label,
  value,
  helper,
  icon,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  icon: typeof TrendingUp;
  tone: 'cyan' | 'emerald' | 'amber' | 'blue' | 'rose';
}) {
  return (
    <Surface className="transition-all duration-300 hover:-translate-y-1 hover:shadow-glow">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase text-slate-400">{label}</span>
          <p className="mt-8 text-3xl font-extrabold leading-none text-slate-950">{value}</p>
        </div>
        <IconFrame icon={icon} tone={tone} />
      </div>
      <p className="mt-5 text-xs font-bold text-slate-500">{helper}</p>
    </Surface>
  );
}

export default function Finance() {
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelectedInvoices((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const totalRevenue = 89000;
  const outstanding = 45000;
  const payrollMonth = 52000;
  const collectionRate = 78;

  return (
    <PageShell>
      <Surface className="bg-gradient-to-br from-white via-cyan-50/40 to-emerald-50/60">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-cyan-700">Revenue operations</p>
            <h2 className="mt-1 text-2xl font-extrabold text-slate-950">Finance pulse</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Track client billing, reminders, collection health, and payroll readiness from one focused ledger.
            </p>
          </div>
          <div className="rounded-lg border border-emerald-100 bg-white/80 p-4 shadow-sm">
            <p className="text-xs font-bold uppercase text-emerald-700">Collection rate</p>
            <div className="mt-2 flex items-end gap-3">
              <span className="text-3xl font-extrabold text-slate-950">{collectionRate}%</span>
              <TrendPill value="+5%" label="vs last month" />
            </div>
          </div>
        </div>
      </Surface>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} helper="+12% this quarter" icon={TrendingUp} tone="cyan" />
        <SummaryCard label="Outstanding" value={`₹${outstanding.toLocaleString()}`} helper="3 invoices pending" icon={AlertCircle} tone="amber" />
        <SummaryCard label="Payroll This Month" value={`₹${payrollMonth.toLocaleString()}`} helper="18 workers processed" icon={Landmark} tone="emerald" />
        <SummaryCard label="Collection Rate" value={`${collectionRate}%`} helper="+5% vs last month" icon={CheckCircle2} tone="blue" />
      </div>

      <div className="table-shell">
        <div className="clinical-content">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
            <SectionHeader
              title="Invoices"
              description="Select invoices and send reminders without leaving the finance center."
            />
            <div className="flex flex-wrap items-center gap-3">
              {selectedInvoices.length > 0 && (
                <span className="rounded-full bg-cyan-50 px-3 py-1.5 text-sm font-bold text-cyan-700">
                  {selectedInvoices.length} selected
                </span>
              )}
              <button type="button" className="btn-secondary">
                <Download className="h-4 w-4" />
                Download
              </button>
              <button type="button" className="btn-primary">
                <Send className="h-4 w-4" />
                Send Reminder
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="table-heading px-6 py-4 w-10">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-600"
                      onChange={(e) => {
                        if (e.target.checked) setSelectedInvoices(invoices.map((invoice) => invoice.id));
                        else setSelectedInvoices([]);
                      }}
                      checked={selectedInvoices.length === invoices.length && invoices.length > 0}
                    />
                  </th>
                  <th className="table-heading px-6 py-4">Invoice #</th>
                  <th className="table-heading px-6 py-4">Client</th>
                  <th className="table-heading px-6 py-4">Amount</th>
                  <th className="table-heading px-6 py-4">Due Date</th>
                  <th className="table-heading px-6 py-4">Status</th>
                  <th className="table-heading px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-slate-100/80 transition-colors hover:bg-cyan-50/40">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-600"
                        checked={selectedInvoices.includes(invoice.id)}
                        onChange={() => toggleSelect(invoice.id)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-cyan-600" />
                        <span className="text-sm font-bold text-slate-950">{invoice.number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">{invoice.client}</td>
                    <td className="px-6 py-4 text-sm font-extrabold text-slate-950">₹{invoice.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-500">{invoice.dueDate}</td>
                    <td className="px-6 py-4">
                      <StatusBadge className={statusStyles[invoice.status]}>
                        {invoice.status === 'Paid' && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {invoice.status === 'Pending' && <Clock className="h-3.5 w-3.5" />}
                        {invoice.status === 'Overdue' && <AlertCircle className="h-3.5 w-3.5" />}
                        {invoice.status}
                      </StatusBadge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button type="button" className="rounded-md p-1 text-slate-300 transition-colors hover:bg-white hover:text-slate-500" aria-label="Invoice actions">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
