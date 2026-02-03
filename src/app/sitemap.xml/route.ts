import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getAllDepartments, departmentToSlug } from "@/lib/cities";

export const dynamic = "force-dynamic";

export async function GET() {
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

  // Récupérer tous les départements
  const departments = getAllDepartments();

  // Construire la liste des sitemaps
  const sitemaps: string[] = [];

  // 1. Sitemap principal (homepage, blog, articles)
  sitemaps.push(`${baseUrl}/sitemap-main.xml`);

  // 2. Pour chaque département : sitemap-villes et sitemap-articles
  departments.forEach((dep) => {
    const depSlug = departmentToSlug(dep);
    // Sitemap des villes du département (pages hub)
    sitemaps.push(`${baseUrl}/sitemap-villes-${depSlug}.xml`);
    // Sitemap des articles localisés (ville × article)
    sitemaps.push(`${baseUrl}/sitemap-articles-${depSlug}.xml`);
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(url => `<sitemap>
<loc>${url}</loc>
</sitemap>`).join("\n")}
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
