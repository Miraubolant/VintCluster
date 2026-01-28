"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateArticle } from "@/lib/openai";
import { generateImage, generateImagePrompt } from "@/lib/replicate";
import type { SchedulerConfig, Json } from "@/types/database";

interface SchedulerConfigWithSite extends SchedulerConfig {
  site?: {
    id: string;
    name: string;
    domain: string;
  };
}

export async function getSchedulerConfigs(): Promise<{
  data: SchedulerConfigWithSite[];
  error?: string;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("scheduler_config")
    .select("*, site:sites(id, name, domain)")
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message, data: [] };
  }

  return { data: (data as SchedulerConfigWithSite[]) || [] };
}

export async function getSchedulerConfigBySiteId(
  siteId: string
): Promise<{ data?: SchedulerConfig; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("scheduler_config")
    .select("*")
    .eq("site_id", siteId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows returned
    return { error: error.message };
  }

  return { data: data as SchedulerConfig | undefined };
}

export async function upsertSchedulerConfig(
  siteId: string,
  config: {
    enabled: boolean;
    auto_publish: boolean;
    max_per_day: number;
    max_per_week: number;
    days_of_week: number[];
    publish_hours: number[];
    keyword_ids: string[];
  }
): Promise<{ data?: SchedulerConfig; error?: string }> {
  const supabase = await createClient();

  // Vérifier si une config existe déjà
  const { data: existing } = await supabase
    .from("scheduler_config")
    .select("id")
    .eq("site_id", siteId)
    .single();

  let result;

  if (existing) {
    // Update
    result = await supabase
      .from("scheduler_config")
      .update({
        enabled: config.enabled,
        auto_publish: config.auto_publish,
        max_per_day: config.max_per_day,
        max_per_week: config.max_per_week,
        days_of_week: config.days_of_week,
        publish_hours: config.publish_hours,
        keyword_ids: config.keyword_ids,
        updated_at: new Date().toISOString(),
      })
      .eq("site_id", siteId)
      .select()
      .single();
  } else {
    // Insert
    result = await supabase
      .from("scheduler_config")
      .insert({
        site_id: siteId,
        enabled: config.enabled,
        auto_publish: config.auto_publish,
        max_per_day: config.max_per_day,
        max_per_week: config.max_per_week,
        days_of_week: config.days_of_week,
        publish_hours: config.publish_hours,
        keyword_ids: config.keyword_ids,
      })
      .select()
      .single();
  }

  if (result.error) {
    return { error: result.error.message };
  }

  revalidatePath("/admin/scheduler");
  return { data: result.data as SchedulerConfig };
}

export async function toggleSchedulerEnabled(
  siteId: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("scheduler_config")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("site_id", siteId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/scheduler");
  return { success: true };
}

// Récupérer les mots-clés disponibles (pending) pour la sélection
export async function getAvailableKeywordsForScheduler(siteId?: string): Promise<{
  data: Array<{ id: string; keyword: string; status: string | null; site_id: string | null; cluster: string | null; priority: number | null }>;
  error?: string;
}> {
  const supabase = await createClient();

  // Récupérer tous les keywords pending (du site spécifique + globaux)
  let query = supabase
    .from("keywords")
    .select("id, keyword, status, site_id, cluster, priority")
    .eq("status", "pending")
    .order("priority", { ascending: false })
    .order("keyword", { ascending: true });

  // Si un siteId est fourni, on filtre les keywords du site + les globaux
  if (siteId) {
    query = query.or(`site_id.eq.${siteId},site_id.is.null`);
  }

  const { data, error } = await query;

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data || [] };
}

// Statistiques pour le dashboard scheduler
export async function getSchedulerStats(): Promise<{
  totalConfigs: number;
  enabledConfigs: number;
  pendingKeywords: number;
  articlesToday: number;
}> {
  const supabase = await createClient();

  const [configsResult, keywordsResult, articlesResult] = await Promise.all([
    supabase.from("scheduler_config").select("enabled"),
    supabase.from("keywords").select("id").eq("status", "pending"),
    supabase
      .from("articles")
      .select("id")
      .gte("created_at", new Date().toISOString().split("T")[0]),
  ]);

  const configs = configsResult.data || [];
  const enabledCount = configs.filter((c) => c.enabled).length;

  return {
    totalConfigs: configs.length,
    enabledConfigs: enabledCount,
    pendingKeywords: keywordsResult.data?.length || 0,
    articlesToday: articlesResult.data?.length || 0,
  };
}

// Lancer manuellement une génération pour un scheduler
export async function runSchedulerManually(
  siteId: string
): Promise<{ success: boolean; articleTitle?: string; error?: string }> {
  const supabase = await createClient();

  // Récupérer la config du scheduler
  const { data: config, error: configError } = await supabase
    .from("scheduler_config")
    .select("*")
    .eq("site_id", siteId)
    .single();

  if (configError || !config) {
    return { success: false, error: "Configuration non trouvée" };
  }

  // Vérifier les limites quotidiennes
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count: todayCount } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true })
    .eq("site_id", siteId)
    .gte("created_at", todayStart.toISOString());

  if ((todayCount || 0) >= (config.max_per_day || 5)) {
    return { success: false, error: "Limite quotidienne atteinte" };
  }

  // Récupérer les keyword_ids configurés
  const keywordIds = (config.keyword_ids as string[]) || [];

  if (keywordIds.length === 0) {
    return { success: false, error: "Aucun mot-clé sélectionné dans la configuration" };
  }

  // Récupérer un mot-clé pending parmi ceux sélectionnés
  const { data: keyword, error: keywordError } = await supabase
    .from("keywords")
    .select("*")
    .in("id", keywordIds)
    .eq("status", "pending")
    .order("priority", { ascending: false })
    .limit(1)
    .single();

  if (keywordError || !keyword) {
    return { success: false, error: "Aucun mot-clé disponible (tous déjà utilisés)" };
  }

  // Mettre à jour le statut du mot-clé
  await supabase
    .from("keywords")
    .update({ status: "generating" })
    .eq("id", keyword.id);

  try {
    // Générer l'article avec OpenAI
    const cluster = keyword.cluster || keyword.site_key || undefined;
    const generated = await generateArticle(keyword.keyword, cluster);

    // Générer une image avec Replicate (FLUX Schnell)
    let imageUrl: string | null = null;
    let imageAlt: string | null = null;
    let imageGenerated = false;

    try {
      const imagePrompt = generateImagePrompt(generated.title, keyword.keyword);
      const image = await generateImage(imagePrompt, "flux-schnell", siteId);
      if (image) {
        imageUrl = image.url;
        imageAlt = image.alt;
        imageGenerated = true;
      }
    } catch (imageError) {
      console.error("Image generation failed:", imageError);
    }

    // Créer l'article
    const { data: article, error: articleError } = await supabase
      .from("articles")
      .insert({
        site_id: siteId,
        keyword_id: keyword.id,
        title: generated.title,
        slug: generated.slug,
        content: generated.content,
        summary: generated.summary,
        faq: generated.faq as unknown as Json,
        image_url: imageUrl,
        image_alt: imageAlt,
        status: config.auto_publish ? "published" : "draft",
        published_at: config.auto_publish ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (articleError) {
      await supabase
        .from("keywords")
        .update({ status: "pending" })
        .eq("id", keyword.id);
      return { success: false, error: articleError.message };
    }

    // Mettre à jour le statut du mot-clé
    await supabase
      .from("keywords")
      .update({ status: config.auto_publish ? "published" : "generated" })
      .eq("id", keyword.id);

    // Logger l'activité
    await supabase.from("activity_logs").insert({
      site_id: siteId,
      type: "article_generated",
      message: `Article généré manuellement: ${generated.title}`,
      metadata: {
        article_id: article.id,
        keyword: keyword.keyword,
        cluster: cluster || null,
        auto_published: config.auto_publish,
        image_generated: imageGenerated,
        manual_trigger: true,
      } as unknown as Json,
    });

    revalidatePath("/admin/scheduler");
    revalidatePath("/admin/articles");
    revalidatePath("/admin/keywords");

    return { success: true, articleTitle: generated.title };
  } catch (error) {
    await supabase
      .from("keywords")
      .update({ status: "pending" })
      .eq("id", keyword.id);

    const message = error instanceof Error ? error.message : "Erreur de génération";
    return { success: false, error: message };
  }
}

// Préparer les données pour la génération en masse
export async function prepareBulkGeneration(
  siteIds: string[],
  totalArticles: number
): Promise<{
  tasks: Array<{ siteId: string; siteName: string; keywordIds: string[]; autoPublish: boolean; count: number }>;
  errors: string[];
}> {
  if (siteIds.length === 0 || totalArticles <= 0) {
    return { tasks: [], errors: ["Paramètres invalides"] };
  }

  const supabase = await createClient();
  const articlesPerConfig = Math.floor(totalArticles / siteIds.length);
  const remainder = totalArticles % siteIds.length;

  const tasks: Array<{ siteId: string; siteName: string; keywordIds: string[]; autoPublish: boolean; count: number }> = [];
  const errors: string[] = [];

  for (let i = 0; i < siteIds.length; i++) {
    const siteId = siteIds[i];
    const articlesToGenerate = articlesPerConfig + (i < remainder ? 1 : 0);

    const { data: config } = await supabase
      .from("scheduler_config")
      .select("*, site:sites(id, name)")
      .eq("site_id", siteId)
      .single();

    if (!config) {
      errors.push(`Configuration non trouvée pour le site ${siteId}`);
      continue;
    }

    const siteName = (config.site as { name: string } | null)?.name || "Site inconnu";
    const keywordIds = (config.keyword_ids as string[]) || [];

    if (keywordIds.length === 0) {
      errors.push(`${siteName}: Aucun mot-clé sélectionné`);
      continue;
    }

    tasks.push({
      siteId,
      siteName,
      keywordIds,
      autoPublish: config.auto_publish || false,
      count: articlesToGenerate,
    });
  }

  return { tasks, errors };
}

// Générer un seul article pour la génération en masse
export async function generateSingleBulkArticle(
  siteId: string,
  keywordIds: string[],
  autoPublish: boolean
): Promise<{
  success: boolean;
  title?: string;
  error?: string;
}> {
  const supabase = await createClient();

  // Récupérer un mot-clé pending
  const { data: keyword } = await supabase
    .from("keywords")
    .select("*")
    .in("id", keywordIds)
    .eq("status", "pending")
    .order("priority", { ascending: false })
    .limit(1)
    .single();

  if (!keyword) {
    return { success: false, error: "Plus de mots-clés disponibles" };
  }

  // Marquer le mot-clé comme en cours
  await supabase
    .from("keywords")
    .update({ status: "generating" })
    .eq("id", keyword.id);

  try {
    // Générer l'article
    const cluster = keyword.cluster || keyword.site_key || undefined;
    const generated = await generateArticle(keyword.keyword, cluster);

    // Générer l'image
    let imageUrl: string | null = null;
    let imageAlt: string | null = null;

    try {
      const imagePrompt = generateImagePrompt(generated.title, keyword.keyword);
      const image = await generateImage(imagePrompt, "flux-schnell", siteId);
      if (image) {
        imageUrl = image.url;
        imageAlt = image.alt;
      }
    } catch {
      // Continue sans image
    }

    // Créer l'article
    const { error: articleError } = await supabase
      .from("articles")
      .insert({
        site_id: siteId,
        keyword_id: keyword.id,
        title: generated.title,
        slug: generated.slug,
        content: generated.content,
        summary: generated.summary,
        faq: generated.faq as unknown as Json,
        image_url: imageUrl,
        image_alt: imageAlt,
        status: autoPublish ? "published" : "draft",
        published_at: autoPublish ? new Date().toISOString() : null,
      });

    if (articleError) {
      await supabase
        .from("keywords")
        .update({ status: "pending" })
        .eq("id", keyword.id);
      return { success: false, error: articleError.message };
    }

    // Mettre à jour le mot-clé
    await supabase
      .from("keywords")
      .update({ status: autoPublish ? "published" : "generated" })
      .eq("id", keyword.id);

    return { success: true, title: generated.title };
  } catch (error) {
    await supabase
      .from("keywords")
      .update({ status: "pending" })
      .eq("id", keyword.id);
    const msg = error instanceof Error ? error.message : "Erreur inconnue";
    return { success: false, error: msg };
  }
}

// Finaliser la génération en masse (revalidate paths)
export async function finalizeBulkGeneration(): Promise<void> {
  revalidatePath("/admin/scheduler");
  revalidatePath("/admin/articles");
  revalidatePath("/admin/keywords");
}

