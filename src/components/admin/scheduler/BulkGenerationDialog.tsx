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
import { Search, Tag, Sparkles, Rocket, Loader2, ImageIcon } from "lucide-react";

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
  imagesPerArticle: number; // 0 = image principale uniquement, 1-5 = images additionnelles dans le contenu
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
  const [imagesPerArticle, setImagesPerArticle] = useState(0); // 0 = main image only

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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-indigo-500" />
            Configuration du Batching
          </DialogTitle>
          <DialogDescription>
            Configurez les options pour la génération en masse sur {selectedConfigs.length} site(s)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recap des sites sélectionnés */}
          <div className="bg-gray-50 rounded-lg p-3">
            <Label className="text-xs uppercase text-gray-500 font-medium">Sites sélectionnés</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedConfigs.map((config) => (
                <span
                  key={config.siteId}
                  className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-sm font-medium"
                >
                  {config.siteName}
                </span>
              ))}
            </div>
          </div>

          {/* Nombre d'articles */}
          <div className="space-y-2">
            <Label>Nombre total d&apos;articles à générer</Label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={1}
                max={100}
                value={totalArticles}
                onChange={(e) => setTotalArticles(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24"
              />
              <span className="text-sm text-gray-500">
                (~{Math.floor(totalArticles / selectedConfigs.length)} par site)
              </span>
            </div>
          </div>

          {/* Publication automatique */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Publication automatique</Label>
              <p className="text-sm text-gray-500">
                Publier les articles immédiatement après génération
              </p>
            </div>
            <Switch checked={autoPublish} onCheckedChange={setAutoPublish} />
          </div>

          {/* Section Images */}
          <div className="border-t pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-purple-500" />
              <div>
                <Label>Images par article</Label>
                <p className="text-sm text-gray-500">
                  Nombre d&apos;images additionnelles générées par IA (FLUX Schnell)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 pl-6 border-l-2 border-purple-200">
              <div className="flex items-center gap-2">
                {[0, 1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setImagesPerArticle(num)}
                    className={`w-10 h-10 rounded-lg border-2 font-bold transition-all ${
                      imagesPerArticle === num
                        ? "bg-purple-600 border-purple-600 text-white"
                        : "bg-white border-gray-200 text-gray-600 hover:border-purple-300"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <div className="text-sm text-gray-500">
                {imagesPerArticle === 0 ? (
                  <span>Image principale uniquement</span>
                ) : (
                  <span>
                    +{imagesPerArticle} image{imagesPerArticle > 1 ? "s" : ""} dans le contenu (basées sur les H2)
                  </span>
                )}
              </div>
            </div>

            {imagesPerArticle > 0 && (
              <div className="pl-6 border-l-2 border-purple-200">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm">
                  <p className="text-purple-800">
                    <strong>Fonctionnement :</strong> Une image sera générée pour chaque H2 de l&apos;article
                    (jusqu&apos;à {imagesPerArticle}) et insérée après le titre correspondant.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Section Amélioration IA */}
          <div className="border-t pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <div>
                  <Label>Amélioration IA</Label>
                  <p className="text-sm text-gray-500">
                    Améliorer chaque article après génération (SEO, longueur, liens)
                  </p>
                </div>
              </div>
              <Switch checked={enableImprovement} onCheckedChange={setEnableImprovement} />
            </div>

            {enableImprovement && (
              <div className="grid grid-cols-2 gap-4 pl-6 border-l-2 border-amber-200">
                <div className="space-y-2">
                  <Label>Modèle IA</Label>
                  <Select value={improvementModel} onValueChange={(v) => setImprovementModel(v as ImprovementModel)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(IMPROVEMENT_MODELS).map(([key, model]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex flex-col">
                            <span>{model.name}</span>
                            <span className="text-xs text-gray-500">{model.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Mode d&apos;amélioration</Label>
                  <Select value={improvementMode} onValueChange={(v) => setImprovementMode(v as ImprovementMode)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(IMPROVEMENT_MODES).map(([key, mode]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <span>{mode.icon}</span>
                            <div className="flex flex-col">
                              <span>{mode.name}</span>
                              <span className="text-xs text-gray-500">{mode.description}</span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Sélection des mots-clés */}
          <div className="border-t pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Mots-clés à utiliser ({selectedKeywordIds.length > 0 ? `${selectedKeywordIds.length} sélectionnés` : "tous par défaut"})
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectAllKeywords}
                  disabled={filteredKeywords.length === 0}
                >
                  Tout sélectionner
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={deselectAllKeywords}
                  disabled={selectedKeywordIds.length === 0}
                >
                  Tout désélectionner
                </Button>
              </div>
            </div>

            <p className="text-sm text-gray-500">
              Si aucun mot-clé n&apos;est sélectionné, les mots-clés configurés dans chaque site seront utilisés.
            </p>

            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un mot-clé, cluster ou site..."
                value={keywordSearch}
                onChange={(e) => setKeywordSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Liste des mots-clés */}
            <div className="border rounded-lg max-h-60 overflow-y-auto">
              {loadingKeywords ? (
                <div className="p-4 text-sm text-gray-500 text-center flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement des mots-clés...
                </div>
              ) : availableKeywords.length === 0 ? (
                <p className="p-4 text-sm text-gray-500 text-center">
                  Aucun mot-clé pending disponible
                </p>
              ) : filteredKeywords.length === 0 ? (
                <p className="p-4 text-sm text-gray-500 text-center">
                  Aucun mot-clé ne correspond à votre recherche
                </p>
              ) : (
                <div className="divide-y">
                  {Object.entries(groupedKeywords).map(([cluster, keywords]) => (
                    <div key={cluster}>
                      <div className="px-3 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase sticky top-0">
                        {cluster} ({keywords.length})
                      </div>
                      {keywords.map((keyword) => (
                        <label
                          key={keyword.id}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedKeywordIds.includes(keyword.id)}
                            onCheckedChange={() => toggleKeyword(keyword.id)}
                          />
                          <span className="flex-1 text-sm">{keyword.keyword}</span>
                          {keyword.priority !== null && keyword.priority > 0 && (
                            <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                              P{keyword.priority}
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            keyword.site_id === null
                              ? "text-amber-600 bg-amber-50"
                              : "text-gray-600 bg-gray-100"
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
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Annuler
            </Button>
            <Button
              onClick={handleLaunch}
              disabled={!canLaunch || isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Lancement...
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4" />
                  Lancer la génération
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
