-- Migration: Ajouter les options d'amélioration IA au scheduler
-- Permet de configurer le modèle et le mode d'amélioration pour la génération en masse

-- Ajouter les colonnes pour l'amélioration IA
ALTER TABLE scheduler_config
ADD COLUMN IF NOT EXISTS improvement_model TEXT DEFAULT 'gpt-4o',
ADD COLUMN IF NOT EXISTS improvement_mode TEXT DEFAULT 'full-pbn',
ADD COLUMN IF NOT EXISTS enable_improvement BOOLEAN DEFAULT false;

-- Commentaires
COMMENT ON COLUMN scheduler_config.improvement_model IS 'Modèle OpenAI pour l''amélioration (gpt-4o, gpt-4o-mini, gpt-4-turbo)';
COMMENT ON COLUMN scheduler_config.improvement_mode IS 'Mode d''amélioration SEO (seo-classic, ai-search, full-pbn)';
COMMENT ON COLUMN scheduler_config.enable_improvement IS 'Activer l''amélioration IA automatique après génération';
