/**
 * Generate a URL-friendly slug from a title
 * @param title - The title to convert to a slug
 * @param maxLength - Maximum length of the slug (default: 100)
 * @returns A URL-friendly slug
 */
export function generateSlug(title: string, maxLength: number = 100): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
    .substring(0, maxLength); // Limit length
}
