"use client";

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { FileText, Tag, Calendar, Clock } from "lucide-react";
import type { Column } from "@/components/admin/shared";
import type { SchedulerConfig } from "@/types/database";

// Type étendu pour les configs avec site
export interface SchedulerConfigWithSite extends SchedulerConfig {
  site?: {
    id: string;
    name: string;
    domain: string;
  };
  articlesCount?: number;
}

const DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

// Composant Badge de statut
export function SchedulerStatusBadge({ enabled }: { enabled: boolean }) {
  if (enabled) {
    return (
      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
        Actif
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-100">
      Inactif
    </Badge>
  );
}

// Composant pour les jours de la semaine
export function SchedulerDaysBadges({ days }: { days: number[] }) {
  if (days.length === 0) {
    return <span className="text-sm text-gray-400">Aucun</span>;
  }

  return (
    <div className="flex gap-1 flex-wrap">
      {days.map((day) => (
        <span
          key={day}
          className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium"
        >
          {DAYS[day]}
        </span>
      ))}
    </div>
  );
}

// Définition des colonnes pour DataTable
export function getSchedulerColumns(
  onToggle: (siteId: string, enabled: boolean) => void
): Column<SchedulerConfigWithSite>[] {
  return [
    {
      key: "site",
      header: "Site",
      cell: (config) => (
        <div>
          <p className="font-medium text-gray-900">
            {config.site?.name || "Site inconnu"}
          </p>
          <p className="text-xs text-gray-500">{config.site?.domain}</p>
        </div>
      ),
    },
    {
      key: "enabled",
      header: "Statut",
      cell: (config) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={config.enabled || false}
            onCheckedChange={(checked) => onToggle(config.site_id, checked)}
          />
          <SchedulerStatusBadge enabled={config.enabled || false} />
        </div>
      ),
    },
    {
      key: "articlesCount",
      header: "Articles",
      hideOnMobile: true,
      cell: (config) => (
        <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 gap-1">
          <FileText className="h-3 w-3" />
          {config.articlesCount ?? 0}
        </Badge>
      ),
    },
    {
      key: "keywords",
      header: "Mots-clés",
      hideOnMobile: true,
      cell: (config) => {
        const keywordIds = (config.keyword_ids as string[]) || [];
        return (
          <Badge
            variant="secondary"
            className={keywordIds.length > 0 ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-100 gap-1" : "bg-gray-100 text-gray-500 hover:bg-gray-100 gap-1"}
          >
            <Tag className="h-3 w-3" />
            {keywordIds.length}
          </Badge>
        );
      },
    },
    {
      key: "days",
      header: "Jours",
      hideOnMobile: true,
      hideOnTablet: true,
      cell: (config) => {
        const days = (config.days_of_week as number[]) || [];
        return <SchedulerDaysBadges days={days} />;
      },
    },
    {
      key: "limits",
      header: "Limites",
      hideOnMobile: true,
      hideOnTablet: true,
      cell: (config) => (
        <div className="text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{config.max_per_day || 0}/j</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{config.max_per_week || 0}/sem</span>
          </div>
        </div>
      ),
    },
  ];
}
