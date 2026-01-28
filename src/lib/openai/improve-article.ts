import { getOpenAIClient } from "./client";
import type { FAQItem } from "@/types/database";

// Model options for improvement
export type ImprovementModel = "gpt-4o" | "gpt-4-turbo";

export interface ImprovedArticle {
  title: string;
  content: string;
  summary: string;
  faq: FAQItem[];
}

export interface ImprovementOptions {
  model: ImprovementModel;
}

// Configuration des modèles disponibles
export const IMPROVEMENT_MODELS: Record<ImprovementModel, { name: string; description: string; speed: string }> = {
  "gpt-4o": {
    name: "GPT-4o",
    description: "Le plus rapide, excellent rapport qualité/vitesse",
    speed: "~15s/article",
  },
  "gpt-4-turbo": {
    name: "GPT-4 Turbo",
    description: "Plus de créativité, meilleure qualité d'écriture",
    speed: "~25s/article",
  },
};

const IMPROVEMENT_SYSTEM_PROMPT = `Tu es un expert en rédaction SEO et optimisation de contenu pour l'IA. Tu améliores des articles de blog existants sur la vente sur Vinted et les outils IA pour vendeurs.

## OBJECTIF
Transformer un article existant en un contenu premium de 1500-2000 mots, optimisé pour :
- Le référencement Google (SEO traditionnel)
- L'affichage en featured snippets
- Les réponses IA (ChatGPT, Perplexity, Google SGE)

## NOS PRODUITS SAAS (à intégrer naturellement)
1. **VintDress** (vintdress.com) - Génère des photos portées réalistes en 30 secondes avec l'IA. Pas de mannequin, pas de shooting.
2. **VintBoost** (vintboost.com) - Génère des vidéos professionnelles de ton vestiaire en 30 secondes. Zéro montage requis.
3. **VintPower** (vintpower.com) - IA qui génère titre, description et prix optimisés + extension Vinted.

## TON & STYLE
- Blog personnel, comme un ami qui partage ses conseils
- Tutoiement OBLIGATOIRE ("tu", "ton", "ta", "tes")
- Conversationnel mais informatif
- Évite le jargon technique excessif
- Phrases courtes et percutantes
- Utilise des expressions françaises naturelles

## VOCABULAIRE VINTED À UTILISER
Intègre naturellement ces termes : vendeur, acheteur, vestiaire, boost, mise en avant, algorithme Vinted, photos, annonces, descriptions, négociation, livraison Mondial Relay, Vinted Pro, évaluation, followers, favoris, offres, bundle, lot

## STRUCTURE OBLIGATOIRE (1500-2000 mots)

### 1. Introduction (100-150 mots)
- Commence par une RÉPONSE DIRECTE à la question principale (format featured snippet)
- Accroche personnelle qui connecte avec le lecteur
- N'utilise PAS de H2 dans l'intro

### 2. Corps de l'article (1200-1600 mots)
- 4-5 sections avec titres H2 clairs et descriptifs
- Sous-sections H3 quand pertinent (1-2 par H2 max)
- Listes à puces pour les conseils pratiques
- Paragraphes courts (3-4 phrases max)
- Données chiffrées avec sources crédibles

### 3. Conclusion (80-120 mots)
- Résumé des points clés
- Call-to-action final encourageant

## DONNÉES & SOURCES CRÉDIBLES
Utilise des données fictives mais réalistes :
- "Selon une étude interne VintDress auprès de 500 vendeurs..."
- "Les utilisateurs de VintBoost rapportent en moyenne +45% de vues..."
- "D'après les retours de la communauté VintPower..."
- "Une analyse de 1000 annonces Vinted montre que..."
Chiffres cohérents : +30% à +50% ventes, 2x à 3x plus de vues, 50% temps gagné, 80% des vendeurs top utilisent...

## OPTIMISATION AI SEARCH (CRITIQUE)
- Paragraphes "snippet-ready" de 40-60 mots répondant à UNE question précise
- Définitions claires en début de section
- Listes numérotées pour les processus étape par étape
- Format "Question implicite → Réponse directe → Développement"
- Chaque H2 doit pouvoir être une réponse à "Comment..." ou "Pourquoi..."

## CTA FORMAT (2-3 par article)
- Format Markdown : **[🚀 Texte d'action](https://produit.com)**
- Placer APRÈS avoir identifié un problème que le produit résout
- CTA sur leur propre ligne, précédé et suivi d'une ligne vide
- Textes variés : "Essayer gratuitement", "Tester maintenant", "Découvrir", "Commencer"
- Espacement : un CTA dans le premier tiers, un au milieu, un vers la fin

## FAQ ENRICHIE (5-6 questions)
- Questions que les gens tapent vraiment sur Google
- Commencer par des verbes d'action : "Comment", "Pourquoi", "Combien", "Est-ce que", "Quel est"
- Réponses de 50-80 mots, directes et complètes
- Inclure des chiffres ou exemples concrets dans les réponses
- Format optimisé pour les featured snippets Google

## RÈGLES IMPORTANTES
- Ne JAMAIS inventer de fonctionnalités qui n'existent pas pour nos produits
- Garder la cohérence avec le sujet original
- Améliorer sans dénaturer le message initial
- Markdown propre et bien formaté (pas de HTML)
- Pas de phrase d'accroche cliché type "Dans cet article, nous allons..."
- Éviter "il est important de noter", "en effet", "ainsi", "par conséquent" en excès`;

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

  const existingFaqFormatted = existingArticle.faq && existingArticle.faq.length > 0
    ? existingArticle.faq.map((f, i) => `${i + 1}. Q: ${f.question}\n   R: ${f.answer}`).join("\n")
    : "Aucune FAQ existante";

  const userPrompt = `Améliore cet article existant en suivant TOUTES les directives du système.

## ARTICLE ACTUEL À AMÉLIORER

**Titre actuel:** ${existingArticle.title}

**Contenu actuel:**
${existingArticle.content}

**Résumé actuel:** ${existingArticle.summary || "Aucun résumé"}

**FAQ actuelle:**
${existingFaqFormatted}

---

## INSTRUCTIONS D'AMÉLIORATION

1. GARDE le sujet principal mais enrichis le contenu
2. AUGMENTE la longueur à 1500-2000 mots
3. AMÉLIORE le titre pour plus d'impact SEO (garde l'intention, améliore la formulation)
4. RESTRUCTURE avec 4-5 sections H2 bien définies
5. ENRICHIS la FAQ avec 5-6 questions pertinentes (garde les meilleures existantes)
6. AJOUTE 2-3 CTA vers VintDress/VintBoost/VintPower selon le contexte
7. INTÈGRE des données chiffrées crédibles
8. OPTIMISE pour les featured snippets et l'AI search

Retourne UNIQUEMENT un JSON valide avec cette structure exacte (sans aucun texte avant ou après):
{
  "title": "Nouveau titre optimisé (50-65 caractères)",
  "content": "Contenu complet amélioré en Markdown avec ## pour H2 et ### pour H3",
  "summary": "Nouvelle meta description optimisée (150-160 caractères)",
  "faq": [
    {"question": "Question 1?", "answer": "Réponse complète 1 (50-80 mots)"},
    {"question": "Question 2?", "answer": "Réponse complète 2 (50-80 mots)"},
    {"question": "Question 3?", "answer": "Réponse complète 3 (50-80 mots)"},
    {"question": "Question 4?", "answer": "Réponse complète 4 (50-80 mots)"},
    {"question": "Question 5?", "answer": "Réponse complète 5 (50-80 mots)"}
  ]
}`;

  const response = await openai.chat.completions.create({
    model: options.model,
    messages: [
      { role: "system", content: IMPROVEMENT_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 4096,
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

  // Validate minimum requirements
  if (!parsed.title || parsed.title.length < 10) {
    throw new Error("Titre invalide ou trop court");
  }

  if (!parsed.content || parsed.content.length < 2000) {
    throw new Error("Contenu trop court (minimum 1500 mots attendus)");
  }

  if (!parsed.faq || parsed.faq.length < 5) {
    throw new Error("FAQ insuffisante (minimum 5 questions attendues)");
  }

  return {
    title: parsed.title,
    content: parsed.content,
    summary: parsed.summary || existingArticle.summary,
    faq: parsed.faq,
  };
}
