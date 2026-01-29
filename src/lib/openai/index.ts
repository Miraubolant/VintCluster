// Client OpenAI
export { getOpenAIClient } from "./client";

// Configuration
export {
  MODELS_CONFIG,
  MODES_CONFIG,
  VINT_PRODUCTS,
  type ArticleModel,
  type ArticleMode,
  type ArticleResult,
  type GenerationOptions,
} from "./config";

// Fonction principale unifiée + fonctions rétrocompatibles
export {
  // Fonction principale
  generateArticle,
  generateOptimizedArticle,

  // Fonction d'amélioration (rétrocompatibilité)
  improveArticle,

  // Types rétrocompatibles
  type GeneratedArticle,
  type ImprovedArticle,
  type ImprovementModel,
  type ImprovementMode,
  type ImprovementOptions,

  // Configs pour l'UI (rétrocompatibilité)
  IMPROVEMENT_MODELS,
  IMPROVEMENT_MODES,
} from "./article";
