// Re-export des types générés par Supabase
export type { Database, Json, Tables, TablesInsert, TablesUpdate } from "./supabase";
import type { Database } from "./supabase";

// Types utilitaires simplifiés
export type Site = Database["public"]["Tables"]["sites"]["Row"];
export type SiteInsert = Database["public"]["Tables"]["sites"]["Insert"];
export type SiteUpdate = Database["public"]["Tables"]["sites"]["Update"];

export type Keyword = Database["public"]["Tables"]["keywords"]["Row"];
export type KeywordInsert = Database["public"]["Tables"]["keywords"]["Insert"];
export type KeywordUpdate = Database["public"]["Tables"]["keywords"]["Update"];
export type KeywordStatus = "pending" | "generating" | "generated" | "published" | "archived";

export type Article = Database["public"]["Tables"]["articles"]["Row"];
export type ArticleInsert = Database["public"]["Tables"]["articles"]["Insert"];
export type ArticleUpdate = Database["public"]["Tables"]["articles"]["Update"];
export type ArticleStatus = "draft" | "ready" | "published" | "unpublished";

export type SchedulerConfig = Database["public"]["Tables"]["scheduler_config"]["Row"];
export type SchedulerConfigInsert = Database["public"]["Tables"]["scheduler_config"]["Insert"];
export type SchedulerConfigUpdate = Database["public"]["Tables"]["scheduler_config"]["Update"];

export type ActivityLog = Database["public"]["Tables"]["activity_logs"]["Row"];
export type ActivityLogInsert = Database["public"]["Tables"]["activity_logs"]["Insert"];

// Type pour FAQ
export interface FAQItem {
  question: string;
  answer: string;
}

// Types pour l'amélioration IA (scheduler)
export type SchedulerImprovementModel = "gpt-4o" | "gpt-4o-mini" | "gpt-4-turbo";
export type SchedulerImprovementMode = "seo-classic" | "ai-search" | "full-pbn";
