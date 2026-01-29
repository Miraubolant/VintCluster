"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  TrendingUp,
  MousePointerClick,
  Eye,
  Target,
  AlertCircle,
  CheckCircle,
  XCircle,
  ExternalLink,
  Search,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAnalytics, type AnalyticsData, type SiteAnalytics } from "@/lib/actions/analytics";

// Composant pour afficher une stat
function StatCard({
  title,
  value,
  icon: Icon,
  color,
  suffix,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  suffix?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
            {suffix && <span className="text-lg text-gray-500 ml-1">{suffix}</span>}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

// Composant pour un site dans la liste
function SiteCard({
  site,
  expanded,
  onToggle,
}: {
  site: SiteAnalytics;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasError = !!site.error;
  const hasData = site.metrics !== null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header cliquable */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              hasError
                ? "bg-red-100"
                : hasData
                ? "bg-green-100"
                : "bg-gray-100"
            }`}
          >
            {hasError ? (
              <XCircle className="w-5 h-5 text-red-600" />
            ) : hasData ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">{site.siteName}</h3>
            <p className="text-sm text-gray-500">{site.domain}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {hasData && site.metrics && (
            <>
              <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-500">Clics</p>
                <p className="font-semibold text-gray-900">
                  {site.metrics.clicks.toLocaleString("fr-FR")}
                </p>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-500">Impressions</p>
                <p className="font-semibold text-gray-900">
                  {site.metrics.impressions.toLocaleString("fr-FR")}
                </p>
              </div>
              <div className="text-right hidden md:block">
                <p className="text-xs text-gray-500">CTR</p>
                <p className="font-semibold text-gray-900">
                  {(site.metrics.ctr * 100).toFixed(1)}%
                </p>
              </div>
              <div className="text-right hidden md:block">
                <p className="text-xs text-gray-500">Position</p>
                <p className="font-semibold text-gray-900">
                  {site.metrics.position.toFixed(1)}
                </p>
              </div>
            </>
          )}
          {hasError && (
            <span className="text-sm text-red-600 max-w-[200px] truncate hidden sm:block">
              {site.error}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Contenu expandable */}
      {expanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          {hasError ? (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{site.error}</span>
            </div>
          ) : hasData ? (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Top Requêtes */}
              <div>
                <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-3">
                  <Search className="w-4 h-4 text-indigo-500" />
                  Top Requêtes
                </h4>
                {site.topQueries.length > 0 ? (
                  <div className="space-y-2">
                    {site.topQueries.slice(0, 5).map((query, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-white rounded-lg p-2 text-sm"
                      >
                        <span className="text-gray-700 truncate max-w-[200px]">
                          {query.query}
                        </span>
                        <div className="flex items-center gap-3 text-gray-500">
                          <span>{query.clicks} clics</span>
                          <span className="text-xs">
                            pos. {query.position.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Aucune requête</p>
                )}
              </div>

              {/* Top Pages */}
              <div>
                <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  Top Pages
                </h4>
                {site.topPages.length > 0 ? (
                  <div className="space-y-2">
                    {site.topPages.slice(0, 5).map((page, i) => {
                      // Extraire le path de l'URL
                      let path = page.page;
                      try {
                        path = new URL(page.page).pathname;
                      } catch {
                        // Garder l'original si ce n'est pas une URL valide
                      }
                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between bg-white rounded-lg p-2 text-sm"
                        >
                          <span className="text-gray-700 truncate max-w-[200px]">
                            {path || "/"}
                          </span>
                          <div className="flex items-center gap-3 text-gray-500">
                            <span>{page.clicks} clics</span>
                            <span className="text-xs">
                              {page.impressions.toLocaleString()} imp.
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Aucune page</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Aucune donnée disponible</p>
          )}

          {/* Lien vers Search Console */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <a
              href={`https://search.google.com/search-console/performance/search-analytics?resource_id=sc-domain:${site.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
            >
              <ExternalLink className="w-4 h-4" />
              Voir dans Search Console
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// Composant de configuration des credentials
function CredentialsSetup() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-amber-100 rounded-lg">
          <AlertCircle className="w-6 h-6 text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900">
            Configuration Google Search Console requise
          </h3>
          <p className="text-sm text-amber-700 mt-1">
            Pour afficher les données Search Console, vous devez configurer les
            credentials Google.
          </p>

          <div className="mt-4 bg-white rounded-lg p-4 border border-amber-200">
            <h4 className="font-medium text-gray-900 mb-3">
              Étapes de configuration :
            </h4>
            <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
              <li>
                Créez un projet dans{" "}
                <a
                  href="https://console.cloud.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  Google Cloud Console
                </a>
              </li>
              <li>Activez l&apos;API &quot;Search Console API&quot;</li>
              <li>
                Créez un Service Account et téléchargez la clé JSON
              </li>
              <li>
                Ajoutez le Service Account comme utilisateur dans chaque
                propriété Search Console
              </li>
              <li>
                Ajoutez ces variables d&apos;environnement :
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                  GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
                  {"\n"}
                  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=&quot;-----BEGIN PRIVATE
                  KEY-----\n...\n-----END PRIVATE KEY-----\n&quot;
                </pre>
              </li>
            </ol>
          </div>

          <div className="mt-4">
            <a
              href="https://developers.google.com/webmaster-tools/v1/how-tos/authorizing"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
            >
              <ExternalLink className="w-4 h-4" />
              Documentation officielle
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "28d" | "3m">("28d");
  const [expandedSites, setExpandedSites] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    setLoading(true);
    const result = await getAnalytics(period);
    setData(result);
    setLoading(false);
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function toggleSite(siteId: string) {
    setExpandedSites((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(siteId)) {
        newSet.delete(siteId);
      } else {
        newSet.add(siteId);
      }
      return newSet;
    });
  }

  function expandAll() {
    if (data) {
      setExpandedSites(new Set(data.sites.map((s) => s.siteId)));
    }
  }

  function collapseAll() {
    setExpandedSites(new Set());
  }

  const formattedLastUpdated = data?.lastUpdated
    ? new Date(data.lastUpdated).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1">
            Données Google Search Console de vos sites
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="28d">28 derniers jours</SelectItem>
              <SelectItem value="3m">3 derniers mois</SelectItem>
            </SelectContent>
          </Select>
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
      </div>

      {/* Credentials non configurées */}
      {data && !data.credentialsConfigured && <CredentialsSetup />}

      {/* Credentials invalides */}
      {data && data.credentialsConfigured && !data.credentialsValid && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="font-medium text-red-900">
                Erreur de connexion à Google
              </p>
              <p className="text-sm text-red-700">{data.credentialsError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats globales */}
      {data && data.credentialsValid && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Clics"
            value={data.summary.totalClicks}
            icon={MousePointerClick}
            color="bg-indigo-500"
          />
          <StatCard
            title="Total Impressions"
            value={data.summary.totalImpressions}
            icon={Eye}
            color="bg-purple-500"
          />
          <StatCard
            title="CTR Moyen"
            value={(data.summary.averageCtr * 100).toFixed(1)}
            icon={TrendingUp}
            color="bg-green-500"
            suffix="%"
          />
          <StatCard
            title="Position Moyenne"
            value={data.summary.averagePosition.toFixed(1)}
            icon={Target}
            color="bg-amber-500"
          />
        </div>
      )}

      {/* Liste des sites */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Sites ({data?.sites.length || 0})
          </h2>
          {data && data.sites.length > 0 && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={expandAll}>
                Tout déplier
              </Button>
              <Button variant="ghost" size="sm" onClick={collapseAll}>
                Tout replier
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : data?.sites.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500">Aucun site configuré</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data?.sites
              .sort((a, b) => {
                // Sites avec données en premier, triés par clics
                if (a.metrics && b.metrics) {
                  return b.metrics.clicks - a.metrics.clicks;
                }
                if (a.metrics) return -1;
                if (b.metrics) return 1;
                return 0;
              })
              .map((site) => (
                <SiteCard
                  key={site.siteId}
                  site={site}
                  expanded={expandedSites.has(site.siteId)}
                  onToggle={() => toggleSite(site.siteId)}
                />
              ))}
          </div>
        )}
      </div>

      {/* Footer avec timestamp */}
      {data && (
        <div className="text-center text-sm text-gray-500">
          Dernière mise à jour : {formattedLastUpdated}
          {data.summary.sitesWithData > 0 && (
            <span className="ml-2">
              • {data.summary.sitesWithData} site(s) avec données
            </span>
          )}
          {data.summary.sitesWithErrors > 0 && (
            <span className="ml-2 text-red-500">
              • {data.summary.sitesWithErrors} erreur(s)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
