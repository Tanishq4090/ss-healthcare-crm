import { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Phone,
  PieChart,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart as RePieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { IconFrame, PageShell, SectionHeader, Surface, TrendPill } from '@/components/AppPrimitives';

const mrrData = [
  { month: 'Jan', value: 3000 },
  { month: 'Feb', value: 4500 },
  { month: 'Mar', value: 6000 },
  { month: 'Apr', value: 7800 },
  { month: 'May', value: 9500 },
  { month: 'Jun', value: 12000 },
];

const leadSourceData = [
  { name: 'Voice AI', value: 45, color: '#0E8B76' },
  { name: 'Web', value: 30, color: '#0F79A4' },
  { name: 'Referral', value: 20, color: '#10B981' },
  { name: 'Direct', value: 5, color: '#94A3B8' },
];

const utilizationMetrics = [
  { label: 'Doctor', value: 84, detail: '672 hrs / 800 hrs', color: '#0E8B76' },
  { label: 'Assistant', value: 67, detail: '268 hrs / 400 hrs', color: '#0F79A4' },
  { label: 'Chair', value: 78, detail: '312 hrs / 400 hrs', color: '#10B981' },
  { label: 'Equipment', value: 79, detail: '172 hrs / 220 hrs', color: '#3B82F6' },
];

function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    const duration = 1200;
    const start = Date.now();
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);

  return (
    <span className="animate-count-up">
      {prefix}{display.toLocaleString()}{suffix}
    </span>
  );
}

function KPICard({
  label,
  value,
  prefix,
  suffix,
  trend,
  trendUp,
  icon,
  tone,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  trend: string;
  trendUp: boolean;
  icon: LucideIcon;
  tone: 'cyan' | 'emerald' | 'amber' | 'blue';
}) {
  return (
    <Surface className="group transition-all duration-300 hover:-translate-y-1 hover:shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
          <div className="mt-6 text-3xl font-extrabold tracking-tight text-slate-950">
            <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
          </div>
        </div>
        <IconFrame icon={icon} tone={tone} />
      </div>
      <div className="mt-5">
        <TrendPill value={trend} positive={trendUp} />
      </div>
    </Surface>
  );
}

export default function Dashboard() {
  return (
    <PageShell>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <Surface className="bg-gradient-to-br from-brand-50 via-white to-cyan-50/80 border border-brand-100/50">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-brand-900/70">Good Morning, Alyona</p>
              <h2 className="mt-3 text-3xl font-extrabold text-slate-950">Your care dashboard is ready.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Monitor patient pipelines, revenue signals, and on-time operations from one intelligent workspace.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { value: '3,549', label: 'Active Patients' },
                { value: '+1,537', label: 'New Patients' },
                { value: '87%', label: 'Satisfaction' },
              ].map((item) => (
                <div key={item.label} className="rounded-[1.5rem] border border-white/80 bg-white/90 px-4 py-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
                  <p className="mt-3 text-xl font-extrabold text-slate-950">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </Surface>

        <Surface>
          <div className="flex items-center gap-3">
            <IconFrame icon={Sparkles} tone="emerald" />
            <div>
              <p className="text-sm font-semibold text-slate-950">AI Assistant</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">Actionable care recommendations and follow-up signals are ready.</p>
            </div>
          </div>
        </Surface>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">
        <KPICard label="Active Leads" value={5} trend="+8%" trendUp icon={TrendingUp} tone="cyan" />
        <KPICard label="Worker Deployments" value={1} trend="+15%" trendUp icon={Users} tone="emerald" />
        <KPICard label="Platform MRR" value={12000} prefix="₹" trend="+22.4%" trendUp icon={Activity} tone="blue" />
        <KPICard label="Voice Calls" value={48} trend="+12%" trendUp icon={Phone} tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Surface className="xl:col-span-2">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <SectionHeader title="Total Appointments" description="Weekly appointment booking and care flow." />
            <div className="segmented-control self-start xl:self-auto">
              <button className="segmented-item segmented-item-active">Month</button>
              <button className="segmented-item">Week</button>
              <button className="segmented-item">Year</button>
            </div>
          </div>
          <div className="mt-6 h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mrrData} margin={{ top: 14, right: 14, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0E8B76" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0.06} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} tickFormatter={(value) => `₹${value / 1000}k`} dx={-10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255,255,255,0.96)',
                    border: '1px solid #CBD5E1',
                    borderRadius: '12px',
                    boxShadow: '0 16px 34px rgba(15, 23, 42, 0.12)',
                  }}
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, 'MRR']}
                />
                <Area type="monotone" dataKey="value" stroke="#0E8B76" strokeWidth={3} fill="url(#mrrGradient)" animationDuration={1400} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Surface>

        <Surface>
          <SectionHeader title="Revenue Source" action={<IconFrame icon={PieChart} tone="blue" className="h-10 w-10" />} />
          <div className="mt-5 flex items-center gap-5">
            <div className="h-32 w-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie data={leadSourceData} cx="50%" cy="50%" innerRadius={36} outerRadius={62} paddingAngle={3} dataKey="value">
                    {leadSourceData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              {leadSourceData.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="truncate text-sm font-medium text-slate-600">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-950">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {utilizationMetrics.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                  <span>{item.label}</span>
                  <span>{item.value}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
                </div>
                <p className="text-xs text-slate-400">{item.detail}</p>
              </div>
            ))}
          </div>
        </Surface>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Surface className="xl:col-span-2">
          <SectionHeader title="Clinical KPI Overview" description="Live clinical targets and patient satisfaction indicators." />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-slate-200/70 bg-white/95 p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">On-time Delivery</p>
              <div className="mt-4 flex items-center gap-4">
                <p className="text-4xl font-extrabold text-slate-950">92.4%</p>
                <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-900">Stable</span>
              </div>
              <p className="mt-3 text-sm text-slate-500">Patient check-ins and treatment starts are ahead of target this month.</p>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200/70 bg-white/95 p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">Revenue Balance</p>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-3xl font-extrabold text-slate-950">₹552.5K</p>
                  <p className="text-sm text-slate-500">Revenue</p>
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-slate-950">₹235.3K</p>
                  <p className="text-sm text-slate-500">Expenses</p>
                </div>
              </div>
              <div className="mt-5 rounded-[1.25rem] bg-brand-50/80 p-4 text-sm text-slate-600">
                Revenue is tracking ahead of forecast with referral channels showing strong growth.
              </div>
            </div>
          </div>
        </Surface>

        <Surface>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-500">Live Taskboard</p>
              <p className="mt-1 text-xs text-slate-400">Upcoming follow-ups and schedule checks.</p>
            </div>
            <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-900">4 tasks</span>
          </div>
          <div className="mt-5 space-y-3">
            {[
              { task: 'Follow up with Apollo Hospitals', due: 'Today', urgent: true },
              { task: 'Review Max Hospital contract', due: 'Tomorrow', urgent: false },
              { task: 'Schedule AI demo for Fortis', due: 'Apr 28', urgent: false },
              { task: 'Process monthly payroll', due: 'Apr 30', urgent: false },
            ].map((item) => (
              <label key={item.task} className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-white/95 p-4">
                <input type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-600" />
                <span className="min-w-0">
                  <span className={item.urgent ? 'block text-sm font-bold text-rose-600' : 'block text-sm font-semibold text-slate-700'}>
                    {item.task}
                  </span>
                  <span className={item.urgent ? 'mt-1 block text-xs text-rose-400' : 'mt-1 block text-xs text-slate-400'}>
                    {item.due}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </Surface>
      </div>
    </PageShell>
  );
}
