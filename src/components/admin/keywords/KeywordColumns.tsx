"use client";

import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import type { Column } from "@/components/admin/shared";
import type { Keyword, KeywordStatus } from "@/types/database";

// Type étendu pour les keywords avec site
export interface KeywordWithSite extends Keyword {
  site?: {
    id: string;
    name: string;
    domain: string;
  };
}

// Configuration des statuts
export const KEYWORD_STATUS_CONFIG: Record<KeywordStatus, { label: string; className: string }> = {
  pending: { label: "En attente", className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" },
  generating: { label: "En génération", className: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
  generated: { label: "Généré", className: "bg-purple-100 text-purple-700 hover:bg-purple-100" },
  published: { label: "Publié", className: "bg-green-100 text-green-700 hover:bg-green-100" },
  archived: { label: "Archivé", className: "bg-gray-100 text-gray-600 hover:bg-gray-100" },
};

// Composant Badge de statut réutilisable
export function KeywordStatusBadge({
  status,
  isGenerating = false,
}: {
  status: KeywordStatus | null;
  isGenerating?: boolean;
}) {
  if (isGenerating) {
    return (
      <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        En génération
      </Badge>
    );
  }

  const config = KEYWORD_STATUS_CONFIG[(status as KeywordStatus) || "pending"] || KEYWORD_STATUS_CONFIG.pending;
  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  );
}

// Définition des colonnes pour DataTable
export function getKeywordColumns(generatingIds: string[] = []): Column<KeywordWithSite>[] {
  return [
    {
      key: "keyword",
      header: "Mot-clé",
      cell: (keyword) => (
        <span className="font-medium text-gray-900">{keyword.keyword}</span>
      ),
    },
    {
      key: "site",
      header: "Site",
      hideOnMobile: true,
      cell: (keyword) => (
        <span className="text-sm text-gray-600">
          {keyword.site?.name || "-"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (keyword) => (
        <KeywordStatusBadge
          status={keyword.status as KeywordStatus}
          isGenerating={generatingIds.includes(keyword.id)}
        />
      ),
    },
    {
      key: "priority",
      header: "Priorité",
      hideOnMobile: true,
      hideOnTablet: true,
      cell: (keyword) => (
        <span className="text-sm text-gray-600">{keyword.priority || 0}</span>
      ),
    },
    {
      key: "created_at",
      header: "Créé le",
      sortable: true,
      hideOnMobile: true,
      cell: (keyword) => (
        <span className="text-sm text-gray-500">
          {keyword.created_at
            ? new Date(keyword.created_at).toLocaleDateString("fr-FR")
            : "-"}
        </span>
      ),
    },
  ];
}

// Options de statut pour les filtres
export const KEYWORD_STATUS_OPTIONS = [
  { value: "pending", label: "En attente" },
  { value: "generating", label: "En génération" },
  { value: "generated", label: "Générés" },
  { value: "published", label: "Publiés" },
  { value: "archived", label: "Archivés" },
];
