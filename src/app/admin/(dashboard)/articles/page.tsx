"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw,
  Plus,
  Sparkles,
  ImageIcon,
  FileText,
  Edit,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";

// Composants partagés
import {
  DataTable,
  SelectionToolbar,
  StatsGrid,
  FilterBar,
  ConfirmDialog,
  type StatCard,
  type FilterConfig,
} from "@/components/admin/shared";
import { useTableState, useTableKeyboardShortcuts } from "@/hooks";

// Composants spécifiques articles
import {
  ArticlePreviewDialog,
  CreateArticleDialog,
  GenerateArticleDialog,
  SEOImproveDialog,
  getArticleColumns,
  ArticleRowActions,
  ArticleBulkActions,
  ARTICLE_STATUS_OPTIONS,
  ARTICLE_SEO_OPTIONS,
  type ArticleWithDetails,
} from "@/components/admin/articles";

// Actions serveur
import {
  getArticles,
  getArticleStats,
  updateArticleStatus,
  deleteArticle,
  bulkUpdateArticleStatus,
  bulkDeleteArticles,
  generateArticleImage,
  bulkSubmitToIndexNow,
  improveArticleWithAI,
  improveArticleSEO,
  type SEOModel,
} from "@/lib/actions/articles";
import { getSites } from "@/lib/actions/sites";

// Context et types
import { useBulkProgress } from "@/contexts/BulkProgressContext";
import { MODEL_INFO, type ImageModel } from "@/lib/replicate";
import {
  IMPROVEMENT_MODELS,
  IMPROVEMENT_MODES,
  type ImprovementModel,
  type ImprovementMode,
} from "@/lib/openai";
import { toast } from "sonner";
import type { Site, ArticleStatus } from "@/types/database";

// Configuration des filtres
const getFilterConfigs = (sites: Site[]): FilterConfig[] => [
  {
    key: "search",
    type: "search",
    label: "Recherche",
    placeholder: "Rechercher un article...",
  },
  {
    key: "siteId",
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
    options: ARTICLE_STATUS_OPTIONS,
  },
  {
    key: "seo",
    type: "select",
    label: "SEO",
    placeholder: "Tous",
    options: ARTICLE_SEO_OPTIONS,
  },
];

// Configuration des stats
const getStatsCards = (stats: {
  total: number;
  draft: number;
  ready: number;
  published: number;
  unpublished: number;
}): StatCard[] => [
  { label: "Total", value: stats.total, icon: FileText, color: "gray" },
  { label: "Brouillons", value: stats.draft, icon: Edit, color: "amber" },
  { label: "Prêts", value: stats.ready, icon: CheckCircle, color: "blue" },
  { label: "Publiés", value: stats.published, icon: Eye, color: "green" },
  { label: "Dépubliés", value: stats.unpublished, icon: EyeOff, color: "gray" },
];

export default function ArticlesPage() {
  const router = useRouter();

  // State principal
  const [sites, setSites] = useState<Site[]>([]);
  const [articles, setArticles] = useState<ArticleWithDetails[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    ready: 0,
    published: 0,
    unpublished: 0,
  });
  const [loading, setLoading] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Filtres locaux (synchro avec serveur)
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ArticleStatus | null>(null);
  const [selectedSeoFilter, setSelectedSeoFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filtrer articles par SEO (client-side) - doit être après la déclaration de selectedSeoFilter
  const filteredArticles = articles.filter((article) => {
    if (!selectedSeoFilter || selectedSeoFilter === "all") return true;
    if (selectedSeoFilter === "improved") return article.seo_improved === true;
    if (selectedSeoFilter === "not_improved") return !article.seo_improved;
    if (selectedSeoFilter === "gemini") return article.seo_model === "gemini";
    if (selectedSeoFilter === "claude") return article.seo_model === "claude";
    return true;
  });

  // Table state avec hook
  const table = useTableState({
    items: filteredArticles,
    getItemId: (a) => a.id,
  });

  // Dialogs
  const [previewArticle, setPreviewArticle] = useState<ArticleWithDetails | null>(null);
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
  const [improveDialogOpen, setImproveDialogOpen] = useState(false);
  const [seoImproveDialogOpen, setSeoImproveDialogOpen] = useState(false);
  const [seoImproveLoading, setSeoImproveLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Modèles sélectionnés
  const [selectedModel, setSelectedModel] = useState<ImageModel>("flux-schnell");
  const [selectedAIModel, setSelectedAIModel] = useState<ImprovementModel>("gpt-4o");
  const [selectedImproveMode, setSelectedImproveMode] = useState<ImprovementMode>("full-pbn");

  // IndexNow loading
  const [indexNowLoading, setIndexNowLoading] = useState(false);

  // Progress tracking
  const { progress, setProgress, isCancelled } = useBulkProgress();
  const cancelledRef = useRef(false);

  // Sync cancelled state
  useEffect(() => {
    cancelledRef.current = isCancelled;
  }, [isCancelled]);

  // Raccourcis clavier
  useTableKeyboardShortcuts({
    onSelectAll: table.selectAll,
    onClearSelection: table.clearSelection,
    onDelete: () => setDeleteDialogOpen(true),
    hasSelection: table.selectedCount > 0,
    enabled: !progress.isRunning,
  });

  // Chargement des données
  const loadData = useCallback(async () => {
    setLoading(true);

    const [sitesRes, articlesRes, statsRes] = await Promise.all([
      getSites(),
      getArticles({
        siteId: selectedSiteId || undefined,
        status: selectedStatus || undefined,
        search: searchQuery || undefined,
      }),
      getArticleStats(selectedSiteId || undefined),
    ]);

    if (sitesRes.data) setSites(sitesRes.data);
    if (articlesRes.data) setArticles(articlesRes.data);
    setStats(statsRes);
    setLoading(false);
  }, [selectedSiteId, selectedStatus, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers de filtres
  const handleFilterChange = (key: string, value: string | null) => {
    table.clearSelection();
    if (key === "search") setSearchQuery(value || "");
    if (key === "siteId") setSelectedSiteId(value);
    if (key === "status") setSelectedStatus(value as ArticleStatus | null);
    if (key === "seo") setSelectedSeoFilter(value);
  };

  // Handlers d'actions individuelles
  const handleStatusChange = async (id: string, status: ArticleStatus) => {
    const result = await updateArticleStatus(id, status);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Statut mis à jour");
    loadData();
  };

  const handleDelete = async (id: string) => {
    const result = await deleteArticle(id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Article supprimé");
    loadData();
  };

  // Handlers d'actions bulk
  const handleBulkStatusChange = async (status: ArticleStatus) => {
    if (table.selectedCount === 0) return;

    setBulkLoading(true);
    const result = await bulkUpdateArticleStatus(table.selectedIds, status);
    setBulkLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(`${result.count} article(s) mis à jour`);
    table.clearSelection();
    loadData();
  };

  const handleBulkDelete = async () => {
    if (table.selectedCount === 0) return;

    setDeleteDialogOpen(false);
    setBulkLoading(true);
    const result = await bulkDeleteArticles(table.selectedIds);
    setBulkLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(`${result.count} article(s) supprimé(s)`);
    table.clearSelection();
    loadData();
  };

  const handleBulkRegenerateImages = async () => {
    if (table.selectedCount === 0) return;

    setRegenerateDialogOpen(false);
    cancelledRef.current = false;

    const selectedArticles = table.selectedItems;

    setProgress({
      isRunning: true,
      total: selectedArticles.length,
      completed: 0,
      currentSite: null,
      errors: [],
      results: [],
    });

    for (let i = 0; i < selectedArticles.length; i++) {
      const article = selectedArticles[i];

      if (cancelledRef.current) {
        setProgress((prev) => ({
          ...prev,
          errors: [...prev.errors, "Annulé par l'utilisateur"],
        }));
        break;
      }

      setProgress((prev) => ({
        ...prev,
        currentSite: `${article.title.substring(0, 40)}... (${i + 1}/${selectedArticles.length})`,
      }));

      const result = await generateArticleImage(article.id, selectedModel);

      if (cancelledRef.current) {
        if (result.url) {
          setProgress((prev) => ({
            ...prev,
            completed: prev.completed + 1,
            results: [...prev.results, { siteName: article.site?.name || "Article", title: article.title }],
            errors: [...prev.errors, "Annulé par l'utilisateur"],
          }));
        }
        break;
      }

      if (result.url) {
        setProgress((prev) => ({
          ...prev,
          completed: prev.completed + 1,
          results: [...prev.results, { siteName: article.site?.name || "Article", title: article.title }],
        }));
      } else if (result.error) {
        setProgress((prev) => ({
          ...prev,
          errors: [...prev.errors, `${article.title.substring(0, 30)}: ${result.error}`],
        }));
      }
    }

    cancelledRef.current = false;
    setProgress((prev) => ({ ...prev, isRunning: false, currentSite: null }));
    table.clearSelection();
    loadData();
  };

  const handleBulkIndexNow = async () => {
    if (table.selectedCount === 0) return;

    const publishedCount = articles.filter(
      (a) => table.selectedIds.includes(a.id) && a.status === "published"
    ).length;

    if (publishedCount === 0) {
      toast.error("Seuls les articles publiés peuvent être soumis à IndexNow");
      return;
    }

    setIndexNowLoading(true);
    const result = await bulkSubmitToIndexNow(table.selectedIds);
    setIndexNowLoading(false);

    if (result.errors.length > 0) {
      result.errors.forEach((err) => toast.error(err));
    }

    if (result.submitted > 0) {
      toast.success(`${result.submitted} article(s) soumis à IndexNow`);
    }

    table.clearSelection();
  };

  const handleBulkImprove = async () => {
    if (table.selectedCount === 0) return;

    setImproveDialogOpen(false);
    cancelledRef.current = false;

    const selectedArticles = table.selectedItems;

    setProgress({
      isRunning: true,
      total: selectedArticles.length,
      completed: 0,
      currentSite: null,
      errors: [],
      results: [],
    });

    for (let i = 0; i < selectedArticles.length; i++) {
      const article = selectedArticles[i];

      if (cancelledRef.current) {
        setProgress((prev) => ({
          ...prev,
          errors: [...prev.errors, "Annulé par l'utilisateur"],
        }));
        break;
      }

      setProgress((prev) => ({
        ...prev,
        currentSite: `Amélioration: ${article.title.substring(0, 35)}... (${i + 1}/${selectedArticles.length})`,
      }));

      const result = await improveArticleWithAI(article.id, selectedAIModel, selectedImproveMode);

      if (cancelledRef.current) {
        if (result.success) {
          setProgress((prev) => ({
            ...prev,
            completed: prev.completed + 1,
            results: [...prev.results, { siteName: article.site?.name || "Article", title: article.title }],
            errors: [...prev.errors, "Annulé par l'utilisateur"],
          }));
        }
        break;
      }

      if (result.success) {
        setProgress((prev) => ({
          ...prev,
          completed: prev.completed + 1,
          results: [...prev.results, { siteName: article.site?.name || "Article", title: article.title }],
        }));
      } else if (result.error) {
        setProgress((prev) => ({
          ...prev,
          errors: [...prev.errors, `${article.title.substring(0, 30)}: ${result.error}`],
        }));
      }
    }

    cancelledRef.current = false;
    setProgress((prev) => ({ ...prev, isRunning: false, currentSite: null }));
    table.clearSelection();
    loadData();
  };

  const handleBulkSEOImprove = async (model: SEOModel) => {
    if (table.selectedCount === 0) return;

    setSeoImproveDialogOpen(false);
    setSeoImproveLoading(true);
    cancelledRef.current = false;

    const selectedArticles = table.selectedItems;

    setProgress({
      isRunning: true,
      total: selectedArticles.length,
      completed: 0,
      currentSite: null,
      errors: [],
      results: [],
    });

    for (let i = 0; i < selectedArticles.length; i++) {
      const article = selectedArticles[i];

      if (cancelledRef.current) {
        setProgress((prev) => ({
          ...prev,
          errors: [...prev.errors, "Annulé par l'utilisateur"],
        }));
        break;
      }

      setProgress((prev) => ({
        ...prev,
        currentSite: `SEO Expert (${model}): ${article.title.substring(0, 30)}... (${i + 1}/${selectedArticles.length})`,
      }));

      const result = await improveArticleSEO(article.id, model);

      if (cancelledRef.current) {
        if (result.success) {
          setProgress((prev) => ({
            ...prev,
            completed: prev.completed + 1,
            results: [...prev.results, { siteName: article.site?.name || "Article", title: article.title }],
            errors: [...prev.errors, "Annulé par l'utilisateur"],
          }));
        }
        break;
      }

      if (result.success) {
        setProgress((prev) => ({
          ...prev,
          completed: prev.completed + 1,
          results: [...prev.results, { siteName: article.site?.name || "Article", title: article.title }],
        }));
      } else if (result.error) {
        setProgress((prev) => ({
          ...prev,
          errors: [...prev.errors, `${article.title.substring(0, 30)}: ${result.error}`],
        }));
      }
    }

    cancelledRef.current = false;
    setSeoImproveLoading(false);
    setProgress((prev) => ({ ...prev, isRunning: false, currentSite: null }));
    table.clearSelection();
    loadData();
  };

  // Colonnes avec actions
  const columns = getArticleColumns();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Articles</h1>
          <p className="text-gray-500 mt-1">
            Consultez et gérez vos articles générés
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          <CreateArticleDialog sites={sites} onSuccess={loadData}>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Créer
            </Button>
          </CreateArticleDialog>
          <GenerateArticleDialog sites={sites} onSuccess={loadData}>
            <Button size="sm" className="bg-indigo-500 hover:bg-indigo-600 text-white">
              <Sparkles className="h-4 w-4 mr-2" />
              Générer IA
            </Button>
          </GenerateArticleDialog>
        </div>
      </div>

      {/* Stats */}
      <StatsGrid stats={getStatsCards(stats)} columns={5} loading={loading} />

      {/* Filtres */}
      <FilterBar
        filters={getFilterConfigs(sites)}
        values={{
          search: searchQuery,
          siteId: selectedSiteId,
          status: selectedStatus,
          seo: selectedSeoFilter,
        }}
        onChange={handleFilterChange}
        onReset={() => {
          setSearchQuery("");
          setSelectedSiteId(null);
          setSelectedStatus(null);
          setSelectedSeoFilter(null);
          table.clearSelection();
        }}
      />

      {/* Toolbar de sélection */}
      {table.selectedCount > 0 && (
        <SelectionToolbar
          selectedCount={table.selectedCount}
          totalCount={filteredArticles.length}
          onClearSelection={table.clearSelection}
          onSelectAll={table.selectAll}
          itemLabel="article"
        >
          <ArticleBulkActions
            onRegenerateImages={() => setRegenerateDialogOpen(true)}
            onIndexNow={handleBulkIndexNow}
            onImprove={() => setImproveDialogOpen(true)}
            onSEOImprove={() => setSeoImproveDialogOpen(true)}
            onStatusChange={handleBulkStatusChange}
            onDelete={() => setDeleteDialogOpen(true)}
            disabled={bulkLoading || progress.isRunning}
            indexNowLoading={indexNowLoading}
          />
        </SelectionToolbar>
      )}

      {/* Table */}
      <DataTable
        items={filteredArticles}
        columns={columns}
        getItemId={(a) => a.id}
        selectable
        selectedIds={table.selectedIds}
        onSelectionChange={table.setSelectedIds}
        rowActions={(article) => (
          <ArticleRowActions
            article={article}
            onView={setPreviewArticle}
            onEdit={(a) => router.push(`/admin/articles/${a.id}`)}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
        )}
        loading={loading}
        emptyMessage="Aucun article trouvé"
        emptyDescription="Générez des articles à partir de vos mots-clés"
      />

      {/* Dialogs */}
      <ArticlePreviewDialog
        article={previewArticle}
        open={!!previewArticle}
        onOpenChange={(open) => !open && setPreviewArticle(null)}
      />

      {/* Dialog confirmation suppression */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Supprimer les articles"
        description={`Êtes-vous sûr de vouloir supprimer ${table.selectedCount} article(s) ? Cette action est irréversible.`}
        variant="destructive"
        confirmLabel="Supprimer"
        onConfirm={handleBulkDelete}
        loading={bulkLoading}
      />

      {/* Dialog régénération images */}
      <Dialog open={regenerateDialogOpen} onOpenChange={setRegenerateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Régénérer les images</DialogTitle>
            <DialogDescription>
              Générer de nouvelles images pour {table.selectedCount} article(s).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Modèle de génération</label>
              <Select value={selectedModel} onValueChange={(v) => setSelectedModel(v as ImageModel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(MODEL_INFO) as ImageModel[]).map((model) => (
                    <SelectItem key={model} value={model}>
                      <div className="flex items-center justify-between gap-4">
                        <span>{MODEL_INFO[model].name}</span>
                        <span className="text-xs text-gray-500">{MODEL_INFO[model].speed}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">{MODEL_INFO[selectedModel].description}</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRegenerateDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleBulkRegenerateImages} className="bg-purple-600 hover:bg-purple-700">
              <ImageIcon className="h-4 w-4 mr-2" />
              Régénérer {table.selectedCount} image(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog amélioration IA */}
      <Dialog open={improveDialogOpen} onOpenChange={setImproveDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Améliorer avec l'IA</DialogTitle>
            <DialogDescription>
              Améliorer {table.selectedCount} article(s) avec l'IA.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Mode d'amélioration</label>
              <Select value={selectedImproveMode} onValueChange={(v) => setSelectedImproveMode(v as ImprovementMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(IMPROVEMENT_MODES) as ImprovementMode[]).map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      <div className="flex items-center gap-2">
                        <span>{IMPROVEMENT_MODES[mode].icon}</span>
                        <span>{IMPROVEMENT_MODES[mode].name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">{IMPROVEMENT_MODES[selectedImproveMode].description}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Modèle IA</label>
              <Select value={selectedAIModel} onValueChange={(v) => setSelectedAIModel(v as ImprovementModel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(IMPROVEMENT_MODELS) as ImprovementModel[]).map((model) => (
                    <SelectItem key={model} value={model}>
                      <div className="flex items-center justify-between gap-4">
                        <span>{IMPROVEMENT_MODELS[model].name}</span>
                        <span className="text-xs text-gray-500">{IMPROVEMENT_MODELS[model].speed}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">{IMPROVEMENT_MODELS[selectedAIModel].description}</p>
            </div>

            <div
              className={`rounded-lg p-3 ${
                selectedImproveMode === "full-pbn"
                  ? "bg-emerald-50 border border-emerald-200"
                  : selectedImproveMode === "ai-search"
                  ? "bg-blue-50 border border-blue-200"
                  : "bg-amber-50 border border-amber-200"
              }`}
            >
              <p
                className={`text-xs ${
                  selectedImproveMode === "full-pbn"
                    ? "text-emerald-800"
                    : selectedImproveMode === "ai-search"
                    ? "text-blue-800"
                    : "text-amber-800"
                }`}
              >
                {selectedImproveMode === "full-pbn" && (
                  <><strong>Full PBN:</strong> Stratégie complète avec détection auto du format, signaux E-E-A-T, enrichissement sémantique et FAQ premium.</>
                )}
                {selectedImproveMode === "ai-search" && (
                  <><strong>AI Search:</strong> Optimisé pour ChatGPT, Perplexity et Google SGE. Format "citation-ready" avec answer boxes.</>
                )}
                {selectedImproveMode === "seo-classic" && (
                  <><strong>SEO Classic:</strong> Structure optimisée pour les featured snippets Google. Titres descriptifs, listes à puces et FAQ.</>
                )}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImproveDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleBulkImprove}
              className={
                selectedImproveMode === "full-pbn"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : selectedImproveMode === "ai-search"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-amber-600 hover:bg-amber-700"
              }
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Améliorer {table.selectedCount} article(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog amélioration SEO Expert */}
      <SEOImproveDialog
        open={seoImproveDialogOpen}
        onOpenChange={setSeoImproveDialogOpen}
        selectedCount={table.selectedCount}
        onConfirm={handleBulkSEOImprove}
        isLoading={seoImproveLoading}
      />
    </div>
  );
}
