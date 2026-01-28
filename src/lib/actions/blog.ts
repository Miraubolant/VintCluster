"use server";

import { createPublicClient } from "@/lib/supabase/server";
import type { Site, FAQItem } from "@/types/database";
import { unstable_cache } from "next/cache";

export interface PublicArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string | null;
  image_url: string | null;
  image_alt: string | null;
  faq: FAQItem[];
  published_at: string;
  site: {
    name: string;
    domain: string;
    primary_color: string;
    secondary_color: string;
  };
}

// Récupérer le site par domaine (avec cache)
export const getSiteByDomain = unstable_cache(
  async (domain: string): Promise<Site | null> => {
    const supabase = createPublicClient();

    const { data, error } = await supabase
      .from("sites")
      .select("*")
      .eq("domain", domain)
      .single();

    if (error || !data) {
      return null;
    }

    return data as Site;
  },
  ["site-by-domain"],
  { revalidate: 3600, tags: ["sites"] }
);

// Récupérer les articles publiés d'un site (avec cache)
export const getPublishedArticles = unstable_cache(
  async (
    siteId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<PublicArticle[]> => {
    const supabase = createPublicClient();

    const { data, error } = await supabase
      .from("articles")
      .select("*, site:sites(name, domain, primary_color, secondary_color)")
      .eq("site_id", siteId)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error || !data) {
      return [];
    }

    return data.map((article) => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      content: article.content,
      summary: article.summary,
      image_url: article.image_url,
      image_alt: article.image_alt,
      faq: (article.faq as unknown as FAQItem[]) || [],
      published_at: article.published_at || article.created_at || "",
      site: article.site as PublicArticle["site"],
    }));
  },
  ["published-articles"],
  { revalidate: 60, tags: ["articles"] }
);

// Récupérer un article par slug (avec cache)
export const getArticleBySlug = unstable_cache(
  async (siteId: string, slug: string): Promise<PublicArticle | null> => {
    const supabase = createPublicClient();

    const { data, error } = await supabase
      .from("articles")
      .select("*, site:sites(name, domain, primary_color, secondary_color)")
      .eq("site_id", siteId)
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      slug: data.slug,
      content: data.content,
      summary: data.summary,
      image_url: data.image_url,
      image_alt: data.image_alt,
      faq: (data.faq as unknown as FAQItem[]) || [],
      published_at: data.published_at || data.created_at || "",
      site: data.site as PublicArticle["site"],
    };
  },
  ["article-by-slug"],
  { revalidate: 60, tags: ["articles"] }
);

// Compter les articles publiés
export const getPublishedArticlesCount = unstable_cache(
  async (siteId: string): Promise<number> => {
    const supabase = createPublicClient();

    const { count, error } = await supabase
      .from("articles")
      .select("*", { count: "exact", head: true })
      .eq("site_id", siteId)
      .eq("status", "published");

    if (error) {
      return 0;
    }

    return count || 0;
  },
  ["published-articles-count"],
  { revalidate: 60, tags: ["articles"] }
);

// Récupérer les slugs pour generateStaticParams
export async function getAllArticleSlugs(
  siteId: string
): Promise<{ slug: string }[]> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("articles")
    .select("slug")
    .eq("site_id", siteId)
    .eq("status", "published");

  if (error || !data) {
    return [];
  }

  return data.map((a) => ({ slug: a.slug }));
}
