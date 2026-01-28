import { z } from "zod";

// Site validation
export const siteSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  domain: z
    .string()
    .min(3, "Le domaine doit contenir au moins 3 caractères")
    .max(255, "Le domaine ne peut pas dépasser 255 caractères")
    .regex(
      /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i,
      "Format de domaine invalide (ex: monsite.com)"
    ),
  primary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Couleur hexadécimale invalide (ex: #FFE500)"),
  secondary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Couleur hexadécimale invalide"),
  meta_description: z
    .string()
    .max(160, "La méta-description ne peut pas dépasser 160 caractères")
    .optional()
    .nullable(),
});

export type SiteInput = z.infer<typeof siteSchema>;

// Keyword validation
export const keywordSchema = z.object({
  keyword: z
    .string()
    .min(2, "Le mot-clé doit contenir au moins 2 caractères")
    .max(255, "Le mot-clé ne peut pas dépasser 255 caractères"),
  site_id: z.string().uuid("ID de site invalide"),
});

export const keywordsImportSchema = z.object({
  keywords: z
    .array(z.string().min(2).max(255))
    .min(1, "Au moins un mot-clé requis")
    .max(1000, "Maximum 1000 mots-clés par import"),
  site_id: z.string().uuid("ID de site invalide"),
});

export type KeywordInput = z.infer<typeof keywordSchema>;

// Article validation
export const articleSchema = z.object({
  title: z
    .string()
    .min(5, "Le titre doit contenir au moins 5 caractères")
    .max(255, "Le titre ne peut pas dépasser 255 caractères"),
  content: z
    .string()
    .min(100, "Le contenu doit contenir au moins 100 caractères"),
  summary: z
    .string()
    .max(500, "Le résumé ne peut pas dépasser 500 caractères")
    .optional()
    .nullable(),
  faq: z
    .array(
      z.object({
        question: z.string().min(5, "Question trop courte"),
        answer: z.string().min(10, "Réponse trop courte"),
      })
    )
    .optional(),
});

export type ArticleInput = z.infer<typeof articleSchema>;

// Scheduler validation
export const schedulerSchema = z.object({
  site_id: z.string().uuid("ID de site invalide"),
  generation_enabled: z.boolean(),
  publish_enabled: z.boolean(),
  generation_hour: z.number().min(0).max(23),
  publish_hour: z.number().min(0).max(23),
  generation_days: z.array(z.number().min(0).max(6)),
  publish_days: z.array(z.number().min(0).max(6)),
  daily_limit: z.number().min(1).max(50),
});

export type SchedulerInput = z.infer<typeof schedulerSchema>;

// Helper function to validate and return errors
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.issues.map((issue) => {
    const path = issue.path.join(".");
    return path ? `${path}: ${issue.message}` : issue.message;
  });

  return { success: false, errors };
}
