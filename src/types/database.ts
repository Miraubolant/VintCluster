// Re-export des types générés par Supabase
export type { Database, Json, Tables, TablesInsert, TablesUpdate } from "./supabase";
import type { Database } from "./supabase";

// Types utilitaires simplifiés
export type Site = Database["public"]["Tables"]["sites"]["Row"];
export type SiteInsert = Database["public"]["Tables"]["sites"]["Insert"];
export type SiteUpdate = Database["public"]["Tables"]["sites"]["Update"];

export type Keyword = Database["public"]["Tables"]["keywords"]["Row"];
export type KeywordInsert = Database["public"]["Tables"]["keywords"]["Insert"];
export type KeywordUpdate = Database["public"]["Tables"]["keywords"]["Update"];
export type KeywordStatus = "pending" | "generating" | "generated" | "published" | "archived";

export type Article = Database["public"]["Tables"]["articles"]["Row"];
export type ArticleInsert = Database["public"]["Tables"]["articles"]["Insert"];
export type ArticleUpdate = Database["public"]["Tables"]["articles"]["Update"];
export type ArticleStatus = "draft" | "ready" | "published" | "unpublished";

export type SchedulerConfig = Database["public"]["Tables"]["scheduler_config"]["Row"];
export type SchedulerConfigInsert = Database["public"]["Tables"]["scheduler_config"]["Insert"];
export type SchedulerConfigUpdate = Database["public"]["Tables"]["scheduler_config"]["Update"];

export type ActivityLog = Database["public"]["Tables"]["activity_logs"]["Row"];
export type ActivityLogInsert = Database["public"]["Tables"]["activity_logs"]["Insert"];

// Type pour FAQ
export interface FAQItem {
  question: string;
  answer: string;
}

// Types pour l'amélioration IA (scheduler)
export type SchedulerImprovementModel = "gpt-4o" | "gpt-4o-mini" | "gpt-4-turbo";
export type SchedulerImprovementMode = "seo-classic" | "ai-search" | "full-pbn";

// Types pour les templates de site
export type SiteTemplate = "brutal" | "minimal" | "magazine" | "tech" | "fresh";

export interface TemplateConfig {
  id: SiteTemplate;
  name: string;
  description: string;
  // Style visuel
  visual: {
    headerStyle: "bold" | "minimal" | "editorial" | "modern" | "playful";
    cardStyle: "brutal" | "clean" | "rich" | "gradient" | "rounded";
    footerStyle: "simple" | "compact" | "detailed" | "modern" | "fun";
  };
  // Style de contenu IA
  content: {
    tone: "direct" | "elegant" | "journalistic" | "expert" | "casual";
    formality: "tu" | "vous";
    useEmojis: boolean;
    structureStyle: "lists" | "paragraphs" | "mixed" | "technical" | "conversational";
    ctaStyle: "bold" | "subtle" | "editorial" | "technical" | "playful";
  };
}

export const TEMPLATES: Record<SiteTemplate, TemplateConfig> = {
  brutal: {
    id: "brutal",
    name: "Brutal",
    description: "Néo-brutaliste avec bordures épaisses et ombres décalées",
    visual: {
      headerStyle: "bold",
      cardStyle: "brutal",
      footerStyle: "simple",
    },
    content: {
      tone: "direct",
      formality: "tu",
      useEmojis: true,
      structureStyle: "lists",
      ctaStyle: "bold",
    },
  },
  minimal: {
    id: "minimal",
    name: "Minimal",
    description: "Ultra clean avec beaucoup d'espace blanc",
    visual: {
      headerStyle: "minimal",
      cardStyle: "clean",
      footerStyle: "compact",
    },
    content: {
      tone: "elegant",
      formality: "vous",
      useEmojis: false,
      structureStyle: "paragraphs",
      ctaStyle: "subtle",
    },
  },
  magazine: {
    id: "magazine",
    name: "Magazine",
    description: "Style éditorial avec grandes images",
    visual: {
      headerStyle: "editorial",
      cardStyle: "rich",
      footerStyle: "detailed",
    },
    content: {
      tone: "journalistic",
      formality: "vous",
      useEmojis: false,
      structureStyle: "mixed",
      ctaStyle: "editorial",
    },
  },
  tech: {
    id: "tech",
    name: "Tech",
    description: "Moderne avec gradients subtils",
    visual: {
      headerStyle: "modern",
      cardStyle: "gradient",
      footerStyle: "modern",
    },
    content: {
      tone: "expert",
      formality: "tu",
      useEmojis: false,
      structureStyle: "technical",
      ctaStyle: "technical",
    },
  },
  fresh: {
    id: "fresh",
    name: "Fresh",
    description: "Coloré et dynamique pour un public jeune",
    visual: {
      headerStyle: "playful",
      cardStyle: "rounded",
      footerStyle: "fun",
    },
    content: {
      tone: "casual",
      formality: "tu",
      useEmojis: true,
      structureStyle: "conversational",
      ctaStyle: "playful",
    },
  },
};
