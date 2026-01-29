"use server";

import { google } from "googleapis";

// Types pour les données Search Console
export interface SearchConsoleMetrics {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchConsoleRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchConsoleSiteData {
  siteUrl: string;
  domain: string;
  metrics: SearchConsoleMetrics;
  topQueries: SearchConsoleRow[];
  topPages: SearchConsoleRow[];
}

export interface SearchConsoleResponse {
  success: boolean;
  data?: SearchConsoleSiteData[];
  error?: string;
}

// Vérifier si les credentials sont configurées
function hasCredentials(): boolean {
  return !!(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  );
}

// Créer le client authentifié
async function getSearchConsoleClient() {
  if (!hasCredentials()) {
    throw new Error("Google Search Console credentials not configured");
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });

  return google.searchconsole({ version: "v1", auth });
}

// Formater le domaine pour l'API Search Console
// L'API accepte: sc-domain:example.com ou https://example.com/
function formatSiteUrl(domain: string): string {
  // Nettoyer le domaine
  const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "");

  // Utiliser le format sc-domain pour les propriétés de domaine
  return `sc-domain:${cleanDomain}`;
}

// Récupérer les métriques pour un site
export async function getSiteMetrics(
  domain: string,
  startDate: string,
  endDate: string
): Promise<{ success: boolean; data?: SearchConsoleSiteData; error?: string }> {
  try {
    if (!hasCredentials()) {
      return { success: false, error: "Credentials Google non configurées" };
    }

    const searchconsole = await getSearchConsoleClient();
    const siteUrl = formatSiteUrl(domain);

    // Récupérer les métriques globales
    const metricsResponse = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: [],
        rowLimit: 1,
      },
    });

    const globalMetrics: SearchConsoleMetrics = metricsResponse.data.rows?.[0]
      ? {
          clicks: metricsResponse.data.rows[0].clicks || 0,
          impressions: metricsResponse.data.rows[0].impressions || 0,
          ctr: metricsResponse.data.rows[0].ctr || 0,
          position: metricsResponse.data.rows[0].position || 0,
        }
      : { clicks: 0, impressions: 0, ctr: 0, position: 0 };

    // Récupérer les top requêtes (triées par clics par défaut)
    const queriesResponse = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ["query"],
        rowLimit: 10,
      },
    });

    const topQueries: SearchConsoleRow[] = (
      queriesResponse.data.rows?.map((row) => ({
        keys: row.keys || [],
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      })) || []
    ).sort((a, b) => b.clicks - a.clicks);

    // Récupérer les top pages (triées par clics par défaut)
    const pagesResponse = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ["page"],
        rowLimit: 10,
      },
    });

    const topPages: SearchConsoleRow[] = (
      pagesResponse.data.rows?.map((row) => ({
        keys: row.keys || [],
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      })) || []
    ).sort((a, b) => b.clicks - a.clicks);

    return {
      success: true,
      data: {
        siteUrl,
        domain,
        metrics: globalMetrics,
        topQueries,
        topPages,
      },
    };
  } catch (error) {
    console.error(`Error fetching metrics for ${domain}:`, error);

    // Gérer les erreurs spécifiques
    if (error instanceof Error) {
      if (error.message.includes("403")) {
        return {
          success: false,
          error: `Accès refusé pour ${domain}. Vérifiez que le service account a accès à cette propriété.`,
        };
      }
      if (error.message.includes("404")) {
        return {
          success: false,
          error: `Propriété ${domain} non trouvée dans Search Console.`,
        };
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

// Vérifier la connexion et lister les sites accessibles
export async function listAccessibleSites(): Promise<{
  success: boolean;
  sites?: string[];
  error?: string;
}> {
  try {
    if (!hasCredentials()) {
      return { success: false, error: "Credentials Google non configurées" };
    }

    const searchconsole = await getSearchConsoleClient();
    const response = await searchconsole.sites.list();

    const sites =
      response.data.siteEntry?.map((site) => site.siteUrl || "").filter(Boolean) || [];

    return { success: true, sites };
  } catch (error) {
    console.error("Error listing sites:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

// Vérifier si les credentials sont valides
export async function checkCredentials(): Promise<{
  configured: boolean;
  valid: boolean;
  error?: string;
}> {
  if (!hasCredentials()) {
    return { configured: false, valid: false };
  }

  try {
    const searchconsole = await getSearchConsoleClient();
    await searchconsole.sites.list();
    return { configured: true, valid: true };
  } catch (error) {
    return {
      configured: true,
      valid: false,
      error: error instanceof Error ? error.message : "Erreur de connexion",
    };
  }
}
