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

// Prompts génériques pour images de blog mode/seconde main
const FASHION_PROMPTS = [
  "Aesthetic flat lay of vintage clothing items on white marble surface, pastel colors, designer pieces, silk scarves, leather accessories, soft natural lighting, editorial fashion photography",
  "Minimalist clothing rack with curated second-hand fashion pieces, neutral tones, wooden hangers, soft morning light, scandinavian interior style, professional product photography",
  "Organized wardrobe with neatly folded sweaters and hanging dresses, warm ambient lighting, cozy atmosphere, lifestyle photography, shallow depth of field",
  "Close-up of luxury fabric textures, silk, cashmere, denim details, artistic macro photography, soft shadows, neutral background, high-end fashion editorial",
  "Stylish second-hand boutique interior, exposed brick walls, golden hour sunlight through windows, vintage clothing displays, warm inviting atmosphere",
  "Fashion accessories arrangement, vintage handbags, sunglasses, jewelry on velvet surface, elegant composition, studio lighting, luxury editorial style",
  "Colorful vintage dresses hanging on antique wooden wardrobe, soft pastel palette, dreamy ethereal lighting, romantic aesthetic",
  "Modern capsule wardrobe concept, neutral toned clothing pieces, minimalist aesthetic, clean white background, lifestyle photography",
  "Stack of folded denim jeans and cotton shirts, rustic wooden surface, natural lighting, casual lifestyle photography, warm earth tones",
  "Elegant coat collection on brass clothing rack, winter fashion, wool textures, sophisticated boutique atmosphere, editorial lighting",
  "Vintage jewelry box with curated accessories, pearls, gold chains, watches, soft velvet interior, intimate close-up photography",
  "Fashion mood board aesthetic, fabric swatches, vintage photographs, dried flowers, creative flat lay composition, artistic styling",
  "Sustainable fashion concept, eco-friendly clothing tags, organic cotton textures, green plants, natural materials, conscious lifestyle",
  "Designer shoes collection, leather loafers, vintage heels, wooden shelf display, warm interior lighting, luxury retail aesthetic",
  "Cozy knitwear collection, chunky sweaters, wool scarves, autumn color palette, soft textures, hygge lifestyle photography",
];

// Sélectionne un prompt aléatoire pour varier les images
function getRandomFashionPrompt(): string {
  const index = Math.floor(Math.random() * FASHION_PROMPTS.length);
  return FASHION_PROMPTS[index];
}

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
    console.error("REPLICATE_API_TOKEN not defined - image generation disabled");
    return null;
  }

  try {
    console.log("Starting image generation:", { model, siteId: siteId || "none" });
    const replicate = getReplicateClient();
    const modelId = MODELS[model];

    // Utiliser un prompt générique mode/seconde main au lieu du titre de l'article
    // Le paramètre 'prompt' est ignoré, on utilise des prompts pré-définis de qualité
    const fashionPrompt = getRandomFashionPrompt();
    const enhancedPrompt = `${fashionPrompt}, professional blog header image, 16:9 aspect ratio, high quality, sharp focus, no text, no words, no letters, no watermarks`;

    let output: unknown;

    if (model === "sdxl") {
      output = await replicate.run(modelId as `${string}/${string}:${string}`, {
        input: {
          prompt: enhancedPrompt,
          negative_prompt: "blurry, low quality, distorted, watermark, text, words, letters, logo, writing, typography, ugly, deformed, cartoon, anime, illustration",
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

    // Avec useFileOutput: false, on reçoit directement des URLs string
    const tempImageUrl = Array.isArray(output) ? output[0] : output;

    if (!tempImageUrl || typeof tempImageUrl !== "string") {
      console.error("No image URL returned from Replicate. Output:", JSON.stringify(output));
      return null;
    }

    console.log("Image generated successfully, URL:", tempImageUrl.substring(0, 60) + "...");

    // Si un siteId est fourni, persister l'image dans Supabase Storage
    let finalImageUrl = tempImageUrl;
    if (siteId) {
      try {
        const storedUrl = await uploadImageFromUrl(tempImageUrl, siteId);
        if (storedUrl) {
          finalImageUrl = storedUrl;
        } else {
          console.warn("Failed to persist image to storage, using temporary URL");
        }
      } catch (storageError) {
        // Storage errors should not break image generation
        console.error("Storage error (using temporary URL):", storageError);
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
 * Génère le texte alt pour l'image basé sur le titre de l'article
 * Note: L'image générée utilise des prompts génériques mode/seconde main,
 * mais le texte alt reste lié au contenu de l'article pour le SEO
 */
export function generateImagePrompt(articleTitle: string, keyword?: string): string {
  // Retourner le titre nettoyé pour le texte alt (SEO)
  const cleanTitle = articleTitle
    .replace(/[?!:]/g, "")
    .trim();

  return keyword ? `${keyword} - ${cleanTitle}` : cleanTitle;
}
