import { createClient } from "@supabase/supabase-js";

const BUCKET_NAME = "images";

// Client admin standalone pour le storage (évite l'import de server.ts qui utilise next/headers)
function getStorageClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables for storage");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

/**
 * Télécharge une image depuis une URL externe et la stocke dans Supabase Storage
 * Retourne l'URL publique permanente
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  siteId: string,
  filename?: string
): Promise<string | null> {
  try {
    // Télécharger l'image depuis l'URL temporaire
    const response = await fetch(imageUrl);

    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status}`);
      return null;
    }

    const contentType = response.headers.get("content-type") || "image/webp";
    const blob = await response.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());

    // Déterminer l'extension
    let extension = "webp";
    if (contentType.includes("jpeg") || contentType.includes("jpg")) {
      extension = "jpg";
    } else if (contentType.includes("png")) {
      extension = "png";
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const finalFilename = filename
      ? `${filename}-${randomSuffix}.${extension}`
      : `${timestamp}-${randomSuffix}.${extension}`;

    // Chemin dans le bucket: images/{siteId}/{filename}
    const filePath = `${siteId}/${finalFilename}`;

    // Upload vers Supabase Storage avec le client admin
    const supabase = getStorageClient();

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType,
        cacheControl: "31536000", // 1 an
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    // Obtenir l'URL publique
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Error uploading image to storage:", error);
    return null;
  }
}

/**
 * Upload un buffer directement vers Supabase Storage
 * Utilisé pour les images générées (favicons, etc.)
 */
export async function uploadBuffer(
  buffer: Buffer,
  siteId: string,
  filename: string,
  contentType: string = "image/png"
): Promise<string | null> {
  try {
    const filePath = `${siteId}/${filename}`;
    const supabase = getStorageClient();

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType,
        cacheControl: "31536000",
        upsert: true, // Remplacer si existe
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Error uploading buffer to storage:", error);
    return null;
  }
}

/**
 * Supprime une image du storage
 */
export async function deleteImageFromStorage(imageUrl: string): Promise<boolean> {
  try {
    // Extraire le chemin du fichier depuis l'URL
    const supabase = getStorageClient();
    const bucketUrl = supabase.storage.from(BUCKET_NAME).getPublicUrl("").data.publicUrl;

    if (!imageUrl.startsWith(bucketUrl)) {
      // Ce n'est pas une image de notre storage
      return false;
    }

    const filePath = imageUrl.replace(bucketUrl, "").replace(/^\//, "");

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error("Delete error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting image from storage:", error);
    return false;
  }
}
