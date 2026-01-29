"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Play,
  Settings,
  Loader2,
  Power,
  PowerOff,
  Trash2,
} from "lucide-react";
import type { SchedulerConfigWithSite } from "./SchedulerColumns";

interface SchedulerRowActionsProps {
  config: SchedulerConfigWithSite;
  isRunning: boolean;
  onRunManually: (siteId: string) => void;
  onEdit: (config: SchedulerConfigWithSite) => void;
  onToggle: (siteId: string, enabled: boolean) => void;
  onDelete?: (siteId: string) => void;
}

export function SchedulerRowActions({
  config,
  isRunning,
  onRunManually,
  onEdit,
  onToggle,
  onDelete,
}: SchedulerRowActionsProps) {
  const keywordIds = (config.keyword_ids as string[]) || [];
  const hasKeywords = keywordIds.length > 0;

  return (
    <div className="flex items-center gap-1">
      {/* Quick play button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRunManually(config.site_id)}
        disabled={isRunning || !hasKeywords}
        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
        title={!hasKeywords ? "Aucun mot-clé sélectionné" : "Lancer une génération maintenant"}
      >
        {isRunning ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>

      {/* Dropdown menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => onRunManually(config.site_id)}
            disabled={isRunning || !hasKeywords}
          >
            {isRunning ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Lancer maintenant
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => onEdit(config)}>
            <Settings className="mr-2 h-4 w-4" />
            Configurer
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {config.enabled ? (
            <DropdownMenuItem onClick={() => onToggle(config.site_id, false)}>
              <PowerOff className="mr-2 h-4 w-4" />
              Désactiver
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => onToggle(config.site_id, true)}>
              <Power className="mr-2 h-4 w-4" />
              Activer
            </DropdownMenuItem>
          )}

          {onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(config.site_id)}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer la config
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
