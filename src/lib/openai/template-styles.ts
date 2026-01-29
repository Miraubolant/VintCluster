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
// TEMPLATE: MINIMAL (ultra clean)
// Style élégant - vouvoiement, pas d'emojis, paragraphes longs
// ============================================================================

const MINIMAL_STYLE: ContentStyleConfig = {
  toneInstructions: `## TON & STYLE MINIMAL
- Vouvoiement OBLIGATOIRE ("vous", "votre", "vos")
- Ton posé, professionnel et raffiné
- Phrases longues et élaborées (15-25 mots)
- Vocabulaire soutenu et précis
- Transitions fluides entre les paragraphes`,

  structureInstructions: `## STRUCTURE MINIMAL
- Sections H2 descriptives et complètes (6-10 mots)
- Peu de listes à puces (préférer les paragraphes)
- Paragraphes développés (4-6 phrases)
- Sous-sections H3 pour structurer la pensée
- Pas de mise en forme excessive`,

  ctaFormat: `## FORMAT CTA MINIMAL
Style: Subtil et élégant, intégré au texte
Format: Découvrez [NomProduit](https://url.com)
Exemple: Pour approfondir cette approche, découvrez les possibilités offertes par [VintDress](https://vintdress.com).
Ton: Suggestif, informatif, non intrusif`,

  introStyle: `## INTRO MINIMAL
- Mise en contexte en 2-3 phrases
- Définition claire du sujet
- Présentation de l'approche de l'article`,

  conclusionStyle: `## CONCLUSION MINIMAL
- Synthèse en prose (1 paragraphe)
- Ouverture sur des perspectives
- Invitation subtile à l'action`,

  emojiUsage: `## EMOJIS MINIMAL
- Aucun emoji dans l'article
- Style épuré et professionnel
- Utiliser des mots plutôt que des symboles`,

  sentenceStyle: `## PHRASES MINIMAL
- Phrases complexes avec subordonnées
- Connecteurs logiques: "En effet", "Par conséquent", "Ainsi"
- Pas de questions rhétoriques
- Style soutenu et académique`,
};

// ============================================================================
// TEMPLATE: MAGAZINE (éditorial)
// Style journalistique - vouvoiement, citations, encadrés
// ============================================================================

const MAGAZINE_STYLE: ContentStyleConfig = {
  toneInstructions: `## TON & STYLE MAGAZINE
- Vouvoiement OBLIGATOIRE ("vous", "votre")
- Ton journalistique et informatif
- Équilibre entre expertise et accessibilité
- Citations et témoignages fictifs mais crédibles
- Vocabulaire varié et imagé`,

  structureInstructions: `## STRUCTURE MAGAZINE
- Sections H2 accrocheurs style presse (5-8 mots)
- Chapô (résumé) après chaque H2
- Encadrés pour les points clés: > Citation ou point important
- Mélange listes et paragraphes
- Intertitres H3 nombreux pour aérer`,

  ctaFormat: `## FORMAT CTA MAGAZINE
Style: Encadré éditorial
Format:
> 💡 **Notre recommandation** : [NomProduit](https://url.com) permet de...
Exemple:
> 💡 **Notre recommandation** : Pour automatiser vos photos, [VintDress](https://vintdress.com) s'impose comme la solution de référence.
Ton: Expert, recommandation éditoriale`,

  introStyle: `## INTRO MAGAZINE
- Accroche narrative ou anecdote
- Chiffre clé ou statistique marquante
- Angle journalistique clair`,

  conclusionStyle: `## CONCLUSION MAGAZINE
- "En résumé" ou "Ce qu'il faut retenir"
- 3-5 points clés numérotés
- Perspective ou tendance future`,

  emojiUsage: `## EMOJIS MAGAZINE
- Emojis limités aux encadrés seulement
- 💡 pour les conseils, 📊 pour les chiffres
- Jamais dans le corps du texte`,

  sentenceStyle: `## PHRASES MAGAZINE
- Alternance phrases courtes et longues
- Style narratif avec des exemples concrets
- Citations: "Selon nos observations..."
- Chiffres et pourcentages fréquents`,
};

// ============================================================================
// TEMPLATE: TECH (moderne)
// Style expert - tutoiement, termes techniques, data-driven
// ============================================================================

const TECH_STYLE: ContentStyleConfig = {
  toneInstructions: `## TON & STYLE TECH
- Tutoiement OBLIGATOIRE mais respectueux
- Ton expert et technique
- Vocabulaire précis: algorithme, conversion, ROI, optimisation
- Références aux métriques et KPIs
- Approche data-driven`,

  structureInstructions: `## STRUCTURE TECH
- Sections H2 techniques et descriptifs
- Listes numérotées pour les processus
- Tableaux Markdown pour les comparaisons
- Code blocks pour les exemples techniques
- Sous-sections H3 méthodiques`,

  ctaFormat: `## FORMAT CTA TECH
Style: Technique avec bénéfice mesurable
Format: [NomProduit](https://url.com) - résultat chiffré
Exemple: Avec [VintDress](https://vintdress.com), les vendeurs constatent en moyenne +47% de clics sur leurs annonces.
Ton: Factuel, basé sur les données`,

  introStyle: `## INTRO TECH
- Problème technique clairement posé
- Métriques de contexte
- Solution et résultats attendus`,

  conclusionStyle: `## CONCLUSION TECH
- Récapitulatif des points techniques
- Métriques clés à retenir
- Prochaines étapes concrètes`,

  emojiUsage: `## EMOJIS TECH
- Aucun emoji dans le texte
- Utiliser des icônes textuelles si besoin: [→] [✓] [!]
- Priorité à la clarté technique`,

  sentenceStyle: `## PHRASES TECH
- Phrases structurées et précises
- Terminologie technique consistante
- Exemples avec chiffres concrets
- Pas de langage émotionnel`,
};

// ============================================================================
// TEMPLATE: FRESH (coloré/jeune)
// Style décontracté - tutoiement fort, emojis, questions
// ============================================================================

const FRESH_STYLE: ContentStyleConfig = {
  toneInstructions: `## TON & STYLE FRESH
- Tutoiement TRÈS familier ("t'as vu", "genre", "trop bien")
- Ton enthousiaste et positif
- Langage jeune et actuel
- Expressions tendance: "game changer", "next level", "c'est le feu"
- Interpellation directe du lecteur`,

  structureInstructions: `## STRUCTURE FRESH
- Sections H2 fun avec emojis et questions
- Beaucoup de listes colorées
- Paragraphes très courts (1-2 phrases)
- Questions fréquentes pour engager
- Mises en forme variées`,

  ctaFormat: `## FORMAT CTA FRESH
Style: Enthousiaste avec double emoji
Format: ✨ [Texte fun](https://url.com) ✨
Exemple: ✨ [Découvre VintDress maintenant](https://vintdress.com) ✨ - tu vas halluciner!
Ton: Excité, FOMO positif`,

  introStyle: `## INTRO FRESH
- Question directe au lecteur
- Promesse de valeur fun
- Teaser sur le contenu à venir`,

  conclusionStyle: `## CONCLUSION FRESH
- Récap' rapide en bullet points fun
- Encouragement enthousiaste
- CTA avec urgence positive`,

  emojiUsage: `## EMOJIS FRESH
- 8-12 emojis dans l'article
- Emojis variés et colorés: ✨ 🎉 💪 🙌 😍 🤩 💯 🔥
- 1-2 emojis par section H2
- Emojis dans les listes aussi`,

  sentenceStyle: `## PHRASES FRESH
- Phrases très courtes (max 12 mots)
- Exclamations fréquentes!
- Questions rhétoriques constantes
- Interjections: "Wahou!", "Incroyable!", "Trop cool!"`,
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
