"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import type { Column } from "@/components/admin/shared";
import type { Site, SiteTemplate } from "@/types/database";
import { TEMPLATES } from "@/types/database";

// Type étendu pour les sites avec stats
export interface SiteWithStats extends Site {
  keywordsCount: number;
  articlesCount: number;
}

// Configuration des templates avec leurs couleurs
export const TEMPLATE_CONFIG: Record<SiteTemplate, { className: string }> = {
  brutal: { className: "bg-orange-100 text-orange-700 hover:bg-orange-100" },
  minimal: { className: "bg-slate-100 text-slate-700 hover:bg-slate-100" },
  magazine: { className: "bg-rose-100 text-rose-700 hover:bg-rose-100" },
  tech: { className: "bg-cyan-100 text-cyan-700 hover:bg-cyan-100" },
  fresh: { className: "bg-lime-100 text-lime-700 hover:bg-lime-100" },
};

// Composant Badge de template réutilisable
export function SiteTemplateBadge({ template }: { template: SiteTemplate | null }) {
  const key = template || "brutal";
  const config = TEMPLATE_CONFIG[key] || TEMPLATE_CONFIG.brutal;
  const templateName = TEMPLATES[key]?.name || "Brutal";

  return (
    <Badge variant="secondary" className={config.className}>
      {templateName}
    </Badge>
  );
}

// Composant couleurs
export function SiteColors({ primary, secondary }: { primary?: string | null; secondary?: string | null }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-6 h-6 rounded border border-gray-200"
        style={{ backgroundColor: primary || "#000000" }}
        title={`Primaire: ${primary}`}
      />
      <div
        className="w-6 h-6 rounded border border-gray-200"
        style={{ backgroundColor: secondary || "#FFFFFF" }}
        title={`Secondaire: ${secondary}`}
      />
    </div>
  );
}

// Badge SEO status
export function SiteSeoBadge({ hasMetaTitle }: { hasMetaTitle: boolean }) {
  if (hasMetaTitle) {
    return (
      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
        OK
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="bg-gray-100 text-gray-500 hover:bg-gray-100">
      -
    </Badge>
  );
}

// Définition des colonnes pour DataTable
export function getSiteColumns(): Column<SiteWithStats>[] {
  return [
    {
      key: "name",
      header: "Site",
      cell: (site) => (
        <div className="font-medium text-gray-900">{site.name}</div>
      ),
    },
    {
      key: "domain",
      header: "Domaine",
      cell: (site) => (
        <a
          href={`https://${site.domain}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
        >
          {site.domain}
          <ExternalLink className="w-3 h-3" />
        </a>
      ),
    },
    {
      key: "keywordsCount",
      header: "Mots-clés",
      hideOnMobile: true,
      cell: (site) => (
        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
          {site.keywordsCount}
        </Badge>
      ),
    },
    {
      key: "articlesCount",
      header: "Articles",
      hideOnMobile: true,
      cell: (site) => (
        <Badge variant="secondary" className="bg-green-100 text-green-700">
          {site.articlesCount}
        </Badge>
      ),
    },
    {
      key: "template",
      header: "Template",
      hideOnMobile: true,
      hideOnTablet: true,
      cell: (site) => (
        <SiteTemplateBadge template={site.template as SiteTemplate} />
      ),
    },
    {
      key: "colors",
      header: "Couleurs",
      hideOnMobile: true,
      hideOnTablet: true,
      cell: (site) => (
        <SiteColors primary={site.primary_color} secondary={site.secondary_color} />
      ),
    },
    {
      key: "seo",
      header: "SEO",
      hideOnMobile: true,
      cell: (site) => (
        <SiteSeoBadge hasMetaTitle={!!site.meta_title} />
      ),
    },
  ];
}

// Options de template pour les filtres
export const SITE_TEMPLATE_OPTIONS = [
  { value: "brutal", label: "Brutal" },
  { value: "minimal", label: "Minimal" },
  { value: "magazine", label: "Magazine" },
  { value: "tech", label: "Tech" },
  { value: "fresh", label: "Fresh" },
];
