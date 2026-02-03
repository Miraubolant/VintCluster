import { MetadataRoute } from "next";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getTopCitiesByPopulation } from "@/lib/cities";

export const dynamic = "force-dynamic";

/**
 * Sitemap principal - contient les pages essentielles
 * Pour le sitemap complet avec millions de pages, voir /sitemaps/index.xml
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
    return [];
  }

  const { data: articles } = await supabase
    .from("articles")
    .select("slug, updated_at")
    .eq("site_id", site.id)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const sitemapEntries: MetadataRoute.Sitemap = [];
  const baseUrl = `https://${site.domain}`;

  // Pages statiques
  sitemapEntries.push({
    url: baseUrl,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1,
  });

  sitemapEntries.push({
    url: `${baseUrl}/blog`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.9,
  });

  // Articles
  articles?.forEach((article) => {
    sitemapEntries.push({
      url: `${baseUrl}/blog/${article.slug}`,
      lastModified: new Date(article.updated_at || Date.now()),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  });

  // Top 100 villes (hub pages les plus importantes)
  const topCities = getTopCitiesByPopulation(100);
  topCities.forEach((city) => {
    sitemapEntries.push({
      url: `${baseUrl}/ville/${city.nom_sans_accent}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    });
  });

  return sitemapEntries;
}
