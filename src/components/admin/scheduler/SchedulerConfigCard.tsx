"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Settings, ChevronDown, ChevronUp } from "lucide-react";
import type { SchedulerConfig } from "@/types/database";

interface SchedulerConfigWithSite extends SchedulerConfig {
  site?: {
    id: string;
    name: string;
    domain: string;
  };
}

interface SchedulerConfigCardProps {
  config: SchedulerConfigWithSite;
  onToggle: (siteId: string, enabled: boolean) => void;
  onEdit: (config: SchedulerConfigWithSite) => void;
}

const DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export function SchedulerConfigCard({
  config,
  onToggle,
  onEdit,
}: SchedulerConfigCardProps) {
  const [expanded, setExpanded] = useState(false);

  const daysOfWeek = (config.days_of_week as number[]) || [];
  const publishHours = (config.publish_hours as number[]) || [];

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Switch
            checked={config.enabled || false}
            onCheckedChange={(checked) => onToggle(config.site_id, checked)}
          />
          <div>
            <h3 className="font-medium text-gray-900">
              {config.site?.name || "Site inconnu"}
            </h3>
            <p className="text-sm text-gray-500">{config.site?.domain}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {config.enabled ? (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
              Actif
            </Badge>
          ) : (
            <Badge variant="secondary">Inactif</Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          <Button variant="outline" size="sm" onClick={() => onEdit(config)}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Max par jour</p>
              <p className="font-medium">{config.max_per_day || 0}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Max par semaine</p>
              <p className="font-medium">{config.max_per_week || 0}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Publication auto</p>
              <p className="font-medium">
                {config.auto_publish ? "Oui" : "Non"}
              </p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Jours actifs</p>
              <div className="flex gap-1 flex-wrap">
                {daysOfWeek.length > 0 ? (
                  daysOfWeek.map((day) => (
                    <span
                      key={day}
                      className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs"
                    >
                      {DAYS[day]}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400">Aucun</span>
                )}
              </div>
            </div>
          </div>

          {publishHours.length > 0 && (
            <div className="mt-4">
              <p className="text-gray-500 text-sm mb-2">Heures de publication</p>
              <div className="flex gap-1 flex-wrap">
                {publishHours.map((hour) => (
                  <span
                    key={hour}
                    className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs"
                  >
                    {hour}h
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
