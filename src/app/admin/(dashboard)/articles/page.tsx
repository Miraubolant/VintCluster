"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "@/lib/actions/articles";
import { getSites } from "@/lib/actions/sites";
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
              onClick={() => handleBulkStatusChange("draft")}
              disabled={bulkLoading}
              className="text-yellow-700 border-yellow-300 hover:bg-yellow-50"
            >
              <FileCheck className="h-4 w-4 mr-1" />
              Brouillon
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatusChange("ready")}
              disabled={bulkLoading}
              className="text-blue-700 border-blue-300 hover:bg-blue-50"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Prêt
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatusChange("published")}
              disabled={bulkLoading}
              className="text-green-700 border-green-300 hover:bg-green-50"
            >
              <Eye className="h-4 w-4 mr-1" />
              Publier
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatusChange("unpublished")}
              disabled={bulkLoading}
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
              disabled={bulkLoading}
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
    </div>
  );
}
