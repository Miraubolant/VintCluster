import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateArticle } from "@/lib/openai";
import { searchUnsplashImage } from "@/lib/unsplash";
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
  const currentDay = now.getDay(); // 0 = Dimanche

  try {
    // Récupérer les configurations actives pour l'heure et le jour actuels
    const { data: configs, error: configError } = await supabase
      .from("scheduler_config")
      .select("*, site:sites(id, name)")
      .eq("enabled", true);

    if (configError) {
      console.error("Error fetching configs:", configError);
      return NextResponse.json({ error: configError.message }, { status: 500 });
    }

    const activeConfigs = (configs || []).filter((config) => {
      const days = (config.days_of_week as number[]) || [];
      const hours = (config.publish_hours as number[]) || [];
      return days.includes(currentDay) && hours.includes(currentHour);
    });

    if (activeConfigs.length === 0) {
      return NextResponse.json({
        message: "No active configs for current time",
        generated: 0,
      });
    }

    let totalGenerated = 0;

    for (const config of activeConfigs) {
      // Vérifier les limites quotidiennes
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { count: todayCount } = await supabase
        .from("articles")
        .select("*", { count: "exact", head: true })
        .eq("site_id", config.site_id)
        .gte("created_at", todayStart.toISOString());

      if ((todayCount || 0) >= (config.max_per_day || 5)) {
        continue;
      }

      // Récupérer un mot-clé pending pour ce site
      const { data: keyword, error: keywordError } = await supabase
        .from("keywords")
        .select("*")
        .eq("site_id", config.site_id)
        .eq("status", "pending")
        .order("priority", { ascending: false })
        .limit(1)
        .single();

      if (keywordError || !keyword) {
        continue;
      }

      // Mettre à jour le statut du mot-clé
      await supabase
        .from("keywords")
        .update({ status: "generating" })
        .eq("id", keyword.id);

      try {
        // Générer l'article
        const generated = await generateArticle(keyword.keyword);
        const image = await searchUnsplashImage(keyword.keyword);

        // Créer l'article
        const { data: article, error: articleError } = await supabase
          .from("articles")
          .insert({
            site_id: config.site_id,
            keyword_id: keyword.id,
            title: generated.title,
            slug: generated.slug,
            content: generated.content,
            summary: generated.summary,
            faq: generated.faq as unknown as Json,
            image_url: image?.url || null,
            image_alt: image?.alt || null,
            status: config.auto_publish ? "published" : "draft",
            published_at: config.auto_publish ? new Date().toISOString() : null,
          })
          .select()
          .single();

        if (articleError) {
          console.error("Error creating article:", articleError);
          await supabase
            .from("keywords")
            .update({ status: "pending" })
            .eq("id", keyword.id);
          continue;
        }

        // Mettre à jour le statut du mot-clé
        await supabase
          .from("keywords")
          .update({ status: config.auto_publish ? "published" : "generated" })
          .eq("id", keyword.id);

        // Logger l'activité
        await supabase.from("activity_logs").insert({
          site_id: config.site_id,
          type: "article_generated",
          message: `Article auto-généré: ${generated.title}`,
          metadata: {
            article_id: article.id,
            keyword: keyword.keyword,
            auto_published: config.auto_publish,
          } as unknown as Json,
        });

        totalGenerated++;
      } catch (genError) {
        console.error("Generation error:", genError);
        await supabase
          .from("keywords")
          .update({ status: "pending" })
          .eq("id", keyword.id);
      }
    }

    return NextResponse.json({
      message: "Cron job completed",
      generated: totalGenerated,
      activeConfigs: activeConfigs.length,
    });
  } catch (error) {
    console.error("Cron error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
