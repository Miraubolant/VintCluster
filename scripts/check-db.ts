/**
 * Script pour vérifier la connexion et les tables Supabase
 * Usage: npx tsx scripts/check-db.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load .env.local
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing environment variables");
  console.log("   NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✓" : "✗");
  console.log("   SUPABASE_SERVICE_ROLE_KEY:", supabaseKey ? "✓" : "✗");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log("🔍 Checking Supabase connection...\n");
  console.log(`   URL: ${supabaseUrl}\n`);

  const tables = ["sites", "keywords", "articles", "scheduler_config", "activity_logs"];
  const results: Record<string, boolean> = {};

  for (const table of tables) {
    const { error } = await supabase.from(table).select("count").limit(1);
    results[table] = !error;
    console.log(`   ${results[table] ? "✅" : "❌"} ${table}${error ? ` - ${error.message}` : ""}`);
  }

  const allExist = Object.values(results).every(Boolean);

  console.log("\n" + "=".repeat(50));

  if (allExist) {
    console.log("✅ All tables exist! Database is ready.");
  } else {
    console.log("⚠️  Some tables are missing.");
    console.log("\nTo create tables:");
    console.log("1. Go to: https://supabase.com/dashboard/project/dukxwkcceqsiopmhicav/sql");
    console.log("2. Copy the content of: supabase/migrations/001_initial_schema.sql");
    console.log("3. Paste and run the SQL");
  }
}

checkDatabase().catch(console.error);
