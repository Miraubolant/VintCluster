import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getCitiesCount } from "@/lib/cities";

export const dynamic = "force-dynamic";

// Nombre d'URLs par sitemap
const URLS_PER_SITEMAP = 45000;

// Nombre de villes à inclure dans les sitemaps locaux
const CITIES_FOR_LOCAL_PAGES = 5000;

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

  // Compter les articles pour calculer le nombre de sitemaps locaux nécessaires
  const { count: articlesCount } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true })
    .eq("site_id", site.id)
    .eq("status", "published");

  const totalArticles = articlesCount || 0;
  const totalLocalPages = CITIES_FOR_LOCAL_PAGES * totalArticles;
  const localSitemapsCount = Math.ceil(totalLocalPages / URLS_PER_SITEMAP);

  // Générer le sitemap index XML
  const sitemaps = [
    `${baseUrl}/sitemaps/main.xml`,
    `${baseUrl}/sitemaps/cities.xml`,
  ];

  // Ajouter les sitemaps locaux paginés
  for (let i = 1; i <= localSitemapsCount; i++) {
    sitemaps.push(`${baseUrl}/sitemaps/local/${i}.xml`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(url => `  <sitemap>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`).join("\n")}
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
