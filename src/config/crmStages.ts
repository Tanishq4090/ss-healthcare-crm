export const CRM_PIPELINE_STAGES = [
  { id: 'new-lead', label: 'New Lead', color: '#3B82F6' },
  { id: 'new-inquiry', label: 'New Inquiry', color: '#8B5CF6' },
  { id: 'in-discussion', label: 'In Discussion', color: '#F59E0B' },
  { id: 'quotation-sent', label: 'Quotation Sent', color: '#EC4899' },
  { id: 'form-submitted', label: 'Form Submitted', color: '#14B8A6' },
  { id: 'staff-assigned', label: 'Staff Assigned', color: '#0EA5E9' },
  { id: 'deposit-pending', label: 'Deposit Pending', color: '#F97316' },
  { id: 'active-client', label: 'Active Client', color: '#00A859' },
  { id: 'monthly-billing', label: 'Monthly Billing', color: '#6366F1' },
  { id: 'closed-won', label: 'Closed Won', color: '#059669' },
] as const;

export type CrmStageId = (typeof CRM_PIPELINE_STAGES)[number]['id'];

export const CRM_STAGE_LABELS = CRM_PIPELINE_STAGES.reduce<Record<string, string>>((acc, stage) => {
  acc[stage.id] = stage.label;
  return acc;
}, {});

export const CRM_STAGE_COLORS = CRM_PIPELINE_STAGES.reduce<Record<string, string>>((acc, stage) => {
  acc[stage.id] = stage.color;
  return acc;
}, {});

export function normalizeCrmStage(stage?: string | null): CrmStageId {
  const raw = String(stage || 'new-lead').trim();
  const fromLabel = CRM_PIPELINE_STAGES.find((item) => item.label.toLowerCase() === raw.toLowerCase());
  if (fromLabel) return fromLabel.id;

  const slug = raw.toLowerCase().replace(/_/g, '-').replace(/\s+/g, '-');
  return (CRM_PIPELINE_STAGES.find((item) => item.id === slug)?.id || 'new-lead') as CrmStageId;
}

/** Post-conversion stages shown in the "Clients" tab */
export const CRM_CLIENT_STAGE_IDS = new Set<CrmStageId>([
  'active-client',
  'monthly-billing',
  'closed-won',
]);

/** Pre-conversion stages shown in the "Pipeline" tab */
export const CRM_PIPELINE_STAGE_IDS = new Set<CrmStageId>([
  'new-lead',
  'new-inquiry',
  'in-discussion',
  'quotation-sent',
  'form-submitted',
  'staff-assigned',
  'deposit-pending',
]);

/** Stages filtered for Pipeline tab view */
export const CRM_PIPELINE_VIEW_STAGES = CRM_PIPELINE_STAGES.filter(
  (s) => CRM_PIPELINE_STAGE_IDS.has(s.id)
);

/** Stages filtered for Clients tab view */
export const CRM_CLIENT_VIEW_STAGES = CRM_PIPELINE_STAGES.filter(
  (s) => CRM_CLIENT_STAGE_IDS.has(s.id)
);

/** @deprecated Use CRM_CLIENT_STAGE_IDS instead */
export const CRM_CLIENT_STAGES = CRM_CLIENT_STAGE_IDS;

