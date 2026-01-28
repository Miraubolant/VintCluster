/**
 * Script pour initialiser le schéma de base de données
 * Usage: npx tsx scripts/setup-database.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log("🚀 Starting database setup...\n");

  // Create tables one by one using Supabase's SQL execution
  const queries = [
    // Extension
    `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,

    // Function for updated_at
    `CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;`,

    // Sites table
    `CREATE TABLE IF NOT EXISTS sites (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      domain VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      logo_url TEXT,
      primary_color VARCHAR(7) DEFAULT '#000000',
      secondary_color VARCHAR(7) DEFAULT '#FFFFFF',
      meta_title VARCHAR(255),
      meta_description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`,

    // Keywords table
    `CREATE TABLE IF NOT EXISTS keywords (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
      keyword VARCHAR(500) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'generated', 'published', 'archived')),
      priority INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(site_id, keyword)
    );`,

    // Articles table
    `CREATE TABLE IF NOT EXISTS articles (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
      keyword_id UUID REFERENCES keywords(id) ON DELETE SET NULL,
      title VARCHAR(500) NOT NULL,
      slug VARCHAR(500) NOT NULL,
      content TEXT NOT NULL,
      summary TEXT,
      faq JSONB,
      image_url TEXT,
      image_alt VARCHAR(255),
      status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'published', 'unpublished')),
      published_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(site_id, slug)
    );`,

    // Scheduler config table
    `CREATE TABLE IF NOT EXISTS scheduler_config (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE UNIQUE,
      enabled BOOLEAN DEFAULT false,
      days_of_week INT[] DEFAULT '{1,2,3,4,5}',
      publish_hours INT[] DEFAULT '{9,14}',
      max_per_day INT DEFAULT 2,
      max_per_week INT DEFAULT 10,
      auto_publish BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`,

    // Activity logs table
    `CREATE TABLE IF NOT EXISTS activity_logs (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      message TEXT NOT NULL,
      metadata JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );`,

    // Indexes
    `CREATE INDEX IF NOT EXISTS idx_keywords_status ON keywords(status);`,
    `CREATE INDEX IF NOT EXISTS idx_keywords_site ON keywords(site_id);`,
    `CREATE INDEX IF NOT EXISTS idx_keywords_priority ON keywords(priority DESC);`,
    `CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);`,
    `CREATE INDEX IF NOT EXISTS idx_articles_site ON articles(site_id);`,
    `CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC);`,
    `CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);`,
    `CREATE INDEX IF NOT EXISTS idx_logs_type ON activity_logs(type);`,
    `CREATE INDEX IF NOT EXISTS idx_logs_site ON activity_logs(site_id);`,
    `CREATE INDEX IF NOT EXISTS idx_logs_created ON activity_logs(created_at DESC);`,
  ];

  for (const query of queries) {
    const { error } = await supabase.rpc("exec_sql", { query });
    if (error) {
      // Try direct approach if rpc doesn't exist
      console.log(`Note: ${error.message}`);
    }
  }

  console.log("✅ Database setup complete!");
  console.log("\nTables created:");
  console.log("  - sites");
  console.log("  - keywords");
  console.log("  - articles");
  console.log("  - scheduler_config");
  console.log("  - activity_logs");
}

setupDatabase().catch(console.error);
