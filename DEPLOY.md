# Déploiement VintCluster sur Coolify

## Prérequis

- Coolify v4+ installé sur un serveur
- Accès à un projet Supabase (base de données configurée)
- Clés API: OpenAI, Unsplash
- Domaines configurés (DNS pointant vers le serveur Coolify)

## Étape 1: Créer l'application

1. Dashboard Coolify → **Projects** → Sélectionner/Créer un projet
2. Cliquer **+ New** → **Application**
3. Choisir la source:
   - **GitHub App** (recommandé) : Connecter votre compte GitHub
   - **Public Repository** : Entrer l'URL `https://github.com/Miraubolant/VintCluster.git`

4. Sélectionner la branche: `main`

## Étape 2: Configuration du Build

Dans l'onglet **General** de l'application:

| Paramètre | Valeur |
|-----------|--------|
| **Build Pack** | `Dockerfile` |
| **Dockerfile Location** | `./Dockerfile` |
| **Ports Exposes** | `3000` |

> **Important**: Le port 3000 est celui sur lequel Next.js écoute. Assurez-vous qu'il correspond au `EXPOSE` dans le Dockerfile.

## Étape 3: Variables d'environnement

Dans l'onglet **Environment Variables**, ajouter:

### Variables obligatoires

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# APIs externes
OPENAI_API_KEY=sk-proj-...
UNSPLASH_ACCESS_KEY=...

# Configuration application
NEXT_PUBLIC_ADMIN_DOMAIN=admin.votredomaine.com

# Sécurité (générer des secrets uniques)
CRON_SECRET=votre-secret-cron-unique-32-chars
REVALIDATION_SECRET=votre-secret-revalidation-unique
```

### Comment obtenir les clés Supabase

1. Aller sur [supabase.com](https://supabase.com) → Votre projet
2. **Settings** → **API**
3. Copier:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

## Étape 4: Configuration des domaines

### Domaine Admin (obligatoire)

Dans l'onglet **Domains**, ajouter:
```
https://admin.votredomaine.com
```

### Domaines des blogs (multi-tenant)

**Option A: Domaines individuels**

Ajouter chaque domaine de blog:
```
https://blog1.com
https://blog2.com
https://monblog.fr
```

**Option B: Wildcard (tous les sous-domaines)**

Pour attraper automatiquement tous les sous-domaines, aller dans **Container Labels** et ajouter:

```bash
# Pour Traefik v3
traefik.http.routers.vintcluster-wildcard.rule=HostRegexp(`^.+\.votredomaine\.com$`)
traefik.http.routers.vintcluster-wildcard.entryPoints=https
traefik.http.routers.vintcluster-wildcard.tls=true
traefik.http.routers.vintcluster-wildcard.tls.certresolver=letsencrypt
traefik.http.routers.vintcluster-wildcard.service=vintcluster-service
traefik.http.services.vintcluster-service.loadbalancer.server.port=3000
```

> **Note**: Remplacez `votredomaine.com` par votre domaine réel.

## Étape 5: Configuration DNS

Pour chaque domaine, configurer un enregistrement DNS:

| Type | Nom | Valeur |
|------|-----|--------|
| A | admin | IP_DU_SERVEUR_COOLIFY |
| A | blog1 | IP_DU_SERVEUR_COOLIFY |
| A | @ (pour domaine racine) | IP_DU_SERVEUR_COOLIFY |
| CNAME | www | votredomaine.com |

**Pour wildcard (Option B):**
| Type | Nom | Valeur |
|------|-----|--------|
| A | * | IP_DU_SERVEUR_COOLIFY |

## Étape 6: Health Check

Dans l'onglet **Health Checks**:

| Paramètre | Valeur |
|-----------|--------|
| **Enabled** | ✅ Oui |
| **Path** | `/api/health` |
| **Port** | `3000` |
| **Interval** | `30s` |
| **Timeout** | `5s` |
| **Retries** | `3` |

Ou ajouter dans le Dockerfile (déjà configuré):
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1
```

## Étape 7: Déployer

1. Cliquer **Deploy** en haut à droite
2. Attendre la fin du build (2-5 minutes)
3. Vérifier les logs pour les erreurs éventuelles

## Étape 8: Configuration Cron Jobs

VintCluster nécessite des tâches planifiées pour:
- Générer automatiquement des articles
- Publier les articles prêts

### Option A: Cron externe (Recommandé)

Utiliser un service comme [cron-job.org](https://cron-job.org), [EasyCron](https://www.easycron.com), ou un cron sur votre serveur:

**Génération d'articles** (toutes les 2 heures):
```bash
# Cron expression: 0 */2 * * *
curl -X GET "https://admin.votredomaine.com/api/cron/generate" \
  -H "Authorization: Bearer VOTRE_CRON_SECRET"
```

**Publication d'articles** (tous les jours à 8h):
```bash
# Cron expression: 0 8 * * *
curl -X GET "https://admin.votredomaine.com/api/cron/publish" \
  -H "Authorization: Bearer VOTRE_CRON_SECRET"
```

### Option B: Coolify Scheduled Tasks

Si votre version de Coolify supporte les tâches planifiées:
1. Aller dans **Scheduled Tasks**
2. Ajouter une nouvelle tâche
3. Configurer avec les mêmes commandes curl

## Étape 9: Premier accès

1. Aller sur `https://admin.votredomaine.com/admin/login`
2. Créer un compte admin via Supabase:
   - Dashboard Supabase → **Authentication** → **Users** → **Add User**
   - Ou utiliser le formulaire d'inscription si activé

3. Créer votre premier site:
   - **Admin** → **Sites** → **Ajouter un site**
   - Entrer le domaine exact (sans https://)

## Configuration Webhook (Auto-deploy)

Pour déployer automatiquement à chaque push:

1. Dans Coolify, aller dans **Webhooks** de l'application
2. Copier l'URL du webhook
3. Dans GitHub → **Settings** → **Webhooks** → **Add webhook**
4. Coller l'URL et sélectionner `push` events

## Mise à jour de l'application

```bash
# Push les changements
git add .
git commit -m "Update"
git push origin main

# Coolify rebuild automatiquement si webhook configuré
# Sinon, cliquer "Redeploy" dans Coolify
```

## Troubleshooting

### "Bad Gateway" ou application inaccessible

1. Vérifier que **Ports Exposes** = `3000`
2. Vérifier les logs: **Logs** → **Application Logs**
3. S'assurer que l'application écoute sur `0.0.0.0:3000` (déjà configuré)

### "Site non trouvé" sur un blog

1. Vérifier que le domaine est configuré dans **Admin → Sites**
2. Le domaine doit correspondre exactement (sans `https://`)
3. Vérifier que le DNS pointe vers le bon serveur

### Les images ne s'affichent pas

1. Vérifier `next.config.ts` → `images.remotePatterns`
2. Ajouter les domaines d'images si nécessaire

### Erreur CORS Supabase

1. Dashboard Supabase → **Authentication** → **URL Configuration**
2. Ajouter tous vos domaines dans **Site URL** et **Redirect URLs**

### Health check échoue

1. Vérifier que `/api/health` répond (tester manuellement)
2. Vérifier les logs pour les erreurs de démarrage
3. Augmenter le **Start Period** si l'app met du temps à démarrer

## Architecture réseau

```
                    ┌─────────────────┐
                    │    Coolify      │
                    │   (Traefik)     │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ admin.site.com│   │  blog1.com    │   │  blog2.com    │
└───────────────┘   └───────────────┘   └───────────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  VintCluster    │
                    │   (Next.js)     │
                    │   Port 3000     │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │    Supabase     │
                    │  (PostgreSQL)   │
                    └─────────────────┘
```

L'application détecte automatiquement le domaine via le header `Host` et affiche le contenu approprié.
