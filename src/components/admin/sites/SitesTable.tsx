"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2, ExternalLink, Sparkles, X } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { DeleteSiteDialog } from "./DeleteSiteDialog";
import { generateAndUpdateSiteSEO } from "@/lib/actions/sites";
import { toast } from "sonner";
import type { Site } from "@/types/database";

interface SiteWithStats extends Site {
  keywordsCount: number;
  articlesCount: number;
}

interface SitesTableProps {
  sites: SiteWithStats[];
}

interface BulkProgress {
  isRunning: boolean;
  current: number;
  total: number;
  currentSite: string | null;
  errors: string[];
}

export function SitesTable({ sites }: SitesTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [progress, setProgress] = useState<BulkProgress>({
    isRunning: false,
    current: 0,
    total: 0,
    currentSite: null,
    errors: [],
  });
  const cancelledRef = useRef(false);

  const siteToDelete = sites.find((s) => s.id === deleteId);

  // Toggle selection
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Toggle all
  const toggleAll = () => {
    if (selectedIds.length === sites.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sites.map((s) => s.id));
    }
  };

  // Handle bulk SEO generation
  const handleBulkGenerateSEO = async () => {
    if (selectedIds.length === 0) return;

    const selectedSites = sites.filter((s) => selectedIds.includes(s.id));
    cancelledRef.current = false;

    setProgress({
      isRunning: true,
      current: 0,
      total: selectedSites.length,
      currentSite: null,
      errors: [],
    });

    for (let i = 0; i < selectedSites.length; i++) {
      if (cancelledRef.current) {
        toast.info("Génération SEO annulée");
        break;
      }

      const site = selectedSites[i];
      setProgress((prev) => ({
        ...prev,
        current: i,
        currentSite: `${site.name} (${i + 1}/${selectedSites.length})`,
      }));

      const result = await generateAndUpdateSiteSEO(site.id, site.name);

      if (!result.success) {
        setProgress((prev) => ({
          ...prev,
          errors: [...prev.errors, `${site.name}: ${result.error}`],
        }));
      }
    }

    // Finalize
    const errorCount = progress.errors.length;
    setProgress((prev) => ({
      ...prev,
      isRunning: false,
      current: prev.total,
      currentSite: null,
    }));

    if (!cancelledRef.current) {
      if (errorCount > 0) {
        toast.warning(`SEO généré avec ${errorCount} erreur(s)`);
      } else {
        toast.success(`SEO généré pour ${selectedSites.length} site(s)`);
      }
    }

    setSelectedIds([]);
    cancelledRef.current = false;

    // Force refresh
    window.location.reload();
  };

  // Cancel operation
  const handleCancel = () => {
    cancelledRef.current = true;
  };

  return (
    <>
      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && !progress.isRunning && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-indigo-700">
              {selectedIds.length} site{selectedIds.length > 1 ? "s" : ""} sélectionné{selectedIds.length > 1 ? "s" : ""}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds([])}
              className="text-gray-600"
            >
              Désélectionner
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkGenerateSEO}
              className="text-indigo-700 border-indigo-300 hover:bg-indigo-100"
            >
              <Sparkles className="h-4 w-4 mr-1" />
              Générer SEO
            </Button>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {progress.isRunning && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-indigo-700">
              Génération SEO en cours...
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4 mr-1" />
              Annuler
            </Button>
          </div>
          <div className="w-full bg-indigo-200 rounded-full h-2 mb-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-indigo-600">
            <span>{progress.currentSite || "Démarrage..."}</span>
            <span>{progress.current}/{progress.total}</span>
          </div>
          {progress.errors.length > 0 && (
            <div className="mt-2 text-xs text-red-600">
              {progress.errors.length} erreur(s)
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedIds.length === sites.length && sites.length > 0}
                  onCheckedChange={toggleAll}
                  disabled={progress.isRunning}
                />
              </TableHead>
              <TableHead className="font-semibold text-gray-700">Site</TableHead>
              <TableHead className="font-semibold text-gray-700">Domaine</TableHead>
              <TableHead className="font-semibold text-gray-700 text-center">Mots-clés</TableHead>
              <TableHead className="font-semibold text-gray-700 text-center">Articles</TableHead>
              <TableHead className="font-semibold text-gray-700">Couleurs</TableHead>
              <TableHead className="font-semibold text-gray-700">SEO</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sites.map((site) => (
              <TableRow
                key={site.id}
                className={`hover:bg-gray-50 ${selectedIds.includes(site.id) ? "bg-indigo-50" : ""}`}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(site.id)}
                    onCheckedChange={() => toggleSelection(site.id)}
                    disabled={progress.isRunning}
                  />
                </TableCell>
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
                  {site.meta_title ? (
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                      OK
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-500">
                      -
                    </Badge>
                  )}
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
