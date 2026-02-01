/**
 * SEO Score Calculator
 * Analyse le contenu d'un article et calcule un score SEO (0-100)
 */

export interface SEOAnalysis {
  score: number; // 0-100
  wordCount: number;
  headingCount: number;
  internalLinks: number;
  externalLinks: number;
  readingTime: number; // minutes
  details: {
    wordCountScore: number;
    headingScore: number;
    keywordDensityScore: number;
    internalLinksScore: number;
    externalLinksScore: number;
    imageScore: number;
    faqScore: number;
    summaryScore: number;
  };
  issues: string[];
  suggestions: string[];
}

interface FAQItem {
  question: string;
  answer: string;
}

/**
 * Calcule le score SEO d'un article
 * @param content Contenu Markdown de l'article
 * @param title Titre de l'article
 * @param summary Résumé/meta description
 * @param keyword Mot-clé principal (optionnel)
 * @param imageUrl URL de l'image (optionnel)
 * @param faq FAQ de l'article (optionnel)
 */
export function analyzeArticleSEO(
  content: string,
  title: string,
  summary?: string | null,
  keyword?: string | null,
  imageUrl?: string | null,
  faq?: FAQItem[] | null
): SEOAnalysis {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // 1. Nombre de mots (20 pts max)
  const words = content.trim().split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  let wordCountScore = 0;
  if (wordCount >= 1500) {
    wordCountScore = 20;
  } else if (wordCount >= 1000) {
    wordCountScore = 15;
  } else if (wordCount >= 500) {
    wordCountScore = 10;
  } else {
    wordCountScore = 5;
    issues.push(`Article trop court (${wordCount} mots)`);
    suggestions.push("Viser au moins 1000-1500 mots pour un meilleur SEO");
  }

  // 2. Headings H2/H3 (15 pts max)
  const h2Matches = content.match(/^## .+$/gm) || [];
  const h3Matches = content.match(/^### .+$/gm) || [];
  const headingCount = h2Matches.length + h3Matches.length;
  let headingScore = 0;
  if (h2Matches.length >= 3 && h2Matches.length <= 8) {
    headingScore = 15;
  } else if (h2Matches.length >= 2) {
    headingScore = 10;
  } else if (h2Matches.length >= 1) {
    headingScore = 5;
  } else {
    issues.push("Aucun titre H2 trouvé");
    suggestions.push("Ajouter 3-6 titres H2 pour structurer l'article");
  }

  // 3. Densité du mot-clé (15 pts max)
  let keywordDensityScore = 0;
  if (keyword) {
    const keywordLower = keyword.toLowerCase();
    const contentLower = content.toLowerCase();
    const keywordOccurrences = (contentLower.match(new RegExp(keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    const density = (keywordOccurrences / wordCount) * 100;

    if (density >= 1 && density <= 3) {
      keywordDensityScore = 15;
    } else if (density > 0 && density < 1) {
      keywordDensityScore = 10;
      suggestions.push("Augmenter légèrement la densité du mot-clé");
    } else if (density > 3 && density <= 5) {
      keywordDensityScore = 8;
      suggestions.push("Densité mot-clé un peu élevée, attention au keyword stuffing");
    } else if (density > 5) {
      keywordDensityScore = 5;
      issues.push("Sur-optimisation du mot-clé détectée");
    } else {
      keywordDensityScore = 5;
      issues.push("Mot-clé absent du contenu");
    }
  } else {
    keywordDensityScore = 10; // Score moyen si pas de mot-clé défini
  }

  // 4. Liens internes (10 pts max)
  const internalLinkPattern = /\[([^\]]+)\]\((?!https?:\/\/)([^)]+)\)/g;
  const internalLinksMatches = content.match(internalLinkPattern) || [];
  const internalLinks = internalLinksMatches.length;
  let internalLinksScore = 0;
  if (internalLinks >= 2 && internalLinks <= 5) {
    internalLinksScore = 10;
  } else if (internalLinks >= 1) {
    internalLinksScore = 7;
    suggestions.push("Ajouter plus de liens internes (2-5 recommandés)");
  } else {
    internalLinksScore = 3;
    issues.push("Aucun lien interne trouvé");
    suggestions.push("Ajouter des liens vers d'autres articles du site");
  }

  // 5. Liens externes (10 pts max)
  const externalLinkPattern = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  const externalLinksMatches = content.match(externalLinkPattern) || [];
  const externalLinks = externalLinksMatches.length;
  let externalLinksScore = 0;
  if (externalLinks >= 1 && externalLinks <= 5) {
    externalLinksScore = 10;
  } else if (externalLinks > 5) {
    externalLinksScore = 7;
    suggestions.push("Trop de liens externes peut diluer le SEO");
  } else {
    externalLinksScore = 5;
    suggestions.push("Ajouter 1-3 liens vers des sources de qualité");
  }

  // 6. Image (10 pts max)
  let imageScore = 0;
  if (imageUrl) {
    imageScore = 10;
  } else {
    imageScore = 0;
    issues.push("Pas d'image principale");
    suggestions.push("Ajouter une image avec un texte alternatif descriptif");
  }

  // 7. FAQ (10 pts max)
  let faqScore = 0;
  const faqCount = faq?.length || 0;
  if (faqCount >= 5) {
    faqScore = 10;
  } else if (faqCount >= 3) {
    faqScore = 7;
  } else if (faqCount >= 1) {
    faqScore = 4;
    suggestions.push("Ajouter plus de questions FAQ (5+ recommandé)");
  } else {
    faqScore = 0;
    issues.push("Pas de FAQ");
    suggestions.push("Ajouter une FAQ avec 5 questions pertinentes");
  }

  // 8. Summary/Meta description (10 pts max)
  let summaryScore = 0;
  const summaryLength = summary?.length || 0;
  if (summaryLength >= 120 && summaryLength <= 160) {
    summaryScore = 10;
  } else if (summaryLength >= 100 && summaryLength <= 180) {
    summaryScore = 7;
  } else if (summaryLength > 0) {
    summaryScore = 4;
    if (summaryLength < 100) {
      suggestions.push("Meta description trop courte (viser 120-160 caractères)");
    } else {
      suggestions.push("Meta description trop longue (viser 120-160 caractères)");
    }
  } else {
    summaryScore = 0;
    issues.push("Pas de meta description");
  }

  // Calcul du score total
  const totalScore =
    wordCountScore +
    headingScore +
    keywordDensityScore +
    internalLinksScore +
    externalLinksScore +
    imageScore +
    faqScore +
    summaryScore;

  // Temps de lecture (200 mots/minute)
  const readingTime = Math.ceil(wordCount / 200);

  return {
    score: totalScore,
    wordCount,
    headingCount,
    internalLinks,
    externalLinks,
    readingTime,
    details: {
      wordCountScore,
      headingScore,
      keywordDensityScore,
      internalLinksScore,
      externalLinksScore,
      imageScore,
      faqScore,
      summaryScore,
    },
    issues,
    suggestions,
  };
}

/**
 * Retourne une couleur basée sur le score SEO
 */
export function getSEOScoreColor(score: number): string {
  if (score >= 80) return "green";
  if (score >= 60) return "yellow";
  if (score >= 40) return "orange";
  return "red";
}

/**
 * Retourne un label basé sur le score SEO
 */
export function getSEOScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Bon";
  if (score >= 40) return "Moyen";
  return "Faible";
}
