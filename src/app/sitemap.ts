import { MetadataRoute } from "next";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getTopCitiesByPopulation, getCitiesCount } from "@/lib/cities";

// Nombre max d'URLs par sitemap (Google limite à 50,000)
const URLS_PER_SITEMAP = 45000;

/**
 * Génère la liste des sitemaps pour le sitemap index
 * Utilisé par Next.js pour créer /sitemap.xml qui liste tous les sitemaps
 */
export async function generateSitemaps() {
  const headersList = await headers();
  const host = headersList.get("x-current-host") || headersList.get("host") || "";
  const currentDomain = host.split(":")[0].toLowerCase().replace(/^www\./, "");

  const supabase = await createClient();

  // Récupérer le site et compter les articles
  const { data: site } = await supabase
    .from("sites")
    .select("id")
    .eq("domain", currentDomain)
    .single();

  if (!site) {
    return [{ id: 0 }];
  }

  const { count: articlesCount } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true })
    .eq("site_id", site.id)
    .eq("status", "published");

  const citiesCount = getCitiesCount();
  const totalArticles = articlesCount || 0;

  // Calcul du nombre de sitemaps nécessaires
  // Sitemap 0: pages statiques + articles + villes seules (max 15k URLs)
  // Sitemaps 1+: combinaisons ville × article

  const staticAndArticlesUrls = 2 + totalArticles + Math.min(citiesCount, 10000); // home + blog + articles + top villes
  const cityArticleCombinations = citiesCount * totalArticles;

  // Premier sitemap pour contenu principal
  const sitemaps = [{ id: 0 }];

  // Sitemaps additionnels pour les combinaisons ville × article
  // On limite aux top 5000 villes pour rester raisonnable (5000 × 300 articles = 1.5M pages)
  const topCitiesForCombinations = 5000;
  const combinationsToIndex = topCitiesForCombinations * totalArticles;
  const additionalSitemaps = Math.ceil(combinationsToIndex / URLS_PER_SITEMAP);

  for (let i = 1; i <= additionalSitemaps; i++) {
    sitemaps.push({ id: i });
  }

  return sitemaps;
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
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

  const baseUrl = `https://${site.domain}`;
  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Sitemap 0: Pages principales
  if (id === 0) {
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
    const { data: articles } = await supabase
      .from("articles")
      .select("slug, updated_at")
      .eq("site_id", site.id)
      .eq("status", "published")
      .order("published_at", { ascending: false });

    articles?.forEach((article) => {
      sitemapEntries.push({
        url: `${baseUrl}/blog/${article.slug}`,
        lastModified: new Date(article.updated_at || Date.now()),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    });

    // Pages villes seules (top 10,000)
    const topCities = getTopCitiesByPopulation(10000);
    topCities.forEach((city) => {
      sitemapEntries.push({
        url: `${baseUrl}/ville/${city.nom_sans_accent}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    });

    return sitemapEntries;
  }

  // Sitemaps 1+: Combinaisons ville × article
  const { data: articles } = await supabase
    .from("articles")
    .select("slug")
    .eq("site_id", site.id)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (!articles || articles.length === 0) {
    return [];
  }

  // Top 5000 villes pour les combinaisons
  const topCities = getTopCitiesByPopulation(5000);
  const totalCombinations = topCities.length * articles.length;

  // Calculer l'offset pour ce sitemap
  const startIndex = (id - 1) * URLS_PER_SITEMAP;
  const endIndex = Math.min(startIndex + URLS_PER_SITEMAP, totalCombinations);

  // Générer les URLs pour cette tranche
  for (let i = startIndex; i < endIndex; i++) {
    const cityIndex = Math.floor(i / articles.length);
    const articleIndex = i % articles.length;

    if (cityIndex < topCities.length && articleIndex < articles.length) {
      const city = topCities[cityIndex];
      const article = articles[articleIndex];

      sitemapEntries.push({
        url: `${baseUrl}/ville/${city.nom_sans_accent}/${article.slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.4,
      });
    }
  }

  return sitemapEntries;
}
