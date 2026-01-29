"use client";

import { Button } from "@/components/ui/button";
import { Rocket, Power, PowerOff, Loader2 } from "lucide-react";
import { ToolbarDivider } from "@/components/admin/shared";

interface SchedulerBulkActionsProps {
  selectedCount: number;
  onLaunchBulk: () => void;
  onEnableAll: () => void;
  onDisableAll: () => void;
  isGenerating?: boolean;
}

export function SchedulerBulkActions({
  selectedCount,
  onLaunchBulk,
  onEnableAll,
  onDisableAll,
  isGenerating = false,
}: SchedulerBulkActionsProps) {
  return (
    <>
      {/* Launch bulk generation */}
      <Button
        variant="outline"
        size="sm"
        onClick={onLaunchBulk}
        disabled={isGenerating}
        className="text-indigo-700 border-indigo-300 hover:bg-indigo-50"
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <Rocket className="h-4 w-4 mr-1" />
        )}
        {isGenerating ? "Génération..." : "Configurer & Lancer"}
      </Button>

      <ToolbarDivider />

      {/* Enable all */}
      <Button
        variant="outline"
        size="sm"
        onClick={onEnableAll}
        disabled={isGenerating}
        className="text-green-700 border-green-300 hover:bg-green-50"
      >
        <Power className="h-4 w-4 mr-1" />
        Activer
      </Button>

      {/* Disable all */}
      <Button
        variant="outline"
        size="sm"
        onClick={onDisableAll}
        disabled={isGenerating}
        className="text-gray-700 border-gray-300 hover:bg-gray-50"
      >
        <PowerOff className="h-4 w-4 mr-1" />
        Désactiver
      </Button>
    </>
  );
}
