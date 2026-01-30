-- Migration: Ajout des colonnes SEO improved aux articles
-- Exécuter dans Supabase SQL Editor

-- Ajouter les colonnes pour tracker l'amélioration SEO Expert
ALTER TABLE articles ADD COLUMN IF NOT EXISTS seo_improved BOOLEAN DEFAULT false;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS seo_improved_at TIMESTAMPTZ;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS seo_model TEXT; -- 'gemini' ou 'claude'

-- Index pour filtrer rapidement les articles améliorés
CREATE INDEX IF NOT EXISTS idx_articles_seo_improved ON articles(seo_improved) WHERE seo_improved = true;
