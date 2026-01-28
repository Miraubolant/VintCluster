import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Route temporaire pour setup la base de données
// À supprimer après utilisation

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    db: { schema: "public" },
    auth: { persistSession: false },
  });

  const results: { step: string; success: boolean; error?: string }[] = [];

  // Test connection first
  const { error: testError } = await supabase.from("sites").select("count");

  if (!testError || testError.code === "42P01") {
    // Table doesn't exist or connection works, proceed with setup

    // We'll create tables by inserting and handling errors
    // Since we can't execute raw SQL via the client, we need to use the SQL Editor

    return NextResponse.json({
      message: "Database setup requires manual SQL execution",
      instructions: [
        "1. Go to your Supabase Dashboard",
        "2. Navigate to SQL Editor",
        "3. Copy the SQL from supabase/migrations/001_initial_schema.sql",
        "4. Execute the SQL",
        "5. Come back here and refresh to verify"
      ],
      sqlFile: "/supabase/migrations/001_initial_schema.sql",
      connectionTest: testError ? "Tables not created yet" : "Connection successful"
    });
  }

  return NextResponse.json({
    error: "Connection failed",
    details: testError.message
  }, { status: 500 });
}
