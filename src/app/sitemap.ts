import { MetadataRoute } from "next";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getTopCitiesByPopulation } from "@/lib/cities";

// Nombre max d'URLs par sitemap (Google limite à 50,000)
const URLS_PER_SITEMAP = 45000;

// Nombre de villes pour les combinaisons (5000 villes × ~300 articles = ~1.5M pages)
const TOP_CITIES_FOR_COMBINATIONS = 5000;

// Estimation du nombre max de sitemaps nécessaires
// 5000 villes × 500 articles max / 45000 = ~56 sitemaps
const MAX_SITEMAPS = 60;

/**
 * Génère la liste des sitemaps pour le sitemap index
 * Note: Ne peut pas utiliser headers() ici car exécuté au build time
 */
export async function generateSitemaps() {
  // Générer un nombre fixe de sitemaps
  // Le sitemap 0 contiendra les pages principales
  // Les sitemaps 1+ contiendront les combinaisons ville × article
  const sitemaps = [];
  for (let i = 0; i <= MAX_SITEMAPS; i++) {
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

  // Top villes pour les combinaisons
  const topCities = getTopCitiesByPopulation(TOP_CITIES_FOR_COMBINATIONS);
  const totalCombinations = topCities.length * articles.length;

  // Calculer l'offset pour ce sitemap
  const startIndex = (id - 1) * URLS_PER_SITEMAP;
  const endIndex = Math.min(startIndex + URLS_PER_SITEMAP, totalCombinations);

  // Si cet index dépasse le total, retourner vide
  if (startIndex >= totalCombinations) {
    return [];
  }

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
