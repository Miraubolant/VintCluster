# Déploiement VintCluster sur Coolify

## Prérequis

- Coolify v4+ installé
- Accès à un projet Supabase
- Clés API: OpenAI, Unsplash

## Configuration Coolify

### 1. Créer une nouvelle application

1. Dashboard Coolify → **New Resource** → **Application**
2. Source: **GitHub** ou **Docker**
3. Sélectionner le repository VintCluster

### 2. Configuration Build

```
Build Pack: Dockerfile
Dockerfile Location: ./Dockerfile
```

### 3. Variables d'environnement

Ajouter dans **Environment Variables**:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase (https://xxx.supabase.co) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anonyme Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role Supabase |
| `OPENAI_API_KEY` | Clé API OpenAI |
| `UNSPLASH_ACCESS_KEY` | Clé API Unsplash |
| `NEXT_PUBLIC_ADMIN_DOMAIN` | Domaine admin (ex: admin.monsite.com) |
| `CRON_SECRET` | Secret pour cron jobs |
| `REVALIDATION_SECRET` | Secret pour revalidation |

### 4. Configuration Domaines

**Pour l'admin:**
- Domaine principal: `admin.votredomaine.com`

**Pour les blogs:**
- Ajouter chaque domaine de blog dans Coolify
- Tous pointent vers la même application

### 5. Health Check

```
Path: /api/health
Port: 3000
```

### 6. Cron Jobs

Configurer dans Coolify ou via un service externe:

**Génération automatique** (toutes les 2h):
```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://admin.votredomaine.com/api/cron/generate
```

**Publication automatique** (8h chaque jour):
```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://admin.votredomaine.com/api/cron/publish
```

## Multi-domaines

L'application détecte automatiquement le domaine via le header `Host`.

1. Créer un site dans l'admin avec le domaine souhaité
2. Ajouter le domaine dans Coolify → Domains
3. Le blog est automatiquement accessible sur ce domaine

## Mise à jour

```bash
git push origin main
# Coolify rebuild automatique si webhook configuré
```

## Troubleshooting

**Le blog affiche "Site non trouvé":**
- Vérifier que le domaine est bien configuré dans la table `sites`
- Le domaine doit correspondre exactement (sans https://)

**Les images ne s'affichent pas:**
- Vérifier la configuration `images.remotePatterns` dans next.config.ts

**Erreur CORS:**
- Ajouter les domaines dans les CORS Supabase
