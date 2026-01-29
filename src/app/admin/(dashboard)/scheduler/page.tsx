"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, CheckSquare, X, Rocket, Loader2 } from "lucide-react";
import {
  SchedulerStats,
  SchedulerConfigCard,
  SchedulerConfigDialog,
  BulkGenerationDialog,
  type BulkGenerationConfig,
} from "@/components/admin/scheduler";
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
import { toast } from "sonner";
import type { Site, SchedulerConfig } from "@/types/database";

interface SchedulerConfigWithSite extends SchedulerConfig {
  site?: {
    id: string;
    name: string;
    domain: string;
  };
  articlesCount?: number;
}

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

  // Selection mode for bulk generation
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedSiteIds, setSelectedSiteIds] = useState<Set<string>>(new Set());
  const [bulkArticleCount, setBulkArticleCount] = useState(4);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);

  // Use context for progress tracking (persists across pages)
  const { progress, setProgress, isCancelled } = useBulkProgress();

  // Use ref for cancel check in async loop (state updates may not be immediate)
  const cancelledRef = useRef(false);

  // Sync cancelled state with ref
  useEffect(() => {
    cancelledRef.current = isCancelled;
  }, [isCancelled]);

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

  function handleSelect(siteId: string, selected: boolean) {
    const newSet = new Set(selectedSiteIds);
    if (selected) {
      newSet.add(siteId);
    } else {
      newSet.delete(siteId);
    }
    setSelectedSiteIds(newSet);
  }

  function handleSelectAll() {
    const selectableConfigs = configs.filter(c => {
      const keywordIds = (c.keyword_ids as string[]) || [];
      return keywordIds.length > 0;
    });
    setSelectedSiteIds(new Set(selectableConfigs.map(c => c.site_id)));
  }

  function handleDeselectAll() {
    setSelectedSiteIds(new Set());
  }

  function toggleSelectionMode() {
    if (selectionMode) {
      setSelectedSiteIds(new Set());
    }
    setSelectionMode(!selectionMode);
  }

  function handleOpenBulkDialog() {
    if (selectedSiteIds.size === 0) return;
    setBulkDialogOpen(true);
  }

  async function handleBulkGeneration(config: BulkGenerationConfig) {
    setBulkDialogOpen(false);
    setBulkGenerating(true);
    setSelectionMode(false);
    const siteIdsToProcess = Array.from(selectedSiteIds);
    setSelectedSiteIds(new Set());
    cancelledRef.current = false;

    // Préparer les tâches avec les options personnalisées
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
      }
    );

    // Calculer le total d'articles à générer
    const totalArticles = tasks.reduce((sum, t) => sum + t.count, 0);

    // Initialiser le progress
    setProgress({
      isRunning: true,
      total: totalArticles,
      completed: 0,
      currentSite: null,
      errors: [...prepErrors],
      results: [],
    });

    // Générer article par article
    outerLoop:
    for (const task of tasks) {
      for (let i = 0; i < task.count; i++) {
        // Check if cancelled before starting each article
        if (cancelledRef.current) {
          setProgress(prev => ({
            ...prev,
            errors: [...prev.errors, "Annulé par l'utilisateur"],
          }));
          break outerLoop;
        }

        // Update current site
        setProgress(prev => ({
          ...prev,
          currentSite: `${task.siteName} (${i + 1}/${task.count})`,
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
          }
        );

        // Check if cancelled after generation
        if (cancelledRef.current) {
          // Still count this article if it succeeded
          if (result.success && result.title) {
            setProgress(prev => ({
              ...prev,
              completed: prev.completed + 1,
              results: [...prev.results, { siteName: task.siteName, title: result.title! }],
              errors: [...prev.errors, "Annulé par l'utilisateur"],
            }));
          } else {
            setProgress(prev => ({
              ...prev,
              errors: [...prev.errors, "Annulé par l'utilisateur"],
            }));
          }
          break outerLoop;
        }

        if (result.success && result.title) {
          setProgress(prev => ({
            ...prev,
            completed: prev.completed + 1,
            results: [...prev.results, { siteName: task.siteName, title: result.title! }],
          }));
        } else if (result.error) {
          setProgress(prev => ({
            ...prev,
            errors: [...prev.errors, `${task.siteName}: ${result.error}`],
          }));
          // Si plus de mots-clés, passer au site suivant
          if (result.error.includes("Plus de mots-clés")) {
            break;
          }
        }
      }
    }

    // Finaliser
    await finalizeBulkGeneration();
    setBulkGenerating(false);
    cancelledRef.current = false;
    setProgress(prev => ({
      ...prev,
      isRunning: false,
      currentSite: null,
    }));
    loadData();
  }

  // Sites sans configuration
  const configuredSiteIds = configs.map((c) => c.site_id);
  const unconfiguredSites = sites.filter(
    (s) => !configuredSiteIds.includes(s.id)
  );

  return (
    <div className="space-y-6">
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
          {configs.length > 0 && (
            <Button
              variant={selectionMode ? "default" : "outline"}
              size="sm"
              onClick={toggleSelectionMode}
              className={selectionMode ? "bg-indigo-600 hover:bg-indigo-700" : ""}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              {selectionMode ? "Annuler" : "Sélectionner"}
            </Button>
          )}
          {unconfiguredSites.length > 0 && (
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Configurer un site
            </Button>
          )}
        </div>
      </div>

      <SchedulerStats stats={stats} />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Configurations ({configs.length})
        </h2>

        {configs.length === 0 ? (
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
          <div className="space-y-3">
            {configs.map((config) => (
              <SchedulerConfigCard
                key={config.id}
                config={config}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onRunManually={handleRunManually}
                isRunning={runningSiteId === config.site_id}
                selectionMode={selectionMode}
                selected={selectedSiteIds.has(config.site_id)}
                onSelect={handleSelect}
              />
            ))}
          </div>
        )}
      </div>

      <SchedulerConfigDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        config={editingConfig}
        sites={unconfiguredSites}
        onSuccess={loadData}
      />

      {/* Floating action bar for bulk generation */}
      {selectionMode && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-white border border-gray-200 rounded-xl shadow-2xl p-4 flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-gray-700">
                {selectedSiteIds.size} config(s) sélectionnée(s)
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs"
              >
                Tout
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeselectAll}
                className="text-xs"
              >
                Aucun
              </Button>
            </div>

            <div className="h-8 w-px bg-gray-200" />

            <Button
              onClick={handleOpenBulkDialog}
              disabled={selectedSiteIds.size === 0 || bulkGenerating || progress.isRunning}
              className="bg-indigo-600 hover:bg-indigo-700 gap-2"
            >
              {bulkGenerating || progress.isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Rocket className="h-4 w-4" />
              )}
              {bulkGenerating || progress.isRunning ? "Génération..." : "Configurer & Lancer"}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSelectionMode}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Generation Dialog */}
      <BulkGenerationDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        selectedConfigs={Array.from(selectedSiteIds).map(siteId => {
          const config = configs.find(c => c.site_id === siteId);
          return {
            siteId,
            siteName: config?.site?.name || "Site inconnu",
          };
        })}
        initialArticleCount={bulkArticleCount}
        onLaunch={handleBulkGeneration}
        isLoading={bulkGenerating}
      />

      {/* Progress bar is rendered by BulkProgressWrapper in the layout */}
    </div>
  );
}
