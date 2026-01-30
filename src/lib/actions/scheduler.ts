"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateArticle, improveArticle, type ImprovementModel, type ImprovementMode } from "@/lib/openai";
import { generateImage, generateImagePrompt } from "@/lib/replicate";
import type { SchedulerConfig, Json } from "@/types/database";

interface SchedulerConfigWithSite extends SchedulerConfig {
  site?: {
    id: string;
    name: string;
    domain: string;
  };
  articlesCount?: number;
}

export async function getSchedulerConfigs(): Promise<{
  data: SchedulerConfigWithSite[];
  error?: string;
}> {
  const supabase = await createClient();

  // Get configs with site info
  const { data, error } = await supabase
    .from("scheduler_config")
    .select("*, site:sites(id, name, domain)")
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message, data: [] };
  }

  // Get article counts for all sites
  const siteIds = data?.map(c => c.site_id) || [];
  if (siteIds.length > 0) {
    const { data: articlesData } = await supabase
      .from("articles")
      .select("site_id")
      .in("site_id", siteIds);

    // Count articles per site
    const articleCounts: Record<string, number> = {};
    articlesData?.forEach(article => {
      articleCounts[article.site_id] = (articleCounts[article.site_id] || 0) + 1;
    });

    // Add counts to configs
    const configsWithCounts = data?.map(config => ({
      ...config,
      articlesCount: articleCounts[config.site_id] || 0,
    })) || [];

    return { data: configsWithCounts as SchedulerConfigWithSite[] };
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
    enable_improvement?: boolean;
    improvement_model?: string;
    improvement_mode?: string;
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
        enable_improvement: config.enable_improvement ?? false,
        improvement_model: config.improvement_model ?? "gpt-4o",
        improvement_mode: config.improvement_mode ?? "full-pbn",
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
        enable_improvement: config.enable_improvement ?? false,
        improvement_model: config.improvement_model ?? "gpt-4o",
        improvement_mode: config.improvement_mode ?? "full-pbn",
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

// Récupérer les mots-clés disponibles pour la génération en masse (plusieurs sites)
export async function getKeywordsForBulkGeneration(siteIds: string[]): Promise<{
  data: Array<{ id: string; keyword: string; status: string | null; site_id: string | null; cluster: string | null; priority: number | null; site_name?: string }>;
  error?: string;
}> {
  if (siteIds.length === 0) {
    return { data: [], error: "Aucun site sélectionné" };
  }

  const supabase = await createClient();

  // Récupérer les keywords pending (des sites sélectionnés + globaux)
  const { data: keywords, error } = await supabase
    .from("keywords")
    .select("id, keyword, status, site_id, cluster, priority")
    .eq("status", "pending")
    .or(`site_id.in.(${siteIds.join(",")}),site_id.is.null`)
    .order("priority", { ascending: false })
    .order("keyword", { ascending: true });

  if (error) {
    return { data: [], error: error.message };
  }

  // Récupérer les noms des sites pour affichage
  const { data: sites } = await supabase
    .from("sites")
    .select("id, name")
    .in("id", siteIds);

  const siteMap = new Map(sites?.map(s => [s.id, s.name]) || []);

  // Ajouter le nom du site à chaque keyword
  const enrichedKeywords = (keywords || []).map(k => ({
    ...k,
    site_name: k.site_id ? siteMap.get(k.site_id) || "Inconnu" : "Global",
  }));

  return { data: enrichedKeywords };
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
  // Approche par lots pour éviter les limites d'URL avec beaucoup d'IDs
  let keyword = null;
  const BATCH_SIZE = 50;

  for (let i = 0; i < keywordIds.length && !keyword; i += BATCH_SIZE) {
    const batch = keywordIds.slice(i, i + BATCH_SIZE);
    const { data } = await supabase
      .from("keywords")
      .select("*")
      .in("id", batch)
      .eq("status", "pending")
      .order("priority", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      keyword = data;
    }
  }

  if (!keyword) {
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

// Interface pour les tâches de génération en masse
export interface BulkGenerationTask {
  siteId: string;
  siteName: string;
  keywordIds: string[];
  autoPublish: boolean;
  count: number;
  enableImprovement: boolean;
  improvementModel: string;
  improvementMode: string;
  imagesPerArticle: number; // 0 = main image only, 1-5 = additional images in content
  // SEO Expert options
  enableSeoExpert: boolean;
  seoExpertModel: "gemini" | "claude";
  seoExpertIncludeTable: boolean;
}

// Préparer les données pour la génération en masse
export async function prepareBulkGeneration(
  siteIds: string[],
  totalArticles: number
): Promise<{
  tasks: BulkGenerationTask[];
  errors: string[];
}> {
  if (siteIds.length === 0 || totalArticles <= 0) {
    return { tasks: [], errors: ["Paramètres invalides"] };
  }

  const supabase = await createClient();
  const articlesPerConfig = Math.floor(totalArticles / siteIds.length);
  const remainder = totalArticles % siteIds.length;

  const tasks: BulkGenerationTask[] = [];
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
      enableImprovement: (config as unknown as { enable_improvement?: boolean }).enable_improvement || false,
      improvementModel: ((config as unknown as { improvement_model?: string }).improvement_model) || "gpt-4o",
      improvementMode: ((config as unknown as { improvement_mode?: string }).improvement_mode) || "full-pbn",
      imagesPerArticle: 0, // Default to main image only for backward compatibility
      // SEO Expert defaults (off for backward compatibility)
      enableSeoExpert: false,
      seoExpertModel: "gemini",
      seoExpertIncludeTable: false,
    });
  }

  return { tasks, errors };
}

// Options pour la configuration personnalisée du batching
export interface BulkGenerationOptions {
  keywordIds?: string[];  // Mots-clés personnalisés (remplace ceux des configs)
  enableImprovement?: boolean;
  improvementModel?: string;
  improvementMode?: string;
  autoPublish?: boolean;
  imagesPerArticle?: number; // 0 = main image only, 1-5 = additional images in content
  // SEO Expert options
  enableSeoExpert?: boolean;
  seoExpertModel?: "gemini" | "claude";
  seoExpertIncludeTable?: boolean;
}

// Préparer les données pour la génération en masse avec options personnalisées
export async function prepareBulkGenerationWithOptions(
  siteIds: string[],
  totalArticles: number,
  options: BulkGenerationOptions
): Promise<{
  tasks: BulkGenerationTask[];
  errors: string[];
}> {
  if (siteIds.length === 0 || totalArticles <= 0) {
    return { tasks: [], errors: ["Paramètres invalides"] };
  }

  const supabase = await createClient();
  const articlesPerConfig = Math.floor(totalArticles / siteIds.length);
  const remainder = totalArticles % siteIds.length;

  const tasks: BulkGenerationTask[] = [];
  const errors: string[] = [];

  // Si des keywords personnalisés sont fournis, les utiliser pour TOUS les sites
  const useCustomKeywords = options.keywordIds && options.keywordIds.length > 0;

  // Les keywords personnalisés viennent du dialog qui les a déjà filtrés par statut "pending"
  // On fait confiance à cette sélection pour éviter les limites d'URL avec beaucoup d'IDs
  const validCustomKeywordIds: string[] = useCustomKeywords ? options.keywordIds! : [];

  for (let i = 0; i < siteIds.length; i++) {
    const siteId = siteIds[i];
    const articlesToGenerate = articlesPerConfig + (i < remainder ? 1 : 0);

    // Récupérer le nom du site
    const { data: site } = await supabase
      .from("sites")
      .select("id, name")
      .eq("id", siteId)
      .single();

    if (!site) {
      errors.push(`Site non trouvé: ${siteId}`);
      continue;
    }

    // Déterminer les keywords à utiliser
    let keywordIds: string[];
    if (useCustomKeywords) {
      // Utiliser les keywords sélectionnés par l'utilisateur
      // Ils viennent du dialog qui les a déjà filtrés par statut "pending"
      keywordIds = validCustomKeywordIds;
    } else {
      // Utiliser les keywords de la config existante
      const { data: config } = await supabase
        .from("scheduler_config")
        .select("keyword_ids")
        .eq("site_id", siteId)
        .single();

      keywordIds = (config?.keyword_ids as string[]) || [];
    }

    if (keywordIds.length === 0) {
      errors.push(`${site.name}: Aucun mot-clé configuré`);
      continue;
    }

    tasks.push({
      siteId,
      siteName: site.name,
      keywordIds,
      autoPublish: options.autoPublish ?? false,
      count: articlesToGenerate,
      enableImprovement: options.enableImprovement ?? false,
      improvementModel: options.improvementModel || "gpt-4o",
      improvementMode: options.improvementMode || "full-pbn",
      imagesPerArticle: options.imagesPerArticle ?? 0,
      enableSeoExpert: options.enableSeoExpert ?? false,
      seoExpertModel: options.seoExpertModel ?? "gemini",
      seoExpertIncludeTable: options.seoExpertIncludeTable ?? false,
    });
  }

  return { tasks, errors };
}

// Options d'amélioration pour la génération en masse
export interface BulkImprovementOptions {
  enableImprovement: boolean;
  improvementModel: string;
  improvementMode: string;
  imagesPerArticle?: number;
  // SEO Expert options
  enableSeoExpert?: boolean;
  seoExpertModel?: "gemini" | "claude";
  seoExpertIncludeTable?: boolean;
}

// Helper: Extract H2 titles from markdown content
function extractH2Titles(content: string): string[] {
  const h2Regex = /^## (.+)$/gm;
  const titles: string[] = [];
  let match;
  while ((match = h2Regex.exec(content)) !== null) {
    titles.push(match[1].trim());
  }
  return titles;
}

// Helper: Insert image after H2 in markdown content
function insertImageAfterH2(content: string, h2Title: string, imageUrl: string, imageAlt: string): string {
  const escapedTitle = h2Title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const h2Regex = new RegExp(`(^## ${escapedTitle}\\s*$)`, 'm');
  const imageMarkdown = `\n\n![${imageAlt}](${imageUrl})\n`;
  return content.replace(h2Regex, `$1${imageMarkdown}`);
}

// Générer un seul article pour la génération en masse
export async function generateSingleBulkArticle(
  siteId: string,
  keywordIds: string[],
  autoPublish: boolean,
  improvementOptions?: BulkImprovementOptions
): Promise<{
  success: boolean;
  title?: string;
  error?: string;
  improved?: boolean;
}> {
  const supabase = await createClient();

  // Récupérer un mot-clé pending parmi ceux sélectionnés
  // On utilise une approche par lots pour éviter les limites d'URL avec beaucoup d'IDs
  let keyword = null;
  const BATCH_SIZE = 50; // Limite sûre pour éviter les problèmes d'URL

  for (let i = 0; i < keywordIds.length && !keyword; i += BATCH_SIZE) {
    const batch = keywordIds.slice(i, i + BATCH_SIZE);
    const { data } = await supabase
      .from("keywords")
      .select("*")
      .in("id", batch)
      .eq("status", "pending")
      .order("priority", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      keyword = data;
    }
  }

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
    let generated = await generateArticle(keyword.keyword, cluster);
    let wasImproved = false;

    // Améliorer l'article si l'option est activée
    if (improvementOptions?.enableImprovement) {
      try {
        const improved = await improveArticle(
          {
            title: generated.title,
            content: generated.content,
            summary: generated.summary,
            faq: generated.faq,
          },
          {
            model: improvementOptions.improvementModel as ImprovementModel,
            mode: improvementOptions.improvementMode as ImprovementMode,
          }
        );
        // Remplacer par la version améliorée
        generated = {
          ...generated,
          title: improved.title,
          content: improved.content,
          summary: improved.summary,
          faq: improved.faq,
        };
        wasImproved = true;
      } catch (improveError) {
        // Continue avec l'article non amélioré si l'amélioration échoue
        console.error("Amélioration IA échouée:", improveError);
      }
    }

    // Appliquer SEO Expert si activé (après l'amélioration standard)
    let seoExpertApplied = false;
    if (improvementOptions?.enableSeoExpert) {
      try {
        // Import dynamique pour éviter les erreurs si les modules ne sont pas configurés
        if (improvementOptions.seoExpertModel === "gemini") {
          const { improveArticleWithGemini } = await import("@/lib/gemini");
          const seoImproved = await improveArticleWithGemini(
            {
              title: generated.title,
              summary: generated.summary,
              content: generated.content,
              keyword: keyword.keyword,
              cluster: keyword.cluster || undefined,
            },
            { includeTable: improvementOptions.seoExpertIncludeTable ?? false }
          );
          generated = {
            ...generated,
            title: seoImproved.title,
            content: seoImproved.content,
            summary: seoImproved.summary,
            faq: seoImproved.faq,
          };
          seoExpertApplied = true;
        } else {
          const { improveArticleWithClaude } = await import("@/lib/anthropic");
          const seoImproved = await improveArticleWithClaude(
            {
              title: generated.title,
              summary: generated.summary,
              content: generated.content,
              keyword: keyword.keyword,
              cluster: keyword.cluster || undefined,
            },
            { includeTable: improvementOptions.seoExpertIncludeTable ?? false }
          );
          generated = {
            ...generated,
            title: seoImproved.title,
            content: seoImproved.content,
            summary: seoImproved.summary,
            faq: seoImproved.faq,
          };
          seoExpertApplied = true;
        }
      } catch (seoError) {
        // Continue si SEO Expert échoue
        console.error("SEO Expert échoué:", seoError);
      }
    }

    // Générer l'image principale
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

    // Générer les images additionnelles dans le contenu (basées sur les H2)
    const imagesPerArticle = improvementOptions?.imagesPerArticle ?? 0;
    if (imagesPerArticle > 0) {
      try {
        const h2Titles = extractH2Titles(generated.content);
        const titlesToProcess = h2Titles.slice(0, imagesPerArticle);

        for (const h2Title of titlesToProcess) {
          try {
            // Générer un prompt basé sur le titre H2
            const h2ImagePrompt = generateImagePrompt(h2Title, keyword.keyword);
            const h2Image = await generateImage(h2ImagePrompt, "flux-schnell", siteId);

            if (h2Image) {
              // Insérer l'image après le H2 dans le contenu
              generated.content = insertImageAfterH2(
                generated.content,
                h2Title,
                h2Image.url,
                h2Image.alt
              );
            }
          } catch {
            // Continue si une image échoue
          }
        }
      } catch {
        // Continue si l'extraction H2 échoue
      }
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
        // SEO Expert fields
        seo_improved: seoExpertApplied,
        seo_improved_at: seoExpertApplied ? new Date().toISOString() : null,
        seo_model: seoExpertApplied ? improvementOptions?.seoExpertModel : null,
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

    return { success: true, title: generated.title, improved: wasImproved };
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

