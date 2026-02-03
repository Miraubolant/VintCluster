import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getCitiesByDepartment, getDepartmentBySlug } from "@/lib/cities";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ department: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { department: rawDepartment } = await params;
  // Extraire le slug du département depuis "sitemap-villes-{slug}.xml"
  const depSlug = rawDepartment.replace(".xml", "");

  const headersList = await headers();
  const host = headersList.get("x-current-host") || headersList.get("host") || "";
  const currentDomain = host.split(":")[0].toLowerCase().replace(/^www\./, "");

  const supabase = await createClient();

  const { data: site } = await supabase
    .from("sites")
    .select("id, domain")
    .eq("domain", currentDomain)
    .single();

  if (!site) {
    return new NextResponse("Site not found", { status: 404 });
  }

  const baseUrl = `https://${site.domain}`;

  // Trouver le département correspondant
  const department = getDepartmentBySlug(depSlug);
  if (!department) {
    return new NextResponse("Department not found", { status: 404 });
  }

  // Récupérer les villes de ce département
  const cities = getCitiesByDepartment(department);

  // Générer les URLs des pages hub villes
  const urls = cities.map((city) => `<url>
<loc>${baseUrl}/ville/${city.nom_sans_accent}</loc>
<changefreq>weekly</changefreq>
<priority>0.7</priority>
</url>`);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
