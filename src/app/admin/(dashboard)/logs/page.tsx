"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { LogsStats, LogsTable, LogsFilters } from "@/components/admin/logs";
import { getActivityLogs, getLogStats, type LogType } from "@/lib/actions/logs";
import { getSites } from "@/lib/actions/sites";
import type { Site, ActivityLog } from "@/types/database";

interface ActivityLogWithSite extends ActivityLog {
  site?: {
    id: string;
    name: string;
    domain: string;
  };
}

const LOGS_PER_PAGE = 50;

export default function LogsPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [logs, setLogs] = useState<ActivityLogWithSite[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    thisWeek: 0,
    byType: {} as Record<string, number>,
  });
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<LogType | null>(null);
  const [page, setPage] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);

    const [sitesRes, logsRes, statsRes] = await Promise.all([
      getSites(),
      getActivityLogs({
        siteId: selectedSiteId || undefined,
        type: selectedType || undefined,
        limit: LOGS_PER_PAGE,
        offset: page * LOGS_PER_PAGE,
      }),
      getLogStats(selectedSiteId || undefined),
    ]);

    if (sitesRes.data) setSites(sitesRes.data);
    if (logsRes.data) {
      setLogs(logsRes.data);
      setTotalLogs(logsRes.total);
    }
    setStats(statsRes);
    setLoading(false);
  }, [selectedSiteId, selectedType, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [selectedSiteId, selectedType]);

  const totalPages = Math.ceil(totalLogs / LOGS_PER_PAGE);
  const hasNextPage = page < totalPages - 1;
  const hasPrevPage = page > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historique</h1>
          <p className="text-gray-500 mt-1">
            Consultez l&apos;historique des actions et événements
          </p>
        </div>
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
      </div>

      <LogsStats stats={stats} />

      <LogsFilters
        sites={sites}
        selectedSiteId={selectedSiteId}
        selectedType={selectedType}
        onSiteChange={setSelectedSiteId}
        onTypeChange={setSelectedType}
      />

      <LogsTable logs={logs} />

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Affichage {page * LOGS_PER_PAGE + 1} -{" "}
            {Math.min((page + 1) * LOGS_PER_PAGE, totalLogs)} sur {totalLogs}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={!hasPrevPage || loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600">
              Page {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNextPage || loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
