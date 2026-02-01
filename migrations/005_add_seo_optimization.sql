-- Migration 005: Ajout tables et colonnes pour optimisation SEO
-- Exécuter dans Supabase SQL Editor

-- ============================================
-- 1. Table seo_tracking (historique positions Google)
-- ============================================
CREATE TABLE IF NOT EXISTS seo_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  -- Métriques Google Search Console
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr DECIMAL(5,4) DEFAULT 0,        -- 0.0000 à 1.0000
  position DECIMAL(5,2) DEFAULT 0,   -- Position moyenne
  -- Requête principale pour cet article/site
  top_query TEXT,
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT now(),
  -- Contrainte: une seule entrée par site/article/date
  UNIQUE(site_id, article_id, date)
);

-- Index pour requêtes efficaces
CREATE INDEX IF NOT EXISTS idx_seo_tracking_site_date ON seo_tracking(site_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_seo_tracking_article_date ON seo_tracking(article_id, date DESC);

-- ============================================
-- 2. Colonnes SEO sur articles
-- ============================================
ALTER TABLE articles ADD COLUMN IF NOT EXISTS seo_score INTEGER DEFAULT 0;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS heading_count INTEGER DEFAULT 0;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS internal_links INTEGER DEFAULT 0;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS external_links INTEGER DEFAULT 0;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS reading_time INTEGER DEFAULT 0;

-- ============================================
-- 3. Table related_articles (articles connexes pré-calculés)
-- ============================================
CREATE TABLE IF NOT EXISTS related_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  related_article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  score DECIMAL(5,2) DEFAULT 0,     -- Score de pertinence 0-100
  reason TEXT,                       -- Raison de la relation (cluster, keyword, etc.)
  created_at TIMESTAMPTZ DEFAULT now(),
  -- Pas de doublons
  UNIQUE(article_id, related_article_id),
  -- Pas d'auto-référence
  CHECK (article_id != related_article_id)
);

-- Index pour récupération rapide par article
CREATE INDEX IF NOT EXISTS idx_related_articles_article ON related_articles(article_id, score DESC);

-- ============================================
-- 4. Colonnes webhook sur sites (rapports hebdo)
-- ============================================
ALTER TABLE sites ADD COLUMN IF NOT EXISTS webhook_url TEXT;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS webhook_enabled BOOLEAN DEFAULT false;

-- ============================================
-- 5. Vérification
-- ============================================
-- Exécuter pour vérifier la création:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('seo_tracking', 'related_articles');
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'articles' AND column_name LIKE 'seo%' OR column_name IN ('word_count', 'heading_count', 'internal_links', 'external_links', 'reading_time');
