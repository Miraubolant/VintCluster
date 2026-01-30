"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Calendar, Clock, FileText, Tag } from "lucide-react";
import { toast } from "sonner";

import {
  DataTable,
  SelectionToolbar,
  StatsGrid,
} from "@/components/admin/shared";
import type { StatCard } from "@/components/admin/shared";
import { useTableState, useTableKeyboardShortcuts } from "@/hooks";
import {
  SchedulerConfigDialog,
  BulkGenerationDialog,
  getSchedulerColumns,
  SchedulerRowActions,
  SchedulerBulkActions,
  type BulkGenerationConfig,
} from "@/components/admin/scheduler";
import type { SchedulerConfigWithSite } from "@/components/admin/scheduler";
import { useBulkProgress } from "@/contexts/BulkProgressContext";
import {
  getSchedulerConfigs,
  getSchedulerStats,
  toggleSchedulerEnabled,
  runSchedulerManually,
  prepareBulkGenerationWithOptions,
  generateSingleBulkArticle,
  finalizeBulkGeneration,
} from "@/lib/actions/scheduler";
import { getSites } from "@/lib/actions/sites";
import type { Site } from "@/types/database";

export default function SchedulerPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [configs, setConfigs] = useState<SchedulerConfigWithSite[]>([]);
  const [stats, setStats] = useState({
    totalConfigs: 0,
    enabledConfigs: 0,
    pendingKeywords: 0,
    articlesToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SchedulerConfigWithSite | null>(null);
  const [runningSiteId, setRunningSiteId] = useState<string | null>(null);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkGenerating, setBulkGenerating] = useState(false);

  // Use context for progress tracking
  const { progress, setProgress, isCancelled } = useBulkProgress();
  const cancelledRef = useRef(false);

  // Sync cancelled state with ref
  useEffect(() => {
    cancelledRef.current = isCancelled;
  }, [isCancelled]);

  // Table state
  const tableState = useTableState<SchedulerConfigWithSite>({
    items: configs,
    getItemId: (c) => c.site_id,
  });

  const loadData = useCallback(async () => {
    setLoading(true);

    const [sitesRes, configsRes, statsRes] = await Promise.all([
      getSites(),
      getSchedulerConfigs(),
      getSchedulerStats(),
    ]);

    if (sitesRes.data) setSites(sitesRes.data);
    if (configsRes.data) setConfigs(configsRes.data);
    setStats(statsRes);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Stats items for StatsGrid
  const statsCards: StatCard[] = [
    { label: "Configurations", value: stats.totalConfigs, icon: Calendar, color: "indigo" },
    { label: "Actives", value: stats.enabledConfigs, icon: Clock, color: "green" },
    { label: "Mots-clés dispo", value: stats.pendingKeywords, icon: Tag, color: "purple" },
    { label: "Articles aujourd'hui", value: stats.articlesToday, icon: FileText, color: "blue" },
  ];

  // Filter configs with keywords (can be selected)
  const selectableConfigs = configs.filter((c) => {
    const keywordIds = (c.keyword_ids as string[]) || [];
    return keywordIds.length > 0;
  });

  // Handlers
  async function handleToggle(siteId: string, enabled: boolean) {
    const result = await toggleSchedulerEnabled(siteId, enabled);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(enabled ? "Scheduler activé" : "Scheduler désactivé");
    loadData();
  }

  async function handleRunManually(siteId: string) {
    setRunningSiteId(siteId);
    const result = await runSchedulerManually(siteId);
    setRunningSiteId(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(`Article généré: ${result.articleTitle}`);
    loadData();
  }

  function handleEdit(config: SchedulerConfigWithSite) {
    setEditingConfig(config);
    setDialogOpen(true);
  }

  function handleAdd() {
    setEditingConfig(null);
    setDialogOpen(true);
  }

  async function handleBulkEnable() {
    for (const siteId of tableState.selectedIds) {
      await toggleSchedulerEnabled(siteId, true);
    }
    toast.success(`${tableState.selectedIds.length} scheduler(s) activé(s)`);
    tableState.clearSelection();
    loadData();
  }

  async function handleBulkDisable() {
    for (const siteId of tableState.selectedIds) {
      await toggleSchedulerEnabled(siteId, false);
    }
    toast.success(`${tableState.selectedIds.length} scheduler(s) désactivé(s)`);
    tableState.clearSelection();
    loadData();
  }

  function handleOpenBulkDialog() {
    if (tableState.selectedIds.length === 0) return;
    setBulkDialogOpen(true);
  }

  async function handleBulkGeneration(config: BulkGenerationConfig) {
    setBulkDialogOpen(false);
    setBulkGenerating(true);
    const siteIdsToProcess = [...tableState.selectedIds];
    tableState.clearSelection();
    cancelledRef.current = false;

    // Prepare tasks with custom options
    const { tasks, errors: prepErrors } = await prepareBulkGenerationWithOptions(
      siteIdsToProcess,
      config.totalArticles,
      {
        keywordIds: config.keywordIds.length > 0 ? config.keywordIds : undefined,
        enableImprovement: config.enableImprovement,
        improvementModel: config.improvementModel,
        improvementMode: config.improvementMode,
        autoPublish: config.autoPublish,
        imagesPerArticle: config.imagesPerArticle,
        enableSeoExpert: config.enableSeoExpert,
        seoExpertModel: config.seoExpertModel,
        seoExpertIncludeTable: config.seoExpertIncludeTable,
      }
    );

    // Calculate total articles
    const totalArticles = tasks.reduce((sum, t) => sum + t.count, 0);

    // Initialize progress
    setProgress({
      isRunning: true,
      total: totalArticles,
      completed: 0,
      currentSite: null,
      errors: [...prepErrors],
      results: [],
    });

    // Generate article by article
    outerLoop:
    for (const task of tasks) {
      for (let i = 0; i < task.count; i++) {
        if (cancelledRef.current) {
          setProgress((prev) => ({
            ...prev,
            errors: [...prev.errors, "Annulé par l'utilisateur"],
          }));
          break outerLoop;
        }

        const seoNote = task.enableSeoExpert ? ` [SEO ${task.seoExpertModel}]` : "";
        setProgress((prev) => ({
          ...prev,
          currentSite: `${task.siteName}${seoNote} (${i + 1}/${task.count})`,
        }));

        const result = await generateSingleBulkArticle(
          task.siteId,
          task.keywordIds,
          task.autoPublish,
          {
            enableImprovement: task.enableImprovement,
            improvementModel: task.improvementModel,
            improvementMode: task.improvementMode,
            imagesPerArticle: task.imagesPerArticle,
            enableSeoExpert: task.enableSeoExpert,
            seoExpertModel: task.seoExpertModel,
            seoExpertIncludeTable: task.seoExpertIncludeTable,
          }
        );

        if (cancelledRef.current) {
          if (result.success && result.title) {
            setProgress((prev) => ({
              ...prev,
              completed: prev.completed + 1,
              results: [...prev.results, { siteName: task.siteName, title: result.title! }],
              errors: [...prev.errors, "Annulé par l'utilisateur"],
            }));
          } else {
            setProgress((prev) => ({
              ...prev,
              errors: [...prev.errors, "Annulé par l'utilisateur"],
            }));
          }
          break outerLoop;
        }

        if (result.success && result.title) {
          setProgress((prev) => ({
            ...prev,
            completed: prev.completed + 1,
            results: [...prev.results, { siteName: task.siteName, title: result.title! }],
          }));
        } else if (result.error) {
          setProgress((prev) => ({
            ...prev,
            errors: [...prev.errors, `${task.siteName}: ${result.error}`],
          }));
          if (result.error.includes("Plus de mots-clés")) {
            break;
          }
        }
      }
    }

    // Finalize
    await finalizeBulkGeneration();
    setBulkGenerating(false);
    cancelledRef.current = false;
    setProgress((prev) => ({
      ...prev,
      isRunning: false,
      currentSite: null,
    }));
    loadData();
  }

  // Columns with toggle handler
  const columns = getSchedulerColumns(handleToggle);

  // Row actions renderer
  const renderActions = (config: SchedulerConfigWithSite) => (
    <SchedulerRowActions
      config={config}
      isRunning={runningSiteId === config.site_id}
      onRunManually={handleRunManually}
      onEdit={handleEdit}
      onToggle={handleToggle}
    />
  );

  // Keyboard shortcuts
  useTableKeyboardShortcuts({
    enabled: !loading,
    onSelectAll: () => {
      tableState.setSelectedIds(selectableConfigs.map((c) => c.site_id));
    },
    onClearSelection: tableState.clearSelection,
  });

  // Sites without configuration
  const configuredSiteIds = configs.map((c) => c.site_id);
  const unconfiguredSites = sites.filter(
    (s) => !configuredSiteIds.includes(s.id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planification</h1>
          <p className="text-gray-500 mt-1">
            Configurez la génération et publication automatiques
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Actualiser
          </Button>
          {unconfiguredSites.length > 0 && (
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Configurer un site
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <StatsGrid stats={statsCards} columns={4} />

      {/* Selection toolbar */}
      <SelectionToolbar
        selectedCount={tableState.selectedIds.length}
        totalCount={selectableConfigs.length}
        onClearSelection={tableState.clearSelection}
        onSelectAll={() => tableState.setSelectedIds(selectableConfigs.map((c) => c.site_id))}
        itemLabel="config"
      >
        <SchedulerBulkActions
          selectedCount={tableState.selectedIds.length}
          onLaunchBulk={handleOpenBulkDialog}
          onEnableAll={handleBulkEnable}
          onDisableAll={handleBulkDisable}
          isGenerating={bulkGenerating || progress.isRunning}
        />
      </SelectionToolbar>

      {/* Table or empty state */}
      {configs.length === 0 && !loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500">Aucune configuration</p>
          <p className="text-sm text-gray-400 mt-1">
            Configurez un site pour activer la génération automatique
          </p>
          {sites.length > 0 && (
            <Button className="mt-4" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Configurer un site
            </Button>
          )}
        </div>
      ) : (
        <DataTable<SchedulerConfigWithSite>
          items={configs}
          columns={columns}
          getItemId={(c) => c.site_id}
          selectable
          loading={loading}
          selectedIds={tableState.selectedIds}
          onSelectionChange={tableState.setSelectedIds}
          rowActions={renderActions}
          emptyMessage="Aucune configuration"
        />
      )}

      {/* Config dialog */}
      <SchedulerConfigDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        config={editingConfig}
        sites={unconfiguredSites}
        onSuccess={loadData}
      />

      {/* Bulk Generation Dialog */}
      <BulkGenerationDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        selectedConfigs={tableState.selectedIds.map((siteId) => {
          const config = configs.find((c) => c.site_id === siteId);
          return {
            siteId,
            siteName: config?.site?.name || "Site inconnu",
          };
        })}
        initialArticleCount={4}
        onLaunch={handleBulkGeneration}
        isLoading={bulkGenerating}
      />
    </div>
  );
}
