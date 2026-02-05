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
  webhook_url: z.string().url().optional().or(z.literal("")),
  webhook_enabled: z.boolean().optional(),
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
      webhook_url: result.data.webhook_url || null,
      webhook_enabled: result.data.webhook_enabled || false,
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
      webhook_url: result.data.webhook_url || null,
      webhook_enabled: result.data.webhook_enabled || false,
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

// ============================================
// GÉNÉRATEUR DE FAVICONS ALÉATOIRES
// ============================================

// Palettes de couleurs variées
const COLOR_PALETTES = [
  // Gradients modernes
  ["#667eea", "#764ba2"], // Purple dream
  ["#f093fb", "#f5576c"], // Pink sunset
  ["#4facfe", "#00f2fe"], // Ocean blue
  ["#43e97b", "#38f9d7"], // Fresh green
  ["#fa709a", "#fee140"], // Warm glow
  ["#a18cd1", "#fbc2eb"], // Soft lavender
  ["#ff9a9e", "#fecfef"], // Blush
  ["#667eea", "#f093fb"], // Purple pink
  ["#30cfd0", "#330867"], // Deep sea
  ["#f83600", "#f9d423"], // Fire
  ["#00c6fb", "#005bea"], // Sky blue
  ["#ff0844", "#ffb199"], // Coral fire
  ["#b721ff", "#21d4fd"], // Neon
  ["#6a11cb", "#2575fc"], // Royal blue
  ["#ec008c", "#fc6767"], // Hot pink
  // Couleurs solides vibrantes
  ["#FF6B6B", "#FF6B6B"], // Coral
  ["#4ECDC4", "#4ECDC4"], // Teal
  ["#45B7D1", "#45B7D1"], // Sky
  ["#96CEB4", "#96CEB4"], // Sage
  ["#FFEAA7", "#FFEAA7"], // Sunshine
  ["#DDA0DD", "#DDA0DD"], // Plum
  ["#98D8C8", "#98D8C8"], // Mint
  ["#F7DC6F", "#F7DC6F"], // Gold
  ["#BB8FCE", "#BB8FCE"], // Purple
  ["#85C1E9", "#85C1E9"], // Light blue
];

// Types de formes
type ShapeType = "circle" | "square" | "rounded" | "hexagon" | "diamond" | "triangle" | "blob";
const SHAPES: ShapeType[] = ["circle", "square", "rounded", "hexagon", "diamond", "triangle", "blob"];

// Types de motifs
type PatternType = "solid" | "gradient-linear" | "gradient-radial" | "gradient-diagonal" | "split" | "corners";
const PATTERNS: PatternType[] = ["solid", "gradient-linear", "gradient-radial", "gradient-diagonal", "split", "corners"];

// Types de décorations
type DecorationType = "none" | "border" | "inner-shape" | "dots" | "lines" | "ring";
const DECORATIONS: DecorationType[] = ["none", "border", "inner-shape", "dots", "lines", "ring"];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateShapePath(shape: ShapeType, size: number): string {
  const center = size / 2;
  const radius = size * 0.4;

  switch (shape) {
    case "circle":
      return `<circle cx="${center}" cy="${center}" r="${radius}" />`;

    case "square":
      const squareSize = size * 0.7;
      const squareOffset = (size - squareSize) / 2;
      return `<rect x="${squareOffset}" y="${squareOffset}" width="${squareSize}" height="${squareSize}" />`;

    case "rounded":
      const roundedSize = size * 0.7;
      const roundedOffset = (size - roundedSize) / 2;
      return `<rect x="${roundedOffset}" y="${roundedOffset}" width="${roundedSize}" height="${roundedSize}" rx="${roundedSize * 0.2}" />`;

    case "hexagon":
      const hexRadius = radius;
      const hexPoints = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        hexPoints.push(`${center + hexRadius * Math.cos(angle)},${center + hexRadius * Math.sin(angle)}`);
      }
      return `<polygon points="${hexPoints.join(" ")}" />`;

    case "diamond":
      return `<polygon points="${center},${center - radius} ${center + radius},${center} ${center},${center + radius} ${center - radius},${center}" />`;

    case "triangle":
      const triHeight = radius * 1.7;
      const triBase = radius * 1.5;
      return `<polygon points="${center},${center - triHeight * 0.5} ${center + triBase},${center + triHeight * 0.5} ${center - triBase},${center + triHeight * 0.5}" />`;

    case "blob":
      // Forme organique type blob
      return `<path d="M${center} ${center - radius * 0.9}
        C${center + radius * 1.1} ${center - radius * 0.6},
        ${center + radius * 0.9} ${center + radius * 0.4},
        ${center + radius * 0.3} ${center + radius * 0.9}
        C${center - radius * 0.2} ${center + radius * 1.1},
        ${center - radius * 0.9} ${center + radius * 0.5},
        ${center - radius * 0.8} ${center - radius * 0.3}
        C${center - radius * 0.7} ${center - radius * 0.9},
        ${center - radius * 0.2} ${center - radius * 1.1},
        ${center} ${center - radius * 0.9}Z" />`;

    default:
      return `<circle cx="${center}" cy="${center}" r="${radius}" />`;
  }
}

function generatePattern(pattern: PatternType, colors: string[], size: number): string {
  const [color1, color2] = colors;
  const gradientId = `grad-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  switch (pattern) {
    case "solid":
      return { defs: "", fill: color1 } as unknown as string;

    case "gradient-linear":
      return {
        defs: `<linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color1}"/>
          <stop offset="100%" style="stop-color:${color2}"/>
        </linearGradient>`,
        fill: `url(#${gradientId})`
      } as unknown as string;

    case "gradient-radial":
      return {
        defs: `<radialGradient id="${gradientId}" cx="30%" cy="30%">
          <stop offset="0%" style="stop-color:${color1}"/>
          <stop offset="100%" style="stop-color:${color2}"/>
        </radialGradient>`,
        fill: `url(#${gradientId})`
      } as unknown as string;

    case "gradient-diagonal":
      return {
        defs: `<linearGradient id="${gradientId}" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:${color1}"/>
          <stop offset="50%" style="stop-color:${color2}"/>
          <stop offset="100%" style="stop-color:${color1}"/>
        </linearGradient>`,
        fill: `url(#${gradientId})`
      } as unknown as string;

    case "split":
      return {
        defs: `<linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="50%" style="stop-color:${color1}"/>
          <stop offset="50%" style="stop-color:${color2}"/>
        </linearGradient>`,
        fill: `url(#${gradientId})`
      } as unknown as string;

    case "corners":
      return {
        defs: `<linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color1}"/>
          <stop offset="25%" style="stop-color:${color2}"/>
          <stop offset="75%" style="stop-color:${color1}"/>
          <stop offset="100%" style="stop-color:${color2}"/>
        </linearGradient>`,
        fill: `url(#${gradientId})`
      } as unknown as string;

    default:
      return { defs: "", fill: color1 } as unknown as string;
  }
}

function generateDecoration(decoration: DecorationType, colors: string[], size: number): string {
  const center = size / 2;
  const [, color2] = colors;
  const contrastColor = color2 || "#ffffff";

  switch (decoration) {
    case "border":
      return `<circle cx="${center}" cy="${center}" r="${size * 0.35}" fill="none" stroke="${contrastColor}" stroke-width="${size * 0.03}" opacity="0.5"/>`;

    case "inner-shape":
      return `<circle cx="${center}" cy="${center}" r="${size * 0.15}" fill="${contrastColor}" opacity="0.3"/>`;

    case "dots":
      const dots = [];
      for (let i = 0; i < 3; i++) {
        const angle = (Math.PI * 2 / 3) * i - Math.PI / 2;
        const x = center + size * 0.25 * Math.cos(angle);
        const y = center + size * 0.25 * Math.sin(angle);
        dots.push(`<circle cx="${x}" cy="${y}" r="${size * 0.04}" fill="${contrastColor}" opacity="0.5"/>`);
      }
      return dots.join("");

    case "lines":
      return `
        <line x1="${center - size * 0.15}" y1="${center}" x2="${center + size * 0.15}" y2="${center}" stroke="${contrastColor}" stroke-width="${size * 0.02}" opacity="0.4"/>
        <line x1="${center}" y1="${center - size * 0.15}" x2="${center}" y2="${center + size * 0.15}" stroke="${contrastColor}" stroke-width="${size * 0.02}" opacity="0.4"/>
      `;

    case "ring":
      return `<circle cx="${center}" cy="${center}" r="${size * 0.28}" fill="none" stroke="${contrastColor}" stroke-width="${size * 0.015}" stroke-dasharray="${size * 0.05} ${size * 0.03}" opacity="0.4"/>`;

    default:
      return "";
  }
}

/**
 * Génère un favicon totalement aléatoire et unique
 */
export async function generateRandomFavicon(
  siteId: string
): Promise<{ url: string } | { error: string }> {
  try {
    const size = 512;

    // Choix aléatoires
    const palette = randomChoice(COLOR_PALETTES);
    const shape = randomChoice(SHAPES);
    const pattern = randomChoice(PATTERNS);
    const decoration = randomChoice(DECORATIONS);

    // Parfois inverser les couleurs
    const colors = Math.random() > 0.5 ? palette : [palette[1], palette[0]];

    // Générer le pattern (retourne un objet avec defs et fill)
    const patternResult = generatePattern(pattern, colors, size) as unknown as { defs: string; fill: string };
    const { defs, fill } = patternResult;

    // Générer le SVG
    const shapePath = generateShapePath(shape, size);
    const decoElements = generateDecoration(decoration, colors, size);

    // Couleur de fond subtile ou transparente
    const bgColor = Math.random() > 0.7 ? colors[1] + "15" : "transparent";

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <defs>${defs}</defs>
        <rect width="${size}" height="${size}" fill="${bgColor}"/>
        <g fill="${fill}">
          ${shapePath}
        </g>
        ${decoElements}
      </svg>
    `;

    // Convertir en PNG
    const pngBuffer = await sharp(Buffer.from(svg))
      .resize(64, 64)
      .png()
      .toBuffer();

    // Upload
    const filename = `favicon-random-${Date.now()}.png`;
    const url = await uploadBuffer(pngBuffer, siteId, filename, "image/png");

    if (!url) {
      return { error: "Échec de l'upload du favicon" };
    }

    return { url };
  } catch (error) {
    console.error("Erreur génération favicon aléatoire:", error);
    return { error: "Erreur lors de la génération du favicon" };
  }
}

/**
 * Génère des favicons aléatoires pour plusieurs sites en masse
 */
export async function bulkGenerateRandomFavicons(
  siteIds: string[]
): Promise<{ success: boolean; results: Array<{ siteId: string; url?: string; error?: string }> }> {
  if (siteIds.length === 0) {
    return { success: false, results: [] };
  }

  if (siteIds.length > 50) {
    return {
      success: false,
      results: [{ siteId: "", error: "Maximum 50 sites à la fois" }]
    };
  }

  const supabase = await createClient();
  const results: Array<{ siteId: string; url?: string; error?: string }> = [];

  for (const siteId of siteIds) {
    const faviconResult = await generateRandomFavicon(siteId);

    if ("error" in faviconResult) {
      results.push({ siteId, error: faviconResult.error });
      continue;
    }

    // Mettre à jour le site avec le nouveau favicon
    const { error: updateError } = await supabase
      .from("sites")
      .update({
        favicon_url: faviconResult.url,
        updated_at: new Date().toISOString()
      })
      .eq("id", siteId);

    if (updateError) {
      results.push({ siteId, error: updateError.message });
    } else {
      results.push({ siteId, url: faviconResult.url });
    }
  }

  revalidatePath("/admin/sites");

  const successCount = results.filter(r => r.url).length;
  return {
    success: successCount > 0,
    results
  };
}
