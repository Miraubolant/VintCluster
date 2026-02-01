import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { analyzeArticleSEO } from "@/lib/seo";
import { computeAndStoreRelatedArticles } from "@/lib/actions/related-articles";
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

// Vérifier l'authentification (CRON_SECRET ou session utilisateur)
async function isAuthenticated(request: NextRequest): Promise<boolean> {
  // 1. Vérifier CRON_SECRET
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // 2. Vérifier session utilisateur
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return !!user;
}

export async function POST(request: NextRequest) {
  // Vérifier l'authentification
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();

  // Options depuis le body
  const body = await request.json().catch(() => ({}));
  const {
    recalculateSeoScore = true,
    recalculateRelated = true,
    siteId = null, // Optionnel: limiter à un site
    limit = 100, // Limite par batch
  } = body;

  try {
    let query = supabase
      .from("articles")
      .select(`
        id,
        title,
        content,
        summary,
        image_url,
        faq,
        keyword:keyword_id(keyword)
      `)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (siteId) {
      query = query.eq("site_id", siteId);
    }

    const { data: articles, error: articlesError } = await query;

    if (articlesError) {
      return NextResponse.json({ error: articlesError.message }, { status: 500 });
    }

    if (!articles || articles.length === 0) {
      return NextResponse.json({
        message: "No articles to process",
        processed: 0,
      });
    }

    let seoUpdated = 0;
    let relatedUpdated = 0;
    const errors: Array<{ articleId: string; error: string }> = [];

    for (const article of articles) {
      try {
        // 1. Recalculer le score SEO
        if (recalculateSeoScore) {
          const keyword = article.keyword as { keyword: string } | null;
          const faq = article.faq as { question: string; answer: string }[] | null;

          const seoAnalysis = analyzeArticleSEO(
            article.content,
            article.title,
            article.summary,
            keyword?.keyword || null,
            article.image_url,
            faq
          );

          const { error: updateError } = await supabase
            .from("articles")
            .update({
              seo_score: seoAnalysis.score,
              word_count: seoAnalysis.wordCount,
              heading_count: seoAnalysis.headingCount,
              internal_links: seoAnalysis.internalLinks,
              external_links: seoAnalysis.externalLinks,
              reading_time: seoAnalysis.readingTime,
            })
            .eq("id", article.id);

          if (!updateError) {
            seoUpdated++;
          }
        }

        // 2. Calculer les articles connexes
        if (recalculateRelated) {
          await computeAndStoreRelatedArticles(article.id);
          relatedUpdated++;
        }

      } catch (articleError) {
        errors.push({
          articleId: article.id,
          error: articleError instanceof Error ? articleError.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      message: "Recalculation completed",
      totalArticles: articles.length,
      seoUpdated,
      relatedUpdated,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error("Recalculation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET pour voir les stats actuelles
export async function GET(request: NextRequest) {
  // Vérifier l'authentification
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();

  try {
    // Compter les articles sans score SEO
    const { count: withoutSeoScore } = await supabase
      .from("articles")
      .select("*", { count: "exact", head: true })
      .eq("status", "published")
      .or("seo_score.is.null,seo_score.eq.0");

    // Compter les articles sans relations
    const { data: articlesWithRelations } = await supabase
      .from("related_articles")
      .select("article_id")
      .limit(1000);

    const articleIdsWithRelations = new Set(articlesWithRelations?.map(r => r.article_id) || []);

    const { data: allPublished } = await supabase
      .from("articles")
      .select("id")
      .eq("status", "published");

    const withoutRelations = allPublished?.filter(a => !articleIdsWithRelations.has(a.id)).length || 0;

    // Total articles publiés
    const { count: totalPublished } = await supabase
      .from("articles")
      .select("*", { count: "exact", head: true })
      .eq("status", "published");

    return NextResponse.json({
      totalPublished: totalPublished || 0,
      withoutSeoScore: withoutSeoScore || 0,
      withoutRelations,
      needsUpdate: (withoutSeoScore || 0) > 0 || withoutRelations > 0,
    });

  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
