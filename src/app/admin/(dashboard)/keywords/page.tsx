"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import {
  KeywordsStats,
  KeywordsFilters,
  KeywordsTable,
  ImportKeywordsDialog,
  BulkActions,
} from "@/components/admin/keywords";
import {
  getKeywords,
  getKeywordStats,
  updateKeywordStatus,
  deleteKeywords,
} from "@/lib/actions/keywords";
import { generateArticleFromKeyword } from "@/lib/actions/articles";
import { getSites } from "@/lib/actions/sites";
import { toast } from "sonner";
import type { Site, Keyword, KeywordStatus } from "@/types/database";

interface KeywordWithSite extends Keyword {
  site?: {
    id: string;
    name: string;
    domain: string;
  };
}

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
  const [selectedStatus, setSelectedStatus] = useState<KeywordStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [generatingIds, setGeneratingIds] = useState<string[]>([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);

    const [sitesRes, keywordsRes, statsRes] = await Promise.all([
      getSites(),
      getKeywords({
        siteId: selectedSiteId || undefined,
        status: selectedStatus || undefined,
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

  async function handleStatusChange(ids: string[], status: KeywordStatus) {
    const result = await updateKeywordStatus(ids, status);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`${ids.length} mot(s)-clé(s) mis à jour`);
    setSelectedIds([]);
    loadData();
  }

  async function handleDelete(ids: string[]) {
    const result = await deleteKeywords(ids);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`${ids.length} mot(s)-clé(s) supprimé(s)`);
    setSelectedIds([]);
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

  return (
    <div className="space-y-6">
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
          <Button onClick={() => setImportDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Importer
          </Button>
        </div>
      </div>

      <KeywordsStats stats={stats} />

      <KeywordsFilters
        sites={sites}
        selectedSiteId={selectedSiteId}
        selectedStatus={selectedStatus}
        searchQuery={searchQuery}
        onSiteChange={setSelectedSiteId}
        onStatusChange={setSelectedStatus}
        onSearchChange={setSearchQuery}
      />

      <BulkActions
        selectedCount={selectedIds.length}
        onStatusChange={(status) => handleStatusChange(selectedIds, status)}
        onDelete={() => handleDelete(selectedIds)}
        onClearSelection={() => setSelectedIds([])}
      />

      <KeywordsTable
        keywords={keywords}
        selectedIds={selectedIds}
        generatingIds={generatingIds}
        onSelectChange={setSelectedIds}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
        onGenerate={handleGenerate}
      />

      <ImportKeywordsDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        sites={sites}
        onSuccess={loadData}
      />
    </div>
  );
}
