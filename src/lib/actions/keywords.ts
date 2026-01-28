"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Keyword, KeywordStatus } from "@/types/database";

interface KeywordWithSite extends Keyword {
  site?: {
    id: string;
    name: string;
    domain: string;
  };
}

export async function getKeywords(filters?: {
  siteId?: string;
  status?: KeywordStatus;
  search?: string;
  globalOnly?: boolean;
  includeGlobal?: boolean;
}): Promise<{ data: KeywordWithSite[]; error?: string }> {
  const supabase = await createClient();

  let query = supabase
    .from("keywords")
    .select("*, site:sites(id, name, domain)")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters?.globalOnly) {
    // Uniquement les keywords sans site
    query = query.is("site_id", null);
  } else if (filters?.siteId) {
    if (filters?.includeGlobal) {
      // Keywords du site + keywords globaux
      query = query.or(`site_id.eq.${filters.siteId},site_id.is.null`);
    } else {
      query = query.eq("site_id", filters.siteId);
    }
  }

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.search) {
    query = query.ilike("keyword", `%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return { error: error.message, data: [] };
  }

  return { data: (data as KeywordWithSite[]) || [] };
}

// Récupérer les keywords disponibles pour génération (pending uniquement)
export async function getAvailableKeywords(): Promise<{ data: KeywordWithSite[]; error?: string }> {
  return getKeywords({ status: "pending" });
}

export async function getKeywordStats(siteId?: string): Promise<{
  total: number;
  pending: number;
  generating: number;
  generated: number;
  published: number;
  archived: number;
}> {
  const supabase = await createClient();

  let baseQuery = supabase.from("keywords").select("status");

  if (siteId) {
    baseQuery = baseQuery.eq("site_id", siteId);
  }

  const { data } = await baseQuery;

  const stats = {
    total: data?.length || 0,
    pending: 0,
    generating: 0,
    generated: 0,
    published: 0,
    archived: 0,
  };

  data?.forEach((k) => {
    const status = k.status as KeywordStatus;
    if (status in stats) {
      stats[status]++;
    }
  });

  return stats;
}

// Type pour les données CSV importées
export interface KeywordImportData {
  keyword: string;
  search_volume?: number;
  difficulty?: number;
  cluster?: string;
  site_key?: string;
  priority?: number;
  notes?: string;
}

export async function importKeywords(
  siteId: string | null,
  keywords: KeywordImportData[]
): Promise<{ imported: number; duplicates: number; error?: string }> {
  const supabase = await createClient();

  // Filtrer les mots-clés vides et les nettoyer
  const cleanedKeywords = keywords
    .map((k) => ({
      ...k,
      keyword: k.keyword.trim(),
    }))
    .filter((k) => k.keyword.length > 0);

  if (cleanedKeywords.length === 0) {
    return { imported: 0, duplicates: 0, error: "Aucun mot-clé valide" };
  }

  // Récupérer les mots-clés pour vérifier les doublons
  const keywordStrings = cleanedKeywords.map((k) => k.keyword);

  // Vérifier les doublons existants (globaux si pas de site, sinon par site)
  let query = supabase
    .from("keywords")
    .select("keyword")
    .in("keyword", keywordStrings);

  if (siteId) {
    query = query.eq("site_id", siteId);
  } else {
    // Pour les keywords globaux, vérifier ceux sans site_id
    query = query.is("site_id", null);
  }

  const { data: existing } = await query;

  const existingSet = new Set(existing?.map((e) => e.keyword.toLowerCase()) || []);

  // Filtrer les nouveaux mots-clés et les doublons dans l'import lui-même
  const seenKeywords = new Set<string>();
  const newKeywords: KeywordImportData[] = [];
  let duplicatesInImport = 0;

  for (const k of cleanedKeywords) {
    const lowerKeyword = k.keyword.toLowerCase();
    if (existingSet.has(lowerKeyword) || seenKeywords.has(lowerKeyword)) {
      duplicatesInImport++;
    } else {
      seenKeywords.add(lowerKeyword);
      newKeywords.push(k);
    }
  }

  if (newKeywords.length === 0) {
    return { imported: 0, duplicates: duplicatesInImport };
  }

  // Insérer les nouveaux mots-clés
  const { error } = await supabase.from("keywords").insert(
    newKeywords.map((k) => ({
      site_id: siteId,
      keyword: k.keyword,
      status: "pending" as const,
      priority: k.priority ?? 0,
      search_volume: k.search_volume ?? null,
      difficulty: k.difficulty ?? null,
      cluster: k.cluster ?? null,
      site_key: k.site_key ?? null,
      notes: k.notes ?? null,
    }))
  );

  if (error) {
    return { imported: 0, duplicates: 0, error: error.message };
  }

  revalidatePath("/admin/keywords");
  return { imported: newKeywords.length, duplicates: duplicatesInImport };
}

// Ancienne fonction pour compatibilité (mots-clés simples)
export async function importKeywordsSimple(
  siteId: string | null,
  keywords: string[]
): Promise<{ imported: number; duplicates: number; error?: string }> {
  return importKeywords(
    siteId,
    keywords.map((k) => ({ keyword: k }))
  );
}

export async function updateKeywordStatus(
  ids: string[],
  status: KeywordStatus
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("keywords")
    .update({ status })
    .in("id", ids);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/keywords");
  return { success: true };
}

export async function deleteKeywords(
  ids: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("keywords")
    .delete()
    .in("id", ids);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/keywords");
  return { success: true };
}

export async function updateKeywordPriority(
  id: string,
  priority: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("keywords")
    .update({ priority })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/keywords");
  return { success: true };
}
