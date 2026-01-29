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
import { upsertSchedulerConfig, getAvailableKeywordsForScheduler } from "@/lib/actions/scheduler";
import { IMPROVEMENT_MODELS, IMPROVEMENT_MODES, type ImprovementModel, type ImprovementMode } from "@/lib/openai";
import { toast } from "sonner";
import { ImageIcon, Search, Tag, Sparkles } from "lucide-react";
import type { Site, SchedulerConfig } from "@/types/database";

interface SchedulerConfigWithSite extends SchedulerConfig {
  site?: {
    id: string;
    name: string;
    domain: string;
  };
}

interface AvailableKeyword {
  id: string;
  keyword: string;
  status: string | null;
  site_id: string | null;
  cluster: string | null;
  priority: number | null;
}

interface SchedulerConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: SchedulerConfigWithSite | null;
  sites: Site[];
  onSuccess: () => void;
}

const DAYS = [
  { value: 0, label: "Dimanche" },
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function SchedulerConfigDialog({
  open,
  onOpenChange,
  config,
  sites,
  onSuccess,
}: SchedulerConfigDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [enabled, setEnabled] = useState(false);
  const [autoPublish, setAutoPublish] = useState(false);
  const [maxPerDay, setMaxPerDay] = useState(5);
  const [maxPerWeek, setMaxPerWeek] = useState(20);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);
  const [publishHours, setPublishHours] = useState<number[]>([9, 14]);
  const [selectedKeywordIds, setSelectedKeywordIds] = useState<string[]>([]);
  const [availableKeywords, setAvailableKeywords] = useState<AvailableKeyword[]>([]);
  const [keywordSearch, setKeywordSearch] = useState("");
  const [loadingKeywords, setLoadingKeywords] = useState(false);
  // Options d'amélioration IA
  const [enableImprovement, setEnableImprovement] = useState(false);
  const [improvementModel, setImprovementModel] = useState<ImprovementModel>("gpt-4o");
  const [improvementMode, setImprovementMode] = useState<ImprovementMode>("full-pbn");

  // Charger les keywords disponibles quand le site change
  useEffect(() => {
    async function loadKeywords() {
      if (!selectedSiteId) {
        setAvailableKeywords([]);
        return;
      }
      setLoadingKeywords(true);
      const result = await getAvailableKeywordsForScheduler(selectedSiteId);
      if (!result.error) {
        setAvailableKeywords(result.data);
      }
      setLoadingKeywords(false);
    }
    loadKeywords();
  }, [selectedSiteId]);

  useEffect(() => {
    if (config) {
      setSelectedSiteId(config.site_id);
      setEnabled(config.enabled || false);
      setAutoPublish(config.auto_publish || false);
      setMaxPerDay(config.max_per_day || 5);
      setMaxPerWeek(config.max_per_week || 20);
      setDaysOfWeek((config.days_of_week as number[]) || [1, 2, 3, 4, 5]);
      setPublishHours((config.publish_hours as number[]) || [9, 14]);
      setSelectedKeywordIds((config.keyword_ids as string[]) || []);
      // Options d'amélioration IA
      setEnableImprovement((config as unknown as { enable_improvement?: boolean }).enable_improvement || false);
      setImprovementModel(((config as unknown as { improvement_model?: string }).improvement_model as ImprovementModel) || "gpt-4o");
      setImprovementMode(((config as unknown as { improvement_mode?: string }).improvement_mode as ImprovementMode) || "full-pbn");
    } else {
      setSelectedSiteId("");
      setEnabled(true);
      setAutoPublish(false);
      setMaxPerDay(5);
      setMaxPerWeek(20);
      setDaysOfWeek([1, 2, 3, 4, 5]);
      setPublishHours([9, 14]);
      setSelectedKeywordIds([]);
      setEnableImprovement(false);
      setImprovementModel("gpt-4o");
      setImprovementMode("full-pbn");
    }
    setKeywordSearch("");
  }, [config, open]);

  function toggleDay(day: number) {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }

  function toggleHour(hour: number) {
    setPublishHours((prev) =>
      prev.includes(hour)
        ? prev.filter((h) => h !== hour)
        : [...prev, hour].sort((a, b) => a - b)
    );
  }

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

  async function handleSubmit() {
    if (!selectedSiteId) {
      toast.error("Veuillez sélectionner un site");
      return;
    }

    if (selectedKeywordIds.length === 0) {
      toast.error("Veuillez sélectionner au moins un mot-clé");
      return;
    }

    setLoading(true);

    const result = await upsertSchedulerConfig(selectedSiteId, {
      enabled,
      auto_publish: autoPublish,
      max_per_day: maxPerDay,
      max_per_week: maxPerWeek,
      days_of_week: daysOfWeek,
      publish_hours: publishHours,
      keyword_ids: selectedKeywordIds,
      enable_improvement: enableImprovement,
      improvement_model: improvementModel,
      improvement_mode: improvementMode,
    });

    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(config ? "Configuration mise à jour" : "Configuration créée");
    onOpenChange(false);
    onSuccess();
  }

  const isEdit = !!config;

  // Filtrer les keywords par recherche
  const filteredKeywords = availableKeywords.filter((k) =>
    k.keyword.toLowerCase().includes(keywordSearch.toLowerCase()) ||
    (k.cluster && k.cluster.toLowerCase().includes(keywordSearch.toLowerCase()))
  );

  // Grouper par cluster
  const groupedKeywords = filteredKeywords.reduce((acc, keyword) => {
    const cluster = keyword.cluster || "Sans cluster";
    if (!acc[cluster]) acc[cluster] = [];
    acc[cluster].push(keyword);
    return acc;
  }, {} as Record<string, AvailableKeyword[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier la configuration" : "Nouvelle configuration"}
          </DialogTitle>
          <DialogDescription>
            Configurez la génération automatique d&apos;articles pour ce site
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!isEdit && (
            <div className="space-y-2">
              <Label>Site</Label>
              <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un site" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Label>Scheduler actif</Label>
              <p className="text-sm text-gray-500">
                Activer la génération automatique
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Publication automatique</Label>
              <p className="text-sm text-gray-500">
                Publier les articles générés automatiquement
              </p>
            </div>
            <Switch checked={autoPublish} onCheckedChange={setAutoPublish} />
          </div>

          {/* Section Amélioration IA */}
          <div className="border-t pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <div>
                  <Label>Amélioration IA automatique</Label>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Max par jour</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={maxPerDay}
                onChange={(e) => setMaxPerDay(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Max par semaine</Label>
              <Input
                type="number"
                min={1}
                max={200}
                value={maxPerWeek}
                onChange={(e) => setMaxPerWeek(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Jours de publication</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <label
                  key={day.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={daysOfWeek.includes(day.value)}
                    onCheckedChange={() => toggleDay(day.value)}
                  />
                  <span className="text-sm">{day.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Heures de publication</Label>
            <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-2 border rounded-lg">
              {HOURS.map((hour) => (
                <button
                  key={hour}
                  type="button"
                  onClick={() => toggleHour(hour)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    publishHours.includes(hour)
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {hour}h
                </button>
              ))}
            </div>
          </div>

          {/* Sélection des mots-clés */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Mots-clés à utiliser ({selectedKeywordIds.length} sélectionnés)
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectAllKeywords}
                  disabled={!selectedSiteId || filteredKeywords.length === 0}
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

            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un mot-clé ou cluster..."
                value={keywordSearch}
                onChange={(e) => setKeywordSearch(e.target.value)}
                className="pl-9"
                disabled={!selectedSiteId}
              />
            </div>

            {/* Liste des mots-clés */}
            <div className="border rounded-lg max-h-60 overflow-y-auto">
              {!selectedSiteId ? (
                <p className="p-4 text-sm text-gray-500 text-center">
                  Sélectionnez un site pour voir les mots-clés disponibles
                </p>
              ) : loadingKeywords ? (
                <p className="p-4 text-sm text-gray-500 text-center">
                  Chargement des mots-clés...
                </p>
              ) : availableKeywords.length === 0 ? (
                <p className="p-4 text-sm text-gray-500 text-center">
                  Aucun mot-clé pending disponible pour ce site
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
                          {keyword.site_id === null && (
                            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                              Global
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Info sur la génération d'images */}
          <div className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="p-1.5 bg-purple-100 rounded">
              <ImageIcon className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-sm">
              <p className="font-medium text-purple-900">Images générées automatiquement</p>
              <p className="text-purple-700 mt-0.5">
                Chaque article généré automatiquement inclura une image créée par IA avec le modèle <span className="font-medium">FLUX Schnell</span> (~3s).
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={loading || selectedKeywordIds.length === 0}>
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
