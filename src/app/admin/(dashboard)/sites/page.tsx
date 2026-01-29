"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import {
  DataTable,
  SelectionToolbar,
  ConfirmDialog,
} from "@/components/admin/shared";
import { useTableState, useTableKeyboardShortcuts } from "@/hooks";
import {
  getSiteColumns,
  SiteRowActions,
  SiteBulkActions,
  AddSiteDialog,
  DeleteSiteDialog,
} from "@/components/admin/sites";
import type { SiteWithStats } from "@/components/admin/sites";
import type { SiteTemplate } from "@/types/database";
import {
  getSitesWithStats,
  generateAndUpdateSiteSEO,
  bulkUpdateSiteTemplate,
  deleteSite,
} from "@/lib/actions/sites";
import { useBulkProgress } from "@/contexts/BulkProgressContext";

export default function SitesPage() {
  const [sites, setSites] = useState<SiteWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<SiteTemplate>("brutal");
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  // Bulk progress
  const { progress, setProgress, resetProgress, isCancelled, resetCancel } = useBulkProgress();

  // Table state
  const tableState = useTableState<SiteWithStats>({
    items: sites,
    getItemId: (site) => site.id,
  });

  // Load sites
  const loadSites = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await getSitesWithStats();
    if (error) {
      setError(error);
    } else {
      setSites(data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  // Columns
  const columns = getSiteColumns();

  // Row actions renderer
  const renderActions = (site: SiteWithStats) => (
    <SiteRowActions
      site={site}
      onDelete={(id) => setDeleteId(id)}
    />
  );

  // Handle bulk SEO generation
  const handleBulkGenerateSEO = async () => {
    if (tableState.selectedIds.length === 0) return;

    const selectedSites = sites.filter((s) => tableState.selectedIds.includes(s.id));
    resetCancel();

    setProgress({
      isRunning: true,
      total: selectedSites.length,
      completed: 0,
      currentSite: "Démarrage...",
      errors: [],
      results: [],
    });

    let successCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < selectedSites.length; i++) {
      if (isCancelled) {
        toast.info("Génération SEO annulée");
        break;
      }

      const site = selectedSites[i];
      setProgress((prev) => ({
        ...prev,
        completed: i,
        currentSite: `${site.name} (${i + 1}/${selectedSites.length})`,
      }));

      const result = await generateAndUpdateSiteSEO(site.id, site.name);

      if (result.success) {
        successCount++;
      } else {
        errors.push(`${site.name}: ${result.error}`);
      }
    }

    setProgress((prev) => ({
      ...prev,
      isRunning: false,
      completed: selectedSites.length,
      currentSite: null,
      errors,
    }));

    if (!isCancelled) {
      if (errors.length > 0) {
        toast.warning(`SEO généré avec ${errors.length} erreur(s)`);
      } else {
        toast.success(`SEO généré pour ${successCount} site(s)`);
      }
    }

    tableState.clearSelection();
    loadSites();
  };

  // Handle bulk template update
  const handleBulkUpdateTemplate = async () => {
    if (tableState.selectedIds.length === 0) return;

    setIsApplyingTemplate(true);
    const result = await bulkUpdateSiteTemplate(tableState.selectedIds, selectedTemplate);
    setIsApplyingTemplate(false);

    if (!result.success) {
      toast.error(result.error || "Erreur lors de la mise à jour");
      return;
    }

    toast.success(`Template appliqué à ${result.updatedCount} site(s)`);
    tableState.clearSelection();
    loadSites();
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (tableState.selectedIds.length === 0) return;

    const selectedSites = sites.filter((s) => tableState.selectedIds.includes(s.id));

    setProgress({
      isRunning: true,
      total: selectedSites.length,
      completed: 0,
      currentSite: "Démarrage...",
      errors: [],
      results: [],
    });

    let successCount = 0;

    for (let i = 0; i < selectedSites.length; i++) {
      const site = selectedSites[i];
      setProgress((prev) => ({
        ...prev,
        completed: i,
        currentSite: site.name,
      }));

      const result = await deleteSite(site.id);
      if (result.success) {
        successCount++;
      }
    }

    setProgress((prev) => ({
      ...prev,
      isRunning: false,
      completed: selectedSites.length,
      currentSite: null,
    }));

    toast.success(`${successCount} site(s) supprimé(s)`);
    tableState.clearSelection();
    loadSites();
  };

  // Keyboard shortcuts
  useTableKeyboardShortcuts({
    enabled: !isLoading,
    onSelectAll: tableState.selectAll,
    onClearSelection: tableState.clearSelection,
    onDelete: () => {
      if (tableState.selectedIds.length > 0) {
        setIsBulkDeleteOpen(true);
      }
    },
  });

  const siteToDelete = sites.find((s) => s.id === deleteId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sites</h1>
          <p className="text-gray-500 mt-1">
            Gérez vos sites et domaines ({sites.length} site{sites.length > 1 ? "s" : ""})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadSites}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          <AddSiteDialog>
            <Button className="bg-indigo-500 hover:bg-indigo-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un site
            </Button>
          </AddSiteDialog>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Selection toolbar */}
      <SelectionToolbar
        selectedCount={tableState.selectedIds.length}
        totalCount={sites.length}
        onClearSelection={tableState.clearSelection}
        onSelectAll={tableState.selectAll}
        itemLabel="site"
      >
        <SiteBulkActions
          selectedCount={tableState.selectedIds.length}
          selectedTemplate={selectedTemplate}
          onTemplateChange={setSelectedTemplate}
          onApplyTemplate={handleBulkUpdateTemplate}
          onGenerateSEO={handleBulkGenerateSEO}
          onDelete={() => setIsBulkDeleteOpen(true)}
          isLoading={isApplyingTemplate}
          isGenerating={progress.isRunning}
        />
      </SelectionToolbar>

      {/* Table or empty state */}
      {sites.length === 0 && !isLoading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Plus className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun site</h3>
          <p className="text-gray-500 mb-4">
            Commencez par ajouter votre premier site
          </p>
          <AddSiteDialog>
            <Button className="bg-indigo-500 hover:bg-indigo-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un site
            </Button>
          </AddSiteDialog>
        </div>
      ) : (
        <DataTable<SiteWithStats>
          items={sites}
          columns={columns}
          getItemId={(site) => site.id}
          selectable
          loading={isLoading}
          selectedIds={tableState.selectedIds}
          onSelectionChange={tableState.setSelectedIds}
          rowActions={renderActions}
          emptyMessage="Aucun site trouvé"
        />
      )}

      {/* Delete single site dialog */}
      <DeleteSiteDialog
        site={siteToDelete || null}
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteId(null);
            loadSites();
          }
        }}
      />

      {/* Bulk delete confirmation */}
      <ConfirmDialog
        open={isBulkDeleteOpen}
        onOpenChange={setIsBulkDeleteOpen}
        title="Supprimer les sites"
        description={`Êtes-vous sûr de vouloir supprimer ${tableState.selectedIds.length} site(s) ? Cette action supprimera également tous les articles et mots-clés associés.`}
        confirmLabel="Supprimer"
        variant="destructive"
        onConfirm={handleBulkDelete}
      />
    </div>
  );
}
