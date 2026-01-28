import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  // Récupérer tous les sites et leurs articles publiés
  const { data: sites } = await supabase
    .from("sites")
    .select("domain");

  const { data: articles } = await supabase
    .from("articles")
    .select("slug, updated_at, site:sites(domain)")
    .eq("status", "published");

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Ajouter les pages principales pour chaque site
  sites?.forEach((site) => {
    sitemapEntries.push({
      url: `https://${site.domain}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    });

    sitemapEntries.push({
      url: `https://${site.domain}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    });
  });

  // Ajouter les articles
  articles?.forEach((article) => {
    const site = article.site as { domain: string } | null;
    if (site?.domain) {
      sitemapEntries.push({
        url: `https://${site.domain}/blog/${article.slug}`,
        lastModified: new Date(article.updated_at || Date.now()),
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  });

  return sitemapEntries;
}
