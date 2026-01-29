import type { FAQItem, SiteTemplate } from "@/types/database";

// ============================================================================
// TYPES
// ============================================================================

export type ArticleModel = "gpt-4o" | "gpt-4o-mini" | "gpt-4-turbo";
export type ArticleMode = "basic" | "seo-classic" | "ai-search" | "full-pbn";

export interface ArticleResult {
  title: string;
  slug: string;
  content: string;
  summary: string;
  faq: FAQItem[];
}

export interface GenerationOptions {
  model?: ArticleModel;
  mode?: ArticleMode;
  cluster?: string;
  template?: SiteTemplate;
}

// ============================================================================
// CONFIGURATION DES MODÈLES
// ============================================================================

export const MODELS_CONFIG: Record<ArticleModel, {
  name: string;
  description: string;
  speed: string;
  maxTokens: number;
}> = {
  "gpt-4o": {
    name: "GPT-4o (Recommandé)",
    description: "Meilleure qualité, articles longs",
    speed: "~15s/article",
    maxTokens: 16384,
  },
  "gpt-4o-mini": {
    name: "GPT-4o Mini",
    description: "Rapide et économique, -90% coût",
    speed: "~8s/article",
    maxTokens: 16384,
  },
  "gpt-4-turbo": {
    name: "GPT-4 Turbo",
    description: "Plus créatif mais output limité",
    speed: "~25s/article",
    maxTokens: 4096,
  },
};

// ============================================================================
// CONFIGURATION DES MODES
// ============================================================================

export const MODES_CONFIG: Record<ArticleMode, {
  name: string;
  description: string;
  icon: string;
  wordCount: string;
}> = {
  "basic": {
    name: "Basique",
    description: "Article rapide 1000-1500 mots",
    icon: "📝",
    wordCount: "1000-1500",
  },
  "seo-classic": {
    name: "SEO Classic",
    description: "Structure optimisée pour Google",
    icon: "🎯",
    wordCount: "2500-3000",
  },
  "ai-search": {
    name: "AI Search Ready",
    description: "Optimisé ChatGPT, Perplexity, SGE",
    icon: "🤖",
    wordCount: "2500-3000",
  },
  "full-pbn": {
    name: "Full PBN",
    description: "SEO + AI Search + E-E-A-T complet",
    icon: "🚀",
    wordCount: "2500-3000",
  },
};

// ============================================================================
// PRODUITS SAAS (source unique de vérité)
// ============================================================================

export const VINT_PRODUCTS = {
  vintdress: {
    name: "VintDress",
    url: "https://vintdress.com",
    description: "Génère des photos portées réalistes en 30s avec l'IA. Pas de mannequin, pas de shooting.",
    cta: "Essayer VintDress gratuitement",
    keywords: ["photo", "photo-ia", "photo-technique", "mannequin"],
  },
  vintboost: {
    name: "VintBoost",
    url: "https://vintboost.com",
    description: "Génère des vidéos pro de ton vestiaire en 30s. Zéro montage requis.",
    cta: "Créer ma première vidéo",
    keywords: ["video", "mannequin-ia"],
  },
  vintpower: {
    name: "VintPower",
    url: "https://vintpower.com",
    description: "IA qui génère titre, description, prix optimisés + extension Vinted.",
    cta: "Optimiser mes annonces",
    keywords: ["vendre", "vente", "outils-vinted"],
  },
} as const;

// Clusters qui utilisent tous les produits
const ALL_PRODUCTS_CLUSTERS = ["algorithme", "tendances", "logistique", "paiement"];

export function getProductContextForCluster(cluster?: string): string {
  const allProductsText = `Tu peux mentionner nos 3 produits selon la pertinence:
- [VintDress](https://vintdress.com) pour les photos portées IA
- [VintBoost](https://vintboost.com) pour les vidéos de vestiaire
- [VintPower](https://vintpower.com) pour optimiser les annonces`;

  if (!cluster || ALL_PRODUCTS_CLUSTERS.includes(cluster.toLowerCase())) {
    return allProductsText;
  }

  const normalizedCluster = cluster.toLowerCase();

  for (const product of Object.values(VINT_PRODUCTS)) {
    if ((product.keywords as readonly string[]).includes(normalizedCluster)) {
      return `Produit principal: **${product.name}** (${product.url})
${product.description}
Intègre naturellement 2-3 liens vers ${product.name} dans l'article.`;
    }
  }

  return allProductsText;
}

// ============================================================================
// INSTRUCTIONS MARKDOWN (communes à tous les modes)
// ============================================================================

export const MARKDOWN_INSTRUCTIONS = `## FORMATAGE MARKDOWN OBLIGATOIRE

CRITIQUE: Le contenu DOIT utiliser la syntaxe Markdown correcte :
- Titres H2 : "## " (deux dièses + espace) - JAMAIS de **gras** pour les titres
- Titres H3 : "### " (trois dièses + espace)
- Une ligne vide AVANT et APRÈS chaque titre
- Une ligne vide entre chaque paragraphe
- Listes à puces avec "- " (tiret + espace)

EXEMPLE:
\`\`\`
## Titre de Section

Premier paragraphe avec du texte.

Deuxième paragraphe séparé.

### Sous-titre

Contenu de la sous-section.

- Point 1
- Point 2

## Prochaine Section

Suite...
\`\`\``;

// ============================================================================
// CONTEXTE DE BASE (commun à tous les modes avancés)
// ============================================================================

export const BASE_CONTEXT = `Tu es un expert SEO français spécialisé dans les blogs sur Vinted et la vente de seconde main.
Tu travailles pour un réseau de blogs qui promeut subtilement 3 produits SaaS.

## NOS PRODUITS SAAS
1. **VintDress** (vintdress.com) - ${VINT_PRODUCTS.vintdress.description}
2. **VintBoost** (vintboost.com) - ${VINT_PRODUCTS.vintboost.description}
3. **VintPower** (vintpower.com) - ${VINT_PRODUCTS.vintpower.description}

## TON & STYLE
- Tutoiement OBLIGATOIRE ("tu", "ton", "tes")
- Ton amical, comme un vendeur expérimenté qui partage ses secrets
- Phrases courtes et percutantes (max 20 mots)
- Expressions françaises naturelles

## VOCABULAIRE VINTED
vestiaire, boost, mise en avant, algorithme, photos, annonces, descriptions,
Mondial Relay, Vinted Pro, évaluation, followers, favoris, offres, bundle,
vendeur top, relisting, visibilité, prix de réserve

## LIENS (2-3 par article)
Format: [texte du lien](https://url.com)
Exemples:
- "Pour ça, [VintDress](https://vintdress.com) génère des photos portées en quelques secondes."
- "Tu peux utiliser [VintPower](https://vintpower.com) pour optimiser tes descriptions."
- "Avec [VintBoost](https://vintboost.com), tu crées des vidéos pro sans montage."

RÈGLES:
- 2-3 liens max, intégrés naturellement dans les phrases
- Photo/mannequin → VintDress | Vidéo → VintBoost | Titre/description/prix → VintPower`;

// ============================================================================
// VALIDATION
// ============================================================================

export function validateArticleResponse(parsed: {
  title?: string;
  content?: string;
  summary?: string;
  faq?: FAQItem[];
}): void {
  if (!parsed.title || parsed.title.length < 5) {
    throw new Error("Titre invalide ou manquant");
  }
  if (!parsed.content || parsed.content.length < 100) {
    throw new Error("Contenu invalide ou manquant");
  }
}

export function logArticleStats(content: string, model: string): void {
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  console.log(`[article] Généré: ${wordCount} mots avec ${model}`);
}
