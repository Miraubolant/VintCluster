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
import { ImageIcon, Search, Tag, Sparkles, Calendar, Clock, Power, Loader2, Settings2, Save } from "lucide-react";
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
  { value: 0, label: "Dim", fullLabel: "Dimanche" },
  { value: 1, label: "Lun", fullLabel: "Lundi" },
  { value: 2, label: "Mar", fullLabel: "Mardi" },
  { value: 3, label: "Mer", fullLabel: "Mercredi" },
  { value: 4, label: "Jeu", fullLabel: "Jeudi" },
  { value: 5, label: "Ven", fullLabel: "Vendredi" },
  { value: 6, label: "Sam", fullLabel: "Samedi" },
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
  // Options d'amelioration IA
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
      // Options d'amelioration IA
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
      toast.error("Veuillez selectionner un site");
      return;
    }

    if (selectedKeywordIds.length === 0) {
      toast.error("Veuillez selectionner au moins un mot-cle");
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

    toast.success(config ? "Configuration mise a jour" : "Configuration creee");
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
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Settings2 className="h-5 w-5 text-indigo-600" />
            </div>
            {isEdit ? "Modifier la configuration" : "Nouvelle configuration"}
          </DialogTitle>
          <DialogDescription>
            Configurez la generation automatique d&apos;articles pour ce site
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-6 py-4">
          {/* Section 1: Site et activation */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
              <Power className="h-4 w-4 text-gray-400" />
              Configuration generale
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-4">
              {/* Selection du site */}
              {!isEdit && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Site</Label>
                  <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Selectionner un site" />
                    </SelectTrigger>
                    <SelectContent>
                      {sites.map((site) => (
                        <SelectItem key={site.id} value={site.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{site.name}</span>
                            <span className="text-xs text-gray-500">{site.domain}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Switches */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div>
                    <Label className="text-sm font-medium">Scheduler actif</Label>
                    <p className="text-xs text-gray-500">Activer la generation auto</p>
                  </div>
                  <Switch checked={enabled} onCheckedChange={setEnabled} />
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div>
                    <Label className="text-sm font-medium">Auto-publication</Label>
                    <p className="text-xs text-gray-500">Publier directement</p>
                  </div>
                  <Switch checked={autoPublish} onCheckedChange={setAutoPublish} />
                </div>
              </div>

              {/* Limites */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600">Max par jour</Label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={maxPerDay}
                    onChange={(e) => setMaxPerDay(Number(e.target.value))}
                    className="h-9 bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600">Max par semaine</Label>
                  <Input
                    type="number"
                    min={1}
                    max={200}
                    value={maxPerWeek}
                    onChange={(e) => setMaxPerWeek(Number(e.target.value))}
                    className="h-9 bg-white"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Planification */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
              <Calendar className="h-4 w-4 text-blue-500" />
              Planification
            </div>

            <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100 space-y-4">
              {/* Jours */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-blue-900">Jours de publication</Label>
                <div className="flex gap-1">
                  {DAYS.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      title={day.fullLabel}
                      className={`flex-1 py-2 px-1 text-xs font-bold rounded-lg border-2 transition-all ${
                        daysOfWeek.includes(day.value)
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "bg-white border-gray-200 text-gray-500 hover:border-blue-300"
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Heures */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-blue-900 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Heures de publication
                  </Label>
                  <span className="text-xs text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                    {publishHours.length} selectionnee{publishHours.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid grid-cols-12 gap-1 p-2 bg-white border border-blue-200 rounded-lg">
                  {HOURS.map((hour) => (
                    <button
                      key={hour}
                      type="button"
                      onClick={() => toggleHour(hour)}
                      className={`py-1.5 text-xs font-medium rounded transition-all ${
                        publishHours.includes(hour)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-50 text-gray-500 hover:bg-blue-100"
                      }`}
                    >
                      {hour}h
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Amelioration IA */}
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

          {/* Section 4: Mots-cles */}
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
                  disabled={!selectedSiteId || filteredKeywords.length === 0}
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

            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un mot-cle ou cluster..."
                value={keywordSearch}
                onChange={(e) => setKeywordSearch(e.target.value)}
                className="pl-9 h-9"
                disabled={!selectedSiteId}
              />
            </div>

            {/* Liste des mots-cles */}
            <div className="border rounded-lg max-h-48 overflow-y-auto bg-white">
              {!selectedSiteId ? (
                <div className="p-6 text-center">
                  <p className="text-sm text-gray-500">
                    Selectionnez un site pour voir les mots-cles disponibles
                  </p>
                </div>
              ) : loadingKeywords ? (
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
                          {keyword.site_id === null && (
                            <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium">
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
          </section>

          {/* Info sur la generation d'images */}
          <div className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="p-1.5 bg-purple-100 rounded">
              <ImageIcon className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-sm">
              <p className="font-medium text-purple-900">Images generees automatiquement</p>
              <p className="text-purple-700 mt-0.5">
                Chaque article genere automatiquement inclura une image creee par IA avec le modele <span className="font-medium">FLUX Schnell</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Footer fixe */}
        <div className="flex items-center justify-between pt-4 border-t bg-white">
          <div className="text-sm text-gray-500">
            {selectedKeywordIds.length} mot{selectedKeywordIds.length > 1 ? "s" : ""}-cle{selectedKeywordIds.length > 1 ? "s" : ""} selectionne{selectedKeywordIds.length > 1 ? "s" : ""}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || selectedKeywordIds.length === 0 || !selectedSiteId}
              className="bg-indigo-600 hover:bg-indigo-700 gap-2 min-w-[140px]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
