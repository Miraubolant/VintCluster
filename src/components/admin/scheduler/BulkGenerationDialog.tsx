"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getKeywordsForBulkGeneration } from "@/lib/actions/scheduler";
import { IMPROVEMENT_MODELS, IMPROVEMENT_MODES, type ImprovementModel, type ImprovementMode } from "@/lib/openai";
import type { SEOModel } from "@/lib/actions/articles";
import { Search, Tag, Sparkles, Rocket, Loader2, ImageIcon, Globe, Hash, Send, Settings2, Zap, Table2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface AvailableKeyword {
  id: string;
  keyword: string;
  status: string | null;
  site_id: string | null;
  cluster: string | null;
  priority: number | null;
  site_name?: string;
}

interface SelectedConfig {
  siteId: string;
  siteName: string;
}

export interface BulkGenerationConfig {
  keywordIds: string[];
  enableImprovement: boolean;
  improvementModel: ImprovementModel;
  improvementMode: ImprovementMode;
  autoPublish: boolean;
  totalArticles: number;
  imagesPerArticle: number;
  // SEO Expert options
  enableSeoExpert: boolean;
  seoExpertModel: SEOModel;
  seoExpertIncludeTable: boolean;
}

interface BulkGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedConfigs: SelectedConfig[];
  initialArticleCount: number;
  onLaunch: (config: BulkGenerationConfig) => void;
  isLoading: boolean;
}

export function BulkGenerationDialog({
  open,
  onOpenChange,
  selectedConfigs,
  initialArticleCount,
  onLaunch,
  isLoading,
}: BulkGenerationDialogProps) {
  // Keywords
  const [availableKeywords, setAvailableKeywords] = useState<AvailableKeyword[]>([]);
  const [selectedKeywordIds, setSelectedKeywordIds] = useState<string[]>([]);
  const [keywordSearch, setKeywordSearch] = useState("");
  const [loadingKeywords, setLoadingKeywords] = useState(false);

  // AI Improvement options
  const [enableImprovement, setEnableImprovement] = useState(false);
  const [improvementModel, setImprovementModel] = useState<ImprovementModel>("gpt-4o");
  const [improvementMode, setImprovementMode] = useState<ImprovementMode>("full-pbn");

  // Other options
  const [autoPublish, setAutoPublish] = useState(false);
  const [totalArticles, setTotalArticles] = useState(initialArticleCount);
  const [imagesPerArticle, setImagesPerArticle] = useState(0);

  // SEO Expert options
  const [enableSeoExpert, setEnableSeoExpert] = useState(false);
  const [seoExpertModel, setSeoExpertModel] = useState<SEOModel>("gemini");
  const [seoExpertIncludeTable, setSeoExpertIncludeTable] = useState(false);

  // Load keywords when dialog opens
  useEffect(() => {
    async function loadKeywords() {
      if (!open || selectedConfigs.length === 0) {
        setAvailableKeywords([]);
        return;
      }
      setLoadingKeywords(true);
      const siteIds = selectedConfigs.map(c => c.siteId);
      const result = await getKeywordsForBulkGeneration(siteIds);
      if (!result.error) {
        setAvailableKeywords(result.data);
      }
      setLoadingKeywords(false);
    }
    loadKeywords();
  }, [open, selectedConfigs]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedKeywordIds([]);
      setKeywordSearch("");
      setEnableImprovement(false);
      setImprovementModel("gpt-4o");
      setImprovementMode("full-pbn");
      setAutoPublish(false);
      setTotalArticles(initialArticleCount);
      setImagesPerArticle(0);
      setEnableSeoExpert(false);
      setSeoExpertModel("gemini");
      setSeoExpertIncludeTable(false);
    }
  }, [open, initialArticleCount]);

  function toggleKeyword(keywordId: string) {
    setSelectedKeywordIds((prev) =>
      prev.includes(keywordId)
        ? prev.filter((id) => id !== keywordId)
        : [...prev, keywordId]
    );
  }

  function selectAllKeywords() {
    const filteredIds = filteredKeywords.map((k) => k.id);
    setSelectedKeywordIds((prev) => {
      const newIds = new Set([...prev, ...filteredIds]);
      return Array.from(newIds);
    });
  }

  function deselectAllKeywords() {
    const filteredIds = new Set(filteredKeywords.map((k) => k.id));
    setSelectedKeywordIds((prev) => prev.filter((id) => !filteredIds.has(id)));
  }

  function handleLaunch() {
    onLaunch({
      keywordIds: selectedKeywordIds,
      enableImprovement,
      improvementModel,
      improvementMode,
      autoPublish,
      totalArticles,
      imagesPerArticle,
      enableSeoExpert,
      seoExpertModel,
      seoExpertIncludeTable,
    });
  }

  // Filter keywords by search
  const filteredKeywords = availableKeywords.filter((k) =>
    k.keyword.toLowerCase().includes(keywordSearch.toLowerCase()) ||
    (k.cluster && k.cluster.toLowerCase().includes(keywordSearch.toLowerCase())) ||
    (k.site_name && k.site_name.toLowerCase().includes(keywordSearch.toLowerCase()))
  );

  // Group by cluster
  const groupedKeywords = filteredKeywords.reduce((acc, keyword) => {
    const cluster = keyword.cluster || "Sans cluster";
    if (!acc[cluster]) acc[cluster] = [];
    acc[cluster].push(keyword);
    return acc;
  }, {} as Record<string, AvailableKeyword[]>);

  const canLaunch = totalArticles > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Rocket className="h-5 w-5 text-indigo-600" />
            </div>
            Lancer une generation en masse
          </DialogTitle>
          <DialogDescription>
            Configurez et lancez la generation automatique d&apos;articles
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-6 py-4">
          {/* Section 1: Sites selectionnes */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
              <Globe className="h-4 w-4 text-gray-400" />
              Sites cibles
            </div>
            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
              {selectedConfigs.map((config) => (
                <span
                  key={config.siteId}
                  className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium shadow-sm"
                >
                  {config.siteName}
                </span>
              ))}
            </div>
          </section>

          {/* Section 2: Parametres de generation */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
              <Settings2 className="h-4 w-4 text-gray-400" />
              Parametres
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
              {/* Nombre d'articles */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Nombre d&apos;articles</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={totalArticles}
                    onChange={(e) => setTotalArticles(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 h-9"
                  />
                  <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                    ~{Math.floor(totalArticles / selectedConfigs.length)}/site
                  </span>
                </div>
              </div>

              {/* Publication automatique */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div>
                  <Label className="text-sm font-medium">Auto-publication</Label>
                  <p className="text-xs text-gray-500">Publier directement</p>
                </div>
                <Switch checked={autoPublish} onCheckedChange={setAutoPublish} />
              </div>
            </div>
          </section>

          {/* Section 3: Images */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
              <ImageIcon className="h-4 w-4 text-purple-500" />
              Images IA
            </div>

            <div className="p-4 bg-purple-50/50 rounded-lg border border-purple-100">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <Label className="text-sm font-medium text-purple-900">Images additionnelles</Label>
                  <p className="text-xs text-purple-700">Generees avec FLUX Schnell</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setImagesPerArticle(num)}
                      className={`w-9 h-9 rounded-lg border-2 font-bold text-sm transition-all ${
                        imagesPerArticle === num
                          ? "bg-purple-600 border-purple-600 text-white shadow-md"
                          : "bg-white border-gray-200 text-gray-600 hover:border-purple-300 hover:bg-purple-50"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-purple-700 bg-white px-2 py-1 rounded border border-purple-200">
                  {imagesPerArticle === 0 ? "Principale uniquement" : `+${imagesPerArticle} dans le contenu`}
                </span>
              </div>
            </div>
          </section>

          {/* Section 4: Amelioration IA */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Amelioration IA
            </div>

            <div className={`p-4 rounded-lg border transition-colors ${
              enableImprovement ? "bg-amber-50/50 border-amber-200" : "bg-gray-50 border-gray-100"
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Label className="text-sm font-medium">Activer l&apos;amelioration</Label>
                  <p className="text-xs text-gray-500">
                    Ameliore SEO, longueur et liens de chaque article
                  </p>
                </div>
                <Switch checked={enableImprovement} onCheckedChange={setEnableImprovement} />
              </div>

              {enableImprovement && (
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-amber-200">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-600">Modele</Label>
                    <Select value={improvementModel} onValueChange={(v) => setImprovementModel(v as ImprovementModel)}>
                      <SelectTrigger className="h-9 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(IMPROVEMENT_MODELS).map(([key, model]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex flex-col">
                              <span className="font-medium">{model.name}</span>
                              <span className="text-xs text-gray-500">{model.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-600">Mode</Label>
                    <Select value={improvementMode} onValueChange={(v) => setImprovementMode(v as ImprovementMode)}>
                      <SelectTrigger className="h-9 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(IMPROVEMENT_MODES).map(([key, mode]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <span>{mode.icon}</span>
                              <span className="font-medium">{mode.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Section 5: SEO Expert */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
              <Zap className="h-4 w-4 text-emerald-500" />
              SEO Expert
            </div>

            <div className={`p-4 rounded-lg border transition-colors ${
              enableSeoExpert ? "bg-emerald-50/50 border-emerald-200" : "bg-gray-50 border-gray-100"
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Label className="text-sm font-medium">Activer SEO Expert</Label>
                  <p className="text-xs text-gray-500">
                    Reecriture complete avec prompt SEO ultra-optimise (~$0.002/article avec Gemini)
                  </p>
                </div>
                <Switch checked={enableSeoExpert} onCheckedChange={setEnableSeoExpert} />
              </div>

              {enableSeoExpert && (
                <div className="space-y-4 pt-3 border-t border-emerald-200">
                  {/* Choix du modèle */}
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">Modele IA</Label>
                    <RadioGroup
                      value={seoExpertModel}
                      onValueChange={(v) => setSeoExpertModel(v as SEOModel)}
                      className="grid grid-cols-2 gap-2"
                    >
                      <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        seoExpertModel === "gemini"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}>
                        <RadioGroupItem value="gemini" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-sm">Gemini 2.0 Flash</span>
                            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded">
                              GRATUIT
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-500">~$0.002/article</p>
                        </div>
                      </label>

                      <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        seoExpertModel === "claude"
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}>
                        <RadioGroupItem value="claude" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-sm">Claude Sonnet</span>
                            <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded">
                              PREMIUM
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-500">~$0.01/article</p>
                        </div>
                      </label>
                    </RadioGroup>
                  </div>

                  {/* Option tableau comparatif */}
                  <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    seoExpertIncludeTable
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}>
                    <Checkbox
                      checked={seoExpertIncludeTable}
                      onCheckedChange={(checked) => setSeoExpertIncludeTable(checked === true)}
                    />
                    <div className="flex items-center gap-2">
                      <Table2 className="h-4 w-4 text-purple-600" />
                      <div>
                        <span className="font-medium text-sm">Inclure un tableau comparatif</span>
                        <p className="text-[10px] text-gray-500">Tableau Markdown au milieu de l&apos;article</p>
                      </div>
                    </div>
                  </label>
                </div>
              )}
            </div>
          </section>

          {/* Section 6: Mots-cles */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                <Tag className="h-4 w-4 text-gray-400" />
                Mots-cles
                {selectedKeywordIds.length > 0 && (
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold normal-case">
                    {selectedKeywordIds.length} selectionnes
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={selectAllKeywords}
                  disabled={filteredKeywords.length === 0}
                  className="h-7 text-xs"
                >
                  Tout
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={deselectAllKeywords}
                  disabled={selectedKeywordIds.length === 0}
                  className="h-7 text-xs"
                >
                  Aucun
                </Button>
              </div>
            </div>

            {selectedKeywordIds.length === 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                <Hash className="h-4 w-4" />
                <span>Sans selection, les mots-cles configures dans chaque site seront utilises</span>
              </div>
            )}

            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un mot-cle, cluster ou site..."
                value={keywordSearch}
                onChange={(e) => setKeywordSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            {/* Liste des mots-cles */}
            <div className="border rounded-lg max-h-48 overflow-y-auto bg-white">
              {loadingKeywords ? (
                <div className="p-6 text-sm text-gray-500 text-center flex flex-col items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                  <span>Chargement des mots-cles...</span>
                </div>
              ) : availableKeywords.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-sm font-medium text-gray-700">Aucun mot-cle disponible</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Verifiez que des mots-cles sont en statut &quot;pending&quot;
                  </p>
                </div>
              ) : filteredKeywords.length === 0 ? (
                <p className="p-4 text-sm text-gray-500 text-center">
                  Aucun resultat pour &quot;{keywordSearch}&quot;
                </p>
              ) : (
                <div className="divide-y">
                  {Object.entries(groupedKeywords).map(([cluster, keywords]) => (
                    <div key={cluster}>
                      <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase sticky top-0 border-b flex items-center justify-between">
                        <span>{cluster}</span>
                        <span className="text-gray-400 font-normal normal-case">{keywords.length}</span>
                      </div>
                      {keywords.map((keyword) => (
                        <label
                          key={keyword.id}
                          className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                            selectedKeywordIds.includes(keyword.id)
                              ? "bg-indigo-50"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <Checkbox
                            checked={selectedKeywordIds.includes(keyword.id)}
                            onCheckedChange={() => toggleKeyword(keyword.id)}
                          />
                          <span className="flex-1 text-sm font-medium text-gray-700">{keyword.keyword}</span>
                          {keyword.priority !== null && keyword.priority > 0 && (
                            <span className="text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-medium">
                              P{keyword.priority}
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            keyword.site_id === null
                              ? "text-amber-700 bg-amber-50 font-medium"
                              : "text-gray-500 bg-gray-100"
                          }`}>
                            {keyword.site_name}
                          </span>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Footer fixe */}
        <div className="flex items-center justify-between pt-4 border-t bg-white">
          <div className="text-sm text-gray-500">
            {totalArticles} article{totalArticles > 1 ? "s" : ""} sur {selectedConfigs.length} site{selectedConfigs.length > 1 ? "s" : ""}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Annuler
            </Button>
            <Button
              onClick={handleLaunch}
              disabled={!canLaunch || isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 gap-2 min-w-[140px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Lancement...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Lancer
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
