-- Migration: Keywords globaux et colonnes enrichies
-- Date: 2024
-- Description: Permet les keywords globaux (sans site) et ajoute les métadonnées SEO

-- 1. Rendre site_id nullable pour permettre les keywords globaux
ALTER TABLE keywords ALTER COLUMN site_id DROP NOT NULL;

-- 2. Ajouter les nouvelles colonnes de métadonnées SEO
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS search_volume INTEGER;
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS difficulty INTEGER;
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS cluster TEXT;
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS site_key TEXT;
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 3. Supprimer l'ancienne contrainte unique (site_id, keyword)
-- car elle ne fonctionne pas avec site_id NULL
ALTER TABLE keywords DROP CONSTRAINT IF EXISTS keywords_site_id_keyword_key;

-- 4. Créer des index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_keywords_site_id ON keywords(site_id);
CREATE INDEX IF NOT EXISTS idx_keywords_status ON keywords(status);
CREATE INDEX IF NOT EXISTS idx_keywords_priority ON keywords(priority DESC);
CREATE INDEX IF NOT EXISTS idx_keywords_cluster ON keywords(cluster);

-- 5. Trigger pour updated_at automatique
CREATE OR REPLACE FUNCTION update_keywords_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS keywords_updated_at ON keywords;
CREATE TRIGGER keywords_updated_at
  BEFORE UPDATE ON keywords
  FOR EACH ROW
  EXECUTE FUNCTION update_keywords_updated_at();

-- Note: Les RLS policies existantes devraient continuer à fonctionner
-- car elles vérifient généralement l'authentification, pas le site_id
