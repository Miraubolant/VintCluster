import { getOpenAIClient } from "./client";
import { generateSlug } from "@/lib/utils/slug";
import type { FAQItem } from "@/types/database";

export interface GeneratedArticle {
  title: string;
  slug: string;
  content: string;
  summary: string;
  faq: FAQItem[];
}

// Configuration des produits SaaS à promouvoir
export const VINT_PRODUCTS = {
  vintdress: {
    name: "VintDress",
    url: "https://vintdress.com",
    description: "Génère des photos portées réalistes en 30 secondes avec l'IA. Pas de mannequin, pas de shooting - juste des images qui vendent !",
    cta: "Essayer VintDress gratuitement",
  },
  vintboost: {
    name: "VintBoost",
    url: "https://vintboost.com",
    description: "Génère des vidéos professionnelles de ton vestiaire en 30 secondes. Zéro montage requis !",
    cta: "Créer ma première vidéo",
  },
  vintpower: {
    name: "VintPower",
    url: "https://vintpower.com",
    description: "Notre IA génère titre, description et prix optimisés à partir de vos photos. Publiez directement sur Vinted avec notre extension.",
    cta: "Optimiser mes annonces",
  },
};

// Mapping cluster → produit à promouvoir
const CLUSTER_TO_PRODUCT: Record<string, keyof typeof VINT_PRODUCTS | "all"> = {
  "photo": "vintdress",
  "photo-ia": "vintdress",
  "photo-technique": "vintdress",
  "video": "vintboost",
  "mannequin-ia": "vintboost",
  "mannequin": "vintboost",
  "vendre": "vintpower",
  "vente": "vintpower",
  "outils-vinted": "vintpower",
  "algorithme": "all",
  "tendances": "all",
  "logistique": "all",
  "paiement": "all",
};

function getProductsForCluster(cluster?: string): string {
  if (!cluster) {
    return `Tu peux mentionner nos 3 produits selon la pertinence du sujet:
- VintDress (vintdress.com) pour les photos portées IA
- VintBoost (vintboost.com) pour les vidéos de vestiaire
- VintPower (vintpower.com) pour optimiser les annonces`;
  }

  const productKey = CLUSTER_TO_PRODUCT[cluster.toLowerCase()];

  if (productKey === "all" || !productKey) {
    return `Tu peux mentionner nos 3 produits selon la pertinence:
- VintDress (vintdress.com) pour les photos portées IA
- VintBoost (vintboost.com) pour les vidéos de vestiaire
- VintPower (vintpower.com) pour optimiser les annonces`;
  }

  const product = VINT_PRODUCTS[productKey];
  return `Produit principal à promouvoir: **${product.name}** (${product.url})
${product.description}
CTA principal: "${product.cta}"`;
}

const SYSTEM_PROMPT = `Tu es un expert en rédaction SEO spécialisé dans la vente sur Vinted et les outils IA pour vendeurs.
Tu génères des articles de blog optimisés pour le référencement naturel qui promeuvent subtilement nos produits SaaS.

## Nos 3 Produits SaaS :
1. **VintDress** (vintdress.com) - Génère des photos portées réalistes en 30 secondes avec l'IA. Pas de mannequin, pas de shooting - juste des images qui vendent !
2. **VintBoost** (vintboost.com) - Génère des vidéos professionnelles de ton vestiaire en 30 secondes. Zéro montage requis !
3. **VintPower** (vintpower.com) - Notre IA génère titre, description et prix optimisés à partir de vos photos. Publiez directement sur Vinted avec notre extension.

## Règles de rédaction :
- Contenu original, informatif et engageant (1000-1500 mots)
- Ton professionnel mais accessible, tutoiement
- Listes à puces pour les conseils pratiques
- Intégration naturelle du mot-clé principal sans sur-optimisation
- Évite le contenu dupliqué et les phrases génériques

## FORMATAGE MARKDOWN OBLIGATOIRE (TRÈS IMPORTANT) :
- Titres H2 : utiliser "## " (deux dièses + espace) - JAMAIS de **gras** pour les titres
- Titres H3 : utiliser "### " (trois dièses + espace) pour les sous-sections
- Une ligne vide AVANT et APRÈS chaque titre
- Une ligne vide entre chaque paragraphe
- Listes à puces avec "- " (tiret + espace)

EXEMPLE DE FORMAT CORRECT:
\`\`\`
## Premier Titre Principal

Premier paragraphe avec du texte informatif.

Deuxième paragraphe séparé par une ligne vide.

### Sous-section

Contenu de la sous-section.

- Point de liste 1
- Point de liste 2

## Deuxième Titre Principal

Suite de l'article...
\`\`\`

## CTA OBLIGATOIRES :
- Insérer 2-3 liens vers le produit le plus pertinent selon le sujet
- Format lien : [Texte descriptif](https://produit.com)
- Intégrer naturellement dans les phrases, pas sur des lignes isolées
- Le lien doit résoudre un problème mentionné dans le paragraphe

Exemple d'intégration naturelle:
"Pour gagner du temps sur tes photos, des outils comme [VintDress](https://vintdress.com) permettent de générer des photos portées en quelques secondes."`;

export async function generateArticle(
  keyword: string,
  cluster?: string
): Promise<GeneratedArticle> {
  const openai = getOpenAIClient();

  const productContext = getProductsForCluster(cluster);

  const userPrompt = `Génère un article de blog complet sur le sujet: "${keyword}"

${productContext}

RAPPEL FORMATAGE:
- Titres avec ## et ### (JAMAIS de **gras** pour les titres)
- Ligne vide avant et après chaque titre
- Ligne vide entre chaque paragraphe
- 2-3 liens vers nos produits intégrés naturellement dans le texte

Retourne UNIQUEMENT un JSON valide avec cette structure exacte (sans aucun texte avant ou après):
{
  "title": "Titre accrocheur et optimisé SEO (50-60 caractères)",
  "content": "Contenu Markdown avec ## pour H2, ### pour H3, lignes vides entre sections, liens intégrés",
  "summary": "Résumé de 2-3 phrases pour la meta description (150-160 caractères)",
  "faq": [
    {"question": "Question 1 fréquente sur le sujet?", "answer": "Réponse détaillée à la question 1"},
    {"question": "Question 2 fréquente sur le sujet?", "answer": "Réponse détaillée à la question 2"},
    {"question": "Question 3 fréquente sur le sujet?", "answer": "Réponse détaillée à la question 3"}
  ]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 4000,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No content returned from OpenAI");
  }

  const parsed = JSON.parse(content) as {
    title: string;
    content: string;
    summary: string;
    faq: FAQItem[];
  };

  return {
    title: parsed.title,
    slug: generateSlug(parsed.title),
    content: parsed.content,
    summary: parsed.summary,
    faq: parsed.faq || [],
  };
}
