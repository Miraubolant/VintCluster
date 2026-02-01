import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSiteMetrics, checkCredentials } from "@/lib/google/search-console";
import type { Database } from "@/types/supabase";

// Créer un client Supabase avec service role pour bypasser RLS
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey);
}

// Obtenir la date J-2 (Google a un délai de 2 jours pour les données)
function getDataDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 2);
  return date.toISOString().split("T")[0];
}

// Extraire le slug d'une URL de page
function extractSlugFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/").filter(Boolean);

    // Pattern: /blog/[slug]
    if (pathParts.length >= 2 && pathParts[0] === "blog") {
      return pathParts[1];
    }

    return null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  // Vérifier le secret du cron
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Vérifier les credentials Google
  const credentialsCheck = await checkCredentials();
  if (!credentialsCheck.configured || !credentialsCheck.valid) {
    return NextResponse.json({
      error: "Google Search Console credentials not configured or invalid",
      details: credentialsCheck.error,
    }, { status: 500 });
  }

  const supabase = getServiceClient();
  const dataDate = getDataDate();

  try {
    // Récupérer tous les sites
    const { data: sites, error: sitesError } = await supabase
      .from("sites")
      .select("id, domain, name");

    if (sitesError) {
      return NextResponse.json({ error: sitesError.message }, { status: 500 });
    }

    if (!sites || sites.length === 0) {
      return NextResponse.json({
        message: "No sites to collect analytics for",
        collected: 0,
      });
    }

    let sitesProcessed = 0;
    let articlesProcessed = 0;
    const errors: Array<{ site: string; error: string }> = [];

    for (const site of sites) {
      try {
        // Récupérer les métriques du site
        const result = await getSiteMetrics(site.domain, dataDate, dataDate);

        if (!result.success || !result.data) {
          errors.push({ site: site.name, error: result.error || "Unknown error" });
          continue;
        }

        const { metrics, topPages, topQueries } = result.data;

        // Stocker les métriques globales du site (article_id = null)
        const { error: globalError } = await supabase
          .from("seo_tracking")
          .upsert({
            site_id: site.id,
            article_id: null,
            date: dataDate,
            clicks: metrics.clicks,
            impressions: metrics.impressions,
            ctr: metrics.ctr,
            position: metrics.position,
            top_query: topQueries[0]?.keys[0] || null,
          }, {
            onConflict: "site_id,article_id,date",
          });

        if (globalError) {
          console.error(`Error storing global metrics for ${site.name}:`, globalError);
        } else {
          sitesProcessed++;
        }

        // Récupérer les articles du site pour matcher avec les top pages
        const { data: articles } = await supabase
          .from("articles")
          .select("id, slug")
          .eq("site_id", site.id)
          .eq("status", "published");

        if (articles && articles.length > 0) {
          // Créer un map slug -> article_id
          const slugToArticle = new Map(articles.map((a) => [a.slug, a.id]));

          // Pour chaque top page, essayer de matcher avec un article
          for (const page of topPages) {
            const pageUrl = page.keys[0];
            if (!pageUrl) continue;

            const slug = extractSlugFromUrl(pageUrl);
            if (!slug) continue;

            const articleId = slugToArticle.get(slug);
            if (!articleId) continue;

            // Trouver la requête principale pour cette page
            // Note: L'API GSC ne donne pas directement les queries par page dans une seule requête
            // On utilise la première query globale comme approximation
            const topQuery = topQueries[0]?.keys[0] || null;

            // Stocker les métriques de l'article
            const { error: articleError } = await supabase
              .from("seo_tracking")
              .upsert({
                site_id: site.id,
                article_id: articleId,
                date: dataDate,
                clicks: page.clicks,
                impressions: page.impressions,
                ctr: page.ctr,
                position: page.position,
                top_query: topQuery,
              }, {
                onConflict: "site_id,article_id,date",
              });

            if (!articleError) {
              articlesProcessed++;
            }
          }
        }

        // Logger l'activité
        await supabase.from("activity_logs").insert({
          site_id: site.id,
          type: "analytics_collected",
          message: `Analytics collectés pour ${site.name}: ${metrics.clicks} clics, ${metrics.impressions} impressions`,
          metadata: {
            date: dataDate,
            clicks: metrics.clicks,
            impressions: metrics.impressions,
            ctr: metrics.ctr,
            position: metrics.position,
          } as unknown as Database["public"]["Tables"]["activity_logs"]["Insert"]["metadata"],
        });

      } catch (siteError) {
        console.error(`Error processing site ${site.name}:`, siteError);
        errors.push({
          site: site.name,
          error: siteError instanceof Error ? siteError.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      message: "Analytics collection completed",
      date: dataDate,
      sitesProcessed,
      articlesProcessed,
      totalSites: sites.length,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error("Analytics collection error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
