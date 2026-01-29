"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  ExternalLink,
  FileCheck,
} from "lucide-react";
import type { ArticleWithDetails } from "./ArticleColumns";
import type { ArticleStatus } from "@/types/database";

interface ArticleRowActionsProps {
  article: ArticleWithDetails;
  onView: (article: ArticleWithDetails) => void;
  onEdit: (article: ArticleWithDetails) => void;
  onStatusChange: (id: string, status: ArticleStatus) => void;
  onDelete: (id: string) => void;
}

export function ArticleRowActions({
  article,
  onView,
  onEdit,
  onStatusChange,
  onDelete,
}: ArticleRowActionsProps) {
  const canVisitSite = article.status === "published" && article.site?.domain;
  const siteUrl = article.site?.domain
    ? `https://${article.site.domain}/blog/${article.slug}`
    : null;

  return (
    <div className="flex items-center gap-1">
      {/* Bouton externe si publié */}
      {canVisitSite && siteUrl && (
        <a
          href={siteUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Voir sur le site"
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </a>
      )}

      {/* Menu dropdown */}
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
          {siteUrl && (
            <DropdownMenuItem asChild>
              <a
                href={siteUrl}
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

          {/* Actions de changement de statut selon le statut actuel */}
          {article.status === "draft" && (
            <DropdownMenuItem onClick={() => onStatusChange(article.id, "ready")}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Marquer prêt
            </DropdownMenuItem>
          )}
          {article.status === "ready" && (
            <>
              <DropdownMenuItem onClick={() => onStatusChange(article.id, "draft")}>
                <FileCheck className="mr-2 h-4 w-4" />
                Remettre en brouillon
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange(article.id, "published")}>
                <Eye className="mr-2 h-4 w-4" />
                Publier
              </DropdownMenuItem>
            </>
          )}
          {article.status === "published" && (
            <DropdownMenuItem onClick={() => onStatusChange(article.id, "unpublished")}>
              <XCircle className="mr-2 h-4 w-4" />
              Dépublier
            </DropdownMenuItem>
          )}
          {article.status === "unpublished" && (
            <DropdownMenuItem onClick={() => onStatusChange(article.id, "published")}>
              <Eye className="mr-2 h-4 w-4" />
              Republier
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => onDelete(article.id)}
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
