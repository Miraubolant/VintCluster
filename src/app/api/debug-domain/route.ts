import { NextRequest, NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  // Auth check - require CRON_SECRET for debug routes
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const host = request.headers.get("host") || "";
  const xCurrentHost = request.headers.get("x-current-host") || "";
  const domain = host.split(":")[0];
  const normalizedDomain = domain.toLowerCase().replace(/^www\./, "");

  const supabase = createPublicClient();

  // Récupérer tous les sites pour comparaison
  const { data: sites, error } = await supabase
    .from("sites")
    .select("id, name, domain");

  // Chercher le site correspondant
  const { data: matchedSite } = await supabase
    .from("sites")
    .select("*")
    .eq("domain", normalizedDomain)
    .single();

  return NextResponse.json({
    headers: {
      host,
      xCurrentHost,
    },
    extracted: {
      domain,
      normalizedDomain,
    },
    database: {
      allSites: sites,
      matchedSite,
      error: error?.message,
    },
  });
}
