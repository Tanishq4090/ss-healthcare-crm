/**
 * Access Control Domain Logic
 * Manages module-level access permissions.
 */

const MODULE_PERMISSIONS: Record<string, string[]> = {
  dashboard: ['admin', 'manager', 'viewer'],
  crm: ['admin', 'manager'],
  clients: ['admin', 'manager'],
  hr: ['admin', 'manager'],
  finance: ['admin'],
  access_control: ['admin'],
  system: ['admin'],
};

export function canAccessModule(userRole: string, module: string): boolean {
  const allowed = MODULE_PERMISSIONS[module];
  if (!allowed) return false;
  return allowed.includes(userRole.toLowerCase());
}

export function getAccessibleModules(userRole: string): string[] {
  return Object.keys(MODULE_PERMISSIONS).filter((mod) =>
    MODULE_PERMISSIONS[mod].includes(userRole.toLowerCase()),
  );
}

export function isAdmin(userRole: string): boolean {
  return userRole.toLowerCase() === 'admin';
}
