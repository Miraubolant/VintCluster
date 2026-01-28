"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SchedulerConfig } from "@/types/database";

interface SchedulerConfigWithSite extends SchedulerConfig {
  site?: {
    id: string;
    name: string;
    domain: string;
  };
}

export async function getSchedulerConfigs(): Promise<{
  data: SchedulerConfigWithSite[];
  error?: string;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("scheduler_config")
    .select("*, site:sites(id, name, domain)")
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message, data: [] };
  }

  return { data: (data as SchedulerConfigWithSite[]) || [] };
}

export async function getSchedulerConfigBySiteId(
  siteId: string
): Promise<{ data?: SchedulerConfig; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("scheduler_config")
    .select("*")
    .eq("site_id", siteId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows returned
    return { error: error.message };
  }

  return { data: data as SchedulerConfig | undefined };
}

export async function upsertSchedulerConfig(
  siteId: string,
  config: {
    enabled: boolean;
    auto_publish: boolean;
    max_per_day: number;
    max_per_week: number;
    days_of_week: number[];
    publish_hours: number[];
    keyword_ids: string[];
  }
): Promise<{ data?: SchedulerConfig; error?: string }> {
  const supabase = await createClient();

  // Vérifier si une config existe déjà
  const { data: existing } = await supabase
    .from("scheduler_config")
    .select("id")
    .eq("site_id", siteId)
    .single();

  let result;

  if (existing) {
    // Update
    result = await supabase
      .from("scheduler_config")
      .update({
        enabled: config.enabled,
        auto_publish: config.auto_publish,
        max_per_day: config.max_per_day,
        max_per_week: config.max_per_week,
        days_of_week: config.days_of_week,
        publish_hours: config.publish_hours,
        keyword_ids: config.keyword_ids,
        updated_at: new Date().toISOString(),
      })
      .eq("site_id", siteId)
      .select()
      .single();
  } else {
    // Insert
    result = await supabase
      .from("scheduler_config")
      .insert({
        site_id: siteId,
        enabled: config.enabled,
        auto_publish: config.auto_publish,
        max_per_day: config.max_per_day,
        max_per_week: config.max_per_week,
        days_of_week: config.days_of_week,
        publish_hours: config.publish_hours,
        keyword_ids: config.keyword_ids,
      })
      .select()
      .single();
  }

  if (result.error) {
    return { error: result.error.message };
  }

  revalidatePath("/admin/scheduler");
  return { data: result.data as SchedulerConfig };
}

export async function toggleSchedulerEnabled(
  siteId: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("scheduler_config")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("site_id", siteId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/scheduler");
  return { success: true };
}

// Récupérer les mots-clés disponibles (pending) pour la sélection
export async function getAvailableKeywordsForScheduler(siteId?: string): Promise<{
  data: Array<{ id: string; keyword: string; status: string | null; site_id: string | null; cluster: string | null; priority: number | null }>;
  error?: string;
}> {
  const supabase = await createClient();

  // Récupérer tous les keywords pending (du site spécifique + globaux)
  let query = supabase
    .from("keywords")
    .select("id, keyword, status, site_id, cluster, priority")
    .eq("status", "pending")
    .order("priority", { ascending: false })
    .order("keyword", { ascending: true });

  // Si un siteId est fourni, on filtre les keywords du site + les globaux
  if (siteId) {
    query = query.or(`site_id.eq.${siteId},site_id.is.null`);
  }

  const { data, error } = await query;

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data || [] };
}

// Statistiques pour le dashboard scheduler
export async function getSchedulerStats(): Promise<{
  totalConfigs: number;
  enabledConfigs: number;
  pendingKeywords: number;
  articlesToday: number;
}> {
  const supabase = await createClient();

  const [configsResult, keywordsResult, articlesResult] = await Promise.all([
    supabase.from("scheduler_config").select("enabled"),
    supabase.from("keywords").select("id").eq("status", "pending"),
    supabase
      .from("articles")
      .select("id")
      .gte("created_at", new Date().toISOString().split("T")[0]),
  ]);

  const configs = configsResult.data || [];
  const enabledCount = configs.filter((c) => c.enabled).length;

  return {
    totalConfigs: configs.length,
    enabledConfigs: enabledCount,
    pendingKeywords: keywordsResult.data?.length || 0,
    articlesToday: articlesResult.data?.length || 0,
  };
}
