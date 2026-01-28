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

export async function GET(request: NextRequest) {
  // Vérifier le secret du cron
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDay();

  try {
    // Récupérer les configurations avec auto_publish actif
    const { data: configs, error: configError } = await supabase
      .from("scheduler_config")
      .select("site_id")
      .eq("enabled", true)
      .eq("auto_publish", true);

    if (configError) {
      return NextResponse.json({ error: configError.message }, { status: 500 });
    }

    if (!configs || configs.length === 0) {
      return NextResponse.json({
        message: "No auto-publish configs",
        published: 0,
      });
    }

    const siteIds = configs.map((c) => c.site_id);

    // Récupérer les articles "ready" pour ces sites
    const { data: articles, error: articlesError } = await supabase
      .from("articles")
      .select("id, site_id, title, keyword_id")
      .in("site_id", siteIds)
      .eq("status", "ready");

    if (articlesError) {
      return NextResponse.json({ error: articlesError.message }, { status: 500 });
    }

    if (!articles || articles.length === 0) {
      return NextResponse.json({
        message: "No articles ready to publish",
        published: 0,
      });
    }

    let published = 0;

    for (const article of articles) {
      // Publier l'article
      const { error: updateError } = await supabase
        .from("articles")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
        })
        .eq("id", article.id);

      if (updateError) {
        console.error(`Error publishing article ${article.id}:`, updateError);
        continue;
      }

      // Mettre à jour le mot-clé associé
      if (article.keyword_id) {
        await supabase
          .from("keywords")
          .update({ status: "published" })
          .eq("id", article.keyword_id);
      }

      // Logger l'activité
      await supabase.from("activity_logs").insert({
        site_id: article.site_id,
        type: "article_published",
        message: `Article auto-publié: ${article.title}`,
        metadata: { article_id: article.id } as unknown as Json,
      });

      published++;
    }

    return NextResponse.json({
      message: "Publish cron completed",
      published,
      total: articles.length,
    });
  } catch (error) {
    console.error("Publish cron error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
