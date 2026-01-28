"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateArticle } from "@/lib/openai";
import { searchUnsplashImage } from "@/lib/unsplash";
import type { Article, ArticleStatus, Json } from "@/types/database";

interface ArticleWithKeyword extends Article {
  keyword?: {
    id: string;
    keyword: string;
  };
  site?: {
    id: string;
    name: string;
    domain: string;
  };
}

export async function getArticles(filters?: {
  siteId?: string;
  status?: ArticleStatus;
  search?: string;
}): Promise<{ data: ArticleWithKeyword[]; error?: string }> {
  const supabase = await createClient();

  let query = supabase
    .from("articles")
    .select("*, keyword:keywords(id, keyword), site:sites(id, name, domain)")
    .order("created_at", { ascending: false });

  if (filters?.siteId) {
    query = query.eq("site_id", filters.siteId);
  }

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return { error: error.message, data: [] };
  }

  return { data: (data as ArticleWithKeyword[]) || [] };
}

export async function getArticleStats(siteId?: string): Promise<{
  total: number;
  draft: number;
  ready: number;
  published: number;
  unpublished: number;
}> {
  const supabase = await createClient();

  let baseQuery = supabase.from("articles").select("status");

  if (siteId) {
    baseQuery = baseQuery.eq("site_id", siteId);
  }

  const { data } = await baseQuery;

  const stats = {
    total: data?.length || 0,
    draft: 0,
    ready: 0,
    published: 0,
    unpublished: 0,
  };

  data?.forEach((a) => {
    const status = a.status as ArticleStatus;
    if (status && status in stats) {
      stats[status as keyof typeof stats]++;
    }
  });

  return stats;
}

export async function generateArticleFromKeyword(
  keywordId: string
): Promise<{ data?: Article; error?: string }> {
  const supabase = await createClient();

  // Récupérer le mot-clé avec cluster et site_key
  const { data: keyword, error: keywordError } = await supabase
    .from("keywords")
    .select("*, site:sites(id, name, domain)")
    .eq("id", keywordId)
    .single();

  if (keywordError || !keyword) {
    return { error: "Mot-clé non trouvé" };
  }

  // Mettre à jour le statut du mot-clé
  await supabase
    .from("keywords")
    .update({ status: "generating" })
    .eq("id", keywordId);

  // Vérifier que le mot-clé a un site_id (obligatoire pour créer un article)
  if (!keyword.site_id) {
    return { error: "Le mot-clé doit être associé à un site pour générer un article" };
  }

  try {
    // Générer l'article avec OpenAI (passer le cluster ou site_key pour les CTA)
    const cluster = keyword.cluster || keyword.site_key || undefined;
    const generated = await generateArticle(keyword.keyword, cluster);

    // Rechercher une image sur Unsplash
    const image = await searchUnsplashImage(keyword.keyword);

    // Créer l'article
    const { data: article, error: articleError } = await supabase
      .from("articles")
      .insert({
        site_id: keyword.site_id,
        keyword_id: keywordId,
        title: generated.title,
        slug: generated.slug,
        content: generated.content,
        summary: generated.summary,
        faq: generated.faq as unknown as Json,
        image_url: image?.url || null,
        image_alt: image?.alt || null,
        status: "draft",
      })
      .select()
      .single();

    if (articleError) {
      // Remettre le mot-clé en pending en cas d'erreur
      await supabase
        .from("keywords")
        .update({ status: "pending" })
        .eq("id", keywordId);
      return { error: articleError.message };
    }

    // Mettre à jour le statut du mot-clé
    await supabase
      .from("keywords")
      .update({ status: "generated" })
      .eq("id", keywordId);

    // Logger l'activité
    await supabase.from("activity_logs").insert({
      site_id: keyword.site_id,
      type: "article_generated",
      message: `Article généré: ${generated.title}`,
      metadata: { article_id: article.id, keyword: keyword.keyword } as unknown as Json,
    });

    revalidatePath("/admin/keywords");
    revalidatePath("/admin/articles");

    return { data: article as Article };
  } catch (error) {
    // Remettre le mot-clé en pending en cas d'erreur
    await supabase
      .from("keywords")
      .update({ status: "pending" })
      .eq("id", keywordId);

    const message = error instanceof Error ? error.message : "Erreur de génération";
    return { error: message };
  }
}

export async function updateArticleStatus(
  id: string,
  status: ArticleStatus
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const updateData: { status: ArticleStatus; published_at?: string | null } = { status };

  if (status === "published") {
    updateData.published_at = new Date().toISOString();

    // Mettre à jour le mot-clé associé
    const { data: article } = await supabase
      .from("articles")
      .select("keyword_id")
      .eq("id", id)
      .single();

    if (article?.keyword_id) {
      await supabase
        .from("keywords")
        .update({ status: "published" })
        .eq("id", article.keyword_id);
    }
  }

  const { error } = await supabase
    .from("articles")
    .update(updateData)
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/articles");
  revalidatePath("/admin/keywords");

  // Revalider les pages publiques du blog si publication
  if (status === "published") {
    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath("/blog/[slug]", "page");
  }

  return { success: true };
}

// Mise à jour groupée du statut de plusieurs articles
export async function bulkUpdateArticleStatus(
  ids: string[],
  status: ArticleStatus
): Promise<{ success: boolean; count: number; error?: string }> {
  if (ids.length === 0) {
    return { success: false, count: 0, error: "Aucun article sélectionné" };
  }

  const supabase = await createClient();

  const updateData: { status: ArticleStatus; published_at?: string | null } = { status };

  if (status === "published") {
    updateData.published_at = new Date().toISOString();
  }

  // Mettre à jour tous les articles
  const { error } = await supabase
    .from("articles")
    .update(updateData)
    .in("id", ids);

  if (error) {
    return { success: false, count: 0, error: error.message };
  }

  // Si publication, mettre à jour les mots-clés associés
  if (status === "published") {
    const { data: articles } = await supabase
      .from("articles")
      .select("keyword_id")
      .in("id", ids);

    const keywordIds = articles
      ?.map((a) => a.keyword_id)
      .filter((id): id is string => id !== null);

    if (keywordIds && keywordIds.length > 0) {
      await supabase
        .from("keywords")
        .update({ status: "published" })
        .in("id", keywordIds);
    }

    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath("/blog/[slug]", "page");
  }

  revalidatePath("/admin/articles");
  revalidatePath("/admin/keywords");

  return { success: true, count: ids.length };
}

// Suppression groupée de plusieurs articles
export async function bulkDeleteArticles(
  ids: string[]
): Promise<{ success: boolean; count: number; error?: string }> {
  if (ids.length === 0) {
    return { success: false, count: 0, error: "Aucun article sélectionné" };
  }

  const supabase = await createClient();

  // Récupérer les keyword_ids pour les remettre en pending
  const { data: articles } = await supabase
    .from("articles")
    .select("keyword_id, status")
    .in("id", ids);

  const keywordIds = articles
    ?.map((a) => a.keyword_id)
    .filter((id): id is string => id !== null);

  // Supprimer les articles
  const { error } = await supabase.from("articles").delete().in("id", ids);

  if (error) {
    return { success: false, count: 0, error: error.message };
  }

  // Remettre les mots-clés en pending
  if (keywordIds && keywordIds.length > 0) {
    await supabase
      .from("keywords")
      .update({ status: "pending" })
      .in("id", keywordIds);
  }

  // Revalider si des articles étaient publiés
  const hadPublished = articles?.some((a) => a.status === "published");
  if (hadPublished) {
    revalidatePath("/");
    revalidatePath("/blog");
  }

  revalidatePath("/admin/articles");
  revalidatePath("/admin/keywords");

  return { success: true, count: ids.length };
}

export async function updateArticle(
  id: string,
  data: {
    title?: string;
    content?: string;
    summary?: string;
    faq?: { question: string; answer: string }[];
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Vérifier si l'article est publié
  const { data: existing } = await supabase
    .from("articles")
    .select("status, slug")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("articles")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/articles");

  // Revalider les pages publiques si article publié
  if (existing?.status === "published") {
    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath(`/blog/${existing.slug}`);
  }

  return { success: true };
}

export async function deleteArticle(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Récupérer l'article pour remettre le keyword en pending et revalider
  const { data: article } = await supabase
    .from("articles")
    .select("keyword_id, status, slug")
    .eq("id", id)
    .single();

  if (article?.keyword_id) {
    await supabase
      .from("keywords")
      .update({ status: "pending" })
      .eq("id", article.keyword_id);
  }

  const { error } = await supabase.from("articles").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/articles");
  revalidatePath("/admin/keywords");

  // Revalider les pages publiques si article était publié
  if (article?.status === "published") {
    revalidatePath("/");
    revalidatePath("/blog");
  }

  return { success: true };
}

export async function getArticleById(
  id: string
): Promise<{ data?: ArticleWithKeyword; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("articles")
    .select("*, keyword:keywords(id, keyword), site:sites(id, name, domain)")
    .eq("id", id)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data: data as ArticleWithKeyword };
}

// Générer un slug à partir d'un titre
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprimer les accents
    .replace(/[^a-z0-9\s-]/g, "") // Supprimer caractères spéciaux
    .replace(/\s+/g, "-") // Espaces en tirets
    .replace(/-+/g, "-") // Tirets multiples en simple
    .replace(/^-|-$/g, "") // Supprimer tirets début/fin
    .substring(0, 100); // Limiter la longueur
}

// Créer un article manuellement
export async function createManualArticle(data: {
  siteId: string;
  title: string;
  content: string;
  summary?: string;
  faq?: { question: string; answer: string }[];
  imageUrl?: string;
  imageAlt?: string;
}): Promise<{ data?: Article; error?: string }> {
  const supabase = await createClient();

  const slug = generateSlug(data.title);

  // Vérifier que le slug est unique pour ce site
  const { data: existing } = await supabase
    .from("articles")
    .select("id")
    .eq("site_id", data.siteId)
    .eq("slug", slug)
    .single();

  const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

  const { data: article, error } = await supabase
    .from("articles")
    .insert({
      site_id: data.siteId,
      title: data.title,
      slug: finalSlug,
      content: data.content,
      summary: data.summary || null,
      faq: (data.faq as unknown as Json) || null,
      image_url: data.imageUrl || null,
      image_alt: data.imageAlt || null,
      status: "draft",
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // Logger l'activité
  await supabase.from("activity_logs").insert({
    site_id: data.siteId,
    type: "article_generated",
    message: `Article créé manuellement: ${data.title}`,
    metadata: { article_id: article.id } as unknown as Json,
  });

  revalidatePath("/admin/articles");
  return { data: article as Article };
}

// Générer un article IA à partir d'un topic libre (pour un site spécifique)
export async function generateArticleFromTopic(
  siteId: string,
  topic: string
): Promise<{ data?: Article; error?: string }> {
  const supabase = await createClient();

  try {
    // Générer l'article avec OpenAI
    const generated = await generateArticle(topic);

    // Rechercher une image sur Unsplash
    const image = await searchUnsplashImage(topic);

    // Vérifier que le slug est unique pour ce site
    const { data: existing } = await supabase
      .from("articles")
      .select("id")
      .eq("site_id", siteId)
      .eq("slug", generated.slug)
      .single();

    const finalSlug = existing ? `${generated.slug}-${Date.now()}` : generated.slug;

    // Créer l'article
    const { data: article, error: articleError } = await supabase
      .from("articles")
      .insert({
        site_id: siteId,
        title: generated.title,
        slug: finalSlug,
        content: generated.content,
        summary: generated.summary,
        faq: generated.faq as unknown as Json,
        image_url: image?.url || null,
        image_alt: image?.alt || null,
        status: "draft",
      })
      .select()
      .single();

    if (articleError) {
      return { error: articleError.message };
    }

    // Logger l'activité
    await supabase.from("activity_logs").insert({
      site_id: siteId,
      type: "article_generated",
      message: `Article IA généré: ${generated.title}`,
      metadata: { article_id: article.id, topic } as unknown as Json,
    });

    revalidatePath("/admin/articles");
    return { data: article as Article };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur de génération";
    return { error: message };
  }
}
