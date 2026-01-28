# VintCluster - Plateforme de Génération de Blogs IA Multi-Sites

## Description du Projet

Plateforme permettant de générer automatiquement des articles de blog avec l'IA (OpenAI GPT-4o) à partir de mots-clés, puis de les publier sur 20+ sites web via une architecture multi-tenant.

## Produits SaaS à Promouvoir

Les articles générés doivent promouvoir ces 3 produits SaaS avec des **CTA clairs** :

| Site | Domaine | Description | CTA Principal |
|------|---------|-------------|---------------|
| **VintDress** | vintdress.com | Génère des photos portées réalistes en 30 secondes avec l'IA. Pas de mannequin, pas de shooting - juste des images qui vendent ! | Essayer VintDress gratuitement |
| **VintBoost** | vintboost.com | Génère des vidéos professionnelles de ton vestiaire en 30 secondes. Zéro montage requis ! | Créer ma première vidéo |
| **VintPower** | vintpower.com | Notre IA génère titre, description et prix optimisés à partir de vos photos. Publiez directement sur Vinted avec notre extension. | Optimiser mes annonces |

### Stratégie de CTA par Cluster (site_key)

| Cluster | Produit principal | Angle de l'article |
|---------|-------------------|-------------------|
| `photo`, `photo-ia`, `photo-technique` | **VintDress** | Photos de qualité, mannequins IA, mise en valeur des vêtements |
| `video`, `mannequin-ia` | **VintBoost** | Vidéos, contenu dynamique, avatar virtuel |
| `vendre`, `vente`, `outils-vinted` | **VintPower** | Optimisation des annonces, descriptions, prix |
| `algorithme`, `tendances`, `logistique`, `paiement` | **Les 3** | Écosystème complet Vint* |

## Stack Technique

- **Framework**: Next.js 16 (App Router + Turbopack)
- **Base de données**: Supabase PostgreSQL
- **Authentification**: Supabase Auth (single user admin)
- **Génération IA**: OpenAI GPT-4o API
- **Images**: Replicate API (FLUX, SDXL - génération IA)
- **Scheduling**: API Routes + External Cron (Coolify/Ofelia)
- **Déploiement**: Docker + Coolify (self-hosted)
- **Styling**: Tailwind CSS + shadcn/ui
- **Validation**: Zod

## Styles Visuels

### Blog Public : Néo-Brutalisme

Le design du blog public suit le style **néo-brutalisme** :

- **Bordures épaisses** : `border-4 border-black`
- **Ombres décalées** : `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` ou `shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`
- **Couleurs vives** : Personnalisables par site (`primary_color`, `secondary_color`)
- **Typographie bold** : Titres en `font-black uppercase`, texte en `font-bold`
- **Hover states prononcés** : Translation + changement d'ombre

```tsx
// Exemple bouton néo-brutaliste
<button className="
  bg-yellow-400 border-4 border-black
  px-6 py-3 font-black text-black uppercase
  shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
  hover:-translate-x-1 hover:-translate-y-1
  hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
  transition-all
">
  Cliquez ici
</button>
```

### Admin : Moderne Notion/Stripe

Le dashboard admin utilise un style **moderne et épuré** :

- **Couleur principale** : Indigo (`indigo-500` / `indigo-600`)
- **Background** : Blanc/Gris très clair (`gray-50`, `white`)
- **Bordures subtiles** : `border-gray-200`
- **Ombres douces** : `shadow-sm`, `shadow-md`
- **Coins arrondis** : `rounded-lg`, `rounded-xl`
- **Composants** : shadcn/ui par défaut

## Architecture

### Multi-Tenant par Domaine

Une seule application Next.js sert tous les sites. Le domaine est détecté via le proxy (anciennement middleware) :

```typescript
// proxy.ts (Next.js 16 - remplace middleware.ts)
export async function proxy(request: NextRequest) {
  const host = request.headers.get('host');
  // Header x-current-host injecté pour les server components
  supabaseResponse.headers.set("x-current-host", host);
  return supabaseResponse;
}
```

**Important** : Les pages qui utilisent `headers()` pour la détection multi-tenant doivent avoir :
```typescript
// Force dynamic rendering car headers() est une fonction dynamique
export const dynamic = "force-dynamic";
```

### Structure des Routes

```
src/app/
├── (blog)/                  # Routes blog public (détection domaine)
│   ├── layout.tsx           # Layout avec header/footer néo-brutaliste
│   ├── page.tsx             # Homepage avec articles featured
│   ├── loading.tsx          # Loading skeleton
│   ├── error.tsx            # Page erreur
│   ├── not-found.tsx        # Page 404
│   └── blog/
│       ├── page.tsx         # Liste paginée des articles
│       └── [slug]/
│           ├── page.tsx     # Détail article + FAQ + JSON-LD (dynamic)
│           └── error.tsx    # Error boundary pour les erreurs de rendu
├── admin/                   # Routes admin (protégées)
│   ├── layout.tsx           # Layout admin avec sidebar
│   ├── page.tsx             # Dashboard stats
│   ├── sites/               # CRUD sites
│   │   └── [id]/            # Détail/édition site
│   ├── keywords/            # Import/gestion mots-clés
│   ├── articles/            # Gestion articles générés
│   │   └── [id]/            # Page édition article (EditArticleForm)
│   ├── scheduler/           # Configuration publication auto
│   ├── logs/                # Historique activité
│   ├── settings/            # Paramètres
│   ├── login/               # Authentification
│   └── error.tsx            # Page erreur admin
└── api/
    ├── cron/
    │   ├── generate/        # Génération automatique
    │   └── publish/         # Publication automatique
    ├── debug-article/       # Debug données article
    ├── debug-domain/        # Debug détection domaine
    ├── debug-page/          # Debug rendu page étape par étape
    ├── debug-render/        # Debug contenu et FAQ
    ├── health/              # Health check Docker
    ├── revalidate/          # Revalidation ISR
    └── setup-db/            # Initialisation DB
```

### Modèle de Données

```sql
-- Sites configurés
CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT NOT NULL UNIQUE,
  logo_url TEXT,                        -- URL du logo (optionnel)
  favicon_url TEXT,                     -- URL du favicon (optionnel)
  primary_color TEXT DEFAULT '#FFE500',
  secondary_color TEXT DEFAULT '#000000',
  meta_title TEXT,                      -- Titre SEO (optionnel)
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Mots-clés importés (site_id optionnel = keyword global)
CREATE TABLE keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE, -- NULL = global keyword
  keyword TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending | generating | generated | published | archived
  priority INTEGER DEFAULT 0,
  search_volume INTEGER,         -- Volume de recherche mensuel
  difficulty INTEGER,            -- Difficulté SEO (0-100)
  cluster TEXT,                  -- Cluster thématique
  site_key TEXT,                 -- Clé pour identifier le type de site cible
  notes TEXT,                    -- Notes/commentaires
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Articles générés
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  keyword_id UUID REFERENCES keywords(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  faq JSONB, -- [{question, answer}]
  image_url TEXT,
  image_alt TEXT,
  status TEXT DEFAULT 'draft', -- draft | ready | published | unpublished
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(site_id, slug)
);

-- Configuration scheduler
CREATE TABLE scheduler_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE UNIQUE,
  enabled BOOLEAN DEFAULT false,
  auto_publish BOOLEAN DEFAULT false,
  days_of_week INTEGER[] DEFAULT '{1,2,3,4,5}', -- 0=Dim, 1=Lun, etc.
  publish_hours INTEGER[] DEFAULT '{10}', -- Heures de génération
  max_per_day INTEGER DEFAULT 5,
  max_per_week INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Logs d'activité
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- site_created | keyword_imported | article_generated | article_published | error
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Structure des Fichiers

```
src/
├── app/                     # Routes Next.js
├── components/
│   ├── ui/                  # Composants shadcn/ui
│   ├── admin/               # Composants admin
│   │   ├── sites/           # SitesTable, CreateSiteDialog, etc.
│   │   ├── keywords/        # KeywordsTable, ImportKeywordsDialog, etc.
│   │   ├── articles/        # ArticlesTable, ArticlePreviewDialog, etc.
│   │   ├── scheduler/       # SchedulerConfigCard, SchedulerConfigDialog
│   │   ├── logs/            # LogsTable, LogsFilters
│   │   └── layout/          # Sidebar, Header
│   └── blog/                # Composants blog public
│       ├── BlogHeader.tsx
│       ├── BlogFooter.tsx
│       ├── ArticleCard.tsx
│       └── ArticleContent.tsx
├── lib/
│   ├── actions/             # Server Actions
│   │   ├── sites.ts
│   │   ├── keywords.ts
│   │   ├── articles.ts
│   │   ├── scheduler.ts
│   │   ├── logs.ts
│   │   └── blog.ts          # Actions publiques avec cache
│   ├── supabase/            # Client Supabase
│   │   ├── client.ts        # Client browser
│   │   ├── server.ts        # Client server
│   │   └── middleware.ts    # Session management
│   ├── openai/              # Génération IA
│   │   ├── client.ts
│   │   └── generate-article.ts
│   ├── replicate/           # Génération d'images IA
│   │   ├── client.ts
│   │   ├── generate-image.ts
│   │   └── index.ts
│   └── validations/         # Schemas Zod
│       └── index.ts
├── hooks/                   # React hooks custom
└── types/
    └── database.ts          # Types TypeScript
```

## Server Actions

### Sites (`lib/actions/sites.ts`)
- `getSites()` - Liste tous les sites
- `getSitesWithStats()` - Liste avec compteurs (keywords, articles)
- `getSiteById(id)` - Récupère un site
- `createSite(data)` - Crée un site
- `updateSite(id, data)` - Met à jour un site (+ revalidation cache auto)
- `deleteSite(id)` - Supprime un site
- `generateSiteSEO(siteName, siteId?)` - Génère meta_title/description avec IA

### Keywords (`lib/actions/keywords.ts`)
- `getKeywords(filters)` - Liste avec filtres (siteId, status, search, globalOnly, includeGlobal)
- `getAvailableKeywords()` - Keywords en statut "pending" pour génération
- `getKeywordStats(siteId)` - Statistiques
- `importKeywords(siteId | null, keywords[])` - Import CSV (siteId null = global)
- `importKeywordsSimple(siteId | null, strings[])` - Import simple (texte uniquement)
- `updateKeywordStatus(ids, status)` - Mise à jour statut
- `deleteKeywords(ids)` - Suppression
- `updateKeywordPriority(id, priority)` - Mise à jour priorité

### Articles (`lib/actions/articles.ts`)
- `getArticles(filters)` - Liste avec filtres
- `getArticleStats(siteId)` - Statistiques
- `getArticleById(id)` - Récupère un article avec keyword et site
- `generateArticleFromKeyword(keywordId, imageOptions?)` - Génération IA depuis keyword lié à un site
- `generateArticleFromTopic(siteId, topic, imageOptions?)` - Génération IA depuis topic libre

ImageOptions:
```typescript
interface ImageOptions {
  source: "none" | "ai" | "url";  // Type de source d'image
  customUrl?: string;              // URL si source === "url"
  model?: "flux-schnell" | "flux-dev" | "sdxl";  // Modèle si source === "ai"
}
```
- `createManualArticle(data)` - Création manuelle d'article
- `updateArticleStatus(id, status)` - Publication
- `updateArticle(id, data)` - Modification
- `deleteArticle(id)` - Suppression
- `bulkUpdateArticleStatus(ids, status)` - Mise à jour en masse du statut
- `bulkDeleteArticles(ids)` - Suppression en masse

### Blog Public (`lib/actions/blog.ts`)
- `getSiteByDomain(domain)` - Site par domaine (cached 60s, gère www automatiquement)
- `getPublishedArticles(siteId, limit, offset)` - Articles publiés (cached 60s)
- `getArticleBySlug(siteId, slug)` - Article par slug (cached 60s)
- `getPublishedArticlesCount(siteId)` - Compte articles
- `getAllArticleSlugs(siteId)` - Pour generateStaticParams

## Variables d'Environnement

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# OpenAI
OPENAI_API_KEY=sk-...

# Replicate (Image Generation)
REPLICATE_API_TOKEN=r8_...

# App Config
NEXT_PUBLIC_ADMIN_DOMAIN=admin.votredomaine.com

# Secrets
CRON_SECRET=xxx  # Pour sécuriser /api/cron/*
REVALIDATION_SECRET=xxx  # Pour /api/revalidate
```

## API Routes

### Cron Jobs (sécurisés par Bearer token)
```bash
# Génération automatique
GET /api/cron/generate
Authorization: Bearer $CRON_SECRET

# Publication automatique
GET /api/cron/publish
Authorization: Bearer $CRON_SECRET
```

### Revalidation ISR
```bash
POST /api/revalidate
Authorization: Bearer $REVALIDATION_SECRET
Content-Type: application/json
{"domain": "monsite.com"}
```

### Health Check
```bash
GET /api/health
# Response: {"status": "healthy", "timestamp": "..."}
```

### Debug Endpoints
```bash
# Debug domaine - Affiche headers et domaine détecté
GET /api/debug-domain

# Debug article - Vérifie les données article en DB
GET /api/debug-article?slug=mon-article

# Debug page - Diagnostic étape par étape du rendu
GET /api/debug-page?slug=mon-article&domain=monsite.com

# Debug render - Analyse contenu et FAQ
GET /api/debug-render?slug=mon-article
```

## Commandes

```bash
# Développement
npm run dev

# Build production
npm run build

# Linting
npm run lint

# Docker
docker build -t vintcluster .
docker-compose up -d
```

## Flux Principal

```
1. Créer Site (admin/sites)
   └─► Définir domaine, couleurs, meta

2. Importer Mots-clés (admin/keywords)
   └─► CSV ou saisie manuelle
   └─► Status: pending

3. Générer Articles (admin/keywords ou cron)
   └─► OpenAI GPT-4o génère titre, contenu, summary, FAQ
   └─► Replicate génère image (FLUX/SDXL) ou URL personnalisée
   └─► Status keyword: generating → generated
   └─► Article créé en draft

4. Réviser & Publier (admin/articles)
   └─► Prévisualisation, édition si besoin
   └─► Publication manuelle ou auto (scheduler)
   └─► Status: draft → published
   └─► Revalidation ISR automatique

5. Blog Public (domaine du site)
   └─► Homepage avec articles featured
   └─► Liste paginée /blog
   └─► Détail article /blog/[slug]
   └─► SEO: JSON-LD, OpenGraph, sitemap
```

## Déploiement

Voir [DEPLOY.md](./DEPLOY.md) pour les instructions Coolify.

### Configuration Docker Multi-Stage

Le Dockerfile utilise 3 stages pour optimiser l'image :

```dockerfile
# Stage 1: deps - Installation des dépendances (incluant devDeps pour TypeScript)
# Stage 2: builder - Build Next.js avec standalone output
# Stage 3: runner - Image de production minimale

# Points importants :
- npm ci (pas --only=production) pour avoir TypeScript au build
- Dossier public/ doit exister (même avec juste .gitkeep)
- Permissions cache : mkdir -p .next/cache && chown -R nextjs:nodejs .next
- User non-root : nextjs (uid 1001)
```

### Configuration Multi-Domaines Coolify

Dans Coolify, séparer les domaines par des virgules sans espaces :
```
https://admin.monsite.com,https://blog1.com,https://blog2.com
```

Chaque domaine doit correspondre exactement à la colonne `domain` dans la table `sites` (sans https://, sans www).

### Troubleshooting Cache

Après ajout d'un nouveau site, si 404 persiste :
1. Attendre 60 secondes (expiration cache)
2. Ou redémarrer le conteneur dans Coolify
3. Ou appeler `/api/revalidate?secret=XXX&tag=sites`

## SEO

### Fonctionnalités SEO

| Fonctionnalité | Status | Fichiers |
|----------------|--------|----------|
| Sitemap dynamique | ✅ | `src/app/sitemap.ts` |
| robots.txt dynamique | ✅ | `src/app/robots.ts` |
| URLs canoniques | ✅ | Toutes les pages blog |
| OpenGraph complet | ✅ | Toutes les pages blog |
| Twitter Cards | ✅ | Toutes les pages blog |
| JSON-LD Article | ✅ | `src/app/(blog)/blog/[slug]/page.tsx` |
| JSON-LD FAQPage | ✅ | `src/app/(blog)/blog/[slug]/page.tsx` |
| JSON-LD BreadcrumbList | ✅ | `src/app/(blog)/blog/[slug]/page.tsx` |
| meta_title/description site | ✅ | Via admin + génération IA |

### Génération SEO IA

Les sites peuvent générer automatiquement leur `meta_title` et `meta_description` via OpenAI :

```typescript
// src/lib/actions/sites.ts
generateSiteSEO(siteName: string, siteId?: string)
// Prend en compte le nom du site + ses keywords associés
```

### Métadonnées par page

| Page | metadataBase | canonical | OpenGraph | Twitter | JSON-LD |
|------|--------------|-----------|-----------|---------|---------|
| `/` (home) | ✅ | `/` | website, siteName, locale, images | summary | - |
| `/blog` | ✅ | `/blog` | website, siteName, locale, images | summary | - |
| `/blog/[slug]` | ✅ | `/blog/[slug]` | article, publishedTime, modifiedTime, images | summary_large_image | Article, FAQPage, BreadcrumbList |

## Notes Importantes

- **Next.js 16** : Utilise Turbopack, `unstable_cache` pour le caching
- **Proxy (ex-Middleware)** : `middleware.ts` renommé en `proxy.ts` avec fonction `proxy()` (convention Next.js 16)
- **Multi-tenant** : Détection domaine via header `x-current-host` injecté par proxy.ts
- **Dynamic Rendering** : Pages utilisant `headers()` doivent avoir `export const dynamic = "force-dynamic"` pour éviter l'erreur `DYNAMIC_SERVER_USAGE`
- **ISR** : Cache 60s pour articles et sites, revalidation on-demand via tag "sites" ou "articles"
- **Sécurité** : Routes admin protégées, CRON_SECRET pour les endpoints cron
- **Types** : Casting `as unknown as Type` nécessaire pour les champs JSONB (faq, metadata)
- **Keywords globaux** : Les mots-clés avec `site_id = NULL` peuvent être utilisés pour générer des articles sur n'importe quel site
- **Gestion www** : Le domaine est normalisé (www supprimé) pour correspondance avec la DB
- **Debug** : Endpoints `/api/debug-*` pour diagnostiquer les problèmes (domain, article, page, render)
- **Bulk Actions** : La page articles supporte la sélection multiple et les actions en masse
- **Error Boundaries** : `error.tsx` dans les routes pour capturer et afficher les erreurs de rendu

## Audit & Issues Connues

### Issues Corrigées ✅

1. ~~**JSON.parse sans try-catch**~~ → Ajout de try-catch spécifique dans `generateSiteSEO()`
2. ~~**Debug routes sans auth**~~ → Endpoints `/api/debug-*` protégés par `CRON_SECRET`
3. ~~**Pas de limite sur bulk operations**~~ → Maximum 100 items par opération
4. ~~**Code dupliqué generateSlug()**~~ → Extrait dans `src/lib/utils/slug.ts`
5. ~~**console.log en production**~~ → Logs informatifs supprimés, console.error conservés

### Warnings Restants

1. **Type casting excessif** - 13 occurrences de `as unknown as` dans le code (normal pour JSONB Supabase)
2. **Pas de rate limiting** - Sur les endpoints API cron (protégés par secret)

### Suggestions Restantes

1. **Types dupliqués** - `ArticleWithKeyword`, `ArticleWithDetails`, `KeywordWithSite` à consolider
2. **Produits hardcodés** - URLs des produits Vint* à externaliser en config

## Migration SQL

Si vous avez une base existante, exécutez cette migration dans Supabase SQL Editor :

```sql
-- Migration: Ajout colonnes keywords et site_id nullable
-- Exécuter dans Supabase SQL Editor

-- 1. Rendre site_id nullable
ALTER TABLE keywords ALTER COLUMN site_id DROP NOT NULL;

-- 2. Ajouter les nouvelles colonnes
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS search_volume INTEGER;
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS difficulty INTEGER;
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS cluster TEXT;
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS site_key TEXT;
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 3. Supprimer l'ancienne contrainte unique
ALTER TABLE keywords DROP CONSTRAINT IF EXISTS keywords_site_id_keyword_key;

-- 4. Créer un index pour les recherches
CREATE INDEX IF NOT EXISTS idx_keywords_site_id ON keywords(site_id);
CREATE INDEX IF NOT EXISTS idx_keywords_status ON keywords(status);
CREATE INDEX IF NOT EXISTS idx_keywords_priority ON keywords(priority DESC);

-- 5. Mettre à jour RLS si nécessaire (optionnel)
-- Si vous utilisez RLS, adaptez les policies pour gérer site_id nullable
```

## Format CSV Import Keywords

Le système supporte l'import CSV avec les colonnes suivantes :

| Colonne | Type | Obligatoire | Description |
|---------|------|-------------|-------------|
| keyword | TEXT | Oui | Le mot-clé à importer |
| search_volume | INTEGER | Non | Volume de recherche mensuel |
| difficulty | INTEGER | Non | Difficulté SEO (0-100) |
| cluster | TEXT | Non | Cluster/catégorie thématique |
| site_key | TEXT | Non | Identifiant du type de site cible |
| priority | INTEGER | Non | Priorité de génération (plus élevé = prioritaire) |
| notes | TEXT | Non | Notes ou commentaires |

Exemple :
```csv
keyword,search_volume,difficulty,cluster,site_key,priority,notes
ia photo vinted,800,35,photo-ia,photo,1,Top performer
mannequin ia vinted,600,30,mannequin-ia,mannequin,1,Position 2.25
```

## Prompt de Génération d'Articles (OpenAI)

Le système de génération utilise ce prompt pour créer des articles avec CTA :

```typescript
// Prompt système (lib/openai/generate-article.ts)
const SYSTEM_PROMPT = `Tu es un expert en rédaction SEO spécialisé dans la vente sur Vinted et les outils IA pour vendeurs.
Tu génères des articles de blog optimisés pour le référencement naturel qui promeuvent subtilement nos 3 produits SaaS.

## Nos Produits :
1. **VintDress** (vintdress.com) - Photos portées IA en 30s. Pas de mannequin, pas de shooting.
2. **VintBoost** (vintboost.com) - Vidéos pro de vestiaire en 30s. Zéro montage.
3. **VintPower** (vintpower.com) - IA qui génère titres, descriptions, prix optimisés + extension Vinted.

## Règles de rédaction :
- Contenu original, informatif et engageant (1000-1500 mots)
- Structure avec sous-titres (## et ###)
- Ton professionnel mais accessible, tutoiement
- Listes à puces pour les conseils pratiques
- Intégration naturelle du mot-clé principal

## CTA OBLIGATOIRES :
- Insérer 2-3 CTA vers le produit le plus pertinent selon le sujet
- Format CTA : "[🚀 Texte du CTA](https://produit.com)"
- Placer les CTA après les sections clés, pas en fin d'article uniquement
- Le CTA doit résoudre un problème mentionné dans le paragraphe précédent`;
```
