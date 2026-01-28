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
import { upsertSchedulerConfig } from "@/lib/actions/scheduler";
import { toast } from "sonner";
import { ImageIcon } from "lucide-react";
import type { Site, SchedulerConfig } from "@/types/database";

interface SchedulerConfigWithSite extends SchedulerConfig {
  site?: {
    id: string;
    name: string;
    domain: string;
  };
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

  useEffect(() => {
    if (config) {
      setSelectedSiteId(config.site_id);
      setEnabled(config.enabled || false);
      setAutoPublish(config.auto_publish || false);
      setMaxPerDay(config.max_per_day || 5);
      setMaxPerWeek(config.max_per_week || 20);
      setDaysOfWeek((config.days_of_week as number[]) || [1, 2, 3, 4, 5]);
      setPublishHours((config.publish_hours as number[]) || [9, 14]);
    } else {
      setSelectedSiteId("");
      setEnabled(true);
      setAutoPublish(false);
      setMaxPerDay(5);
      setMaxPerWeek(20);
      setDaysOfWeek([1, 2, 3, 4, 5]);
      setPublishHours([9, 14]);
    }
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

  async function handleSubmit() {
    if (!selectedSiteId) {
      toast.error("Veuillez sélectionner un site");
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
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
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
