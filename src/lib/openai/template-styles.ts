import type { SiteTemplate } from "@/types/database";

// ============================================================================
// STYLES DE CONTENU PAR TEMPLATE
// Chaque template a un style d'écriture distinct pour l'anti-détection
// ============================================================================

export interface ContentStyleConfig {
  // Instructions de ton et style
  toneInstructions: string;
  // Structure des sections
  structureInstructions: string;
  // Style des CTAs
  ctaFormat: string;
  // Style d'intro
  introStyle: string;
  // Style de conclusion
  conclusionStyle: string;
  // Emojis autorisés
  emojiUsage: string;
  // Longueur des phrases
  sentenceStyle: string;
}

// ============================================================================
// TEMPLATE: BRUTAL (néo-brutaliste)
// Style actuel - direct, tutoiement, emojis, listes courtes
// ============================================================================

const BRUTAL_STYLE: ContentStyleConfig = {
  toneInstructions: `## TON & STYLE BRUTAL
- Tutoiement OBLIGATOIRE ("tu", "ton", "tes")
- Ton direct, sans détour, comme un pote qui te file ses tips
- Phrases courtes et percutantes (max 15 mots)
- Vocabulaire simple et percutant
- Expressions familières françaises: "C'est validé", "Franchement", "Tu vois le délire"`,

  structureInstructions: `## STRUCTURE BRUTAL
- Sections H2 courtes et punchy (3-5 mots max)
- Beaucoup de listes à puces (5-7 items)
- Paragraphes courts (2-3 phrases max)
- Pas de sous-sections H3 sauf si vraiment nécessaire
- Mise en évidence avec **gras** dans le texte`,

  ctaFormat: `## FORMAT CTA BRUTAL
Style: Bold et direct avec emoji
Format: **[🚀 Texte CTA](https://url.com)**
Exemple: **[🚀 Teste VintDress gratos](https://vintdress.com)**
Ton: Incitatif, urgent, FOMO`,

  introStyle: `## INTRO BRUTAL
- Accroche choc en 1 phrase (problème ou statistique)
- Réponse directe en 2 phrases
- Promesse claire de ce que le lecteur va apprendre`,

  conclusionStyle: `## CONCLUSION BRUTAL
- Résumé en 3-5 bullet points
- CTA direct et sans détour
- Phrase de fin motivante courte`,

  emojiUsage: `## EMOJIS BRUTAL
- Utilise 3-5 emojis dans l'article
- 1 emoji par section H2 (dans le titre)
- Emojis permis: 🚀 💡 ⚡ 🔥 ✅ 💰 📸 🎯`,

  sentenceStyle: `## PHRASES BRUTAL
- Max 15 mots par phrase
- Beaucoup de phrases nominales
- Questions rhétoriques fréquentes
- Onomatopées permises: "Bam!", "Boom!"`,
};

// ============================================================================
// TEMPLATE: MINIMAL (Apple / Swiss Design)
// Style épuré à la Apple - vouvoiement, espaces, hiérarchie claire
// Typographie fine, beaucoup de respiration, minimalisme fonctionnel
// ============================================================================

const MINIMAL_STYLE: ContentStyleConfig = {
  toneInstructions: `## TON & STYLE MINIMAL (Apple/Swiss Design)
- Vouvoiement OBLIGATOIRE ("vous", "votre", "vos")
- Ton calme, confiant, épuré comme la communication Apple
- Phrases courtes mais percutantes (10-15 mots)
- Vocabulaire précis et choisi, jamais verbeux
- Chaque mot doit compter - éliminer le superflu
- Style élégant qui inspire confiance`,

  structureInstructions: `## STRUCTURE MINIMAL
- Sections H2 concises et impactantes (3-6 mots max)
- Un concept par paragraphe, très aéré
- Listes à puces espacées quand nécessaire
- Beaucoup d'espace blanc visuel (paragraphes courts)
- Hiérarchie claire: une idée principale par section`,

  ctaFormat: `## FORMAT CTA MINIMAL
Style: Discret et élégant, phrase simple
Format: [NomProduit](https://url.com)
Exemple: Simplifiez vos photos avec [VintDress](https://vintdress.com).
Ton: Confiant, direct, sans pression - l'utilisateur décide`,

  introStyle: `## INTRO MINIMAL
- Phrase d'accroche simple et directe
- Problème posé en une phrase
- Promesse claire de la solution`,

  conclusionStyle: `## CONCLUSION MINIMAL
- Récapitulatif en 2-3 phrases maximum
- Une action suggérée, pas plus
- Finir sur une note positive et sobre`,

  emojiUsage: `## EMOJIS MINIMAL
- Aucun emoji - jamais
- Élégance par la typographie pure
- Laisser le texte respirer`,

  sentenceStyle: `## PHRASES MINIMAL
- Phrases simples et directes
- Pas de fioritures ni d'adjectifs inutiles
- Structure sujet-verbe-complément privilégiée
- Ponctuation minimaliste`,
};

// ============================================================================
// TEMPLATE: MAGAZINE (The Verge / Modern Editorial)
// Style éditorial moderne - bold, coloré, accrocheur
// Titres forts, mise en page dynamique, ton engagé
// ============================================================================

const MAGAZINE_STYLE: ContentStyleConfig = {
  toneInstructions: `## TON & STYLE MAGAZINE (The Verge)
- Vouvoiement OBLIGATOIRE ("vous", "votre")
- Ton affirmé, engagé, avec du caractère
- Phrases variées avec du rythme
- Prendre position, avoir des opinions
- Style éditorial moderne, pas corporate
- Donner envie de partager`,

  structureInstructions: `## STRUCTURE MAGAZINE
- Sections H2 punchy et accrocheurs (4-7 mots)
- Paragraphes de longueur variée pour le rythme
- Points clés en **gras** pour scanner rapidement
- Encadrés colorés: > Point important à retenir
- Sous-sections H3 pour structurer les arguments`,

  ctaFormat: `## FORMAT CTA MAGAZINE
Style: Encadré éditorial avec recommandation
Format:
> **Notre verdict** : [NomProduit](https://url.com) change la donne.
Exemple:
> **Notre verdict** : [VintDress](https://vintdress.com) est exactement ce dont les vendeurs Vinted avaient besoin.
Ton: Éditorial, opinion assumée`,

  introStyle: `## INTRO MAGAZINE
- Accroche forte qui capte l'attention
- Contexte rapide du problème
- Teaser de ce que l'article va démontrer`,

  conclusionStyle: `## CONCLUSION MAGAZINE
- "Le verdict" ou "Notre avis"
- Points forts en liste
- Invitation claire à l'action`,

  emojiUsage: `## EMOJIS MAGAZINE
- 1-2 emojis maximum, dans les encadrés
- 📊 pour données, 🔑 pour points clés
- Jamais dans les titres ou le corps principal`,

  sentenceStyle: `## PHRASES MAGAZINE
- Rythme varié: courtes + longues
- Affirmations confiantes
- Questions pour engager le lecteur
- Chiffres concrets et comparaisons`,
};

// ============================================================================
// TEMPLATE: TECH (Stripe / Notion Style)
// Style documentation pro - clair, bien structuré, rassurant
// Comme lire la doc Stripe ou un article Notion
// ============================================================================

const TECH_STYLE: ContentStyleConfig = {
  toneInstructions: `## TON & STYLE TECH (Stripe/Notion)
- Tutoiement OBLIGATOIRE mais professionnel
- Ton clair, didactique, bienveillant
- Comme un collègue senior qui explique bien
- Vocabulaire précis sans être intimidant
- Rassurer tout en étant expert`,

  structureInstructions: `## STRUCTURE TECH
- Sections H2 claires et descriptives (4-8 mots)
- Étapes numérotées pour les processus: 1. 2. 3.
- Listes à puces pour les options/avantages
- Sous-sections H3 pour détailler
- **Gras** pour les concepts importants`,

  ctaFormat: `## FORMAT CTA TECH
Style: Intégré naturellement avec bénéfice clair
Format: Essaie [NomProduit](https://url.com) pour [bénéfice].
Exemple: Essaie [VintDress](https://vintdress.com) pour générer tes photos en 30 secondes.
Ton: Utile, sans pression, orienté solution`,

  introStyle: `## INTRO TECH
- Contexte du problème en 1-2 phrases
- Ce que tu vas apprendre
- Pourquoi c'est important`,

  conclusionStyle: `## CONCLUSION TECH
- Résumé des points clés en liste
- Prochaine étape recommandée
- Ressource ou outil pour aller plus loin`,

  emojiUsage: `## EMOJIS TECH
- Aucun emoji
- Clarté et professionnalisme
- Iconographie textuelle si utile: → • ✓`,

  sentenceStyle: `## PHRASES TECH
- Phrases claires et directes
- Un concept à la fois
- Exemples concrets fréquents
- Éviter le jargon inutile`,
};

// ============================================================================
// TEMPLATE: FRESH (TikTok / Instagram Gen-Z)
// Style réseaux sociaux dark mode - néon, énergique, viral
// Comme un créateur de contenu qui parle à sa communauté
// ============================================================================

const FRESH_STYLE: ContentStyleConfig = {
  toneInstructions: `## TON & STYLE FRESH (TikTok/Instagram)
- Tutoiement OBLIGATOIRE, très direct
- Ton énergique comme un créateur de contenu
- Langage actuel: "no cap", "c'est validé", "trust"
- Parler comme à un pote, pas comme un article
- Créer de l'engagement, donner envie de partager`,

  structureInstructions: `## STRUCTURE FRESH
- Sections H2 courtes et percutantes (3-5 mots max)
- Format "snackable" - paragraphes d'1-2 phrases
- Listes avec emojis pour chaque item
- Questions pour créer l'interaction
- Style très visuel, facile à scanner`,

  ctaFormat: `## FORMAT CTA FRESH
Style: Appel à l'action fun et direct
Format: ✨ [Action fun](https://url.com) ✨
Exemple: ✨ [Teste VintDress](https://vintdress.com) ✨ et dis-moi ce que t'en penses!
Ton: FOMO positif, communautaire`,

  introStyle: `## INTRO FRESH
- Accroche choc ou question
- "T'as déjà essayé de..." ou "Imagine si..."
- Promesse claire de ce qu'on va apprendre`,

  conclusionStyle: `## CONCLUSION FRESH
- Récap ultra rapide
- Appel à l'action communautaire
- "Dis-moi en commentaire..." vibe`,

  emojiUsage: `## EMOJIS FRESH
- 6-10 emojis dans l'article
- Emojis tendance: ✨ 🔥 💀 🙌 👀 💯 🚀 ✅
- Un emoji par item de liste
- Emojis dans les titres H2 aussi`,

  sentenceStyle: `## PHRASES FRESH
- Ultra courtes (max 10 mots)
- Interpellations: "Attends", "Écoute", "Regarde"
- Questions fréquentes
- Exclamations!`,
};

// ============================================================================
// MAPPING TEMPLATE → STYLE
// ============================================================================

export const TEMPLATE_STYLES: Record<SiteTemplate, ContentStyleConfig> = {
  brutal: BRUTAL_STYLE,
  minimal: MINIMAL_STYLE,
  magazine: MAGAZINE_STYLE,
  tech: TECH_STYLE,
  fresh: FRESH_STYLE,
};

// ============================================================================
// FONCTION POUR OBTENIR LE STYLE COMPLET
// ============================================================================

export function getTemplateStyleInstructions(template: SiteTemplate): string {
  const style = TEMPLATE_STYLES[template];

  return `${style.toneInstructions}

${style.structureInstructions}

${style.ctaFormat}

${style.introStyle}

${style.conclusionStyle}

${style.emojiUsage}

${style.sentenceStyle}`;
}

// ============================================================================
// FONCTION POUR OBTENIR LE CONTEXTE COMPLET AVEC TEMPLATE
// ============================================================================

export function getTemplateContext(template: SiteTemplate): string {
  const style = TEMPLATE_STYLES[template];
  const templateName = template.charAt(0).toUpperCase() + template.slice(1);

  return `## TEMPLATE ACTIF: ${templateName.toUpperCase()}

Ce site utilise le style "${templateName}". Respecte STRICTEMENT les consignes suivantes:

${getTemplateStyleInstructions(template)}`;
}
