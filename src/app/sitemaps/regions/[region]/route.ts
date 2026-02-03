import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getCitiesByRegion, getAllRegions } from "@/lib/cities";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ region: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { region: regionSlug } = await params;
  const cleanSlug = regionSlug.replace(".xml", "");

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

  // Trouver la région correspondante
  const regions = getAllRegions();
  const matchedRegion = regions.find((r) => {
    const slug = r
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return slug === cleanSlug;
  });

  if (!matchedRegion) {
    return new NextResponse("Region not found", { status: 404 });
  }

  // Récupérer les villes de cette région
  const cities = getCitiesByRegion(matchedRegion);

  // Récupérer les articles publiés
  const { data: articles } = await supabase
    .from("articles")
    .select("slug")
    .eq("site_id", site.id)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const urls: string[] = [];

  // 1. Pages hub des villes de la région (priorité haute)
  cities.forEach((city) => {
    urls.push(`  <url>
    <loc>${baseUrl}/ville/${city.nom_sans_accent}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
  });

  // 2. Combinaisons ville × article (priorité moyenne)
  if (articles && articles.length > 0) {
    // Limiter à 1000 villes par région pour éviter les sitemaps trop gros
    const limitedCities = cities.slice(0, 1000);

    limitedCities.forEach((city) => {
      articles.forEach((article) => {
        urls.push(`  <url>
    <loc>${baseUrl}/ville/${city.nom_sans_accent}/${article.slug}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`);
      });
    });
  }

  // Limiter à 45000 URLs max par sitemap
  const limitedUrls = urls.slice(0, 45000);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${limitedUrls.join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
