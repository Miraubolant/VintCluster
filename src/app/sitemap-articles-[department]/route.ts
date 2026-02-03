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
  // Extraire le slug du département depuis "sitemap-articles-{slug}.xml"
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

  // Récupérer les articles publiés
  const { data: articles } = await supabase
    .from("articles")
    .select("slug")
    .eq("site_id", site.id)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (!articles || articles.length === 0) {
    // Retourner un sitemap vide si pas d'articles
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;
    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  }

  // Générer les combinaisons ville × article
  const urls: string[] = [];

  cities.forEach((city) => {
    articles.forEach((article) => {
      urls.push(`<url>
<loc>${baseUrl}/ville/${city.nom_sans_accent}/${article.slug}</loc>
<changefreq>monthly</changefreq>
<priority>0.5</priority>
</url>`);
    });
  });

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
