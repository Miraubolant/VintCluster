import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getTopCitiesByPopulation } from "@/lib/cities";

export const dynamic = "force-dynamic";

// Configuration
const URLS_PER_SITEMAP = 45000;
const CITIES_FOR_LOCAL_PAGES = 5000;

interface RouteParams {
  params: Promise<{ page: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { page: pageStr } = await params;
  const page = parseInt(pageStr.replace(".xml", ""), 10);

  if (isNaN(page) || page < 1) {
    return new NextResponse("Invalid page number", { status: 400 });
  }

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

  // Récupérer les articles
  const { data: articles } = await supabase
    .from("articles")
    .select("slug")
    .eq("site_id", site.id)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (!articles || articles.length === 0) {
    return new NextResponse("No articles found", { status: 404 });
  }

  // Top villes pour les combinaisons
  const cities = getTopCitiesByPopulation(CITIES_FOR_LOCAL_PAGES);
  const totalCombinations = cities.length * articles.length;

  // Calculer l'offset pour cette page
  const startIndex = (page - 1) * URLS_PER_SITEMAP;
  const endIndex = Math.min(startIndex + URLS_PER_SITEMAP, totalCombinations);

  // Vérifier si cette page existe
  if (startIndex >= totalCombinations) {
    return new NextResponse("Page not found", { status: 404 });
  }

  // Générer les URLs pour cette tranche
  const urls: string[] = [];

  for (let i = startIndex; i < endIndex; i++) {
    const cityIndex = Math.floor(i / articles.length);
    const articleIndex = i % articles.length;

    if (cityIndex < cities.length && articleIndex < articles.length) {
      const city = cities[cityIndex];
      const article = articles[articleIndex];

      urls.push(`  <url>
    <loc>${baseUrl}/ville/${city.nom_sans_accent}/${article.slug}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>`);
    }
  }

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
