import pg from 'pg';

const supabaseConfig = {
  host: 'aws-0-sa-east-1.pooler.supabase.com',
  port: 5432,
  user: 'postgres.mruoqycgsfxdhogehztx',
  password: 'Wukhoh-miqxim-simhu6',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
};

const vpsConfig = {
  host: '187.127.12.245',
  port: 5432,
  user: 'postgres',
  password: 'Wukhoh-miqxim-simhu6',
  database: 'controletotal',
  ssl: false
};

async function getTables(client) {
  const query = `
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_schema IN ('public', 'auth') 
      AND table_type = 'BASE TABLE'
      AND table_name NOT LIKE 'pg_%'
      AND table_name NOT LIKE 'sql_%'
    ORDER BY table_schema, table_name;
  `;
  const res = await client.query(query);
  return res.rows;
}

async function getRowCount(client, schema, table) {
  try {
    const res = await client.query(`SELECT COUNT(*) as count FROM "${schema}"."${table}"`);
    return parseInt(res.rows[0].count, 10);
  } catch (err) {
    return -1; // Indicates table might not exist or error
  }
}

async function run() {
  const supabaseClient = new pg.Client(supabaseConfig);
  const vpsClient = new pg.Client(vpsConfig);

  try {
    console.log("Connecting to Supabase...");
    await supabaseClient.connect();
    console.log("Connected to Supabase.");

    console.log("Connecting to VPS...");
    await vpsClient.connect();
    console.log("Connected to VPS.");

    const sbTables = await getTables(supabaseClient);
    
    console.log("\nComparing row counts between Supabase and VPS:\n");
    console.log(String("Table").padEnd(35) + " | " + "Supabase".padStart(10) + " | " + "VPS".padStart(10) + " | " + "Status");
    console.log("-".repeat(70));

    for (const t of sbTables) {
      // Skip some native supabase tables if we get permission errors or if they are irrelevant
      if (t.table_schema === 'auth' && !['users', 'identities', 'sessions'].includes(t.table_name)) {
        continue;
      }
      if (t.table_name.startsWith('flow_') || t.table_name.startsWith('schema_') || t.table_name === 'decrypted_secrets') {
        continue;
      }
      
      const fullname = `${t.table_schema}.${t.table_name}`;
      const sbCount = await getRowCount(supabaseClient, t.table_schema, t.table_name);
      const vpsCount = await getRowCount(vpsClient, t.table_schema, t.table_name);

      let status = "OK";
      if (vpsCount === -1) {
        status = "MISSING IN VPS";
      } else if (sbCount !== vpsCount) {
        status = `MISMATCH (${vpsCount - sbCount > 0 ? '+' : ''}${vpsCount - sbCount} rows)`;
      }

      console.log(
        fullname.padEnd(35) + " | " + 
        (sbCount === -1 ? "Error" : String(sbCount)).padStart(10) + " | " + 
        (vpsCount === -1 ? "Missing" : String(vpsCount)).padStart(10) + " | " + 
        status
      );
    }

  } catch (err) {
    console.error("Comparison failed:", err);
  } finally {
    await supabaseClient.end();
    await vpsClient.end();
  }
}

run();
