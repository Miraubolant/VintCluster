import { getOpenAIClient } from "./client";
import type { FAQItem } from "@/types/database";

// Model options for improvement (modèles disponibles sur OpenAI API)
export type ImprovementModel = "gpt-4o" | "gpt-4o-mini" | "gpt-4-turbo";

// Improvement modes
export type ImprovementMode = "seo-classic" | "ai-search" | "full-pbn";

export interface ImprovedArticle {
  title: string;
  content: string;
  summary: string;
  faq: FAQItem[];
}

export interface ImprovementOptions {
  model: ImprovementModel;
  mode: ImprovementMode;
}

// Configuration des modèles disponibles
export const IMPROVEMENT_MODELS: Record<ImprovementModel, { name: string; description: string; speed: string; maxTokens: number }> = {
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

// Configuration des modes d'amélioration
export const IMPROVEMENT_MODES: Record<ImprovementMode, { name: string; description: string; icon: string }> = {
  "seo-classic": {
    name: "SEO Classic",
    description: "Structure optimisée, mots-clés, featured snippets Google",
    icon: "🎯",
  },
  "ai-search": {
    name: "AI Search Ready",
    description: "Optimisé ChatGPT, Perplexity, Google SGE (réponses directes)",
    icon: "🤖",
  },
  "full-pbn": {
    name: "Full PBN",
    description: "Stratégie complète : SEO + AI Search + Autorité + E-E-A-T",
    icon: "🚀",
  },
};

// Prompt de base commun à tous les modes
const BASE_CONTEXT = `Tu es un expert SEO français spécialisé dans les blogs sur Vinted et la vente de seconde main.
Tu travailles pour un réseau de blogs (PBN) qui promeut subtilement 3 produits SaaS.

## NOS PRODUITS SAAS
1. **VintDress** (vintdress.com) - Génère des photos portées réalistes en 30s avec l'IA. Pas de mannequin, pas de shooting.
2. **VintBoost** (vintboost.com) - Génère des vidéos pro de ton vestiaire en 30s. Zéro montage requis.
3. **VintPower** (vintpower.com) - IA qui génère titre, description, prix optimisés + extension Vinted.

## TON & STYLE OBLIGATOIRE
- Tutoiement OBLIGATOIRE partout ("tu", "ton", "tes")
- Ton amical, comme un vendeur expérimenté qui partage ses secrets
- Phrases courtes et percutantes (max 20 mots par phrase)
- Zéro jargon technique inutile
- Expressions françaises naturelles et actuelles

## VOCABULAIRE VINTED (à utiliser naturellement)
vestiaire, boost, mise en avant, algorithme, photos, annonces, descriptions, négociation,
Mondial Relay, Vinted Pro, évaluation, followers, favoris, offres, bundle, lot, acheteur,
vendeur top, relisting, visibilité, prix de réserve

## LIENS HYPERTEXTE OBLIGATOIRES (2-3 par article)
Intègre NATURELLEMENT des liens vers nos produits dans le texte.
Format Markdown: [texte du lien](https://url.com)

Exemples d'intégration naturelle :
- "Pour ça, des outils comme [VintDress](https://vintdress.com) génèrent des photos portées en quelques secondes."
- "Tu peux utiliser [VintPower](https://vintpower.com) pour optimiser tes titres et descriptions automatiquement."
- "Avec [VintBoost](https://vintboost.com), tu crées des vidéos pro de ton vestiaire sans montage."

RÈGLES:
- 2-3 liens maximum par article (pas plus)
- Liens intégrés naturellement dans des phrases, PAS en fin de paragraphe
- Choisir le(s) produit(s) le(s) plus pertinent(s) selon le sujet
- Photo/mannequin → VintDress | Vidéo/contenu dynamique → VintBoost | Titre/description/prix → VintPower`;

// Prompt pour le mode SEO Classic
const SEO_CLASSIC_PROMPT = `${BASE_CONTEXT}

## MODE: SEO CLASSIC 🎯

### OBJECTIF
Créer un article parfaitement structuré pour ranker sur Google avec les featured snippets.

### STRUCTURE (2500-3000 mots)
1. **Intro (150-200 mots)** - Réponse directe à la question principale en 40-60 mots (featured snippet ready)
2. **5-7 sections H2** - Titres descriptifs avec mot-clé principal
3. **H3 si pertinent** - 2-3 sous-sections par H2
4. **Conclusion (100-150 mots)** - Résumé + CTA naturel

### OPTIMISATION FEATURED SNIPPETS
- Premier paragraphe de chaque section : définition ou réponse directe (40-60 mots)
- Listes à puces pour les conseils (5-7 items max)
- Listes numérotées pour les processus step-by-step
- Tableaux Markdown pour les comparaisons si pertinent

### CTA SUBTILS (2-3 max)
- Mentionne le produit UNIQUEMENT quand il résout un problème évoqué
- Intégration naturelle dans le texte, pas de bannière
- Exemple : "Pour gagner du temps sur les photos, des outils comme VintDress permettent de..."

### FAQ (6 questions)
- Questions "People Also Ask" réalistes
- Réponses de 50-80 mots, snippet-ready
- Inclure des chiffres ou exemples concrets`;

// Prompt pour le mode AI Search Ready
const AI_SEARCH_PROMPT = `${BASE_CONTEXT}

## MODE: AI SEARCH READY 🤖

### OBJECTIF
Optimiser pour ChatGPT, Perplexity, Google SGE et les assistants IA qui citent des sources.

### STRUCTURE OPTIMISÉE IA (2500-3000 mots)
1. **Answer Box (50-60 mots)** - Réponse directe et complète dès le premier paragraphe
2. **5-7 sections H2** avec définitions encadrées - Format "**Qu'est-ce que X ?** X est..."
3. **Listes structurées** - Les IA adorent les formats clairs et numérotés
4. **Exemples concrets détaillés** - Avec chiffres vérifiables et cas pratiques

### FORMAT "CITATION-READY"
- Chaque section doit pouvoir être citée indépendamment
- Phrases assertives et factuelles
- Éviter les opinions, préférer les données
- Format "Selon [source], X permet d'obtenir +Y%..."

### SIGNAUX DE FRAÎCHEUR
- Mentionner l'année en cours (2025)
- "En 2025, les vendeurs Vinted..."
- "Les dernières mises à jour de l'algorithme..."

### CTA CONTEXTUELS (2-3)
- Placement naturel après un problème identifié
- Format discret : "des outils comme [Produit] aident à..."

### FAQ ORIENTÉE IA (6-8 questions)
- Questions que les gens posent à ChatGPT
- "Comment...", "Pourquoi...", "Quel est le meilleur moyen de..."
- Réponses directes, citables, avec données`;

// Prompt pour le mode Full PBN (le plus complet)
const FULL_PBN_PROMPT = `${BASE_CONTEXT}

## MODE: FULL PBN 🚀 (STRATÉGIE COMPLÈTE)

### OBJECTIF TRIPLE
1. Ranker sur Google (SEO traditionnel)
2. Être cité par les IA (ChatGPT, Perplexity, SGE)
3. Construire l'autorité topique sur la niche Vinted

### DÉTECTION AUTOMATIQUE DU FORMAT
Analyse le titre et adapte le style :
- "Comment..." → Guide pratique détaillé avec étapes numérotées
- Chiffres (10, 5, 7...) → Liste enrichie avec exemples pour chaque point
- "Test", "avis", "j'ai essayé" → Étude de cas avec méthodo et résultats
- "vs", "ou", "comparatif" → Tableau comparatif + avantages/inconvénients

### STRUCTURE PREMIUM (2500-3000 mots)

#### 1. HOOK + ANSWER BOX (150-200 mots)
- Accroche personnelle qui crée la connexion
- Réponse directe en 40-60 mots (featured snippet)
- Promesse de valeur pour la suite

#### 2. CORPS ENRICHI (2000-2500 mots)
- 6-8 sections H2 avec mots-clés LSI
- Définitions encadrées pour les concepts clés
- Listes à puces ET numérotées alternées
- 1-2 tableaux Markdown si comparaison pertinente
- Exemples concrets détaillés avec chiffres

#### 3. CONCLUSION ACTIONNABLE (150-200 mots)
- Résumé en 5 points clés
- CTA naturel vers l'action

### SIGNAUX E-E-A-T (AUTORITÉ)
- **Experience** : "Après avoir vendu plus de 500 articles sur Vinted..."
- **Expertise** : Vocabulaire précis, pas d'approximations
- **Authoritativeness** : Citer des sources (études internes, analyses)
- **Trust** : Admettre les limites, conseils honnêtes

### DONNÉES & SOURCES CRÉDIBLES
- "D'après notre analyse de 1000 annonces Vinted en 2025..."
- "Les utilisateurs de VintDress rapportent en moyenne +47% de ventes"
- "Une étude interne sur 500 vendeurs montre que..."
- Chiffres réalistes : +30% à +60% ventes, 2x-3x visibilité, 50% temps gagné

### ENRICHISSEMENT SÉMANTIQUE (LSI)
Intégrer naturellement les termes connexes :
- vente en ligne, e-commerce, marketplace, mode circulaire
- économie collaborative, seconde main, occasion, vintage
- optimisation, visibilité, conversion, taux de vente
- photos produit, mise en scène, présentation, attractivité

### CTA INTELLIGENTS (3 max, bien espacés)
Place les mentions de nos SaaS uniquement quand pertinent :
- Problème de photos / mannequin / mise en scène → VintDress
- Besoin de visibilité / contenu dynamique / vidéo → VintBoost
- Descriptions / titres / prix / automatisation → VintPower

Format subtil : "C'est exactement ce que propose [Produit] - [bénéfice en 1 phrase]"

### FAQ PREMIUM (6-8 questions)
Mix de questions :
- 2-3 questions "People Also Ask" Google
- 2-3 questions posées à ChatGPT/Perplexity
- 1-2 questions longue traîne spécifiques
Réponses : 60-100 mots, données concrètes, citables par les IA

### RÈGLES CRITIQUES
- JAMAIS de fonctionnalités inventées pour nos produits
- Markdown propre (pas de HTML)
- Éviter les clichés SEO ("Dans cet article...", "il est important de noter...")
- Chaque paragraphe doit apporter de la valeur unique`;

// Sélection du prompt selon le mode
function getPromptForMode(mode: ImprovementMode): string {
  switch (mode) {
    case "seo-classic":
      return SEO_CLASSIC_PROMPT;
    case "ai-search":
      return AI_SEARCH_PROMPT;
    case "full-pbn":
    default:
      return FULL_PBN_PROMPT;
  }
}

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
  const systemPrompt = getPromptForMode(options.mode);

  const existingFaqFormatted = existingArticle.faq && existingArticle.faq.length > 0
    ? existingArticle.faq.map((f, i) => `${i + 1}. Q: ${f.question}\n   R: ${f.answer}`).join("\n")
    : "Aucune FAQ existante";

  // Détecter le type de contenu pour le prompt utilisateur
  const title = existingArticle.title.toLowerCase();
  let contentTypeHint = "";
  if (title.includes("comment") || title.includes("guide") || title.includes("tutoriel")) {
    contentTypeHint = "📝 TYPE DÉTECTÉ: Guide pratique - Structure en étapes numérotées recommandée";
  } else if (/\d+/.test(title) || title.includes("top") || title.includes("meilleur")) {
    contentTypeHint = "📋 TYPE DÉTECTÉ: Liste/Top X - Développe chaque point avec exemples concrets";
  } else if (title.includes("test") || title.includes("avis") || title.includes("essayé")) {
    contentTypeHint = "🔬 TYPE DÉTECTÉ: Étude de cas - Inclure méthodologie, résultats chiffrés, conclusion";
  } else if (title.includes("vs") || title.includes(" ou ") || title.includes("comparatif")) {
    contentTypeHint = "⚖️ TYPE DÉTECTÉ: Comparatif - Tableau de comparaison + avantages/inconvénients";
  }

  const userPrompt = `## ARTICLE À AMÉLIORER

${contentTypeHint}

**Titre actuel:** ${existingArticle.title}

**Contenu actuel:**
${existingArticle.content}

**Résumé actuel:** ${existingArticle.summary || "Aucun résumé"}

**FAQ actuelle:**
${existingFaqFormatted}

---

## INSTRUCTIONS

Transforme cet article en suivant TOUTES les directives du système.
Garde le sujet principal mais enrichis MASSIVEMENT le contenu.
OBJECTIF: 2500-3000 MOTS minimum. Développe chaque section en profondeur.

Retourne UNIQUEMENT un JSON valide:
{
  "title": "Titre SEO optimisé (50-65 caractères, avec mot-clé principal)",
  "content": "Contenu Markdown LONG et DÉTAILLÉ (2500-3000 mots, ## pour H2, ### pour H3, listes, tableaux)",
  "summary": "Meta description accrocheuse (150-160 caractères)",
  "faq": [
    {"question": "Question 1?", "answer": "Réponse complète avec données (60-100 mots)"},
    {"question": "Question 2?", "answer": "Réponse complète avec données (60-100 mots)"},
    {"question": "Question 3?", "answer": "Réponse complète avec données (60-100 mots)"},
    {"question": "Question 4?", "answer": "Réponse complète avec données (60-100 mots)"},
    {"question": "Question 5?", "answer": "Réponse complète avec données (60-100 mots)"},
    {"question": "Question 6?", "answer": "Réponse complète avec données (60-100 mots)"}
  ]
}`;

  // max_tokens selon la config du modèle
  const modelConfig = IMPROVEMENT_MODELS[options.model];
  const maxTokens = modelConfig?.maxTokens || 8192;

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

  const parsed = JSON.parse(content) as {
    title: string;
    content: string;
    summary: string;
    faq: FAQItem[];
  };

  // Validation basique - uniquement titre et contenu non vides
  if (!parsed.title || parsed.title.length < 5) {
    throw new Error("Titre invalide ou manquant");
  }

  if (!parsed.content || parsed.content.length < 100) {
    throw new Error("Contenu invalide ou manquant");
  }

  // Log informatif du nombre de mots (pas de blocage)
  const wordCount = parsed.content.split(/\s+/).filter(w => w.length > 0).length;
  console.log(`[improve-article] Article généré: ${wordCount} mots avec ${options.model}`);

  // Use existing FAQ if new one is insufficient
  const finalFaq = parsed.faq && parsed.faq.length >= 3
    ? parsed.faq
    : (existingArticle.faq && existingArticle.faq.length > 0
        ? existingArticle.faq
        : parsed.faq || []);

  return {
    title: parsed.title,
    content: parsed.content,
    summary: parsed.summary || existingArticle.summary,
    faq: finalFaq,
  };
}
