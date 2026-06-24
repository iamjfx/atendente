import pg from 'pg';

const supabaseUrl = 'https://zmjimlpcnsszxoebjdhd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptamltbHBjbnNzenhvZWJqZGhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTM5NTgwMywiZXhwIjoyMDk2OTcxODAzfQ.5U_hNQL-MwANzH3V04EEQ9gMxbvJ6TgimY7t_gK3PLY';

const vpsConfig = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'Wukhoh-miqxim-simhu6',
  database: 'controletotal',
  ssl: false
};

const TABLES = [
  'profiles',
  'clientes',
  'agendamentos',
  'atendimentos',
  'orcamentos',
  'servicos_catalogo',
  'whatsapp_templates',
  'anamnese_configs',
  'anamnese_respostas',
  'cobrancas',
  'pagamentos'
];

async function getSupabaseRowCount(table) {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/${table}?select=id`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Prefer': 'count=exact'
      }
    });
    if (!res.ok) return -1;
    const contentRange = res.headers.get('content-range');
    if (contentRange) {
      const parts = contentRange.split('/');
      return parseInt(parts[1] || parts[0], 10);
    }
    return 0;
  } catch (err) {
    return -1;
  }
}

async function getVpsRowCount(client, table) {
  try {
    const res = await client.query(`SELECT COUNT(*) as count FROM public."${table}"`);
    return parseInt(res.rows[0].count, 10);
  } catch (err) {
    return -1;
  }
}

async function run() {
  const vpsClient = new pg.Client(vpsConfig);

  try {
    console.log("Connecting to VPS Database...");
    await vpsClient.connect();
    console.log("Connected to VPS Database.");

    console.log("\nComparing database row counts:\n");
    console.log(String("Table").padEnd(25) + " | " + "Supabase (API)".padStart(15) + " | " + "VPS".padStart(10) + " | " + "Status");
    console.log("-".repeat(65));

    for (const table of TABLES) {
      const sbCount = await getSupabaseRowCount(table);
      const vpsCount = await getVpsRowCount(vpsClient, table);

      let status = "OK";
      if (vpsCount === -1) {
        status = "MISSING IN VPS";
      } else if (sbCount === -1) {
        status = "UNABLE TO READ FROM SUPABASE";
      } else if (sbCount !== vpsCount) {
        status = `MISMATCH (${vpsCount - sbCount > 0 ? '+' : ''}${vpsCount - sbCount} rows)`;
      }

      console.log(
        table.padEnd(25) + " | " + 
        (sbCount === -1 ? "Error" : String(sbCount)).padStart(15) + " | " + 
        (vpsCount === -1 ? "Missing" : String(vpsCount)).padStart(10) + " | " + 
        status
      );
    }

  } catch (err) {
    console.error("Comparison run failed:", err);
  } finally {
    await vpsClient.end();
  }
}

run();
