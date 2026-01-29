"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Trash2, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import type { Article, ArticleStatus } from "@/types/database";
import Image from "next/image";

interface ArticleWithKeyword extends Article {
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

interface ArticlesTableProps {
  articles: ArticleWithKeyword[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onView: (article: ArticleWithKeyword) => void;
  onEdit: (article: ArticleWithKeyword) => void;
  onStatusChange: (id: string, status: ArticleStatus) => void;
  onDelete: (id: string) => void;
}

const statusLabels: Record<string, { label: string; className: string }> = {
  draft: { label: "Brouillon", className: "bg-yellow-100 text-yellow-700" },
  ready: { label: "Prêt", className: "bg-blue-100 text-blue-700" },
  published: { label: "Publié", className: "bg-green-100 text-green-700" },
  unpublished: { label: "Dépublié", className: "bg-gray-100 text-gray-600" },
};

function getStatusInfo(status: string | null) {
  return statusLabels[status || "draft"] || statusLabels.draft;
}

export function ArticlesTable({
  articles,
  selectedIds,
  onSelectionChange,
  onView,
  onEdit,
  onStatusChange,
  onDelete,
}: ArticlesTableProps) {
  const allSelected = articles.length > 0 && selectedIds.length === articles.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < articles.length;

  function toggleAll() {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(articles.map((a) => a.id));
    }
  }

  function toggleOne(id: string) {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  }

  if (articles.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-500">Aucun article trouvé</p>
        <p className="text-sm text-gray-400 mt-1">
          Générez des articles à partir de vos mots-clés
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="w-12 px-4 py-3">
                <Checkbox
                  checked={allSelected}
                  ref={(el) => {
                    if (el) {
                      (el as unknown as HTMLInputElement).indeterminate = someSelected;
                    }
                  }}
                  onCheckedChange={toggleAll}
                  aria-label="Sélectionner tout"
                />
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Article
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Site
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mot-clé
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="w-12 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {articles.map((article) => (
              <tr
                key={article.id}
                className={`hover:bg-gray-50 ${
                  selectedIds.includes(article.id) ? "bg-indigo-50" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <Checkbox
                    checked={selectedIds.includes(article.id)}
                    onCheckedChange={() => toggleOne(article.id)}
                    aria-label={`Sélectionner ${article.title}`}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {article.image_url && (
                      <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={article.image_url}
                          alt={article.image_alt || article.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate max-w-xs">
                        {article.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate max-w-xs">
                        /{article.slug}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-600">
                    {article.site?.name || "-"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-600">
                    {article.keyword?.keyword || "-"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      getStatusInfo(article.status).className
                    }`}
                  >
                    {getStatusInfo(article.status).label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-500">
                    {article.created_at
                      ? new Date(article.created_at).toLocaleDateString("fr-FR")
                      : "-"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {/* Bouton voir sur le site (si publié) */}
                    {article.status === "published" && article.site?.domain && (
                      <a
                        href={`https://${article.site.domain}/blog/${article.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Voir sur le site"
                      >
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(article)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Aperçu
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(article)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        {article.site?.domain && (
                          <DropdownMenuItem asChild>
                            <a
                              href={`https://${article.site.domain}/blog/${article.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center"
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Voir sur le site
                            </a>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                      {article.status === "draft" && (
                        <DropdownMenuItem
                          onClick={() => onStatusChange(article.id, "ready")}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Marquer prêt
                        </DropdownMenuItem>
                      )}
                      {article.status === "ready" && (
                        <DropdownMenuItem
                          onClick={() => onStatusChange(article.id, "published")}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Publier
                        </DropdownMenuItem>
                      )}
                      {article.status === "published" && (
                        <DropdownMenuItem
                          onClick={() => onStatusChange(article.id, "unpublished")}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Dépublier
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(article.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
