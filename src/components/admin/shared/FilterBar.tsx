"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  type: "search" | "select";
  label: string;
  placeholder?: string;
  options?: FilterOption[];
  className?: string;
}

export interface FilterBarProps {
  filters: FilterConfig[];
  values: Record<string, string | null>;
  onChange: (key: string, value: string | null) => void;
  onReset?: () => void;
  className?: string;
  showResetButton?: boolean;
}

export function FilterBar({
  filters,
  values,
  onChange,
  onReset,
  className,
  showResetButton = true,
}: FilterBarProps) {
  // Check if any filter has a value
  const hasActiveFilters = Object.values(values).some(
    (v) => v !== null && v !== "" && v !== "all"
  );

  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-gray-200 p-5",
        "flex flex-wrap items-center gap-4",
        className
      )}
    >
      <div className="flex items-center gap-2.5 text-gray-500 mr-3">
        <SlidersHorizontal className="h-5 w-5" />
        <span className="text-base font-medium hidden sm:inline">Filtres</span>
      </div>

      {filters.map((filter) => (
        <div key={filter.key} className={cn("flex-1 min-w-[160px] max-w-[280px]", filter.className)}>
          {filter.type === "search" ? (
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder={filter.placeholder || `Rechercher...`}
                value={values[filter.key] || ""}
                onChange={(e) => onChange(filter.key, e.target.value || null)}
                className="pl-11 h-11 text-base"
              />
              {values[filter.key] && (
                <button
                  onClick={() => onChange(filter.key, null)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          ) : filter.type === "select" && filter.options ? (
            <Select
              value={values[filter.key] || "all"}
              onValueChange={(value) => onChange(filter.key, value === "all" ? null : value)}
            >
              <SelectTrigger className="h-11 text-base">
                <SelectValue placeholder={filter.placeholder || filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{filter.placeholder || `Tous`}</SelectItem>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>
      ))}

      {/* Reset button */}
      {showResetButton && hasActiveFilters && onReset && (
        <Button
          variant="ghost"
          onClick={onReset}
          className="text-gray-500 hover:text-gray-700 h-11 px-4 text-base"
        >
          <X className="h-5 w-5 mr-1.5" />
          Réinitialiser
        </Button>
      )}
    </div>
  );
}

// Composant simplifié pour juste une barre de recherche
export function SearchBar({
  value,
  onChange,
  placeholder = "Rechercher...",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-11 h-11 text-base"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
