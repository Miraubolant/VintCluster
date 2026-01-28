import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Vérifier le secret du cron pour la sécurité
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Vérifier les variables d'environnement (sans exposer les valeurs complètes)
  const envCheck = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    REPLICATE_API_TOKEN: !!process.env.REPLICATE_API_TOKEN,
    REPLICATE_API_TOKEN_LENGTH: process.env.REPLICATE_API_TOKEN?.length || 0,
    REPLICATE_API_TOKEN_PREFIX: process.env.REPLICATE_API_TOKEN?.substring(0, 5) || "N/A",
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    CRON_SECRET: !!process.env.CRON_SECRET,
  };

  return NextResponse.json({
    message: "Environment variables check",
    env: envCheck,
    timestamp: new Date().toISOString(),
  });
}
