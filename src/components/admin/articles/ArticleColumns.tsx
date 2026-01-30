"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";
import type { Column } from "@/components/admin/shared";
import type { Article, ArticleStatus } from "@/types/database";

// Type étendu pour les articles avec relations
export interface ArticleWithDetails extends Article {
  keyword?: {
    id: string;
    keyword: string;
  };
  site?: {
    id: string;
    name: string;
    domain: string;
  };
}

// Composant Badge SEO Expert
export function SEOBadge({ model, improved }: { model?: string | null; improved?: boolean | null }) {
  if (!improved) return null;

  const modelLabel = model === "gemini" ? "Gemini" : model === "claude" ? "Claude" : "SEO";
  const colorClass = model === "gemini"
    ? "bg-blue-100 text-blue-700 border-blue-200"
    : model === "claude"
    ? "bg-orange-100 text-orange-700 border-orange-200"
    : "bg-emerald-100 text-emerald-700 border-emerald-200";

  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded border ${colorClass}`}
      title={`Amélioré par SEO Expert (${modelLabel})`}
    >
      <Zap className="h-2.5 w-2.5" />
      {modelLabel}
    </span>
  );
}

// Labels et styles pour les statuts
export const STATUS_CONFIG: Record<ArticleStatus, { label: string; className: string }> = {
  draft: { label: "Brouillon", className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" },
  ready: { label: "Prêt", className: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
  published: { label: "Publié", className: "bg-green-100 text-green-700 hover:bg-green-100" },
  unpublished: { label: "Dépublié", className: "bg-gray-100 text-gray-600 hover:bg-gray-100" },
};

// Composant Badge de statut réutilisable
export function ArticleStatusBadge({ status }: { status: ArticleStatus | null }) {
  const config = STATUS_CONFIG[status || "draft"] || STATUS_CONFIG.draft;
  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  );
}

// Composant Thumbnail
export function ArticleThumbnail({ src, alt }: { src?: string | null; alt: string }) {
  if (!src) return null;

  return (
    <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
      />
    </div>
  );
}

// Définition des colonnes pour DataTable
export function getArticleColumns(): Column<ArticleWithDetails>[] {
  return [
    {
      key: "title",
      header: "Article",
      cell: (article) => (
        <div className="flex items-center gap-3">
          <ArticleThumbnail src={article.image_url} alt={article.title} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-900 truncate max-w-xs">
                {article.title}
              </p>
              <SEOBadge improved={article.seo_improved} model={article.seo_model} />
            </div>
            <p className="text-xs text-gray-500 truncate max-w-xs">
              /{article.slug}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "site",
      header: "Site",
      hideOnMobile: true,
      cell: (article) => (
        <span className="text-sm text-gray-600">
          {article.site?.name || "-"}
        </span>
      ),
    },
    {
      key: "keyword",
      header: "Mot-clé",
      hideOnMobile: true,
      hideOnTablet: true,
      cell: (article) => (
        <span className="text-sm text-gray-600">
          {article.keyword?.keyword || "-"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (article) => (
        <ArticleStatusBadge status={article.status as ArticleStatus} />
      ),
    },
    {
      key: "created_at",
      header: "Date",
      sortable: true,
      hideOnMobile: true,
      cell: (article) => (
        <span className="text-sm text-gray-500">
          {article.created_at
            ? new Date(article.created_at).toLocaleDateString("fr-FR")
            : "-"}
        </span>
      ),
    },
  ];
}

// Options de statut pour les filtres
export const ARTICLE_STATUS_OPTIONS = [
  { value: "draft", label: "Brouillons" },
  { value: "ready", label: "Prêts" },
  { value: "published", label: "Publiés" },
  { value: "unpublished", label: "Dépubliés" },
];

// Options de filtre SEO
export const ARTICLE_SEO_OPTIONS = [
  { value: "all", label: "Tous" },
  { value: "improved", label: "SEO amélioré" },
  { value: "not_improved", label: "Non amélioré" },
  { value: "gemini", label: "Gemini" },
  { value: "claude", label: "Claude" },
];
