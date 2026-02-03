import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getAllRegions } from "@/lib/cities";

export const dynamic = "force-dynamic";

const URLS_PER_SITEMAP = 45000;
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

  // Compter les articles
  const { count: articlesCount } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true })
    .eq("site_id", site.id)
    .eq("status", "published");

  const totalArticles = articlesCount || 0;
  const totalLocalPages = CITIES_FOR_LOCAL_PAGES * totalArticles;
  const localSitemapsCount = Math.ceil(totalLocalPages / URLS_PER_SITEMAP);

  // Récupérer toutes les régions
  const regions = getAllRegions();

  // Construire la liste des sitemaps
  const sitemaps: string[] = [];

  // 1. Sitemap des articles (priorité haute)
  sitemaps.push(`${baseUrl}/sitemaps/articles.xml`);

  // 2. Sitemap des hubs villes (priorité moyenne-haute)
  sitemaps.push(`${baseUrl}/sitemaps/cities-hub.xml`);

  // 3. Index des régions (maillage géographique)
  sitemaps.push(`${baseUrl}/sitemaps/regions/index.xml`);

  // 4. Sitemaps par région (18 régions françaises)
  regions.forEach((region) => {
    const regionSlug = region
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    sitemaps.push(`${baseUrl}/sitemaps/regions/${regionSlug}.xml`);
  });

  // 5. Sitemaps locaux paginés (ville × article)
  for (let i = 1; i <= Math.min(localSitemapsCount, 200); i++) {
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
