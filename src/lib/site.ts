import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Site } from "@/types/database";

/**
 * Récupère le site actuel basé sur le domaine dans les headers
 * À utiliser dans les Server Components
 */
export async function getCurrentSite(): Promise<Site | null> {
  const headersList = await headers();
  const host = headersList.get("x-current-host") || headersList.get("host") || "";

  // Nettoyer le host (enlever le port si présent)
  const domain = host.split(":")[0];

  // Ne pas chercher de site pour localhost/admin
  if (domain === "localhost" || domain === "127.0.0.1") {
    return null;
  }

  const supabase = await createClient();

  const { data: site } = await supabase
    .from("sites")
    .select("*")
    .eq("domain", domain)
    .single();

  return site;
}

/**
 * Récupère un site par son ID
 */
export async function getSiteById(id: string): Promise<Site | null> {
  const supabase = await createClient();

  const { data: site } = await supabase
    .from("sites")
    .select("*")
    .eq("id", id)
    .single();

  return site;
}

/**
 * Récupère un site par son domaine
 */
export async function getSiteByDomain(domain: string): Promise<Site | null> {
  const supabase = await createClient();

  const { data: site } = await supabase
    .from("sites")
    .select("*")
    .eq("domain", domain)
    .single();

  return site;
}

/**
 * Récupère tous les sites
 */
export async function getAllSites(): Promise<Site[]> {
  const supabase = await createClient();

  const { data: sites } = await supabase
    .from("sites")
    .select("*")
    .order("created_at", { ascending: false });

  return sites || [];
}
