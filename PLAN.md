# Plan d'Implémentation VintCluster

## Vue d'Ensemble

**Durée estimée**: 6-8 semaines
**Phases**: 8 phases principales

---

## Phase 1 : Setup Initial
**Objectif**: Projet Next.js fonctionnel avec Supabase connecté

### Checklist

- [ ] Initialiser projet Next.js 14 avec App Router
  ```bash
  npx create-next-app@latest vintcluster --typescript --tailwind --eslint --app --src-dir
  ```
- [ ] Installer dépendances core
  ```bash
  npm install @supabase/supabase-js @supabase/ssr
  npm install openai
  npm install zod
  npm install @tanstack/react-query
  ```
- [ ] Installer et configurer shadcn/ui
  ```bash
  npx shadcn@latest init
  npx shadcn@latest add button input card table dialog form toast tabs badge
  ```
- [ ] Créer structure de dossiers (`src/lib/`, `src/hooks/`, `src/types/`)
- [ ] Configurer variables d'environnement (`.env.local`)
- [ ] Setup client Supabase (`src/lib/supabase/client.ts` et `server.ts`)
- [ ] Créer middleware Next.js pour détection domaine
- [ ] Tester connexion Supabase

### Livrables
- Projet qui démarre sans erreur
- Connexion Supabase fonctionnelle

---

## Phase 2 : Base de Données
**Objectif**: Schéma complet dans Supabase

### Checklist

- [ ] Créer table `sites`
  ```sql
  CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#000000',
    secondary_color VARCHAR(7) DEFAULT '#ffffff',
    meta_title VARCHAR(255),
    meta_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- [ ] Créer table `keywords`
  ```sql
  CREATE TABLE keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    keyword VARCHAR(500) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    priority INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(site_id, keyword)
  );
  CREATE INDEX idx_keywords_status ON keywords(status);
  CREATE INDEX idx_keywords_site ON keywords(site_id);
  ```
- [ ] Créer table `articles`
  ```sql
  CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    keyword_id UUID REFERENCES keywords(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    faq JSONB,
    image_url TEXT,
    image_alt VARCHAR(255),
    status VARCHAR(20) DEFAULT 'draft',
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(site_id, slug)
  );
  CREATE INDEX idx_articles_status ON articles(status);
  CREATE INDEX idx_articles_site ON articles(site_id);
  CREATE INDEX idx_articles_published ON articles(published_at DESC);
  ```
- [ ] Créer table `scheduler_config`
  ```sql
  CREATE TABLE scheduler_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE UNIQUE,
    enabled BOOLEAN DEFAULT false,
    days_of_week INT[] DEFAULT '{1,2,3,4,5}',
    publish_hours INT[] DEFAULT '{9,14}',
    max_per_day INT DEFAULT 2,
    max_per_week INT DEFAULT 10,
    auto_publish BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- [ ] Créer table `activity_logs`
  ```sql
  CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX idx_logs_type ON activity_logs(type);
  CREATE INDEX idx_logs_created ON activity_logs(created_at DESC);
  ```
- [ ] Configurer Row Level Security (RLS) - policies pour admin
- [ ] Créer fonctions SQL utilitaires (triggers updated_at)
- [ ] Générer types TypeScript
  ```bash
  npx supabase gen types typescript --project-id <id> > src/types/database.ts
  ```
- [ ] Créer helpers TypeScript pour chaque table

### Livrables
- Schéma complet créé dans Supabase
- Types TypeScript générés
- RLS configuré

---

## Phase 3 : Authentification Admin
**Objectif**: Login admin sécurisé

### Checklist

- [ ] Configurer Supabase Auth (email/password)
- [ ] Créer page `/admin/login`
- [ ] Créer layout admin avec protection auth
- [ ] Implémenter middleware de protection routes `/admin/*`
- [ ] Créer composant `AuthProvider`
- [ ] Ajouter bouton logout dans header admin
- [ ] Créer l'utilisateur admin dans Supabase Dashboard
- [ ] Tester flow login/logout complet

### Livrables
- Login fonctionnel
- Routes admin protégées
- Session persistante

---

## Phase 4 : Gestion des Sites (Admin)
**Objectif**: CRUD complet pour les sites

### Checklist

- [ ] Créer layout admin (`/admin/layout.tsx`)
  - Sidebar navigation
  - Header avec user info
  - Breadcrumbs
- [ ] Page liste sites (`/admin/sites/page.tsx`)
  - Table avec tous les sites
  - Colonnes: nom, domaine, nb articles, statut
  - Actions: éditer, supprimer
- [ ] Dialog/Page création site (`/admin/sites/new`)
  - Formulaire: domain, name, colors, logo
  - Validation Zod
  - Server Action création
- [ ] Page édition site (`/admin/sites/[id]/page.tsx`)
  - Formulaire pré-rempli
  - Preview couleurs
  - Server Action update
- [ ] Server Actions pour CRUD sites
- [ ] Composant `SiteSelector` (dropdown pour filtrer par site)
- [ ] Tester création/édition/suppression

### Livrables
- Interface complète gestion sites
- CRUD fonctionnel

---

## Phase 5 : Import Mots-Clés
**Objectif**: Import CSV et gestion des keywords

### Checklist

- [ ] Page mots-clés (`/admin/keywords/page.tsx`)
  - Filtre par site
  - Filtre par statut (pending, generated, published, archived)
  - Recherche textuelle
  - Pagination
- [ ] Composant upload CSV
  - Drag & drop zone
  - Preview avant import
  - Sélection colonnes
- [ ] Parser CSV côté client
  ```typescript
  // Utiliser papaparse
  npm install papaparse @types/papaparse
  ```
- [ ] Détection doublons avant import
- [ ] Server Action import batch
- [ ] Actions bulk sur keywords sélectionnés
  - Archiver
  - Supprimer
  - Changer priorité
- [ ] Indicateurs stats (total, pending, generated, etc.)
- [ ] Tester import CSV réel

### Livrables
- Import CSV fonctionnel
- Gestion complète keywords
- Détection doublons

---

## Phase 6 : Génération IA
**Objectif**: Générer articles complets avec GPT-4

### Checklist

- [ ] Configurer client OpenAI (`src/lib/openai/client.ts`)
- [ ] Créer prompts système
  ```typescript
  // src/lib/openai/prompts.ts
  - SYSTEM_PROMPT_ARTICLE
  - SYSTEM_PROMPT_TITLE
  - SYSTEM_PROMPT_SUMMARY
  - SYSTEM_PROMPT_FAQ
  ```
- [ ] Fonction génération titre
- [ ] Fonction génération contenu (markdown)
- [ ] Fonction génération résumé
- [ ] Fonction génération FAQ (JSON structuré)
- [ ] Intégrer Unsplash API
  ```typescript
  npm install unsplash-js
  // Recherche image par keyword
  ```
- [ ] Fonction génération complète article
  ```typescript
  async function generateArticle(keyword: string, siteId: string): Promise<Article>
  ```
- [ ] API Route `/api/generate`
  - Input: keyword_id
  - Output: article créé
  - Gestion erreurs/retry
- [ ] Bouton "Générer" sur page keywords
- [ ] Génération batch (plusieurs keywords)
- [ ] Progress indicator pendant génération
- [ ] Logging génération dans activity_logs
- [ ] Tester génération sur plusieurs keywords

### Livrables
- Génération article complète fonctionnelle
- Intégration images Unsplash
- UI de génération

---

## Phase 7 : Gestion Articles & Publication
**Objectif**: Consulter, éditer, publier articles

### Checklist

- [ ] Page liste articles (`/admin/articles/page.tsx`)
  - Filtre par site
  - Filtre par statut (draft, ready, published)
  - Tri par date
  - Preview rapide
- [ ] Page édition article (`/admin/articles/[id]/page.tsx`)
  - Éditeur markdown riche
    ```bash
    npm install @uiw/react-md-editor
    ```
  - Édition titre, contenu, summary, FAQ
  - Changement image
  - Preview live
- [ ] Sélecteur sites publication (multi-select)
- [ ] Boutons Publier / Dépublier
- [ ] Server Action publication
  - Créer entrée publications
  - Mettre à jour status article
  - Trigger revalidation ISR
- [ ] API Route `/api/revalidate`
  ```typescript
  // Revalider pages concernées
  revalidatePath(`/article/${slug}`)
  revalidatePath('/')
  revalidatePath('/sitemap.xml')
  ```
- [ ] Bouton "Marquer comme prêt" (draft → ready)
- [ ] Historique modifications article
- [ ] Tester cycle complet: génération → édition → publication

### Livrables
- Éditeur article complet
- Publication multi-sites
- Revalidation ISR

---

## Phase 8 : Publication Automatique
**Objectif**: Scheduler avec pg_cron

### Checklist

- [ ] Activer extension pg_cron dans Supabase
  ```sql
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  ```
- [ ] Page configuration scheduler (`/admin/scheduler/page.tsx`)
  - Activer/désactiver par site
  - Sélection jours de la semaine
  - Sélection heures de publication
  - Limites quotidiennes/hebdomadaires
  - Option auto-publish vs garder en draft
- [ ] Créer Edge Function `auto-publish`
  ```typescript
  // supabase/functions/auto-publish/index.ts
  - Récupérer sites avec scheduler actif
  - Vérifier jour/heure actuels
  - Sélectionner keywords pending (priorité + ancienneté)
  - Générer articles
  - Publier si auto_publish = true
  - Logger activité
  ```
- [ ] Configurer cron job dans Supabase
  ```sql
  SELECT cron.schedule(
    'auto-publish-job',
    '0 * * * *', -- Toutes les heures
    $$SELECT net.http_post(
      url := 'https://your-app.com/api/cron/auto-publish',
      headers := '{"Authorization": "Bearer SECRET"}'::jsonb
    )$$
  );
  ```
- [ ] API Route `/api/cron/auto-publish`
  - Vérification secret
  - Appel logique publication
- [ ] Dashboard stats scheduler
  - Articles publiés aujourd'hui/semaine
  - Prochaines publications prévues
  - Erreurs récentes
- [ ] Tester scheduler en conditions réelles

### Livrables
- Scheduler fonctionnel
- Publication automatique
- Monitoring

---

## Phase 9 : Blog Public (Frontend)
**Objectif**: Affichage blog multi-tenant

### Checklist

- [ ] Middleware détection site par domaine
  ```typescript
  // middleware.ts
  export function middleware(request: NextRequest) {
    const host = request.headers.get('host')
    // Injecter site_id dans headers pour les server components
  }
  ```
- [ ] Layout public (`/app/(public)/layout.tsx`)
  - Header avec logo/nom site
  - Navigation
  - Footer
  - Couleurs dynamiques depuis config site
- [ ] Page accueil blog (`/app/(public)/page.tsx`)
  - Liste articles publiés (paginée)
  - Cards articles avec image, titre, summary
  - ISR avec revalidation
- [ ] Page article (`/app/(public)/article/[slug]/page.tsx`)
  - Contenu markdown rendu en HTML
    ```bash
    npm install react-markdown remark-gfm
    ```
  - Section FAQ (collapsible)
  - Métadonnées SEO
  - Schema.org Article
- [ ] Génération sitemap dynamique (`/app/sitemap.ts`)
  ```typescript
  export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const host = headers().get('host')
    const site = await getSiteByDomain(host)
    const articles = await getPublishedArticles(site.id)
    // Retourner sitemap
  }
  ```
- [ ] Page 404 personnalisée
- [ ] Optimisation images (next/image avec Unsplash)
- [ ] Composants SEO (meta tags dynamiques)
- [ ] Tester sur plusieurs domaines

### Livrables
- Blog public fonctionnel
- Multi-tenant par domaine
- SEO optimisé

---

## Phase 10 : Journalisation & Monitoring
**Objectif**: Logs et notifications

### Checklist

- [ ] Page logs (`/admin/logs/page.tsx`)
  - Filtres: type, site, date
  - Pagination
  - Détails expandables
- [ ] Types de logs
  - `generation_started`
  - `generation_success`
  - `generation_error`
  - `publish_success`
  - `publish_error`
  - `scheduler_run`
  - `csv_import`
- [ ] Helper logging centralisé
  ```typescript
  async function logActivity(type: string, message: string, metadata?: object)
  ```
- [ ] Notifications toast dans l'admin
- [ ] Dashboard récapitulatif (`/admin/page.tsx`)
  - Stats globales
  - Dernières activités
  - Erreurs récentes
  - Graphiques (optionnel)
- [ ] Export logs CSV (optionnel)

### Livrables
- Système de logs complet
- Dashboard admin informatif

---

## Phase 11 : Déploiement Coolify
**Objectif**: Production ready

### Checklist

- [ ] Créer `Dockerfile` optimisé
  ```dockerfile
  FROM node:20-alpine AS builder
  # ... build steps
  FROM node:20-alpine AS runner
  # ... production image
  ```
- [ ] Créer `docker-compose.yml` (optionnel, pour dev local)
- [ ] Configurer app dans Coolify
  - Source: Git repository
  - Build: Dockerfile
  - Domains: ajouter tous les domaines
- [ ] Configurer variables d'environnement dans Coolify
- [ ] Configurer health check
- [ ] Premier déploiement test
- [ ] Configurer SSL (automatique via Coolify)
- [ ] Ajouter domaines supplémentaires
- [ ] Tester chaque domaine
- [ ] Configurer backups Supabase (optionnel)

### Livrables
- Application déployée en production
- Tous les domaines configurés
- SSL fonctionnel

---

## Phase 12 : Tests & Polish
**Objectif**: Qualité production

### Checklist

- [ ] Tests manuels parcours complets
  - Import CSV → Génération → Publication → Vérification blog
- [ ] Gestion erreurs utilisateur (messages clairs)
- [ ] Loading states partout
- [ ] Empty states (pas d'articles, pas de sites, etc.)
- [ ] Responsive admin (mobile-friendly)
- [ ] Performance audit (Lighthouse)
- [ ] Sécurité review
  - Validation inputs
  - Protection CSRF
  - Rate limiting API génération
- [ ] Documentation utilisateur basique

### Livrables
- Application stable et polie
- Prête pour usage quotidien

---

## Priorités MVP

Si tu veux un MVP plus rapide, concentre-toi sur ces phases dans l'ordre:

1. **Phase 1** - Setup (obligatoire)
2. **Phase 2** - Base de données (obligatoire)
3. **Phase 3** - Auth (obligatoire)
4. **Phase 4** - Gestion sites (simplifié: juste CRUD basique)
5. **Phase 5** - Import keywords (simplifié: sans détection doublons avancée)
6. **Phase 6** - Génération IA (core feature)
7. **Phase 7** - Publication manuelle (core feature)
8. **Phase 9** - Blog public (obligatoire)
9. **Phase 11** - Déploiement (obligatoire)

Les phases 8 (scheduler), 10 (logs) et 12 (polish) peuvent être ajoutées après le MVP.

---

## Estimation par Phase

| Phase | Complexité |
|-------|------------|
| 1. Setup | Faible |
| 2. Base de données | Faible |
| 3. Auth | Faible |
| 4. Gestion sites | Moyenne |
| 5. Import keywords | Moyenne |
| 6. Génération IA | Élevée |
| 7. Articles & Publication | Élevée |
| 8. Scheduler | Moyenne |
| 9. Blog public | Moyenne |
| 10. Logs | Faible |
| 11. Déploiement | Moyenne |
| 12. Polish | Variable |
