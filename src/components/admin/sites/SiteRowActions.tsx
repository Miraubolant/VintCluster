"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, ExternalLink } from "lucide-react";
import type { SiteWithStats } from "./SiteColumns";

interface SiteRowActionsProps {
  site: SiteWithStats;
  onDelete: (id: string) => void;
}

export function SiteRowActions({ site, onDelete }: SiteRowActionsProps) {
  return (
    <div className="flex items-center gap-1">
      {/* Bouton externe */}
      <a
        href={`https://${site.domain}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Voir le site"
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </a>

      {/* Menu dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/admin/sites/${site.id}`} className="flex items-center">
              <Pencil className="mr-2 h-4 w-4" />
              Modifier
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href={`https://${site.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Voir le site
            </a>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => onDelete(site.id)}
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
