import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VPS_DB_PASSWORD = process.env.VPS_DB_PASSWORD;
const VPS_HOST = process.env.VPS_HOST;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !VPS_DB_PASSWORD || !VPS_HOST) {
  console.error("Configure SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VPS_DB_PASSWORD e VPS_HOST no .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const vpsConfig = {
  host: VPS_HOST,
  port: 5432,
  user: 'postgres',
  password: VPS_DB_PASSWORD,
  database: 'controletotal',
  ssl: false
};

const TABLES = [
  'profiles', 'clientes', 'agendamentos', 'atendimentos',
  'orcamentos', 'servicos_catalogo', 'whatsapp_templates',
  'anamnese_configs', 'anamnese_respostas', 'cobrancas', 'pagamentos'
];

async function getSupabaseRowCount(table) {
  try {
    const { count, error } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true });
    if (error) return -1;
    return count || 0;
  } catch {
    return -1;
  }
}

async function getVpsRowCount(client, table) {
  try {
    const res = await client.query(`SELECT COUNT(*) as count FROM public."${table}"`);
    return parseInt(res.rows[0].count, 10);
  } catch {
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
    console.log(String("Table").padEnd(25) + " | " + "Supabase".padStart(15) + " | " + "VPS".padStart(10) + " | " + "Status");
    console.log("-".repeat(65));

    for (const table of TABLES) {
      const sbCount = await getSupabaseRowCount(table);
      const vpsCount = await getVpsRowCount(vpsClient, table);

      let status = "OK";
      if (vpsCount === -1) status = "MISSING IN VPS";
      else if (sbCount === -1) status = "UNABLE TO READ FROM SUPABASE";
      else if (sbCount !== vpsCount) status = `MISMATCH (${vpsCount - sbCount > 0 ? '+' : ''}${vpsCount - sbCount} rows)`;

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
