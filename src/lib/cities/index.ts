/**
 * Utilitaires pour le SEO programmatique local
 * Charge les villes depuis un fichier JSON statique (pas de DB)
 */

import { readFileSync } from "fs";
import { join } from "path";

export interface City {
  code_insee: string;
  nom_standard: string;
  nom_a: string; // "à Paris", "au Mans"
  nom_de: string; // "de Paris", "du Mans"
  nom_sans_accent: string; // Slug URL-friendly
  dep_nom: string;
  reg_nom: string;
  population: number;
  gentile: string | null; // "Parisiens", "Lyonnais"
  code_postal: string;
  latitude_centre: number;
  longitude_centre: number;
}

// Cache pour les données chargées
let citiesCache: City[] | null = null;
let citiesBySlug: Map<string, City> | null = null;
let citiesByInsee: Map<string, City> | null = null;

/**
 * Charge les villes depuis le fichier JSON
 * Utilise un cache en mémoire pour éviter de relire le fichier
 */
function loadCities(): City[] {
  if (citiesCache) return citiesCache;

  const filePath = join(process.cwd(), "data", "cities.json");
  const fileContent = readFileSync(filePath, "utf-8");
  citiesCache = JSON.parse(fileContent) as City[];

  return citiesCache;
}

/**
 * Initialise les caches de lookup
 */
function initCaches() {
  if (citiesBySlug && citiesByInsee) return;

  const cities = loadCities();
  citiesBySlug = new Map();
  citiesByInsee = new Map();

  for (const city of cities) {
    citiesBySlug.set(city.nom_sans_accent, city);
    citiesByInsee.set(city.code_insee, city);
  }
}

/**
 * Retourne toutes les villes
 */
export function getAllCities(): City[] {
  return loadCities();
}

/**
 * Retourne le nombre total de villes
 */
export function getCitiesCount(): number {
  return loadCities().length;
}

/**
 * Récupère une ville par son slug (nom_sans_accent)
 */
export function getCityBySlug(slug: string): City | undefined {
  initCaches();
  return citiesBySlug!.get(slug);
}

/**
 * Récupère une ville par son code INSEE
 */
export function getCityByInsee(code: string): City | undefined {
  initCaches();
  return citiesByInsee!.get(code);
}

/**
 * Retourne les N villes les plus peuplées
 * Utilisé pour generateStaticParams (pré-rendu ISR)
 */
export function getTopCitiesByPopulation(limit: number = 500): City[] {
  const cities = loadCities();
  return [...cities]
    .sort((a, b) => b.population - a.population)
    .slice(0, limit);
}

/**
 * Retourne les villes d'un département
 */
export function getCitiesByDepartment(depNom: string): City[] {
  return loadCities().filter((c) => c.dep_nom === depNom);
}

/**
 * Retourne les villes d'une région
 */
export function getCitiesByRegion(regNom: string): City[] {
  return loadCities().filter((c) => c.reg_nom === regNom);
}

/**
 * Recherche de villes par nom (partiel)
 */
export function searchCities(query: string, limit: number = 10): City[] {
  const normalized = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return loadCities()
    .filter((c) => c.nom_sans_accent.includes(normalized))
    .slice(0, limit);
}

/**
 * Retourne tous les slugs de villes (pour sitemap)
 */
export function getAllCitySlugs(): string[] {
  return loadCities().map((c) => c.nom_sans_accent);
}

/**
 * Retourne les départements uniques
 */
export function getAllDepartments(): string[] {
  const deps = new Set(loadCities().map((c) => c.dep_nom));
  return Array.from(deps).sort();
}

/**
 * Convertit un nom de département en slug URL-friendly
 */
export function departmentToSlug(depNom: string): string {
  return depNom
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Trouve un département par son slug
 */
export function getDepartmentBySlug(slug: string): string | undefined {
  const departments = getAllDepartments();
  return departments.find((dep) => departmentToSlug(dep) === slug);
}

/**
 * Retourne les régions uniques
 */
export function getAllRegions(): string[] {
  const regs = new Set(loadCities().map((c) => c.reg_nom));
  return Array.from(regs).sort();
}

/**
 * Formate la population avec séparateur de milliers
 */
export function formatPopulation(pop: number): string {
  return new Intl.NumberFormat("fr-FR").format(pop);
}

/**
 * Génère un titre SEO pour une page ville
 */
export function generateCityTitle(city: City, siteName: string): string {
  return `Vendre sur Vinted ${city.nom_a} | ${siteName}`;
}

/**
 * Génère une meta description pour une page ville
 */
export function generateCityDescription(city: City): string {
  const gentileText = city.gentile
    ? `Les ${city.gentile}`
    : `Les habitants ${city.nom_de}`;
  return `${gentileText} vendent sur Vinted ! Découvre nos conseils pour optimiser tes ventes ${city.nom_a} (${city.code_postal}). Photos IA, descriptions optimisées et plus.`;
}

/**
 * Génère le contenu localisé pour une ville
 */
export function generateCityContent(city: City): {
  intro: string;
  localTip: string;
  deliveryInfo: string;
} {
  const gentileText = city.gentile
    ? `les ${city.gentile}`
    : `les vendeurs ${city.nom_de}`;

  return {
    intro: `Tu habites ${city.nom_a} et tu veux booster tes ventes sur Vinted ? Tu es au bon endroit ! Que tu sois dans le centre-ville ou en périphérie ${city.nom_de}, nos conseils s'adaptent à ta situation.`,
    localTip: `Astuce locale : ${gentileText} qui mentionnent leur ville dans leurs annonces obtiennent souvent de meilleurs résultats grâce à la recherche locale de Vinted.`,
    deliveryInfo: `Point relais ${city.nom_a} : Avec plus de ${Math.floor(city.population / 1000) || 1} points relais disponibles dans le ${city.code_postal}, tes acheteurs auront toujours une option de livraison proche.`,
  };
}
