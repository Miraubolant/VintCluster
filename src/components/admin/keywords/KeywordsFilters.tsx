"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Site } from "@/types/database";
import type { KeywordStatus } from "@/types/database";

interface KeywordsFiltersProps {
  sites: Site[];
  selectedSiteId: string | null;
  selectedStatus: KeywordStatus | null;
  searchQuery: string;
  onSiteChange: (siteId: string | null) => void;
  onStatusChange: (status: KeywordStatus | null) => void;
  onSearchChange: (query: string) => void;
}

const statusOptions: { value: KeywordStatus | "all"; label: string }[] = [
  { value: "all", label: "Tous les statuts" },
  { value: "pending", label: "En attente" },
  { value: "generating", label: "En génération" },
  { value: "generated", label: "Générés" },
  { value: "published", label: "Publiés" },
  { value: "archived", label: "Archivés" },
];

export function KeywordsFilters({
  sites,
  selectedSiteId,
  selectedStatus,
  searchQuery,
  onSiteChange,
  onStatusChange,
  onSearchChange,
}: KeywordsFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Rechercher un mot-clé..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

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
        value={selectedStatus || "all"}
        onValueChange={(value) =>
          onStatusChange(value === "all" ? null : (value as KeywordStatus))
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
  );
}
