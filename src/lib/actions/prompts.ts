"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ============================================================================
// TYPES
// ============================================================================

export interface PromptConfig {
  id: string;
  key: string;
  name: string;
  description: string | null;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Helper pour exécuter les requêtes sur prompt_config
// (table non encore dans les types Supabase générés)
async function queryPromptConfig() {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from("prompt_config");
}

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Récupère toutes les configurations de prompts
 */
export async function getPromptConfigs(): Promise<{
  data: PromptConfig[];
  error?: string;
}> {
  try {
    const query = await queryPromptConfig();
    const { data, error } = await query
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: (data as PromptConfig[]) || [] };
  } catch {
    // Table n'existe probablement pas encore
    return { data: [], error: "Table prompt_config non trouvée. Exécutez la migration." };
  }
}

/**
 * Récupère un prompt par sa clé
 */
export async function getPromptByKey(key: string): Promise<{
  data?: PromptConfig;
  error?: string;
}> {
  try {
    const query = await queryPromptConfig();
    const { data, error } = await query
      .select("*")
      .eq("key", key)
      .eq("is_active", true)
      .single();

    if (error && error.code !== "PGRST116") {
      return { error: error.message };
    }

    return { data: data as PromptConfig | undefined };
  } catch {
    return { error: "Table prompt_config non trouvée" };
  }
}

/**
 * Récupère le contenu d'un prompt actif, ou retourne le défaut
 */
export async function getActivePromptContent(
  key: string,
  defaultContent: string
): Promise<string> {
  const { data } = await getPromptByKey(key);
  return data?.content || defaultContent;
}

/**
 * Met à jour un prompt
 */
export async function updatePromptConfig(
  id: string,
  data: {
    content?: string;
    is_active?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const query = await queryPromptConfig();
    const { error } = await query
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/settings");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la mise à jour" };
  }
}

/**
 * Réinitialise un prompt (désactive pour utiliser le défaut)
 */
export async function resetPromptToDefault(
  key: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const query = await queryPromptConfig();
    const { error } = await query
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("key", key);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/settings");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la réinitialisation" };
  }
}

/**
 * Crée un nouveau prompt
 */
export async function createPromptConfig(data: {
  key: string;
  name: string;
  description?: string;
  content: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const query = await queryPromptConfig();
    const { error } = await query.insert({
      key: data.key,
      name: data.name,
      description: data.description || null,
      content: data.content,
      is_active: true,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/settings");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la création" };
  }
}
