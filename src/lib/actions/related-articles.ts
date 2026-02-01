"use server";

import { createClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";

export interface RelatedArticleResult {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string | null;
  image_url: string | null;
  image_alt: string | null;
  published_at: string;
  updated_at: string | null;
  faq: { question: string; answer: string }[];
  score: number;
  reason: string;
}

/**
 * Récupère les articles connexes d'un article donné
 * Utilise les relations pré-calculées ou calcule à la volée
 */
export async function getRelatedArticles(
  articleId: string,
  limit: number = 3
): Promise<RelatedArticleResult[]> {
  const supabase = await createClient();

  // D'abord, essayer de récupérer les relations pré-calculées
  const { data: precomputed } = await supabase
    .from("related_articles")
    .select(`
      score,
      reason,
      related:related_article_id(
        id,
        title,
        slug,
        content,
        summary,
        image_url,
        image_alt,
        published_at,
        updated_at,
        faq,
        status
      )
    `)
    .eq("article_id", articleId)
    .order("score", { ascending: false })
    .limit(limit);

  if (precomputed && precomputed.length > 0) {
    return precomputed
      .filter((r) => {
        const related = r.related as unknown as { status: string } | null;
        return related && related.status === "published";
      })
      .map((r) => {
        const related = r.related as unknown as {
          id: string;
          title: string;
          slug: string;
          content: string;
          summary: string | null;
          image_url: string | null;
          image_alt: string | null;
          published_at: string;
          updated_at: string | null;
          faq: { question: string; answer: string }[] | null;
        };
        return {
          id: related.id,
          title: related.title,
          slug: related.slug,
          content: related.content,
          summary: related.summary,
          image_url: related.image_url,
          image_alt: related.image_alt,
          published_at: related.published_at,
          updated_at: related.updated_at,
          faq: related.faq || [],
          score: Number(r.score) || 0,
          reason: r.reason || "related",
        };
      });
  }

  // Sinon, calculer à la volée et retourner les résultats
  return computeRelatedArticlesOnTheFly(articleId, limit);
}

/**
 * Calcul à la volée des articles connexes
 * Utilisé quand les relations ne sont pas pré-calculées
 */
async function computeRelatedArticlesOnTheFly(
  articleId: string,
  limit: number
): Promise<RelatedArticleResult[]> {
  const supabase = await createClient();

  // Récupérer l'article source avec son keyword
  const { data: sourceArticle } = await supabase
    .from("articles")
    .select(`
      id,
      site_id,
      title,
      keyword:keywords(
        keyword,
        cluster,
        site_key
      )
    `)
    .eq("id", articleId)
    .single();

  if (!sourceArticle) {
    return [];
  }

  const keyword = sourceArticle.keyword as { keyword: string; cluster: string | null; site_key: string | null } | null;

  // Récupérer les autres articles publiés du même site
  const { data: candidates } = await supabase
    .from("articles")
    .select(`
      id,
      title,
      slug,
      content,
      summary,
      image_url,
      image_alt,
      published_at,
      updated_at,
      faq,
      keyword:keywords(
        keyword,
        cluster,
        site_key
      )
    `)
    .eq("site_id", sourceArticle.site_id)
    .eq("status", "published")
    .neq("id", articleId)
    .order("published_at", { ascending: false })
    .limit(20); // Prendre plus de candidats pour avoir du choix

  if (!candidates || candidates.length === 0) {
    return [];
  }

  // Calculer les scores de pertinence
  const scored = candidates.map((candidate) => {
    const candidateKeyword = candidate.keyword as { keyword: string; cluster: string | null; site_key: string | null } | null;
    let score = 0;
    const reasons: string[] = [];

    // Score basé sur le cluster (+40 pts)
    if (keyword?.cluster && candidateKeyword?.cluster && keyword.cluster === candidateKeyword.cluster) {
      score += 40;
      reasons.push("même cluster");
    }

    // Score basé sur le site_key (+20 pts)
    if (keyword?.site_key && candidateKeyword?.site_key && keyword.site_key === candidateKeyword.site_key) {
      score += 20;
      reasons.push("même catégorie");
    }

    // Score basé sur la similarité du mot-clé (+30 pts)
    if (keyword?.keyword && candidateKeyword?.keyword) {
      const similarity = calculateWordOverlap(keyword.keyword, candidateKeyword.keyword);
      score += Math.round(similarity * 30);
      if (similarity > 0.3) {
        reasons.push("mots-clés similaires");
      }
    }

    // Bonus de récence (+10 pts si publié dans les 30 derniers jours)
    if (candidate.published_at) {
      const publishedDate = new Date(candidate.published_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (publishedDate > thirtyDaysAgo) {
        score += 10;
        reasons.push("récent");
      }
    }

    return {
      ...candidate,
      score,
      reason: reasons.length > 0 ? reasons.join(", ") : "contenu connexe",
    };
  });

  // Trier par score et prendre les meilleurs
  const sorted = scored
    .filter((a) => a.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  // Si pas assez de résultats avec score > 0, compléter avec les plus récents
  if (sorted.length < limit) {
    const remaining = candidates
      .filter((c) => !sorted.find((s) => s.id === c.id))
      .slice(0, limit - sorted.length)
      .map((c) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        content: c.content,
        summary: c.summary,
        image_url: c.image_url,
        image_alt: c.image_alt,
        published_at: c.published_at,
        updated_at: c.updated_at,
        faq: c.faq,
        keyword: c.keyword,
        score: 5,
        reason: "récent",
      }));
    sorted.push(...remaining);
  }

  return sorted.map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    content: a.content,
    summary: a.summary,
    image_url: a.image_url,
    image_alt: a.image_alt,
    published_at: a.published_at,
    updated_at: a.updated_at,
    faq: (a.faq as { question: string; answer: string }[] | null) || [],
    score: a.score,
    reason: a.reason,
  }));
}

/**
 * Calcule le pourcentage de mots en commun entre deux strings
 */
function calculateWordOverlap(str1: string, str2: string): number {
  const words1 = new Set(
    str1
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3)
  );
  const words2 = new Set(
    str2
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3)
  );

  if (words1.size === 0 || words2.size === 0) return 0;

  let overlap = 0;
  words1.forEach((word) => {
    if (words2.has(word)) overlap++;
  });

  return overlap / Math.min(words1.size, words2.size);
}

/**
 * Calcule et stocke les articles connexes pour un article
 * Appelé après la publication d'un article
 */
export async function computeAndStoreRelatedArticles(articleId: string): Promise<void> {
  const supabase = await createClient();

  // Calculer les articles connexes
  const related = await computeRelatedArticlesOnTheFly(articleId, 10);

  if (related.length === 0) return;

  // Supprimer les anciennes relations
  await supabase
    .from("related_articles")
    .delete()
    .eq("article_id", articleId);

  // Insérer les nouvelles relations
  const inserts = related.map((r) => ({
    article_id: articleId,
    related_article_id: r.id,
    score: r.score,
    reason: r.reason,
  }));

  await supabase.from("related_articles").insert(inserts);
}

/**
 * Recalcule les articles connexes pour tous les articles d'un site
 */
export async function recomputeSiteRelatedArticles(siteId: string): Promise<number> {
  const supabase = await createClient();

  // Récupérer tous les articles publiés du site
  const { data: articles } = await supabase
    .from("articles")
    .select("id")
    .eq("site_id", siteId)
    .eq("status", "published");

  if (!articles) return 0;

  let processed = 0;
  for (const article of articles) {
    await computeAndStoreRelatedArticles(article.id);
    processed++;
  }

  return processed;
}

/**
 * Version cachée de getRelatedArticles pour les pages publiques
 */
export const getCachedRelatedArticles = unstable_cache(
  async (articleId: string, limit: number = 3) => {
    return getRelatedArticles(articleId, limit);
  },
  ["related-articles"],
  { revalidate: 3600, tags: ["articles"] } // Cache 1h
);
