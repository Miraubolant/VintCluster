import { getReplicateClient } from "./client";
import { uploadImageFromUrl } from "@/lib/supabase/storage";

export type ImageModel = "flux-schnell" | "flux-dev" | "sdxl";

interface ImageGenerationResult {
  url: string;
  alt: string;
}

// Modèles disponibles avec leurs identifiants Replicate
const MODELS: Record<ImageModel, string> = {
  "flux-schnell": "black-forest-labs/flux-schnell",
  "flux-dev": "black-forest-labs/flux-dev",
  "sdxl": "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
};

// Descriptions des modèles pour l'UI
export const MODEL_INFO: Record<ImageModel, { name: string; description: string; speed: string }> = {
  "flux-schnell": {
    name: "FLUX Schnell",
    description: "Rapide et efficace, idéal pour les articles de blog",
    speed: "~3s",
  },
  "flux-dev": {
    name: "FLUX Dev",
    description: "Haute qualité, détails plus fins",
    speed: "~15s",
  },
  "sdxl": {
    name: "Stable Diffusion XL",
    description: "Modèle classique, grande flexibilité",
    speed: "~10s",
  },
};

/**
 * Génère une image via Replicate basée sur un prompt
 * @param prompt - Le prompt pour générer l'image
 * @param model - Le modèle à utiliser (flux-schnell par défaut)
 * @param siteId - Si fourni, l'image est persistée dans Supabase Storage
 */
export async function generateImage(
  prompt: string,
  model: ImageModel = "flux-schnell",
  siteId?: string
): Promise<ImageGenerationResult | null> {
  const apiToken = process.env.REPLICATE_API_TOKEN;

  if (!apiToken) {
    console.warn("REPLICATE_API_TOKEN not defined, skipping image generation");
    return null;
  }

  try {
    const replicate = getReplicateClient();
    const modelId = MODELS[model];

    // Améliorer le prompt pour de meilleures images de blog
    const enhancedPrompt = `Professional blog header image: ${prompt}. High quality, modern, clean design, suitable for web article header, 16:9 aspect ratio, vibrant colors, professional photography style`;

    let output: unknown;

    if (model === "sdxl") {
      output = await replicate.run(modelId as `${string}/${string}:${string}`, {
        input: {
          prompt: enhancedPrompt,
          negative_prompt: "blurry, low quality, distorted, watermark, text, logo, ugly, deformed",
          width: 1024,
          height: 576,
          num_outputs: 1,
          scheduler: "K_EULER",
          num_inference_steps: 30,
          guidance_scale: 7.5,
        },
      });
    } else {
      // FLUX models
      output = await replicate.run(modelId as `${string}/${string}`, {
        input: {
          prompt: enhancedPrompt,
          aspect_ratio: "16:9",
          output_format: "webp",
          output_quality: 90,
        },
      });
    }

    // Le résultat peut être un tableau ou une URL directe
    const tempImageUrl = Array.isArray(output) ? output[0] : output;

    if (!tempImageUrl || typeof tempImageUrl !== "string") {
      console.error("No image URL returned from Replicate");
      return null;
    }

    // Si un siteId est fourni, persister l'image dans Supabase Storage
    let finalImageUrl = tempImageUrl;
    if (siteId) {
      const storedUrl = await uploadImageFromUrl(tempImageUrl, siteId);
      if (storedUrl) {
        finalImageUrl = storedUrl;
      } else {
        console.warn("Failed to persist image to storage, using temporary URL");
      }
    }

    return {
      url: finalImageUrl,
      alt: prompt,
    };
  } catch (error) {
    console.error("Error generating image with Replicate:", error);
    return null;
  }
}

/**
 * Génère un prompt d'image optimisé basé sur le titre de l'article
 */
export function generateImagePrompt(articleTitle: string, keyword?: string): string {
  // Nettoyer le titre pour en faire un bon prompt
  const cleanTitle = articleTitle
    .replace(/[?!:]/g, "")
    .replace(/\d+/g, "")
    .trim();

  const basePrompt = keyword
    ? `${keyword}, ${cleanTitle}`
    : cleanTitle;

  return basePrompt;
}
