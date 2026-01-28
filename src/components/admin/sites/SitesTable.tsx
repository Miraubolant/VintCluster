"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2, ExternalLink } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteSiteDialog } from "./DeleteSiteDialog";
import type { Site } from "@/types/database";

interface SiteWithStats extends Site {
  keywordsCount: number;
  articlesCount: number;
}

interface SitesTableProps {
  sites: SiteWithStats[];
}

export function SitesTable({ sites }: SitesTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const siteToDelete = sites.find((s) => s.id === deleteId);

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-700">Site</TableHead>
              <TableHead className="font-semibold text-gray-700">Domaine</TableHead>
              <TableHead className="font-semibold text-gray-700 text-center">Mots-clés</TableHead>
              <TableHead className="font-semibold text-gray-700 text-center">Articles</TableHead>
              <TableHead className="font-semibold text-gray-700">Couleurs</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sites.map((site) => (
              <TableRow key={site.id} className="hover:bg-gray-50">
                <TableCell>
                  <div className="font-medium text-gray-900">{site.name}</div>
                </TableCell>
                <TableCell>
                  <a
                    href={`https://${site.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    {site.domain}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    {site.keywordsCount}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    {site.articlesCount}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border border-gray-200"
                      style={{ backgroundColor: site.primary_color || "#000000" }}
                      title={`Primaire: ${site.primary_color}`}
                    />
                    <div
                      className="w-6 h-6 rounded border border-gray-200"
                      style={{ backgroundColor: site.secondary_color || "#FFFFFF" }}
                      title={`Secondaire: ${site.secondary_color}`}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/sites/${site.id}`} className="flex items-center">
                          <Pencil className="w-4 h-4 mr-2" />
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
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Voir le site
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteId(site.id)}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DeleteSiteDialog
        site={siteToDelete || null}
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      />
    </>
  );
}
