"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActivityLog } from "@/types/database";

interface ActivityLogWithSite extends ActivityLog {
  site?: {
    id: string;
    name: string;
    domain: string;
  };
}

export type LogType =
  | "article_generated"
  | "article_published"
  | "article_unpublished"
  | "keyword_imported"
  | "site_created"
  | "site_updated"
  | "scheduler_updated"
  | "error";

export async function getActivityLogs(filters?: {
  siteId?: string;
  type?: LogType;
  limit?: number;
  offset?: number;
}): Promise<{ data: ActivityLogWithSite[]; total: number; error?: string }> {
  const supabase = await createClient();

  let query = supabase
    .from("activity_logs")
    .select("*, site:sites(id, name, domain)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters?.siteId) {
    query = query.eq("site_id", filters.siteId);
  }

  if (filters?.type) {
    query = query.eq("type", filters.type);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    return { error: error.message, data: [], total: 0 };
  }

  return {
    data: (data as ActivityLogWithSite[]) || [],
    total: count || 0,
  };
}

export async function getLogStats(siteId?: string): Promise<{
  total: number;
  today: number;
  thisWeek: number;
  byType: Record<string, number>;
}> {
  const supabase = await createClient();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  let baseQuery = supabase.from("activity_logs").select("type, created_at");

  if (siteId) {
    baseQuery = baseQuery.eq("site_id", siteId);
  }

  const { data } = await baseQuery;

  const stats = {
    total: data?.length || 0,
    today: 0,
    thisWeek: 0,
    byType: {} as Record<string, number>,
  };

  data?.forEach((log) => {
    const createdAt = new Date(log.created_at || "");

    if (createdAt >= todayStart) {
      stats.today++;
    }

    if (createdAt >= weekStart) {
      stats.thisWeek++;
    }

    const type = log.type || "unknown";
    stats.byType[type] = (stats.byType[type] || 0) + 1;
  });

  return stats;
}

export async function deleteOldLogs(
  daysToKeep: number = 30
): Promise<{ deleted: number; error?: string }> {
  const supabase = await createClient();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  // D'abord compter les logs à supprimer
  const { count } = await supabase
    .from("activity_logs")
    .select("*", { count: "exact", head: true })
    .lt("created_at", cutoffDate.toISOString());

  // Ensuite supprimer
  const { error } = await supabase
    .from("activity_logs")
    .delete()
    .lt("created_at", cutoffDate.toISOString());

  if (error) {
    return { deleted: 0, error: error.message };
  }

  return { deleted: count || 0 };
}
