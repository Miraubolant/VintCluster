import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  getCitiesByDepartment,
  getDepartmentBySlug,
  getAllDepartments,
  departmentToSlug,
} from "@/lib/cities";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ sitemap: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { sitemap } = await params;

  // Parse le nom du sitemap
  const cleanName = sitemap.replace(".xml", "");

  // Vérifier quel type de sitemap est demandé
  if (cleanName === "sitemap-main") {
    return handleMainSitemap();
  }

  if (cleanName.startsWith("sitemap-villes-")) {
    const depSlug = cleanName.replace("sitemap-villes-", "");
    return handleVillesSitemap(depSlug);
  }

  if (cleanName.startsWith("sitemap-articles-")) {
    const depSlug = cleanName.replace("sitemap-articles-", "");
    return handleArticlesSitemap(depSlug);
  }

  // Si aucun pattern ne correspond, 404
  return new NextResponse("Sitemap not found", { status: 404 });
}

// Sitemap principal (homepage, blog, articles)
async function handleMainSitemap() {
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

  const { data: articles } = await supabase
    .from("articles")
    .select("slug, published_at, updated_at")
    .eq("site_id", site.id)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const urls: string[] = [];

  // Homepage
  urls.push(`<url>
<loc>${baseUrl}</loc>
<changefreq>daily</changefreq>
<priority>1.0</priority>
</url>`);

  // Page blog
  urls.push(`<url>
<loc>${baseUrl}/blog</loc>
<changefreq>daily</changefreq>
<priority>0.9</priority>
</url>`);

  // Articles
  if (articles) {
    articles.forEach((article) => {
      urls.push(`<url>
<loc>${baseUrl}/blog/${article.slug}</loc>
<lastmod>${article.updated_at || article.published_at || new Date().toISOString()}</lastmod>
<changefreq>weekly</changefreq>
<priority>0.8</priority>
</url>`);
    });
  }

  return createSitemapResponse(urls);
}

// Sitemap des villes par département
async function handleVillesSitemap(depSlug: string) {
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

  // Trouver le département
  const department = getDepartmentBySlug(depSlug);
  if (!department) {
    return new NextResponse("Department not found", { status: 404 });
  }

  const cities = getCitiesByDepartment(department);

  const urls = cities.map((city) => `<url>
<loc>${baseUrl}/ville/${city.nom_sans_accent}</loc>
<changefreq>weekly</changefreq>
<priority>0.7</priority>
</url>`);

  return createSitemapResponse(urls);
}

// Sitemap des articles localisés par département
async function handleArticlesSitemap(depSlug: string) {
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

  // Trouver le département
  const department = getDepartmentBySlug(depSlug);
  if (!department) {
    return new NextResponse("Department not found", { status: 404 });
  }

  const cities = getCitiesByDepartment(department);

  const { data: articles } = await supabase
    .from("articles")
    .select("slug")
    .eq("site_id", site.id)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (!articles || articles.length === 0) {
    return createSitemapResponse([]);
  }

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

  // Limiter à 45000 URLs
  const limitedUrls = urls.slice(0, 45000);

  return createSitemapResponse(limitedUrls);
}

function createSitemapResponse(urls: string[]) {
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
