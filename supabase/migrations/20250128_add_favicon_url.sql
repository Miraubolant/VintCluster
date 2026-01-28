-- VintCluster - Add favicon_url to sites table
-- Migration: Add favicon support for multi-tenant sites

-- Add favicon_url column to sites table
ALTER TABLE sites
ADD COLUMN IF NOT EXISTS favicon_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN sites.favicon_url IS 'URL of the site favicon (ico, png, or svg format recommended)';
