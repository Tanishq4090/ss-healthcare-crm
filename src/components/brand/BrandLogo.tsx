import { SS_HEALTHCARE_BRAND } from '@/config/brand';

export default function BrandLogo({
  compact = false,
  className = '',
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-[rgba(0,168,89,0.22)]">
        <img src={SS_HEALTHCARE_BRAND.logoPath} alt={SS_HEALTHCARE_BRAND.name} className="h-8 w-8 object-contain" />
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-slate-950">{SS_HEALTHCARE_BRAND.name}</p>
          <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-[0.18em] text-[#004C8C]">
            Admin OS
          </p>
        </div>
      )}
    </div>
  );
}
