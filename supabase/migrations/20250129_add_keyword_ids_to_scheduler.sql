-- Migration: Ajouter keyword_ids à scheduler_config pour sélectionner les mots-clés à utiliser
-- Permet de choisir quels keywords seront utilisés pour la génération automatique

ALTER TABLE scheduler_config ADD COLUMN IF NOT EXISTS keyword_ids UUID[] DEFAULT '{}';

-- Index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_scheduler_config_keyword_ids ON scheduler_config USING GIN (keyword_ids);

-- Commentaire explicatif
COMMENT ON COLUMN scheduler_config.keyword_ids IS 'Liste des IDs de mots-clés à utiliser pour la génération automatique. Si vide, aucun article ne sera généré.';
