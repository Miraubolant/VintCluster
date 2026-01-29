"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Sparkles, FileText, Clock, LayoutList, CheckCircle, Archive } from "lucide-react";
import { toast } from "sonner";

import {
  DataTable,
  SelectionToolbar,
  StatsGrid,
  FilterBar,
  ConfirmDialog,
} from "@/components/admin/shared";
import type { StatCard, FilterConfig } from "@/components/admin/shared";
import { useTableState, useTableKeyboardShortcuts } from "@/hooks";
import {
  getKeywordColumns,
  KeywordRowActions,
  KeywordBulkActions,
  ImportKeywordsDialog,
  KEYWORD_STATUS_OPTIONS,
} from "@/components/admin/keywords";
import type { KeywordWithSite } from "@/components/admin/keywords";
import {
  getKeywords,
  getKeywordStats,
  updateKeywordStatus,
  deleteKeywords,
} from "@/lib/actions/keywords";
import { generateArticleFromKeyword } from "@/lib/actions/articles";
import { getSites } from "@/lib/actions/sites";
import type { Site, KeywordStatus } from "@/types/database";
import { useBulkProgress } from "@/contexts/BulkProgressContext";

export default function KeywordsPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [keywords, setKeywords] = useState<KeywordWithSite[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    generating: 0,
    generated: 0,
    published: 0,
    archived: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [generatingIds, setGeneratingIds] = useState<string[]>([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Bulk progress
  const { progress, setProgress, isCancelled, resetCancel } = useBulkProgress();

  // Table state
  const tableState = useTableState<KeywordWithSite>({
    items: keywords,
    getItemId: (k) => k.id,
  });

  const loadData = useCallback(async () => {
    setLoading(true);

    const [sitesRes, keywordsRes, statsRes] = await Promise.all([
      getSites(),
      getKeywords({
        siteId: selectedSiteId || undefined,
        status: (selectedStatus as KeywordStatus) || undefined,
        search: searchQuery || undefined,
      }),
      getKeywordStats(selectedSiteId || undefined),
    ]);

    if (sitesRes.data) setSites(sitesRes.data);
    if (keywordsRes.data) setKeywords(keywordsRes.data);
    setStats(statsRes);
    setLoading(false);
  }, [selectedSiteId, selectedStatus, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Stats items for StatsGrid
  const statsCards: StatCard[] = [
    { label: "Total", value: stats.total, icon: LayoutList, color: "gray" },
    { label: "En attente", value: stats.pending, icon: Clock, color: "yellow" },
    { label: "En génération", value: stats.generating, icon: Sparkles, color: "blue" },
    { label: "Générés", value: stats.generated, icon: FileText, color: "purple" },
    { label: "Publiés", value: stats.published, icon: CheckCircle, color: "green" },
    { label: "Archivés", value: stats.archived, icon: Archive, color: "gray" },
  ];

  // Filter config
  const filters: FilterConfig[] = [
    {
      key: "search",
      type: "search",
      label: "Recherche",
      placeholder: "Rechercher un mot-clé...",
    },
    {
      key: "site",
      type: "select",
      label: "Site",
      placeholder: "Tous les sites",
      options: sites.map((s) => ({ value: s.id, label: s.name })),
    },
    {
      key: "status",
      type: "select",
      label: "Statut",
      placeholder: "Tous les statuts",
      options: KEYWORD_STATUS_OPTIONS,
    },
  ];

  // Filter values
  const filterValues: Record<string, string | null> = {
    search: searchQuery || null,
    site: selectedSiteId,
    status: selectedStatus,
  };

  // Handle filter change
  const handleFilterChange = (key: string, value: string | null) => {
    if (key === "search") {
      setSearchQuery(value || "");
    } else if (key === "site") {
      setSelectedSiteId(value);
    } else if (key === "status") {
      setSelectedStatus(value);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedSiteId(null);
    setSelectedStatus(null);
  };

  // Columns with generating state
  const columns = getKeywordColumns(generatingIds);

  // Row actions renderer
  const renderActions = (keyword: KeywordWithSite) => (
    <KeywordRowActions
      keyword={keyword}
      isGenerating={generatingIds.includes(keyword.id)}
      onGenerate={handleGenerate}
      onStatusChange={(id, status) => handleStatusChange([id], status)}
      onDelete={(id) => handleDelete([id])}
    />
  );

  // Handlers
  async function handleStatusChange(ids: string[], status: KeywordStatus) {
    const result = await updateKeywordStatus(ids, status);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`${ids.length} mot(s)-clé(s) mis à jour`);
    tableState.clearSelection();
    loadData();
  }

  async function handleDelete(ids: string[]) {
    const result = await deleteKeywords(ids);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`${ids.length} mot(s)-clé(s) supprimé(s)`);
    tableState.clearSelection();
    loadData();
  }

  async function handleGenerate(keywordId: string) {
    setGeneratingIds((prev) => [...prev, keywordId]);

    const result = await generateArticleFromKeyword(keywordId);

    setGeneratingIds((prev) => prev.filter((id) => id !== keywordId));

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Article généré avec succès !");
    loadData();
  }

  async function handleBulkGenerate() {
    if (tableState.selectedIds.length === 0) return;

    const selectedKeywords = keywords.filter((k) =>
      tableState.selectedIds.includes(k.id) && k.status === "pending"
    );

    if (selectedKeywords.length === 0) {
      toast.warning("Aucun mot-clé en attente sélectionné");
      return;
    }

    resetCancel();
    setGeneratingIds(selectedKeywords.map((k) => k.id));

    setProgress({
      isRunning: true,
      total: selectedKeywords.length,
      completed: 0,
      currentSite: "Démarrage...",
      errors: [],
      results: [],
    });

    let successCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < selectedKeywords.length; i++) {
      if (isCancelled) {
        toast.info("Génération annulée");
        break;
      }

      const keyword = selectedKeywords[i];
      setProgress((prev) => ({
        ...prev,
        completed: i,
        currentSite: `${keyword.keyword} (${i + 1}/${selectedKeywords.length})`,
      }));

      const result = await generateArticleFromKeyword(keyword.id);

      if (result.error) {
        errors.push(`${keyword.keyword}: ${result.error}`);
      } else {
        successCount++;
      }
    }

    setGeneratingIds([]);
    setProgress((prev) => ({
      ...prev,
      isRunning: false,
      completed: selectedKeywords.length,
      currentSite: null,
      errors,
    }));

    if (!isCancelled) {
      if (errors.length > 0) {
        toast.warning(`${successCount} article(s) généré(s) avec ${errors.length} erreur(s)`);
      } else {
        toast.success(`${successCount} article(s) généré(s)`);
      }
    }

    tableState.clearSelection();
    loadData();
  }

  async function handleBulkDelete() {
    await handleDelete(tableState.selectedIds);
    setIsDeleteDialogOpen(false);
  }

  // Keyboard shortcuts
  useTableKeyboardShortcuts({
    enabled: !loading,
    onSelectAll: tableState.selectAll,
    onClearSelection: tableState.clearSelection,
    onDelete: () => {
      if (tableState.selectedIds.length > 0) {
        setIsDeleteDialogOpen(true);
      }
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mots-clés</h1>
          <p className="text-gray-500 mt-1">
            Importez et gérez vos mots-clés pour la génération d&apos;articles
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          <Link href="/admin/keywords/generate">
            <Button variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
              <Sparkles className="h-4 w-4 mr-2" />
              Générer IA
            </Button>
          </Link>
          <Button onClick={() => setImportDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Importer
          </Button>
        </div>
      </div>

      {/* Stats */}
      <StatsGrid stats={statsCards} columns={6} />

      {/* Filters */}
      <FilterBar
        filters={filters}
        values={filterValues}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Selection toolbar */}
      <SelectionToolbar
        selectedCount={tableState.selectedIds.length}
        totalCount={keywords.length}
        onClearSelection={tableState.clearSelection}
        onSelectAll={tableState.selectAll}
        itemLabel="mot-clé"
      >
        <KeywordBulkActions
          selectedCount={tableState.selectedIds.length}
          onGenerate={handleBulkGenerate}
          onStatusChange={(status) => handleStatusChange(tableState.selectedIds, status)}
          onDelete={() => setIsDeleteDialogOpen(true)}
          isGenerating={progress.isRunning || generatingIds.length > 0}
        />
      </SelectionToolbar>

      {/* Table */}
      <DataTable<KeywordWithSite>
        items={keywords}
        columns={columns}
        getItemId={(k) => k.id}
        selectable
        loading={loading}
        selectedIds={tableState.selectedIds}
        onSelectionChange={tableState.setSelectedIds}
        rowActions={renderActions}
        emptyMessage="Aucun mot-clé trouvé"
        emptyDescription="Importez des mots-clés pour commencer"
      />

      {/* Import dialog */}
      <ImportKeywordsDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        sites={sites}
        onSuccess={loadData}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Supprimer les mots-clés"
        description={`Êtes-vous sûr de vouloir supprimer ${tableState.selectedIds.length} mot(s)-clé(s) ?`}
        confirmLabel="Supprimer"
        variant="destructive"
        onConfirm={handleBulkDelete}
      />
    </div>
  );
}
