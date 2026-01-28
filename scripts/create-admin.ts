/**
 * Script pour créer l'utilisateur admin
 * Usage: npx tsx scripts/create-admin.ts <email> <password>
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createAdmin() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error("Usage: npx tsx scripts/create-admin.ts <email> <password>");
    console.error("Example: npx tsx scripts/create-admin.ts admin@example.com mypassword123");
    process.exit(1);
  }

  console.log(`\n🔐 Creating admin user: ${email}\n`);

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    console.error("❌ Error creating user:", error.message);
    process.exit(1);
  }

  console.log("✅ Admin user created successfully!");
  console.log(`   Email: ${data.user.email}`);
  console.log(`   ID: ${data.user.id}`);
  console.log("\n📝 You can now login at /admin/login");
}

createAdmin().catch(console.error);
