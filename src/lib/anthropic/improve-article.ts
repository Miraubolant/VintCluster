import { getAnthropicClient } from "./client";

// Prompt SEO Expert ultra-optimisé pour Claude
const SEO_EXPERT_SYSTEM_PROMPT = `Tu es un expert SEO de niveau mondial avec 15 ans d'expérience en rédaction de contenu qui génère du trafic organique massif. Tu maîtrises parfaitement :
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
- Format des liens : [🚀 Texte du CTA](https://url.com)

## STRUCTURE SEO OPTIMALE
L'article DOIT suivre cette structure :

1. **Introduction captivante** (150-200 mots)
   - Hook émotionnel ou statistique surprenante
   - Problématique claire
   - Promesse de valeur
   - Pas de CTA ici

2. **Corps de l'article** (1500-2000 mots minimum)
   - 5-7 sections avec H2 optimisés (inclure le mot-clé ou variante)
   - Sous-sections H3 quand pertinent
   - Listes à puces pour la scannabilité
   - Paragraphes courts (3-4 lignes max)
   - Transitions fluides entre sections
   - 1 mention produit subtile vers le milieu
   - 1 mention produit subtile vers la fin

3. **Conclusion actionnable** (100-150 mots)
   - Récapitulatif des points clés
   - Call-to-action motivant (pas de vente directe)
   - Question ouverte pour l'engagement

## OPTIMISATIONS SEO OBLIGATOIRES
- Mot-clé principal dans : titre H1, premier paragraphe, 1 H2, conclusion
- Densité mot-clé : 1-2% (naturel, pas de bourrage)
- Mots-clés LSI et synonymes variés tout au long du texte
- Phrases courtes et vocabulaire accessible
- Utiliser "tu/toi" (tutoiement) pour créer de la proximité
- Ajouter des données chiffrées quand possible (stats, pourcentages)

## TECHNIQUES ANTI-DÉTECTION IA ESSENTIELLES
- Varier considérablement la longueur des phrases (5 à 25 mots)
- Inclure des expressions idiomatiques françaises naturelles
- Ajouter des anecdotes personnelles ou exemples très concrets
- Utiliser des questions rhétoriques pour engager le lecteur
- Éviter absolument les structures répétitives
- Inclure des opinions nuancées ("certains pensent que...", "d'un autre côté...")
- Ajouter des imperfections stylistiques volontaires (comme à l'oral)
- Utiliser des connecteurs variés (bref, en fait, d'ailleurs, justement...)

## FORMAT DE SORTIE STRICT
Tu dois retourner UNIQUEMENT un JSON valide avec cette structure exacte, sans aucun texte avant ou après :
{
  "title": "Titre H1 optimisé SEO (50-60 caractères)",
  "summary": "Meta description optimisée (150-160 caractères, inclut mot-clé et CTA implicite)",
  "content": "Contenu Markdown complet avec H2, H3, listes, etc.",
  "faq": [
    {"question": "Question fréquente 1 ?", "answer": "Réponse détaillée..."},
    {"question": "Question fréquente 2 ?", "answer": "Réponse détaillée..."},
    {"question": "Question fréquente 3 ?", "answer": "Réponse détaillée..."},
    {"question": "Question fréquente 4 ?", "answer": "Réponse détaillée..."},
    {"question": "Question fréquente 5 ?", "answer": "Réponse détaillée..."}
  ]
}`;

interface ArticleInput {
  title: string;
  summary: string;
  content: string;
  keyword?: string;
  cluster?: string;
}

interface ImprovedArticle {
  title: string;
  summary: string;
  content: string;
  faq: Array<{ question: string; answer: string }>;
}

export async function improveArticleWithClaude(
  article: ArticleInput
): Promise<ImprovedArticle> {
  const client = getAnthropicClient();

  const userPrompt = `## ARTICLE À RÉÉCRIRE COMPLÈTEMENT

**Titre actuel:** ${article.title}

**Résumé actuel:** ${article.summary}

**Mot-clé principal:** ${article.keyword || "à extraire du titre"}

**Cluster thématique:** ${article.cluster || "vente Vinted"}

**Contenu actuel (à utiliser comme base pour comprendre le sujet):**
${article.content.substring(0, 4000)}

---

RÉÉCRIS ENTIÈREMENT cet article en appliquant TOUTES les règles SEO et les techniques anti-détection IA.

Objectifs :
- Article final 2x plus long que l'original (minimum 2000 mots)
- Contenu 10x plus engageant et utile
- Parfaitement optimisé pour le mot-clé principal
- Impossible à détecter comme généré par IA
- CTA subtils et naturels vers nos produits Vint*
- FAQ enrichie avec 5 questions pertinentes

IMPORTANT : Retourne UNIQUEMENT le JSON valide, sans aucun commentaire, explication ou texte avant/après le JSON.`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
    system: SEO_EXPERT_SYSTEM_PROMPT,
  });

  // Extraire le texte de la réponse
  const textContent = message.content.find((block) => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text content in Claude response");
  }

  const response = textContent.text;

  // Extraire le JSON de la réponse
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse Claude response as JSON");
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as ImprovedArticle;
    return parsed;
  } catch (error) {
    throw new Error(`Failed to parse Claude JSON response: ${error}`);
  }
}
