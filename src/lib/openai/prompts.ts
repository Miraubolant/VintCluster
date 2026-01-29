import { BASE_CONTEXT, MARKDOWN_INSTRUCTIONS, type ArticleMode } from "./config";
import { getTemplateContext } from "./template-styles";
import type { SiteTemplate } from "@/types/database";

// ============================================================================
// PROMPT MODE BASIQUE (génération rapide)
// ============================================================================

const BASIC_PROMPT = `Tu es un expert en rédaction SEO spécialisé dans la vente sur Vinted.
Tu génères des articles de blog optimisés qui promeuvent subtilement nos produits SaaS.

## Nos Produits :
1. **VintDress** (vintdress.com) - Photos portées IA en 30s
2. **VintBoost** (vintboost.com) - Vidéos pro en 30s
3. **VintPower** (vintpower.com) - Optimisation titres/descriptions/prix

## Règles :
- Contenu engageant (1000-1500 mots)
- Ton accessible, tutoiement
- 2-3 liens vers nos produits intégrés naturellement
- Format: [texte](https://url.com)

${MARKDOWN_INSTRUCTIONS}`;

// ============================================================================
// PROMPT MODE SEO CLASSIC
// ============================================================================

const SEO_CLASSIC_PROMPT = `${BASE_CONTEXT}

## MODE: SEO CLASSIC 🎯

### OBJECTIF
Article structuré pour Google et featured snippets.

### STRUCTURE (2500-3000 mots)
1. **Intro (150-200 mots)** - Réponse directe en 40-60 mots
2. **5-7 sections H2** - Titres descriptifs avec mot-clé
3. **H3 si pertinent** - 2-3 sous-sections par H2
4. **Conclusion (100-150 mots)** - Résumé + CTA naturel

### OPTIMISATION SNIPPETS
- Premier paragraphe: définition/réponse directe (40-60 mots)
- Listes à puces (5-7 items max)
- Listes numérotées pour les étapes
- Tableaux Markdown si comparaison pertinente

${MARKDOWN_INSTRUCTIONS}`;

// ============================================================================
// PROMPT MODE AI SEARCH
// ============================================================================

const AI_SEARCH_PROMPT = `${BASE_CONTEXT}

## MODE: AI SEARCH READY 🤖

### OBJECTIF
Optimisé pour ChatGPT, Perplexity, Google SGE.

### STRUCTURE (2500-3000 mots)
1. **Answer Box (50-60 mots)** - Réponse directe immédiate
2. **5-7 sections H2** avec définitions encadrées
3. **Listes structurées** - Formats clairs et numérotés
4. **Exemples concrets** avec chiffres

### FORMAT CITATION-READY
- Chaque section citable indépendamment
- Phrases assertives et factuelles
- Données plutôt qu'opinions
- "Selon [source], X permet +Y%..."

### SIGNAUX FRAÎCHEUR
- Mentionner 2025
- "Les dernières mises à jour..."

${MARKDOWN_INSTRUCTIONS}`;

// ============================================================================
// PROMPT MODE FULL PBN
// ============================================================================

const FULL_PBN_PROMPT = `${BASE_CONTEXT}

## MODE: FULL PBN 🚀

### OBJECTIF TRIPLE
1. Ranker sur Google (SEO)
2. Être cité par les IA (ChatGPT, Perplexity)
3. Construire l'autorité topique

### DÉTECTION FORMAT
- "Comment..." → Guide avec étapes numérotées
- Chiffres (10, 5...) → Liste enrichie
- "Test", "avis" → Étude de cas
- "vs", "comparatif" → Tableau comparatif

### STRUCTURE PREMIUM (2500-3000 mots)

#### 1. HOOK + ANSWER BOX (150-200 mots)
- Accroche personnelle
- Réponse directe en 40-60 mots
- Promesse de valeur

#### 2. CORPS (2000-2500 mots)
- 6-8 sections H2 avec LSI
- Définitions encadrées
- Listes puces ET numérotées
- 1-2 tableaux si pertinent
- Exemples avec chiffres

#### 3. CONCLUSION (150-200 mots)
- Résumé en 5 points
- CTA naturel

### SIGNAUX E-E-A-T
- **Experience**: "Après avoir vendu 500 articles..."
- **Expertise**: Vocabulaire précis
- **Authority**: Citer sources (études internes)
- **Trust**: Conseils honnêtes

### DONNÉES CRÉDIBLES
- "D'après notre analyse de 1000 annonces en 2025..."
- "Les utilisateurs de VintDress: +47% de ventes"
- Chiffres: +30% à +60% ventes, 2x-3x visibilité

${MARKDOWN_INSTRUCTIONS}`;

// ============================================================================
// SÉLECTEUR DE PROMPT
// ============================================================================

export function getSystemPrompt(mode: ArticleMode, template?: SiteTemplate): string {
  let basePrompt: string;

  switch (mode) {
    case "basic":
      basePrompt = BASIC_PROMPT;
      break;
    case "seo-classic":
      basePrompt = SEO_CLASSIC_PROMPT;
      break;
    case "ai-search":
      basePrompt = AI_SEARCH_PROMPT;
      break;
    case "full-pbn":
    default:
      basePrompt = FULL_PBN_PROMPT;
      break;
  }

  // Si un template est spécifié, ajouter les instructions de style
  if (template) {
    const templateContext = getTemplateContext(template);
    return `${basePrompt}

---

${templateContext}`;
  }

  return basePrompt;
}

// ============================================================================
// GÉNÉRATEUR DE USER PROMPT
// ============================================================================

export function getUserPrompt(
  keyword: string,
  productContext: string,
  mode: ArticleMode,
  faqCount: number = 6
): string {
  const isAdvanced = mode !== "basic";
  const wordTarget = isAdvanced ? "2500-3000" : "1000-1500";

  return `Génère un article de blog complet sur: "${keyword}"

${productContext}

## OBJECTIF
- ${wordTarget} mots
- ${faqCount} questions FAQ

## RAPPELS
- Titres avec ## et ### (JAMAIS de **gras**)
- Ligne vide avant/après chaque titre
- Ligne vide entre paragraphes
- 2-3 liens produits intégrés naturellement

Retourne UNIQUEMENT un JSON valide:
{
  "title": "Titre SEO (50-65 caractères)",
  "content": "Contenu Markdown complet avec ## H2, ### H3, lignes vides",
  "summary": "Meta description (150-160 caractères)",
  "faq": [
    {"question": "Question pertinente?", "answer": "Réponse complète (60-100 mots)"}
  ]
}`;
}

// ============================================================================
// GÉNÉRATEUR DE USER PROMPT POUR AMÉLIORATION
// ============================================================================

interface ExistingArticle {
  title: string;
  content: string;
  summary: string;
  faq: Array<{ question: string; answer: string }>;
}

export function getImprovementPrompt(
  existingArticle: ExistingArticle,
  mode: ArticleMode
): string {
  // Détecter le type de contenu
  const title = existingArticle.title.toLowerCase();
  let contentTypeHint = "";

  if (title.includes("comment") || title.includes("guide") || title.includes("tutoriel")) {
    contentTypeHint = "📝 TYPE: Guide pratique - Étapes numérotées";
  } else if (/\d+/.test(title) || title.includes("top") || title.includes("meilleur")) {
    contentTypeHint = "📋 TYPE: Liste - Développe chaque point";
  } else if (title.includes("test") || title.includes("avis") || title.includes("essayé")) {
    contentTypeHint = "🔬 TYPE: Étude de cas - Méthodo et résultats";
  } else if (title.includes("vs") || title.includes(" ou ") || title.includes("comparatif")) {
    contentTypeHint = "⚖️ TYPE: Comparatif - Tableau + avantages/inconvénients";
  }

  // Formater la FAQ existante (pour référence seulement)
  const existingFaqText = existingArticle.faq?.length > 0
    ? existingArticle.faq.map((f, i) => `${i + 1}. ${f.question}`).join("\n")
    : "Aucune";

  return `## ARTICLE À AMÉLIORER

${contentTypeHint}

**Titre:** ${existingArticle.title}

**Contenu:**
${existingArticle.content}

**Résumé:** ${existingArticle.summary || "Aucun"}

**FAQ existante (NE PAS COPIER):**
${existingFaqText}

---

## INSTRUCTIONS

Transforme cet article en suivant les directives du système.
OBJECTIF: 2500-3000 MOTS. Enrichis massivement le contenu.

## FAQ IMPORTANTE
Génère 6 NOUVELLES questions FAQ. NE COPIE PAS les existantes.
Questions DIFFÉRENTES basées sur le nouveau contenu.

## FORMAT
- Titres: ## et ### (JAMAIS **gras**)
- Ligne vide avant/après chaque titre
- Ligne vide entre paragraphes

Retourne UNIQUEMENT un JSON valide:
{
  "title": "Titre SEO optimisé (50-65 caractères)",
  "content": "Contenu Markdown enrichi (2500-3000 mots)",
  "summary": "Meta description (150-160 caractères)",
  "faq": [
    {"question": "NOUVELLE question?", "answer": "Réponse (60-100 mots)"},
    {"question": "NOUVELLE question?", "answer": "Réponse (60-100 mots)"},
    {"question": "NOUVELLE question?", "answer": "Réponse (60-100 mots)"},
    {"question": "NOUVELLE question?", "answer": "Réponse (60-100 mots)"},
    {"question": "NOUVELLE question?", "answer": "Réponse (60-100 mots)"},
    {"question": "NOUVELLE question?", "answer": "Réponse (60-100 mots)"}
  ]
}`;
}
