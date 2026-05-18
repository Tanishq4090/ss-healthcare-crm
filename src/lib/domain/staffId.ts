/**
 * Staff ID Domain Logic
 * Re-exports from staffIdentity.ts for consistent domain API surface.
 */
export {
  absoluteStaffIdUrl,
  buildStaffAssignedMessage,
  toWhatsAppPhone,
  logTemplateMessage,
} from '@/lib/staffIdentity';

export function buildStaffIdVerificationUrl(employeeCode: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/verify/${employeeCode}`;
}

export function formatEmployeeCode(code?: string | null): string {
  if (!code) return '—';
  return code.toUpperCase();
}
