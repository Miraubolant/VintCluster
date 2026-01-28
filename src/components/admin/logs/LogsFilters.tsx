"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Site } from "@/types/database";
import type { LogType } from "@/lib/actions/logs";

interface LogsFiltersProps {
  sites: Site[];
  selectedSiteId: string | null;
  selectedType: LogType | null;
  onSiteChange: (siteId: string | null) => void;
  onTypeChange: (type: LogType | null) => void;
}

const typeOptions: { value: LogType | "all"; label: string }[] = [
  { value: "all", label: "Tous les types" },
  { value: "article_generated", label: "Articles générés" },
  { value: "article_published", label: "Articles publiés" },
  { value: "article_unpublished", label: "Articles dépubliés" },
  { value: "keyword_imported", label: "Mots-clés importés" },
  { value: "site_created", label: "Sites créés" },
  { value: "site_updated", label: "Sites modifiés" },
  { value: "scheduler_updated", label: "Scheduler modifié" },
  { value: "error", label: "Erreurs" },
];

export function LogsFilters({
  sites,
  selectedSiteId,
  selectedType,
  onSiteChange,
  onTypeChange,
}: LogsFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <Select
        value={selectedSiteId || "all"}
        onValueChange={(value) => onSiteChange(value === "all" ? null : value)}
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
        value={selectedType || "all"}
        onValueChange={(value) =>
          onTypeChange(value === "all" ? null : (value as LogType))
        }
      >
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Tous les types" />
        </SelectTrigger>
        <SelectContent>
          {typeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
