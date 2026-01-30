-- Migration: Add SEO Expert options to scheduler_config
-- Exécuter dans Supabase SQL Editor

-- Ajouter les colonnes SEO Expert
ALTER TABLE scheduler_config ADD COLUMN IF NOT EXISTS enable_seo_expert BOOLEAN DEFAULT false;
ALTER TABLE scheduler_config ADD COLUMN IF NOT EXISTS seo_expert_model TEXT DEFAULT 'gemini';
ALTER TABLE scheduler_config ADD COLUMN IF NOT EXISTS seo_expert_include_table BOOLEAN DEFAULT false;

-- Valeurs possibles pour seo_expert_model: 'gemini' | 'claude'
