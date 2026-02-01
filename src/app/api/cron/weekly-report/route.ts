import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/supabase";

// Créer un client Supabase avec service role pour bypasser RLS
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey);
}

interface WeeklyReport {
  site: {
    id: string;
    name: string;
    domain: string;
  };
  period: {
    start: string;
    end: string;
  };
  metrics: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  };
  trends: {
    clicksChange: number;
    impressionsChange: number;
    ctrChange: number;
    positionChange: number;
  };
  topArticles: Array<{
    title: string;
    slug: string;
    clicks: number;
    impressions: number;
    position: number;
  }>;
  articlesPublished: number;
  totalArticles: number;
}

// Calculer le pourcentage de changement
function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export async function GET(request: NextRequest) {
  // Vérifier le secret du cron
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();

  // Calculer les périodes
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() - 2); // J-2 car Google a un délai

  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 6); // 7 jours

  const prevEndDate = new Date(startDate);
  prevEndDate.setDate(prevEndDate.getDate() - 1);

  const prevStartDate = new Date(prevEndDate);
  prevStartDate.setDate(prevStartDate.getDate() - 6);

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  try {
    // Récupérer les sites avec webhook activé
    const { data: sites, error: sitesError } = await supabase
      .from("sites")
      .select("id, name, domain, webhook_url, webhook_enabled")
      .eq("webhook_enabled", true)
      .not("webhook_url", "is", null);

    if (sitesError) {
      return NextResponse.json({ error: sitesError.message }, { status: 500 });
    }

    if (!sites || sites.length === 0) {
      return NextResponse.json({
        message: "No sites with webhook enabled",
        sent: 0,
      });
    }

    let reportsSent = 0;
    const errors: Array<{ site: string; error: string }> = [];

    for (const site of sites) {
      if (!site.webhook_url) continue;

      try {
        // Récupérer les métriques de la semaine courante (globales site)
        const { data: currentMetrics } = await supabase
          .from("seo_tracking")
          .select("clicks, impressions, ctr, position")
          .eq("site_id", site.id)
          .is("article_id", null)
          .gte("date", formatDate(startDate))
          .lte("date", formatDate(endDate));

        // Récupérer les métriques de la semaine précédente
        const { data: previousMetrics } = await supabase
          .from("seo_tracking")
          .select("clicks, impressions, ctr, position")
          .eq("site_id", site.id)
          .is("article_id", null)
          .gte("date", formatDate(prevStartDate))
          .lte("date", formatDate(prevEndDate));

        // Calculer les totaux
        const current = {
          clicks: currentMetrics?.reduce((sum, m) => sum + (m.clicks || 0), 0) || 0,
          impressions: currentMetrics?.reduce((sum, m) => sum + (m.impressions || 0), 0) || 0,
          ctr: currentMetrics && currentMetrics.length > 0
            ? currentMetrics.reduce((sum, m) => sum + (m.ctr || 0), 0) / currentMetrics.length
            : 0,
          position: currentMetrics && currentMetrics.length > 0
            ? currentMetrics.reduce((sum, m) => sum + (m.position || 0), 0) / currentMetrics.length
            : 0,
        };

        const previous = {
          clicks: previousMetrics?.reduce((sum, m) => sum + (m.clicks || 0), 0) || 0,
          impressions: previousMetrics?.reduce((sum, m) => sum + (m.impressions || 0), 0) || 0,
          ctr: previousMetrics && previousMetrics.length > 0
            ? previousMetrics.reduce((sum, m) => sum + (m.ctr || 0), 0) / previousMetrics.length
            : 0,
          position: previousMetrics && previousMetrics.length > 0
            ? previousMetrics.reduce((sum, m) => sum + (m.position || 0), 0) / previousMetrics.length
            : 0,
        };

        // Top articles de la semaine
        const { data: topArticlesData } = await supabase
          .from("seo_tracking")
          .select(`
            clicks,
            impressions,
            position,
            article:article_id(title, slug)
          `)
          .eq("site_id", site.id)
          .not("article_id", "is", null)
          .gte("date", formatDate(startDate))
          .lte("date", formatDate(endDate))
          .order("clicks", { ascending: false })
          .limit(5);

        const topArticles = (topArticlesData || [])
          .filter((a) => a.article)
          .map((a) => {
            const article = a.article as unknown as { title: string; slug: string };
            return {
              title: article.title,
              slug: article.slug,
              clicks: a.clicks || 0,
              impressions: a.impressions || 0,
              position: a.position || 0,
            };
          });

        // Compter les articles publiés cette semaine
        const { count: articlesPublished } = await supabase
          .from("articles")
          .select("*", { count: "exact", head: true })
          .eq("site_id", site.id)
          .eq("status", "published")
          .gte("published_at", formatDate(startDate))
          .lte("published_at", formatDate(endDate));

        // Compter le total des articles publiés
        const { count: totalArticles } = await supabase
          .from("articles")
          .select("*", { count: "exact", head: true })
          .eq("site_id", site.id)
          .eq("status", "published");

        // Construire le rapport
        const report: WeeklyReport = {
          site: {
            id: site.id,
            name: site.name,
            domain: site.domain,
          },
          period: {
            start: formatDate(startDate),
            end: formatDate(endDate),
          },
          metrics: {
            clicks: current.clicks,
            impressions: current.impressions,
            ctr: Math.round(current.ctr * 10000) / 100, // Convertir en pourcentage
            position: Math.round(current.position * 10) / 10,
          },
          trends: {
            clicksChange: calculateChange(current.clicks, previous.clicks),
            impressionsChange: calculateChange(current.impressions, previous.impressions),
            ctrChange: calculateChange(current.ctr, previous.ctr),
            positionChange: -calculateChange(current.position, previous.position), // Négatif = amélioration
          },
          topArticles,
          articlesPublished: articlesPublished || 0,
          totalArticles: totalArticles || 0,
        };

        // Envoyer le webhook
        const webhookResponse = await fetch(site.webhook_url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(report),
        });

        if (!webhookResponse.ok) {
          errors.push({
            site: site.name,
            error: `Webhook returned ${webhookResponse.status}`,
          });
          continue;
        }

        // Logger l'activité
        await supabase.from("activity_logs").insert({
          site_id: site.id,
          type: "weekly_report_sent",
          message: `Rapport hebdomadaire envoyé pour ${site.name}`,
          metadata: {
            period: report.period,
            metrics: report.metrics,
            trends: report.trends,
          } as unknown as Json,
        });

        reportsSent++;

      } catch (siteError) {
        console.error(`Error processing site ${site.name}:`, siteError);
        errors.push({
          site: site.name,
          error: siteError instanceof Error ? siteError.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      message: "Weekly reports completed",
      sent: reportsSent,
      totalSites: sites.length,
      period: {
        start: formatDate(startDate),
        end: formatDate(endDate),
      },
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error("Weekly report error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
