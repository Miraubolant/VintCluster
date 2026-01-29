-- Migration: Ajout colonne template aux sites
-- Exécuter dans Supabase SQL Editor

-- 1. Ajouter la colonne template avec valeur par défaut 'brutal'
ALTER TABLE sites ADD COLUMN IF NOT EXISTS template TEXT DEFAULT 'brutal';

-- 2. Mettre à jour les sites existants avec 'brutal' (le template actuel)
UPDATE sites SET template = 'brutal' WHERE template IS NULL;

-- 3. Ajouter une contrainte CHECK pour valider les valeurs
ALTER TABLE sites ADD CONSTRAINT sites_template_check
  CHECK (template IN ('brutal', 'minimal', 'magazine', 'tech', 'fresh'));

-- 4. Créer un index pour les requêtes par template
CREATE INDEX IF NOT EXISTS idx_sites_template ON sites(template);
