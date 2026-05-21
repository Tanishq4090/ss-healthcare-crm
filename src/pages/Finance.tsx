import { Lock, WalletCards } from 'lucide-react';
import { PageShell, SectionHeader, Surface } from '@/components/AppPrimitives';

export default function Finance() {
  return (
    <PageShell>
      <Surface className="bg-gradient-to-br from-[#004C8C]/5 via-white to-[#00A859]/5 border-[#00A859]/20 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-40 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
        <div className="flex flex-col gap-5 relative z-10">
          <SectionHeader
            eyebrow="Billing Operations"
            title="Finance Module"
            description="Manage client billing, payments, and financial reports."
            action={<div className="h-10 w-10 bg-[#004C8C]/10 rounded-xl flex items-center justify-center border border-[#004C8C]/20"><WalletCards className="w-5 h-5 text-[#004C8C]" /></div>}
          />
        </div>
      </Surface>

      <div className="flex-1 flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Lock className="w-10 h-10 text-slate-300" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Coming Soon</h2>
          <p className="text-slate-500 mb-8 font-medium">The comprehensive Finance & Billing module is currently locked and will be activated in a future phase according to your requirements.</p>
          
          <button type="button" disabled className="btn-secondary opacity-50 cursor-not-allowed mx-auto">
            Module Locked
          </button>
        </div>
      </div>
    </PageShell>
  );
}
