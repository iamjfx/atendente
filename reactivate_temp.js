import postgres from "postgres";
import "dotenv/config";

const PASSWORD = process.env.SUPABASE_DB_PASSWORD;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;

if (!PASSWORD || !PROJECT_REF) {
  console.error("Configure SUPABASE_DB_PASSWORD e SUPABASE_PROJECT_REF no .env");
  process.exit(1);
}

const host = `aws-0-sa-east-1.pooler.supabase.com`;
const port = 6543;
const user = `postgres.${PROJECT_REF}`;
const database = "postgres";

const sql = postgres({
  host, port, user,
  password: PASSWORD,
  database,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  try {
    console.log("Fetching RLS policies for profiles table...");
    const policies = await sql`
      select policyname, cmd, qual, with_check 
      from pg_policies 
      where tablename = 'profiles';
    `;
    console.log("Policies:", policies);
  } catch (err) {
    console.error("Error executing query:", err);
  } finally {
    await sql.end();
  }
}

run();
