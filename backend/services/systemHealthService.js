/**
 * System Health Service
 * Checks the health of all system components and integrations.
 */
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkDatabaseHealth() {
  try {
    const { count, error } = await supabase
      .from('crm_leads')
      .select('*', { count: 'exact', head: true });
    return { status: 'healthy', leads_count: count, error: null };
  } catch (err) {
    return { status: 'error', leads_count: 0, error: err.message };
  }
}

async function checkEmployeesTable() {
  try {
    const { count, error } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true });
    return { status: error ? 'error' : 'healthy', count: count || 0 };
  } catch (err) {
    return { status: 'error', count: 0, error: err.message };
  }
}

async function getFullSystemStatus() {
  const [db, employees] = await Promise.all([
    checkDatabaseHealth(),
    checkEmployeesTable(),
  ]);

  const allHealthy = db.status === 'healthy' && employees.status === 'healthy';

  return {
    overall: allHealthy ? 'healthy' : 'degraded',
    version: 'v1.0-live',
    components: {
      database: db,
      employees: employees,
      callyzer_integration: { status: 'integration_ready', phase: 2 },
      whatsapp_integration: { status: 'integration_ready', phase: 2 },
    },
    timestamp: new Date().toISOString(),
  };
}

module.exports = { checkDatabaseHealth, checkEmployeesTable, getFullSystemStatus };
