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

3. **Conclusion** (100-150 mots)
   - Récapitulatif des points clés
   - Call-to-action motivant (pas de vente directe)
   - Question ouverte pour l'engagement

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

interface ImprovedArticle {
  title: string;
  summary: string;
  content: string;
  faq: Array<{ question: string; answer: string }>;
}

export async function improveArticleWithGemini(
  article: ArticleInput
): Promise<ImprovedArticle> {
  const client = getGeminiClient();
  // Utiliser gemini-2.0-flash (rapide et gratuit) ou gemini-1.5-pro-latest
  const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });

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
- Avec des CTA subtils vers nos produits

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

  try {
    const parsed = JSON.parse(jsonMatch[0]) as ImprovedArticle;
    return parsed;
  } catch (error) {
    throw new Error(`Failed to parse Gemini JSON response: ${error}`);
  }
}
