"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  RefreshCw,
  Search,
  Plus,
  Sparkles,
  X,
  CheckCircle,
  Trash2,
  FileCheck,
  Eye,
  XCircle,
  ImageIcon,
  Loader2,
  Send,
} from "lucide-react";
import {
  ArticlesStats,
  ArticlesTable,
  ArticlePreviewDialog,
  CreateArticleDialog,
  GenerateArticleDialog,
} from "@/components/admin/articles";
import {
  getArticles,
  getArticleStats,
  updateArticleStatus,
  deleteArticle,
  bulkUpdateArticleStatus,
  bulkDeleteArticles,
  generateArticleImage,
  bulkSubmitToIndexNow,
} from "@/lib/actions/articles";
import { getSites } from "@/lib/actions/sites";
import { useBulkProgress } from "@/contexts/BulkProgressContext";
import { MODEL_INFO, type ImageModel } from "@/lib/replicate";
import { toast } from "sonner";
import type { Site, Article, ArticleStatus } from "@/types/database";

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

const statusOptions: { value: ArticleStatus | "all"; label: string }[] = [
  { value: "all", label: "Tous les statuts" },
  { value: "draft", label: "Brouillons" },
  { value: "ready", label: "Prêts" },
  { value: "published", label: "Publiés" },
  { value: "unpublished", label: "Dépubliés" },
];

export default function ArticlesPage() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [articles, setArticles] = useState<ArticleWithKeyword[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    ready: 0,
    published: 0,
    unpublished: 0,
  });
  const [loading, setLoading] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ArticleStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewArticle, setPreviewArticle] = useState<ArticleWithKeyword | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Regenerate images dialog
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ImageModel>("flux-schnell");

  // IndexNow submission
  const [indexNowLoading, setIndexNowLoading] = useState(false);

  // Progress tracking
  const { progress, setProgress, isCancelled } = useBulkProgress();
  const cancelledRef = useRef(false);

  // Sync cancelled state with ref
  useEffect(() => {
    cancelledRef.current = isCancelled;
  }, [isCancelled]);

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

  async function handleStatusChange(id: string, status: ArticleStatus) {
    const result = await updateArticleStatus(id, status);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Statut mis à jour");
    loadData();
  }

  async function handleDelete(id: string) {
    const result = await deleteArticle(id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Article supprimé");
    loadData();
  }

  async function handleBulkStatusChange(status: ArticleStatus) {
    if (selectedIds.length === 0) return;

    setBulkLoading(true);
    const result = await bulkUpdateArticleStatus(selectedIds, status);
    setBulkLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(`${result.count} article(s) mis à jour`);
    setSelectedIds([]);
    loadData();
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;

    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer ${selectedIds.length} article(s) ?`
    );
    if (!confirmed) return;

    setBulkLoading(true);
    const result = await bulkDeleteArticles(selectedIds);
    setBulkLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(`${result.count} article(s) supprimé(s)`);
    setSelectedIds([]);
    loadData();
  }

  async function handleBulkRegenerateImages() {
    if (selectedIds.length === 0) return;

    setRegenerateDialogOpen(false);
    cancelledRef.current = false;

    // Get article titles for progress display
    const selectedArticles = articles.filter(a => selectedIds.includes(a.id));

    // Initialize progress
    setProgress({
      isRunning: true,
      total: selectedIds.length,
      completed: 0,
      currentSite: null,
      errors: [],
      results: [],
    });

    // Generate images one by one
    for (let i = 0; i < selectedArticles.length; i++) {
      const article = selectedArticles[i];

      // Check if cancelled
      if (cancelledRef.current) {
        setProgress(prev => ({
          ...prev,
          errors: [...prev.errors, "Annulé par l'utilisateur"],
        }));
        break;
      }

      // Update current status
      setProgress(prev => ({
        ...prev,
        currentSite: `${article.title.substring(0, 40)}${article.title.length > 40 ? "..." : ""} (${i + 1}/${selectedIds.length})`,
      }));

      const result = await generateArticleImage(article.id, selectedModel);

      // Check if cancelled after generation
      if (cancelledRef.current) {
        if (result.url) {
          setProgress(prev => ({
            ...prev,
            completed: prev.completed + 1,
            results: [...prev.results, { siteName: article.site?.name || "Article", title: article.title }],
            errors: [...prev.errors, "Annulé par l'utilisateur"],
          }));
        } else {
          setProgress(prev => ({
            ...prev,
            errors: [...prev.errors, "Annulé par l'utilisateur"],
          }));
        }
        break;
      }

      if (result.url) {
        setProgress(prev => ({
          ...prev,
          completed: prev.completed + 1,
          results: [...prev.results, { siteName: article.site?.name || "Article", title: article.title }],
        }));
      } else if (result.error) {
        setProgress(prev => ({
          ...prev,
          errors: [...prev.errors, `${article.title.substring(0, 30)}: ${result.error}`],
        }));
      }
    }

    // Finalize
    cancelledRef.current = false;
    setProgress(prev => ({
      ...prev,
      isRunning: false,
      currentSite: null,
    }));
    setSelectedIds([]);
    loadData();
  }

  async function handleBulkIndexNow() {
    if (selectedIds.length === 0) return;

    // Vérifier qu'il y a des articles publiés
    const publishedCount = articles.filter(
      (a) => selectedIds.includes(a.id) && a.status === "published"
    ).length;

    if (publishedCount === 0) {
      toast.error("Seuls les articles publiés peuvent être soumis à IndexNow");
      return;
    }

    setIndexNowLoading(true);
    const result = await bulkSubmitToIndexNow(selectedIds);
    setIndexNowLoading(false);

    if (result.errors.length > 0) {
      result.errors.forEach((err) => toast.error(err));
    }

    if (result.submitted > 0) {
      toast.success(`${result.submitted} article(s) soumis à IndexNow`);
    }

    setSelectedIds([]);
  }

  return (
    <div className="space-y-6">
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

      <ArticlesStats stats={stats} />

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un article..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select
          value={selectedSiteId || "all"}
          onValueChange={(value) => setSelectedSiteId(value === "all" ? null : value)}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Tous les sites" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les sites</SelectItem>
            {sites.map((site) => (
              <SelectItem key={site.id} value={site.id}>
                {site.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedStatus || "all"}
          onValueChange={(value) =>
            setSelectedStatus(value === "all" ? null : (value as ArticleStatus))
          }
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Barre d'actions groupées */}
      {selectedIds.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-medium text-indigo-900">
              {selectedIds.length} article(s) sélectionné(s)
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds([])}
              className="text-indigo-600 hover:text-indigo-800"
            >
              <X className="h-4 w-4 mr-1" />
              Désélectionner
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRegenerateDialogOpen(true)}
              disabled={bulkLoading || progress.isRunning}
              className="text-purple-700 border-purple-300 hover:bg-purple-50"
            >
              <ImageIcon className="h-4 w-4 mr-1" />
              Régénérer images
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkIndexNow}
              disabled={bulkLoading || progress.isRunning || indexNowLoading}
              className="text-cyan-700 border-cyan-300 hover:bg-cyan-50"
            >
              {indexNowLoading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-1" />
              )}
              IndexNow
            </Button>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatusChange("draft")}
              disabled={bulkLoading || progress.isRunning}
              className="text-yellow-700 border-yellow-300 hover:bg-yellow-50"
            >
              <FileCheck className="h-4 w-4 mr-1" />
              Brouillon
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatusChange("ready")}
              disabled={bulkLoading || progress.isRunning}
              className="text-blue-700 border-blue-300 hover:bg-blue-50"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Prêt
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatusChange("published")}
              disabled={bulkLoading || progress.isRunning}
              className="text-green-700 border-green-300 hover:bg-green-50"
            >
              <Eye className="h-4 w-4 mr-1" />
              Publier
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatusChange("unpublished")}
              disabled={bulkLoading || progress.isRunning}
              className="text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Dépublier
            </Button>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkLoading || progress.isRunning}
              className="text-red-700 border-red-300 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Supprimer
            </Button>
          </div>
        </div>
      )}

      <ArticlesTable
        articles={articles}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onView={(article) => setPreviewArticle(article)}
        onEdit={(article) => router.push(`/admin/articles/${article.id}`)}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
      />

      <ArticlePreviewDialog
        article={previewArticle}
        open={!!previewArticle}
        onOpenChange={(open) => !open && setPreviewArticle(null)}
      />

      {/* Dialog de régénération d'images */}
      <Dialog open={regenerateDialogOpen} onOpenChange={setRegenerateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Régénérer les images</DialogTitle>
            <DialogDescription>
              Générer de nouvelles images pour {selectedIds.length} article(s) sélectionné(s).
              Choisissez le modèle à utiliser.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Modèle de génération</label>
              <Select value={selectedModel} onValueChange={(value) => setSelectedModel(value as ImageModel)}>
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
              <p className="text-xs text-gray-500">
                {MODEL_INFO[selectedModel].description}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRegenerateDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleBulkRegenerateImages}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Régénérer {selectedIds.length} image(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress bar is rendered by BulkProgressWrapper in the layout */}
    </div>
  );
}
