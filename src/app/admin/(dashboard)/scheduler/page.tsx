"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import {
  SchedulerStats,
  SchedulerConfigCard,
  SchedulerConfigDialog,
} from "@/components/admin/scheduler";
import {
  getSchedulerConfigs,
  getSchedulerStats,
  toggleSchedulerEnabled,
  runSchedulerManually,
} from "@/lib/actions/scheduler";
import { getSites } from "@/lib/actions/sites";
import { toast } from "sonner";
import type { Site, SchedulerConfig } from "@/types/database";

interface SchedulerConfigWithSite extends SchedulerConfig {
  site?: {
    id: string;
    name: string;
    domain: string;
  };
}

export default function SchedulerPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [configs, setConfigs] = useState<SchedulerConfigWithSite[]>([]);
  const [stats, setStats] = useState({
    totalConfigs: 0,
    enabledConfigs: 0,
    pendingKeywords: 0,
    articlesToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SchedulerConfigWithSite | null>(null);
  const [runningSiteId, setRunningSiteId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);

    const [sitesRes, configsRes, statsRes] = await Promise.all([
      getSites(),
      getSchedulerConfigs(),
      getSchedulerStats(),
    ]);

    if (sitesRes.data) setSites(sitesRes.data);
    if (configsRes.data) setConfigs(configsRes.data);
    setStats(statsRes);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleToggle(siteId: string, enabled: boolean) {
    const result = await toggleSchedulerEnabled(siteId, enabled);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(enabled ? "Scheduler activé" : "Scheduler désactivé");
    loadData();
  }

  async function handleRunManually(siteId: string) {
    setRunningSiteId(siteId);
    const result = await runSchedulerManually(siteId);
    setRunningSiteId(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(`Article généré: ${result.articleTitle}`);
    loadData();
  }

  function handleEdit(config: SchedulerConfigWithSite) {
    setEditingConfig(config);
    setDialogOpen(true);
  }

  function handleAdd() {
    setEditingConfig(null);
    setDialogOpen(true);
  }

  // Sites sans configuration
  const configuredSiteIds = configs.map((c) => c.site_id);
  const unconfiguredSites = sites.filter(
    (s) => !configuredSiteIds.includes(s.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planification</h1>
          <p className="text-gray-500 mt-1">
            Configurez la génération et publication automatiques
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Actualiser
          </Button>
          {unconfiguredSites.length > 0 && (
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Configurer un site
            </Button>
          )}
        </div>
      </div>

      <SchedulerStats stats={stats} />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Configurations ({configs.length})
        </h2>

        {configs.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-500">Aucune configuration</p>
            <p className="text-sm text-gray-400 mt-1">
              Configurez un site pour activer la génération automatique
            </p>
            {sites.length > 0 && (
              <Button className="mt-4" onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Configurer un site
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {configs.map((config) => (
              <SchedulerConfigCard
                key={config.id}
                config={config}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onRunManually={handleRunManually}
                isRunning={runningSiteId === config.site_id}
              />
            ))}
          </div>
        )}
      </div>

      <SchedulerConfigDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        config={editingConfig}
        sites={unconfiguredSites}
        onSuccess={loadData}
      />
    </div>
  );
}
