"use server";

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Types
export interface GeneratedKeyword {
  keyword: string;
  source: "ai" | "autocomplete" | "modifier" | "question" | "longtail" | "semantic";
  estimatedVolume?: "high" | "medium" | "low";
  intent?: "informational" | "transactional" | "navigational" | "commercial";
}

export interface KeywordGenerationResult {
  success: boolean;
  keywords?: GeneratedKeyword[];
  error?: string;
}

// Modificateurs français pour Vinted/e-commerce
const FRENCH_MODIFIERS = {
  prefixes: [
    "comment", "pourquoi", "quand", "où", "quel", "quelle",
    "meilleur", "meilleure", "top", "astuce", "conseil",
    "guide", "tutoriel", "avis", "comparatif", "alternative"
  ],
  suffixes: [
    "gratuit", "2025", "2026", "en ligne", "facile", "rapide",
    "pas cher", "pro", "débutant", "astuce", "conseil",
    "guide", "tutoriel", "avis", "france", "application"
  ],
  questions: [
    "comment faire", "comment utiliser", "c'est quoi", "qu'est-ce que",
    "pourquoi", "où trouver", "quel est le meilleur", "combien coûte",
    "est-ce que", "faut-il"
  ],
  intents: {
    transactional: ["acheter", "prix", "tarif", "gratuit", "essayer", "télécharger"],
    informational: ["comment", "guide", "tutoriel", "apprendre", "comprendre"],
    commercial: ["meilleur", "comparatif", "avis", "vs", "alternative"],
    navigational: ["site", "application", "outil", "plateforme"]
  }
};

// Clusters spécifiques à Vinted
const VINTED_CLUSTERS = {
  "photo-ia": ["ia photo", "photo ia", "intelligence artificielle photo", "génération image"],
  "mannequin-ia": ["mannequin virtuel", "avatar", "essayage virtuel", "modèle 3d"],
  "vente": ["vendre", "annonce", "description", "titre", "optimiser"],
  "video": ["video", "clip", "montage", "créer vidéo"],
  "logistique": ["envoi", "colis", "livraison", "mondial relay", "colissimo"],
  "algorithme": ["algorithme", "visibilité", "boost", "ranking"]
};

// 1. Génération IA avec GPT
export async function generateKeywordsWithAI(
  seedKeyword: string,
  context: string = "vinted",
  count: number = 20
): Promise<KeywordGenerationResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Tu es un expert SEO spécialisé dans la recherche de mots-clés pour le marché français.

CONTEXTE: Tu génères des mots-clés pour des blogs qui promeuvent des outils IA pour vendeurs Vinted:
- VintDress: Photos portées IA pour vêtements
- VintBoost: Vidéos de vestiaire automatiques
- VintPower: Génération de descriptions/titres optimisés

RÈGLES:
1. Génère des mots-clés en français uniquement
2. Privilégie les long-tail (3-5 mots)
3. Inclus des questions (comment, pourquoi, quel)
4. Varie les intentions (informationnelle, transactionnelle, commerciale)
5. Inclus des variations avec "gratuit", "2025", "2026", "avis"
6. Pense aux concurrents et alternatives
7. Inclus des termes techniques et grand public

FORMAT DE RÉPONSE (JSON uniquement):
{
  "keywords": [
    {"keyword": "...", "intent": "informational|transactional|commercial|navigational", "volume": "high|medium|low"},
    ...
  ]
}`
        },
        {
          role: "user",
          content: `Génère ${count} mots-clés pertinents basés sur: "${seedKeyword}"
Contexte additionnel: ${context}

Inclus:
- 5 variations directes du mot-clé
- 5 questions (comment, pourquoi, etc.)
- 5 mots-clés transactionnels (avec gratuit, prix, acheter)
- 5 mots-clés long-tail (4-6 mots)

Réponds uniquement en JSON.`
        }
      ],
      temperature: 0.8,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { success: false, error: "Pas de réponse de l'IA" };
    }

    const parsed = JSON.parse(content);
    const keywords: GeneratedKeyword[] = parsed.keywords.map((kw: { keyword: string; intent?: string; volume?: string }) => ({
      keyword: kw.keyword.toLowerCase().trim(),
      source: "ai" as const,
      estimatedVolume: kw.volume as "high" | "medium" | "low",
      intent: kw.intent as "informational" | "transactional" | "navigational" | "commercial"
    }));

    return { success: true, keywords };
  } catch (error) {
    console.error("Error generating keywords with AI:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur IA"
    };
  }
}

// 2. Google Autocomplete (via API gratuite)
export async function getGoogleAutocomplete(
  query: string
): Promise<KeywordGenerationResult> {
  try {
    // API Google Suggest gratuite
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=fr&q=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    // Format: [query, [suggestions]]
    const suggestions: string[] = data[1] || [];

    const keywords: GeneratedKeyword[] = suggestions
      .filter((s: string) => s !== query)
      .map((suggestion: string) => ({
        keyword: suggestion.toLowerCase().trim(),
        source: "autocomplete" as const,
        estimatedVolume: "medium" as const
      }));

    return { success: true, keywords };
  } catch (error) {
    console.error("Error fetching autocomplete:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur autocomplete"
    };
  }
}

// 3. Génération par modificateurs
export async function generateWithModifiers(
  seedKeyword: string
): Promise<KeywordGenerationResult> {
  const keywords: GeneratedKeyword[] = [];
  const seed = seedKeyword.toLowerCase().trim();

  // Préfixes
  for (const prefix of FRENCH_MODIFIERS.prefixes) {
    keywords.push({
      keyword: `${prefix} ${seed}`,
      source: "modifier",
      intent: prefix.startsWith("comment") || prefix.startsWith("guide")
        ? "informational"
        : prefix.startsWith("meilleur") || prefix.startsWith("avis")
        ? "commercial"
        : "informational"
    });
  }

  // Suffixes
  for (const suffix of FRENCH_MODIFIERS.suffixes) {
    keywords.push({
      keyword: `${seed} ${suffix}`,
      source: "modifier",
      intent: suffix === "gratuit" || suffix === "pas cher"
        ? "transactional"
        : suffix === "avis"
        ? "commercial"
        : "informational"
    });
  }

  return { success: true, keywords };
}

// 4. Générateur de questions
export async function generateQuestions(
  seedKeyword: string
): Promise<KeywordGenerationResult> {
  const keywords: GeneratedKeyword[] = [];
  const seed = seedKeyword.toLowerCase().trim();

  const questionPatterns = [
    `comment ${seed}`,
    `comment faire ${seed}`,
    `comment utiliser ${seed}`,
    `pourquoi ${seed}`,
    `c'est quoi ${seed}`,
    `qu'est-ce que ${seed}`,
    `${seed} c'est quoi`,
    `${seed} comment ça marche`,
    `${seed} pour débutant`,
    `${seed} tuto`,
    `${seed} guide complet`,
    `où trouver ${seed}`,
    `quel ${seed} choisir`,
    `${seed} gratuit ou payant`,
    `${seed} vaut le coup`,
    `${seed} avis utilisateur`,
    `${seed} avantages inconvénients`
  ];

  for (const pattern of questionPatterns) {
    keywords.push({
      keyword: pattern,
      source: "question",
      intent: "informational"
    });
  }

  return { success: true, keywords };
}

// 5. Expansion sémantique avec IA
export async function expandSemantically(
  seedKeyword: string,
  existingKeywords: string[] = []
): Promise<KeywordGenerationResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Tu es un expert SEO. Génère des mots-clés sémantiquement liés (LSI keywords) en français.
Inclus:
- Synonymes et variations
- Termes connexes du même champ lexical
- Expressions équivalentes
- Termes techniques et grand public
- Fautes d'orthographe courantes
Réponds en JSON: {"keywords": ["mot1", "mot2", ...]}`
        },
        {
          role: "user",
          content: `Mot-clé seed: "${seedKeyword}"
${existingKeywords.length > 0 ? `Mots-clés existants (à éviter): ${existingKeywords.slice(0, 20).join(", ")}` : ""}
Génère 15 variations sémantiques uniques.`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { success: false, error: "Pas de réponse" };
    }

    const parsed = JSON.parse(content);
    const keywords: GeneratedKeyword[] = (parsed.keywords || []).map((kw: string) => ({
      keyword: kw.toLowerCase().trim(),
      source: "semantic" as const,
      estimatedVolume: "low" as const
    }));

    return { success: true, keywords };
  } catch (error) {
    console.error("Error in semantic expansion:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur expansion"
    };
  }
}

// 6. Combinateur long-tail
export async function generateLongTail(
  seedKeyword: string,
  cluster?: string
): Promise<KeywordGenerationResult> {
  const keywords: GeneratedKeyword[] = [];
  const seed = seedKeyword.toLowerCase().trim();

  // Combinaisons spécifiques Vinted
  const vintedCombinations = [
    `${seed} vinted`,
    `${seed} vinted gratuit`,
    `${seed} vinted 2026`,
    `${seed} pour vinted`,
    `meilleur ${seed} vinted`,
    `${seed} vendre vinted`,
    `${seed} annonce vinted`,
    `application ${seed} vinted`,
    `${seed} vendeur vinted`,
    `${seed} photo vinted`
  ];

  // Si cluster spécifié, ajouter des termes du cluster
  if (cluster && VINTED_CLUSTERS[cluster as keyof typeof VINTED_CLUSTERS]) {
    const clusterTerms = VINTED_CLUSTERS[cluster as keyof typeof VINTED_CLUSTERS];
    for (const term of clusterTerms) {
      keywords.push({
        keyword: `${seed} ${term}`,
        source: "longtail",
        intent: "commercial"
      });
    }
  }

  for (const combo of vintedCombinations) {
    keywords.push({
      keyword: combo,
      source: "longtail",
      intent: "transactional"
    });
  }

  return { success: true, keywords };
}

// 7. Fonction principale: Génération complète
export async function generateAllKeywords(
  seedKeyword: string,
  options: {
    useAI?: boolean;
    useAutocomplete?: boolean;
    useModifiers?: boolean;
    useQuestions?: boolean;
    useSemantic?: boolean;
    useLongTail?: boolean;
    cluster?: string;
    existingKeywords?: string[];
  } = {}
): Promise<KeywordGenerationResult> {
  const {
    useAI = true,
    useAutocomplete = true,
    useModifiers = true,
    useQuestions = true,
    useSemantic = true,
    useLongTail = true,
    cluster,
    existingKeywords = []
  } = options;

  const allKeywords: GeneratedKeyword[] = [];
  const errors: string[] = [];

  // Lancer les générations en parallèle
  const promises: Promise<KeywordGenerationResult>[] = [];

  if (useAI) {
    promises.push(generateKeywordsWithAI(seedKeyword, cluster || "vinted", 25));
  }
  if (useAutocomplete) {
    promises.push(getGoogleAutocomplete(seedKeyword));
    // Aussi avec variations
    promises.push(getGoogleAutocomplete(`${seedKeyword} vinted`));
    promises.push(getGoogleAutocomplete(`comment ${seedKeyword}`));
  }
  if (useModifiers) {
    promises.push(generateWithModifiers(seedKeyword));
  }
  if (useQuestions) {
    promises.push(generateQuestions(seedKeyword));
  }
  if (useSemantic) {
    promises.push(expandSemantically(seedKeyword, existingKeywords));
  }
  if (useLongTail) {
    promises.push(generateLongTail(seedKeyword, cluster));
  }

  const results = await Promise.allSettled(promises);

  for (const result of results) {
    if (result.status === "fulfilled" && result.value.success && result.value.keywords) {
      allKeywords.push(...result.value.keywords);
    } else if (result.status === "fulfilled" && result.value.error) {
      errors.push(result.value.error);
    } else if (result.status === "rejected") {
      errors.push(result.reason?.message || "Unknown error");
    }
  }

  // Dédupliquer par keyword
  const seen = new Set<string>();
  const uniqueKeywords = allKeywords.filter(kw => {
    const normalized = kw.keyword.toLowerCase().trim();
    if (seen.has(normalized) || existingKeywords.includes(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });

  // Trier par source (AI en premier car meilleure qualité)
  const sourceOrder = { ai: 0, autocomplete: 1, semantic: 2, longtail: 3, question: 4, modifier: 5 };
  uniqueKeywords.sort((a, b) =>
    (sourceOrder[a.source] || 99) - (sourceOrder[b.source] || 99)
  );

  return {
    success: true,
    keywords: uniqueKeywords
  };
}

// 8. Analyse de concurrents (extraire mots-clés d'une URL)
export async function analyzeCompetitorKeywords(
  topic: string
): Promise<KeywordGenerationResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Tu es un expert SEO. Analyse le sujet donné et génère les mots-clés qu'un concurrent utiliserait.

Pense à:
- Les mots-clés principaux du sujet
- Les long-tail keywords
- Les questions fréquentes
- Les termes techniques
- Les mots-clés transactionnels
- Les comparaisons (vs, alternative, meilleur)

Format JSON: {"keywords": [{"keyword": "...", "priority": 1-3}]}`
        },
        {
          role: "user",
          content: `Sujet/Niche: ${topic}

Génère 30 mots-clés qu'un concurrent dans cette niche ciblerait pour le marché français.`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { success: false, error: "Pas de réponse" };
    }

    const parsed = JSON.parse(content);
    const keywords: GeneratedKeyword[] = (parsed.keywords || []).map((kw: { keyword: string; priority?: number }) => ({
      keyword: kw.keyword.toLowerCase().trim(),
      source: "ai" as const,
      estimatedVolume: kw.priority === 1 ? "high" : kw.priority === 2 ? "medium" : "low"
    }));

    return { success: true, keywords };
  } catch (error) {
    console.error("Error analyzing competitor:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur analyse"
    };
  }
}
