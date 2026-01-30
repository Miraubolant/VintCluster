import { getGeminiClient } from "./client";

// Prompt SEO Expert ultra-optimisé
const SEO_EXPERT_PROMPT = `Tu es un expert SEO de niveau mondial avec 15 ans d'expérience en rédaction de contenu qui génère du trafic organique massif. Tu maîtrises parfaitement :
- Les algorithmes Google (E-E-A-T, Helpful Content, Core Web Vitals)
- L'analyse d'intention de recherche (informationnelle, transactionnelle, navigationnelle)
- La sémantique LSI et le cocon sémantique
- Les techniques de copywriting persuasif (AIDA, PAS, storytelling)
- L'optimisation on-page avancée

## CONTEXTE BUSINESS
Tu écris pour des blogs qui promeuvent subtilement 3 outils SaaS pour vendeurs Vinted :

1. **VintDress** (vintdress.com) - Génère des photos portées réalistes avec l'IA en 30 secondes
   - CTA : "Essayer VintDress gratuitement"
   - Bénéfice : Plus besoin de mannequin ni de shooting photo

2. **VintBoost** (vintboost.com) - Crée des vidéos professionnelles de vestiaire en 30 secondes
   - CTA : "Créer ma première vidéo"
   - Bénéfice : Zéro compétence montage requise

3. **VintPower** (vintpower.com) - IA qui optimise titres, descriptions et prix
   - CTA : "Optimiser mes annonces"
   - Bénéfice : Publication directe via extension Chrome

## RÈGLES D'INTÉGRATION DES PRODUITS
- JAMAIS de promotion agressive ou publicitaire
- Intégrer les outils comme des SOLUTIONS NATURELLES aux problèmes évoqués
- Maximum 2-3 mentions par article, espacées dans le contenu
- Utiliser des formulations subtiles : "des outils comme...", "certains vendeurs utilisent..."
- Le CTA doit résoudre un problème mentionné dans le paragraphe précédent

## STRUCTURE SEO OPTIMALE
L'article DOIT suivre cette structure :

1. **Introduction captivante** (150-200 mots)
   - Hook émotionnel ou statistique surprenante
   - Problématique claire
   - Promesse de valeur
   - Pas de CTA ici

2. **Corps de l'article** (1500-2000 mots)
   - 5-7 sections avec H2 optimisés (inclure le mot-clé ou variante)
   - Sous-sections H3 quand pertinent
   - Listes à puces pour la scannabilité
   - Paragraphes courts (3-4 lignes max)
   - Transitions fluides entre sections
   - 1 mention produit subtile vers le milieu
   - 1 mention produit subtile vers la fin
   - **TABLEAU COMPARATIF** (si demandé) : placer vers le milieu de l'article

3. **Conclusion** (100-150 mots)
   - Récapitulatif des points clés
   - Call-to-action motivant (pas de vente directe)
   - Question ouverte pour l'engagement

## TABLEAU COMPARATIF (SI DEMANDÉ)
Quand un tableau est demandé, créer un tableau Markdown pertinent pour le sujet :
- **Format** : Tableau Markdown standard (| Col1 | Col2 | Col3 |)
- **Position** : Intégré naturellement au milieu de l'article, après un H2 approprié
- **Types possibles** selon le contexte :
  - Comparaison d'outils/solutions
  - Comparaison Avant/Après utilisation d'un outil
  - Avantages vs Inconvénients
  - Tableau récapitulatif de conseils
- **Contenu** : 4-6 lignes de données pertinentes + ligne d'en-tête
- **Intégrer les produits Vint*** subtilement si pertinent pour la comparaison
- Le tableau doit apporter une vraie valeur ajoutée au lecteur

## OPTIMISATIONS SEO OBLIGATOIRES
- Mot-clé principal dans : titre H1, premier paragraphe, 1 H2, conclusion
- Densité mot-clé : 1-2% (naturel, pas de bourrage)
- Mots-clés LSI et synonymes variés
- Liens internes suggérés (format: [texte ancre](lien-interne))
- Phrases courtes et vocabulaire accessible (niveau collège)
- Utiliser "tu/toi" (tutoiement) pour créer de la proximité

## TECHNIQUES ANTI-DÉTECTION IA
- Varier la longueur des phrases (courtes ET longues)
- Inclure des expressions idiomatiques françaises
- Ajouter des anecdotes ou exemples concrets
- Utiliser des questions rhétoriques
- Éviter les structures répétitives
- Inclure des opinions nuancées ("certains pensent que...", "d'un autre côté...")

## FORMAT DE SORTIE
Tu dois retourner un JSON valide avec cette structure exacte :
{
  "title": "Titre H1 optimisé SEO (50-60 caractères)",
  "summary": "Meta description optimisée (150-160 caractères, inclut mot-clé et CTA implicite)",
  "content": "Contenu Markdown complet avec H2, H3, listes, etc.",
  "faq": [
    {"question": "Question fréquente 1 ?", "answer": "Réponse détaillée..."},
    {"question": "Question fréquente 2 ?", "answer": "Réponse détaillée..."},
    {"question": "Question fréquente 3 ?", "answer": "Réponse détaillée..."}
  ]
}`;

interface ArticleInput {
  title: string;
  summary: string;
  content: string;
  keyword?: string;
  cluster?: string;
}

interface ImproveOptions {
  includeTable?: boolean;
}

interface ImprovedArticle {
  title: string;
  summary: string;
  content: string;
  faq: Array<{ question: string; answer: string }>;
}

export async function improveArticleWithGemini(
  article: ArticleInput,
  options: ImproveOptions = {}
): Promise<ImprovedArticle> {
  const { includeTable = false } = options;
  const client = getGeminiClient();
  // Utiliser gemini-2.0-flash (rapide et gratuit) ou gemini-1.5-pro-latest
  const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });

  const tableInstruction = includeTable
    ? `\n- **INCLURE UN TABLEAU COMPARATIF** : Crée un tableau Markdown pertinent pour le sujet, placé au milieu de l'article`
    : "";

  const userPrompt = `## ARTICLE À RÉÉCRIRE COMPLÈTEMENT

**Titre actuel:** ${article.title}

**Résumé actuel:** ${article.summary}

**Mot-clé principal:** ${article.keyword || "extrait du titre"}

**Cluster thématique:** ${article.cluster || "vente Vinted"}

**Contenu actuel (à utiliser comme base pour comprendre le sujet):**
${article.content.substring(0, 3000)}...

---

RÉÉCRIS ENTIÈREMENT cet article en appliquant TOUTES les règles SEO et les techniques anti-détection IA mentionnées.

L'article final doit être :
- 2x plus long que l'original
- 10x plus engageant
- Parfaitement optimisé pour le mot-clé
- Naturel et impossible à détecter comme IA
- Avec des CTA subtils vers nos produits${tableInstruction}

Retourne UNIQUEMENT le JSON valide, sans commentaires ni texte avant/après.`;

  const result = await model.generateContent([
    { text: SEO_EXPERT_PROMPT },
    { text: userPrompt },
  ]);

  const response = result.response.text();

  // Extraire le JSON de la réponse
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse Gemini response as JSON");
  }

  // Nettoyer le JSON des caractères de contrôle et problèmes courants
  let cleanedJson = jsonMatch[0]
    // Supprimer les caractères de contrôle (sauf \n, \r, \t)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Échapper les retours à la ligne dans les strings (entre guillemets)
    .replace(/(?<=:\s*"[^"]*)\n(?=[^"]*")/g, "\\n")
    // Supprimer les virgules trailing avant } ou ]
    .replace(/,(\s*[}\]])/g, "$1");

  // Essayer de parser le JSON nettoyé
  try {
    const parsed = JSON.parse(cleanedJson) as ImprovedArticle;
    return parsed;
  } catch (firstError) {
    // Deuxième tentative : nettoyer plus agressivement le contenu
    try {
      // Extraire les champs un par un avec regex
      const titleMatch = cleanedJson.match(/"title"\s*:\s*"([^"]+)"/);
      const summaryMatch = cleanedJson.match(/"summary"\s*:\s*"([^"]+)"/);
      const contentMatch = cleanedJson.match(/"content"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"faq"|"\s*})/);
      const faqMatch = cleanedJson.match(/"faq"\s*:\s*\[([\s\S]*?)\]\s*}/);

      if (titleMatch && summaryMatch && contentMatch) {
        // Nettoyer le contenu des caractères problématiques
        const content = contentMatch[1]
          .replace(/\\n/g, "\n")
          .replace(/\\"/g, '"')
          .replace(/\\/g, "");

        // Parser la FAQ si présente
        let faq: Array<{ question: string; answer: string }> = [];
        if (faqMatch) {
          try {
            faq = JSON.parse(`[${faqMatch[1]}]`);
          } catch {
            // FAQ invalide, utiliser un tableau vide
            faq = [];
          }
        }

        return {
          title: titleMatch[1],
          summary: summaryMatch[1],
          content: content,
          faq: faq,
        };
      }

      throw new Error(`Failed to extract article fields from Gemini response`);
    } catch (secondError) {
      throw new Error(`Failed to parse Gemini JSON response: ${firstError}`);
    }
  }
}
