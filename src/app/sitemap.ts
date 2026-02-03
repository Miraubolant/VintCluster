import { MetadataRoute } from "next";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getTopCitiesByPopulation } from "@/lib/cities";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = await headers();
  const host = headersList.get("x-current-host") || headersList.get("host") || "";
  const currentDomain = host.split(":")[0].toLowerCase().replace(/^www\./, "");

  const supabase = await createClient();

  // Récupérer le site correspondant au domaine actuel
  const { data: site } = await supabase
    .from("sites")
    .select("id, domain")
    .eq("domain", currentDomain)
    .single();

  // Si pas de site trouvé, retourner un sitemap vide
  if (!site) {
    return [];
  }

  // Récupérer les articles publiés de CE site uniquement
  const { data: articles } = await supabase
    .from("articles")
    .select("slug, updated_at")
    .eq("site_id", site.id)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const sitemapEntries: MetadataRoute.Sitemap = [];
  const baseUrl = `https://${site.domain}`;

  // Page d'accueil
  sitemapEntries.push({
    url: baseUrl,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1,
  });

  // Page blog
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

  // Pages villes seules (top 1000 pour rester sous 50k URLs)
  const topCities = getTopCitiesByPopulation(1000);
  topCities.forEach((city) => {
    sitemapEntries.push({
      url: `${baseUrl}/ville/${city.nom_sans_accent}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    });
  });

  // Combinaisons ville × article (top 100 villes × tous les articles)
  // Pour rester sous la limite de 50k URLs
  const topCitiesForCombinations = getTopCitiesByPopulation(100);
  const articleSlugs = articles?.map(a => a.slug) || [];

  topCitiesForCombinations.forEach((city) => {
    articleSlugs.forEach((slug) => {
      sitemapEntries.push({
        url: `${baseUrl}/ville/${city.nom_sans_accent}/${slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.5,
      });
    });
  });

  return sitemapEntries;
}
