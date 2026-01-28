export * from "./database";

import type { Site, Article, Keyword, FAQItem } from "./database";

// Types additionnels pour l'application

export type SiteWithStats = Site & {
  articlesCount?: number;
  keywordsCount?: number;
};

export type ArticleWithRelations = Article & {
  site?: Site;
  keyword?: Keyword;
};

export type KeywordWithArticle = Keyword & {
  article?: Article;
};

// Types pour les formulaires
export interface CreateSiteForm {
  domain: string;
  name: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  metaTitle?: string;
  metaDescription?: string;
}

export interface CreateKeywordForm {
  siteId: string;
  keywords: string[];
}

// Types pour les réponses API
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

// Types pour la génération IA
export interface GeneratedArticle {
  title: string;
  content: string;
  summary: string;
  faq: FAQItem[];
  imageUrl: string;
  imageAlt: string;
}
