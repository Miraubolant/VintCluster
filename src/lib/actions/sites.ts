"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { Site } from "@/types/database";
import { getOpenAIClient } from "@/lib/openai/client";

// Schema de validation
const siteSchema = z.object({
  domain: z.string().min(3, "Le domaine doit faire au moins 3 caractères"),
  name: z.string().min(2, "Le nom doit faire au moins 2 caractères"),
  logo_url: z.string().url().optional().or(z.literal("")),
  favicon_url: z.string().url().optional().or(z.literal("")),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Couleur invalide"),
  secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Couleur invalide"),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
});

export type SiteFormData = z.infer<typeof siteSchema>;

export async function createSite(formData: SiteFormData): Promise<{ data?: Site; error?: string }> {
  const supabase = await createClient();

  // Validation
  const result = siteSchema.safeParse(formData);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    return { error: firstIssue?.message || "Données invalides" };
  }

  const { data, error } = await supabase
    .from("sites")
    .insert({
      domain: result.data.domain,
      name: result.data.name,
      logo_url: result.data.logo_url || null,
      favicon_url: result.data.favicon_url || null,
      primary_color: result.data.primary_color,
      secondary_color: result.data.secondary_color,
      meta_title: result.data.meta_title || null,
      meta_description: result.data.meta_description || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Ce domaine existe déjà" };
    }
    return { error: error.message };
  }

  revalidatePath("/admin/sites");
  return { data: data as Site };
}

export async function updateSite(id: string, formData: SiteFormData): Promise<{ data?: Site; error?: string }> {
  const supabase = await createClient();

  // Validation
  const result = siteSchema.safeParse(formData);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    return { error: firstIssue?.message || "Données invalides" };
  }

  const { data, error } = await supabase
    .from("sites")
    .update({
      domain: result.data.domain,
      name: result.data.name,
      logo_url: result.data.logo_url || null,
      favicon_url: result.data.favicon_url || null,
      primary_color: result.data.primary_color,
      secondary_color: result.data.secondary_color,
      meta_title: result.data.meta_title || null,
      meta_description: result.data.meta_description || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Ce domaine existe déjà" };
    }
    return { error: error.message };
  }

  revalidatePath("/admin/sites");
  revalidatePath(`/admin/sites/${id}`);

  // Revalidate public site cache (async, don't wait)
  if (result.data.domain) {
    fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL ? "" : "http://localhost:3000"}/api/revalidate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: process.env.REVALIDATION_SECRET,
        domain: result.data.domain,
      }),
    }).catch(() => {
      // Silent fail - cache will expire naturally
    });
  }

  return { data: data as Site };
}

export async function deleteSite(id: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("sites")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/sites");
  return { success: true };
}

export async function getSites(): Promise<{ data: Site[]; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sites")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message, data: [] };
  }

  return { data: (data as Site[]) || [] };
}

export async function getSiteById(id: string): Promise<{ data?: Site; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sites")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data: data as Site };
}

interface SiteWithStats extends Site {
  keywordsCount: number;
  articlesCount: number;
}

export async function getSitesWithStats(): Promise<{ data: SiteWithStats[]; error?: string }> {
  const supabase = await createClient();

  const { data: sites, error } = await supabase
    .from("sites")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !sites) {
    return { error: error?.message, data: [] };
  }

  // Récupérer les stats pour chaque site
  const sitesWithStats = await Promise.all(
    (sites as Site[]).map(async (site) => {
      const [keywordsResult, articlesResult] = await Promise.all([
        supabase.from("keywords").select("*", { count: "exact", head: true }).eq("site_id", site.id),
        supabase.from("articles").select("*", { count: "exact", head: true }).eq("site_id", site.id),
      ]);

      return {
        ...site,
        keywordsCount: keywordsResult.count || 0,
        articlesCount: articlesResult.count || 0,
      };
    })
  );

  return { data: sitesWithStats };
}

// Generate SEO metadata using AI
export async function generateSiteSEO(
  siteName: string,
  siteId?: string
): Promise<{ meta_title: string; meta_description: string } | { error: string }> {
  try {
    const openai = getOpenAIClient();

    // If siteId provided, get associated keywords for better context
    let keywords: string[] = [];
    if (siteId) {
      const supabase = await createClient();
      const { data } = await supabase
        .from("keywords")
        .select("keyword")
        .eq("site_id", siteId)
        .limit(10);

      if (data) {
        keywords = data.map((k) => k.keyword);
      }
    }

    const keywordsContext = keywords.length > 0
      ? `\n\nMots-clés associés au site: ${keywords.join(", ")}`
      : "";

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Tu es un expert SEO. Génère un titre SEO et une méta-description pour un site web.

Règles:
- Titre SEO: 50-60 caractères max, accrocheur, avec le nom du site
- Description: 150-160 caractères max, incitative, avec appel à l'action
- Ton professionnel mais engageant
- Intègre les mots-clés naturellement si fournis

Réponds UNIQUEMENT en JSON valide avec ce format:
{"meta_title": "...", "meta_description": "..."}`
        },
        {
          role: "user",
          content: `Nom du site: ${siteName}${keywordsContext}`
        }
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { error: "Pas de réponse de l'IA" };
    }

    // Parse JSON response with specific error handling
    let result;
    try {
      result = JSON.parse(content);
    } catch {
      return { error: "Réponse IA invalide (format JSON incorrect)" };
    }

    if (!result.meta_title && !result.meta_description) {
      return { error: "Réponse IA incomplète" };
    }

    return {
      meta_title: result.meta_title || "",
      meta_description: result.meta_description || "",
    };
  } catch {
    return { error: "Erreur lors de la génération SEO" };
  }
}
