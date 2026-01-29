"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getSiteMetrics,
  checkCredentials,
  listAccessibleSites,
} from "@/lib/google/search-console";

// Type pour les métriques (défini localement pour éviter les problèmes d'export)
export interface SearchConsoleMetrics {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SiteAnalytics {
  siteId: string;
  siteName: string;
  domain: string;
  metrics: SearchConsoleMetrics | null;
  topQueries: Array<{
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  topPages: Array<{
    page: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  error?: string;
}

export interface AnalyticsSummary {
  totalClicks: number;
  totalImpressions: number;
  averageCtr: number;
  averagePosition: number;
  sitesWithData: number;
  sitesWithErrors: number;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  sites: SiteAnalytics[];
  lastUpdated: string;
  credentialsConfigured: boolean;
  credentialsValid: boolean;
  credentialsError?: string;
}

// Calculer les dates pour les périodes
function getDateRange(period: "7d" | "28d" | "3m"): { startDate: string; endDate: string } {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 1); // Hier (données du jour pas encore disponibles)

  const startDate = new Date(endDate);

  switch (period) {
    case "7d":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "28d":
      startDate.setDate(startDate.getDate() - 28);
      break;
    case "3m":
      startDate.setMonth(startDate.getMonth() - 3);
      break;
  }

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  };
}

// Récupérer les analytics pour tous les sites
export async function getAnalytics(
  period: "7d" | "28d" | "3m" = "28d"
): Promise<AnalyticsData> {
  try {
    const supabase = await createClient();
    const { startDate, endDate } = getDateRange(period);

    // Vérifier les credentials (avec gestion d'erreur)
    let credentialsStatus: { configured: boolean; valid: boolean; error?: string };
    try {
      credentialsStatus = await checkCredentials();
    } catch (credError) {
      console.error("Error checking credentials:", credError);
      credentialsStatus = {
        configured: true,
        valid: false,
        error: credError instanceof Error ? credError.message : "Erreur de vérification des credentials",
      };
    }

    // Récupérer tous les sites
    const { data: sites, error } = await supabase
      .from("sites")
      .select("id, name, domain")
      .order("name");

    if (error || !sites) {
      return {
        summary: {
          totalClicks: 0,
          totalImpressions: 0,
          averageCtr: 0,
          averagePosition: 0,
          sitesWithData: 0,
          sitesWithErrors: 0,
        },
        sites: [],
        lastUpdated: new Date().toISOString(),
        credentialsConfigured: credentialsStatus.configured,
        credentialsValid: credentialsStatus.valid,
        credentialsError: credentialsStatus.error,
      };
    }

    // Si credentials non configurées, retourner les sites sans données
    if (!credentialsStatus.configured || !credentialsStatus.valid) {
      return {
        summary: {
          totalClicks: 0,
          totalImpressions: 0,
          averageCtr: 0,
          averagePosition: 0,
          sitesWithData: 0,
          sitesWithErrors: sites.length,
        },
        sites: sites.map((site) => ({
          siteId: site.id,
          siteName: site.name,
          domain: site.domain,
          metrics: null,
          topQueries: [],
          topPages: [],
          error: credentialsStatus.error || "Credentials non configurées",
        })),
        lastUpdated: new Date().toISOString(),
        credentialsConfigured: credentialsStatus.configured,
        credentialsValid: credentialsStatus.valid,
        credentialsError: credentialsStatus.error,
      };
    }

    // Récupérer les métriques pour chaque site (en parallèle)
    const siteAnalyticsPromises = sites.map(async (site) => {
      const result = await getSiteMetrics(site.domain, startDate, endDate);

      if (result.success && result.data) {
        return {
          siteId: site.id,
          siteName: site.name,
          domain: site.domain,
          metrics: result.data.metrics,
          topQueries: result.data.topQueries.map((row) => ({
            query: row.keys[0] || "",
            clicks: row.clicks,
            impressions: row.impressions,
            ctr: row.ctr,
            position: row.position,
          })),
          topPages: result.data.topPages.map((row) => ({
            page: row.keys[0] || "",
            clicks: row.clicks,
            impressions: row.impressions,
            ctr: row.ctr,
            position: row.position,
          })),
        };
      }

      return {
        siteId: site.id,
        siteName: site.name,
        domain: site.domain,
        metrics: null,
        topQueries: [],
        topPages: [],
        error: result.error,
      };
    });

    const siteAnalytics = await Promise.all(siteAnalyticsPromises);

    // Calculer le résumé
    const sitesWithData = siteAnalytics.filter((s) => s.metrics !== null);
    const sitesWithErrors = siteAnalytics.filter((s) => s.error);

    const summary: AnalyticsSummary = {
      totalClicks: sitesWithData.reduce((sum, s) => sum + (s.metrics?.clicks || 0), 0),
      totalImpressions: sitesWithData.reduce(
        (sum, s) => sum + (s.metrics?.impressions || 0),
        0
      ),
      averageCtr:
        sitesWithData.length > 0
          ? sitesWithData.reduce((sum, s) => sum + (s.metrics?.ctr || 0), 0) /
            sitesWithData.length
          : 0,
      averagePosition:
        sitesWithData.length > 0
          ? sitesWithData.reduce((sum, s) => sum + (s.metrics?.position || 0), 0) /
            sitesWithData.length
          : 0,
      sitesWithData: sitesWithData.length,
      sitesWithErrors: sitesWithErrors.length,
    };

    return {
      summary,
      sites: siteAnalytics,
      lastUpdated: new Date().toISOString(),
      credentialsConfigured: credentialsStatus.configured,
      credentialsValid: credentialsStatus.valid,
    };
  } catch (error) {
    console.error("Error in getAnalytics:", error);
    return {
      summary: {
        totalClicks: 0,
        totalImpressions: 0,
        averageCtr: 0,
        averagePosition: 0,
        sitesWithData: 0,
        sitesWithErrors: 0,
      },
      sites: [],
      lastUpdated: new Date().toISOString(),
      credentialsConfigured: false,
      credentialsValid: false,
      credentialsError: error instanceof Error ? error.message : "Erreur inattendue",
    };
  }
}

// Récupérer les analytics pour un site spécifique
export async function getSiteAnalytics(
  siteId: string,
  period: "7d" | "28d" | "3m" = "28d"
): Promise<SiteAnalytics | null> {
  const supabase = await createClient();
  const { startDate, endDate } = getDateRange(period);

  // Récupérer le site
  const { data: site, error } = await supabase
    .from("sites")
    .select("id, name, domain")
    .eq("id", siteId)
    .single();

  if (error || !site) {
    return null;
  }

  // Vérifier les credentials
  const credentialsStatus = await checkCredentials();

  if (!credentialsStatus.configured || !credentialsStatus.valid) {
    return {
      siteId: site.id,
      siteName: site.name,
      domain: site.domain,
      metrics: null,
      topQueries: [],
      topPages: [],
      error: credentialsStatus.error || "Credentials non configurées",
    };
  }

  // Récupérer les métriques
  const result = await getSiteMetrics(site.domain, startDate, endDate);

  if (result.success && result.data) {
    return {
      siteId: site.id,
      siteName: site.name,
      domain: site.domain,
      metrics: result.data.metrics,
      topQueries: result.data.topQueries.map((row) => ({
        query: row.keys[0] || "",
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      })),
      topPages: result.data.topPages.map((row) => ({
        page: row.keys[0] || "",
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      })),
    };
  }

  return {
    siteId: site.id,
    siteName: site.name,
    domain: site.domain,
    metrics: null,
    topQueries: [],
    topPages: [],
    error: result.error,
  };
}

// Lister les sites accessibles dans Search Console
export async function getAccessibleSearchConsoleSites(): Promise<{
  success: boolean;
  sites?: string[];
  error?: string;
}> {
  return listAccessibleSites();
}

// Vérifier le statut des credentials
export async function getCredentialsStatus(): Promise<{
  configured: boolean;
  valid: boolean;
  error?: string;
}> {
  return checkCredentials();
}
