"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import sharp from "sharp";
import type { Site } from "@/types/database";
import { getOpenAIClient } from "@/lib/openai/client";
import { uploadBuffer } from "@/lib/supabase/storage";

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
  template: z.enum(["brutal", "minimal", "magazine", "tech", "fresh"]).optional(),
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
      template: result.data.template || "brutal",
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
      template: result.data.template || "brutal",
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _siteId?: string
): Promise<{ meta_title: string; meta_description: string } | { error: string }> {
  try {
    const openai = getOpenAIClient();

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Tu es un expert SEO spécialisé dans les blogs sur Vinted et la seconde main.

## CONTEXTE
Chaque site est un blog français qui parle de :
- La vente sur Vinted
- La mode seconde main
- Les astuces pour mieux vendre
- Les outils IA qui aident les vendeurs (photos, vidéos, descriptions optimisées)

## RÈGLES STRICTES
- Titre SEO: 50-60 caractères max, accrocheur, DOIT contenir le nom du site
- Description: 150-160 caractères max, conviviale et engageante
- Ton amical, comme un blog perso qui partage ses bons plans
- Mentionne subtilement qu'on propose des outils/astuces IA pour vendre mieux
- CHAQUE génération doit être UNIQUE et DIFFÉRENTE des précédentes
- Utilise des formulations variées à chaque fois
- Évite les clichés SEO ("découvrez", "bienvenue sur")

## EXEMPLES DE VARIATIONS
Titres: "[Nom] - Tes astuces Vinted", "[Nom] | Blog mode seconde main", "[Nom] : Vends mieux sur Vinted"
Descriptions: phrases courtes, tutoiement, emojis possibles (1-2 max), call-to-action naturel

Réponds UNIQUEMENT en JSON valide:
{"meta_title": "...", "meta_description": "..."}`
        },
        {
          role: "user",
          content: `Génère un titre SEO et une description UNIQUES pour ce blog: ${siteName}`
        }
      ],
      temperature: 0.9,
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

/**
 * Génère un favicon avec les initiales du site
 */
export async function generateFavicon(
  siteName: string,
  primaryColor: string,
  secondaryColor: string,
  siteId?: string
): Promise<{ url: string } | { error: string }> {
  try {
    // Extraire les initiales (max 2 caractères)
    const words = siteName.trim().split(/\s+/);
    let initials: string;
    if (words.length >= 2) {
      initials = (words[0][0] + words[1][0]).toUpperCase();
    } else {
      initials = siteName.substring(0, 2).toUpperCase();
    }

    // Créer le SVG avec style géométrique brutaliste
    const size = 512;
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <!-- Background -->
        <rect width="${size}" height="${size}" fill="${primaryColor}"/>

        <!-- Border -->
        <rect x="16" y="16" width="${size - 32}" height="${size - 32}"
              fill="none" stroke="${secondaryColor}" stroke-width="24"/>

        <!-- Text -->
        <text x="50%" y="54%"
              font-family="Arial Black, Arial, sans-serif"
              font-size="240"
              font-weight="900"
              fill="${secondaryColor}"
              text-anchor="middle"
              dominant-baseline="middle">
          ${initials}
        </text>
      </svg>
    `;

    // Convertir SVG en PNG avec sharp
    const pngBuffer = await sharp(Buffer.from(svg))
      .resize(64, 64) // Taille favicon standard
      .png()
      .toBuffer();

    // Déterminer l'ID du site pour le stockage
    let uploadSiteId = siteId;
    if (!uploadSiteId) {
      // Générer un ID temporaire pour les nouveaux sites
      uploadSiteId = `temp-${Date.now()}`;
    }

    // Upload vers Supabase Storage
    const filename = `favicon-${Date.now()}.png`;
    const url = await uploadBuffer(pngBuffer, uploadSiteId, filename, "image/png");

    if (!url) {
      return { error: "Échec de l'upload du favicon" };
    }

    return { url };
  } catch (error) {
    console.error("Erreur génération favicon:", error);
    return { error: "Erreur lors de la génération du favicon" };
  }
}

/**
 * Génère et met à jour le SEO d'un site en une seule action
 */
export async function generateAndUpdateSiteSEO(
  siteId: string,
  siteName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Générer le SEO
    const seoResult = await generateSiteSEO(siteName);

    if ("error" in seoResult) {
      return { success: false, error: seoResult.error };
    }

    // Mettre à jour le site
    const supabase = await createClient();
    const { error: updateError } = await supabase
      .from("sites")
      .update({
        meta_title: seoResult.meta_title,
        meta_description: seoResult.meta_description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", siteId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath("/admin/sites");
    revalidatePath(`/admin/sites/${siteId}`);

    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la génération SEO" };
  }
}

/**
 * Met à jour le template de plusieurs sites en une seule action
 */
export async function bulkUpdateSiteTemplate(
  siteIds: string[],
  template: "brutal" | "minimal" | "magazine" | "tech" | "fresh"
): Promise<{ success: boolean; error?: string; updatedCount: number }> {
  if (siteIds.length === 0) {
    return { success: false, error: "Aucun site sélectionné", updatedCount: 0 };
  }

  if (siteIds.length > 100) {
    return { success: false, error: "Maximum 100 sites à la fois", updatedCount: 0 };
  }

  try {
    const supabase = await createClient();
    const { error, count } = await supabase
      .from("sites")
      .update({ template, updated_at: new Date().toISOString() })
      .in("id", siteIds);

    if (error) {
      return { success: false, error: error.message, updatedCount: 0 };
    }

    revalidatePath("/admin/sites");

    return { success: true, updatedCount: count || siteIds.length };
  } catch (e) {
    console.error("Erreur bulk update template:", e);
    return { success: false, error: "Erreur lors de la mise à jour", updatedCount: 0 };
  }
}
