# VintCluster

Plateforme de génération de blogs IA multi-sites avec architecture multi-tenant.

## Fonctionnalités

- **Multi-sites** : Gérez 20+ blogs depuis un seul panneau d'administration
- **Génération IA** : Articles générés automatiquement avec GPT-4o
- **Images IA** : Génération d'images via Replicate (FLUX, SDXL)
- **FAQ automatique** : Questions/réponses générées pour chaque article
- **Planification** : Publication automatique programmable par site
- **ISR** : Régénération incrémentale pour des performances optimales
- **SEO** : Métadonnées, JSON-LD, sitemap automatique

## Stack technique

- **Frontend** : Next.js 16, React 19, TailwindCSS, shadcn/ui
- **Backend** : Supabase (PostgreSQL, Auth, RLS)
- **IA** : OpenAI GPT-4o
- **Images** : Replicate API (FLUX, SDXL)
- **Déploiement** : Docker, Coolify

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Admin Panel                          │
│                   admin.votredomaine.com                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      VintCluster App                        │
│                    (Next.js + Supabase)                     │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌─────────┐     ┌─────────┐     ┌─────────┐
        │ Blog 1  │     │ Blog 2  │     │ Blog N  │
        │site1.com│     │site2.com│     │siteN.com│
        └─────────┘     └─────────┘     └─────────┘
```

## Installation

### Prérequis

- Node.js 20+
- Compte Supabase
- Clé API OpenAI
- Clé API Replicate

### 1. Cloner et installer

```bash
git clone https://github.com/votre-repo/vintcluster.git
cd vintcluster
npm install
```

### 2. Configuration

Copier `.env.example` vers `.env.local` et remplir les variables :

```bash
cp .env.example .env.local
```

### 3. Base de données

Exécuter le script SQL de création des tables dans Supabase :

```sql
-- Voir supabase/schema.sql
```

Ou via l'API setup :

```bash
curl http://localhost:3000/api/setup-db
```

### 4. Lancement

```bash
# Développement
npm run dev

# Production
npm run build
npm start
```

## Variables d'environnement

| Variable | Description | Requis |
|----------|-------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase | Oui |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anonyme Supabase | Oui |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role Supabase | Oui |
| `OPENAI_API_KEY` | Clé API OpenAI | Oui |
| `REPLICATE_API_TOKEN` | Token API Replicate | Oui |
| `NEXT_PUBLIC_ADMIN_DOMAIN` | Domaine admin | Oui |
| `CRON_SECRET` | Secret pour les cron jobs | Oui |
| `REVALIDATION_SECRET` | Secret pour la revalidation | Oui |

## Structure du projet

```
src/
├── app/
│   ├── (blog)/           # Routes publiques (blogs)
│   │   ├── page.tsx      # Homepage
│   │   ├── blog/
│   │   │   ├── page.tsx  # Liste articles
│   │   │   └── [slug]/   # Article détail
│   ├── admin/            # Routes admin
│   │   ├── sites/        # Gestion sites
│   │   ├── keywords/     # Gestion mots-clés
│   │   ├── articles/     # Gestion articles
│   │   ├── scheduler/    # Planification
│   │   └── logs/         # Logs activité
│   └── api/              # Routes API
│       ├── cron/         # Endpoints cron
│       ├── health/       # Health check
│       └── revalidate/   # Revalidation ISR
├── components/
│   ├── admin/            # Composants admin
│   ├── blog/             # Composants blog
│   └── ui/               # Composants shadcn/ui
├── lib/
│   ├── actions/          # Server Actions
│   ├── openai/           # Intégration OpenAI
│   ├── supabase/         # Client Supabase
│   ├── replicate/        # Génération d'images IA
│   └── validations/      # Schemas Zod
└── types/                # Types TypeScript
```

## Déploiement

### Docker

```bash
# Build
docker build -t vintcluster .

# Run
docker run -p 3000:3000 --env-file .env vintcluster
```

### Docker Compose

```bash
docker-compose up -d
```

### Coolify

Voir [DEPLOY.md](./DEPLOY.md) pour les instructions détaillées.

## API Endpoints

### Cron Jobs

```bash
# Génération automatique
POST /api/cron/generate
Authorization: Bearer $CRON_SECRET

# Publication automatique
POST /api/cron/publish
Authorization: Bearer $CRON_SECRET
```

### Revalidation

```bash
POST /api/revalidate
Authorization: Bearer $REVALIDATION_SECRET
Content-Type: application/json

{
  "domain": "monsite.com"
}
```

### Health Check

```bash
GET /api/health
```

## Workflow

1. **Créer un site** dans l'admin avec domaine et couleurs
2. **Importer des mots-clés** via CSV ou saisie manuelle
3. **Générer des articles** manuellement ou automatiquement
4. **Réviser et publier** les articles générés
5. **Configurer la planification** pour automatiser

## Styles

### Admin
- Design moderne style Notion/Stripe
- Couleur primaire : Indigo
- Composants shadcn/ui

### Blog public
- Style néo-brutaliste
- Bordures 4px noires
- Ombres offset (8px)
- Typographie uppercase bold
- Couleurs vives personnalisables

## Licence

MIT
