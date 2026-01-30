import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateArticle } from "@/lib/openai";
import { generateImage, generateImagePrompt } from "@/lib/replicate";
import type { Database, Json } from "@/types/supabase";

// Fuseau horaire pour le cron (France)
const TIMEZONE = "Europe/Paris";

// Créer un client Supabase avec service role pour bypasser RLS
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey);
}

// Obtenir l'heure et le jour dans le fuseau horaire configuré
function getLocalTime() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    hour: "numeric",
    hour12: false,
    weekday: "short",
  });

  const parts = formatter.formatToParts(now);
  const hourPart = parts.find((p) => p.type === "hour");
  const weekdayPart = parts.find((p) => p.type === "weekday");

  const hour = hourPart ? parseInt(hourPart.value) : now.getHours();

  // Convertir le jour de la semaine en nombre (0 = Dimanche)
  const dayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  const day = weekdayPart ? dayMap[weekdayPart.value] ?? now.getDay() : now.getDay();

  return { hour, day, timezone: TIMEZONE, utcTime: now.toISOString() };
}

export async function GET(request: NextRequest) {
  // Vérifier le secret du cron
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();

  // Paramètre force pour bypasser la vérification du temps
  const forceRun = request.nextUrl.searchParams.get("force") === "true";

  // Utiliser l'heure locale (Europe/Paris)
  const localTime = getLocalTime();
  const currentHour = localTime.hour;
  const currentDay = localTime.day;

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

    // Filtrer les configs actives pour l'heure et le jour actuels
    // Si force=true, on prend toutes les configs activées
    const activeConfigs = (configs || []).filter((config) => {
      if (forceRun) return true; // Bypass le filtre temporel

      const days = (config.days_of_week as number[]) || [];
      const hours = (config.publish_hours as number[]) || [];
      return days.includes(currentDay) && hours.includes(currentHour);
    });

    if (activeConfigs.length === 0) {
      return NextResponse.json({
        message: "No active configs for current time",
        generated: 0,
        debug: {
          serverTime: localTime,
          currentDay,
          currentHour,
          enabledConfigs: (configs || []).map((c) => ({
            site: (c.site as { name: string } | null)?.name,
            days: c.days_of_week,
            hours: c.publish_hours,
          })),
        },
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

      // Récupérer les keyword_ids configurés pour ce scheduler
      const keywordIds = (config.keyword_ids as string[]) || [];

      // Si aucun keyword n'est sélectionné, passer au suivant
      if (keywordIds.length === 0) {
        continue;
      }

      // Récupérer un mot-clé pending parmi ceux sélectionnés
      const { data: keyword, error: keywordError } = await supabase
        .from("keywords")
        .select("*")
        .in("id", keywordIds)
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
        // Générer l'article avec OpenAI (passer le cluster pour les CTA)
        const cluster = keyword.cluster || keyword.site_key || undefined;
        const generated = await generateArticle(keyword.keyword, cluster);

        // Générer une image avec Replicate (FLUX Schnell pour la rapidité)
        let imageUrl: string | null = null;
        let imageAlt: string | null = null;
        let imageGenerated = false;

        try {
          const imagePrompt = generateImagePrompt(generated.title, keyword.keyword);
          const image = await generateImage(imagePrompt, "flux-schnell", config.site_id);
          if (image) {
            imageUrl = image.url;
            imageAlt = image.alt;
            imageGenerated = true;
          }
        } catch (imageError) {
          // Si la génération d'image échoue, on continue sans image
          console.error("Image generation failed:", imageError);
        }

        // Créer l'article (avec ou sans image)
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
            image_url: imageUrl,
            image_alt: imageAlt,
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

        // Logger l'activité avec infos image
        await supabase.from("activity_logs").insert({
          site_id: config.site_id,
          type: "article_generated",
          message: `Article auto-généré: ${generated.title}`,
          metadata: {
            article_id: article.id,
            keyword: keyword.keyword,
            cluster: cluster || null,
            auto_published: config.auto_publish,
            image_generated: imageGenerated,
            image_model: imageGenerated ? "flux-schnell" : null,
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
      forced: forceRun,
      serverTime: localTime,
    });
  } catch (error) {
    console.error("Cron error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
