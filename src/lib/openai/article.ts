import { getOpenAIClient } from "./client";
import { generateSlug } from "@/lib/utils/slug";
import type { FAQItem } from "@/types/database";
import {
  type ArticleModel,
  type ArticleMode,
  type ArticleResult,
  type GenerationOptions,
  MODELS_CONFIG,
  MODES_CONFIG,
  getProductContextForCluster,
  validateArticleResponse,
  logArticleStats,
} from "./config";
import { getSystemPrompt, getUserPrompt, getImprovementPrompt } from "./prompts";

// ============================================================================
// RE-EXPORTS pour rétrocompatibilité
// ============================================================================

// Types exportés
export type { ArticleModel, ArticleMode, ArticleResult, GenerationOptions };

// Alias pour rétrocompatibilité avec l'ancien code
export type ImprovementModel = ArticleModel;
export type ImprovementMode = Exclude<ArticleMode, "basic">;

export interface ImprovementOptions {
  model: ImprovementModel;
  mode: ImprovementMode;
}

export interface ImprovedArticle {
  title: string;
  content: string;
  summary: string;
  faq: FAQItem[];
}

// Re-export des configs pour l'UI
export const IMPROVEMENT_MODELS = MODELS_CONFIG;
export const IMPROVEMENT_MODES = {
  "seo-classic": MODES_CONFIG["seo-classic"],
  "ai-search": MODES_CONFIG["ai-search"],
  "full-pbn": MODES_CONFIG["full-pbn"],
};

// ============================================================================
// FONCTION PRINCIPALE UNIFIÉE
// ============================================================================

/**
 * Génère un article à partir d'un mot-clé.
 *
 * @param keyword - Le mot-clé/sujet de l'article
 * @param optionsOrCluster - Options de génération ou cluster (string pour rétrocompatibilité)
 * @returns Article généré avec titre, slug, contenu, summary et FAQ
 *
 * @example
 * // Génération basique rapide
 * const article = await generateArticle("vendre sur vinted");
 *
 * @example
 * // Génération avec cluster (ancienne API)
 * const article = await generateArticle("vendre sur vinted", "vente");
 *
 * @example
 * // Génération avancée Full PBN (nouvelle API)
 * const article = await generateArticle("vendre sur vinted", {
 *   model: "gpt-4o",
 *   mode: "full-pbn",
 *   cluster: "vente"
 * });
 */
export async function generateArticle(
  keyword: string,
  optionsOrCluster?: GenerationOptions | string
): Promise<ArticleResult> {
  // Support de l'ancienne signature: generateArticle(keyword, cluster?)
  const options: GenerationOptions = typeof optionsOrCluster === "string"
    ? { cluster: optionsOrCluster }
    : optionsOrCluster || {};

  const {
    model = "gpt-4o",
    mode = "basic",
    cluster,
  } = options;

  const openai = getOpenAIClient();
  const modelConfig = MODELS_CONFIG[model];
  const maxTokens = modelConfig?.maxTokens || 4000;

  // Construire les prompts
  const systemPrompt = getSystemPrompt(mode);
  const productContext = getProductContextForCluster(cluster);
  const faqCount = mode === "basic" ? 3 : 6;
  const userPrompt = getUserPrompt(keyword, productContext, mode, faqCount);

  // Appel API
  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: maxTokens,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Aucun contenu retourné par OpenAI");
  }

  // Parser et valider
  const parsed = JSON.parse(content) as {
    title: string;
    content: string;
    summary: string;
    faq: FAQItem[];
  };

  validateArticleResponse(parsed);
  logArticleStats(parsed.content, model);

  return {
    title: parsed.title,
    slug: generateSlug(parsed.title),
    content: parsed.content,
    summary: parsed.summary,
    faq: parsed.faq || [],
  };
}

// ============================================================================
// FONCTION D'AMÉLIORATION (wrapper pour rétrocompatibilité)
// ============================================================================

/**
 * Améliore un article existant avec un mode SEO avancé.
 *
 * @param existingArticle - Article à améliorer
 * @param options - Options d'amélioration (model, mode)
 * @returns Article amélioré
 *
 * @example
 * const improved = await improveArticle(article, {
 *   model: "gpt-4o",
 *   mode: "full-pbn"
 * });
 */
export async function improveArticle(
  existingArticle: {
    title: string;
    content: string;
    summary: string;
    faq: FAQItem[];
  },
  options: ImprovementOptions
): Promise<ImprovedArticle> {
  const openai = getOpenAIClient();
  const modelConfig = MODELS_CONFIG[options.model];
  const maxTokens = modelConfig?.maxTokens || 16384;

  // Construire les prompts
  const systemPrompt = getSystemPrompt(options.mode);
  const userPrompt = getImprovementPrompt(existingArticle, options.mode);

  // Appel API
  const response = await openai.chat.completions.create({
    model: options.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: maxTokens,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Aucun contenu retourné par OpenAI");
  }

  // Parser et valider
  const parsed = JSON.parse(content) as {
    title: string;
    content: string;
    summary: string;
    faq: FAQItem[];
  };

  validateArticleResponse(parsed);
  logArticleStats(parsed.content, options.model);

  // Gérer la FAQ (utiliser l'existante si la nouvelle est insuffisante)
  const finalFaq = parsed.faq?.length >= 3
    ? parsed.faq
    : (existingArticle.faq?.length > 0 ? existingArticle.faq : parsed.faq || []);

  return {
    title: parsed.title,
    content: parsed.content,
    summary: parsed.summary || existingArticle.summary,
    faq: finalFaq,
  };
}

// ============================================================================
// FONCTION COMBINÉE (génération + amélioration en une seule étape)
// ============================================================================

/**
 * Génère un article et l'améliore immédiatement si un mode avancé est spécifié.
 * C'est la fonction recommandée pour une génération optimale en une seule étape.
 *
 * @param keyword - Le mot-clé/sujet
 * @param options - Options incluant le mode d'amélioration
 * @returns Article final (généré et potentiellement amélioré)
 *
 * @example
 * // Génération + amélioration Full PBN en une étape
 * const article = await generateOptimizedArticle("vendre sur vinted", {
 *   model: "gpt-4o",
 *   mode: "full-pbn",
 *   cluster: "vente"
 * });
 */
export async function generateOptimizedArticle(
  keyword: string,
  options: GenerationOptions = {}
): Promise<ArticleResult> {
  const { mode = "basic" } = options;

  // Si mode basique, génération simple
  if (mode === "basic") {
    return generateArticle(keyword, options);
  }

  // Pour les modes avancés, générer directement avec le bon prompt
  // (plus efficace qu'une génération basique + amélioration)
  return generateArticle(keyword, options);
}

// ============================================================================
// TYPES LEGACY (pour rétrocompatibilité complète)
// ============================================================================

export interface GeneratedArticle extends ArticleResult {}
