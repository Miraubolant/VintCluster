# Plan de Refactorisation - Admin Dashboard VintCluster

## Résumé des Décisions

| Aspect | Décision |
|--------|----------|
| **Toolbar sélection** | Barre fixe en haut (style Articles) |
| **Progress Bar** | Flottante bas-droite (actuel) |
| **Modales** | Modal centrée (actuel) |
| **Mobile** | Responsive complet |
| **State management** | Hook `useTableState` |
| **Limite bulk** | Pas de limite |
| **Raccourcis clavier** | Complets (Ctrl+A, Escape, Delete, Ctrl+Enter, flèches) |
| **Confirmation suppression** | Simple (Annuler/Confirmer) |
| **Wizards** | Garder étapes actuelles |
| **Page prioritaire** | Articles (modèle de référence) |
| **Migration** | Supprimer immédiatement les anciens composants |

---

## Phase 1 : Composants Génériques (Base)

### 1.1 Hook `useTableState`
**Fichier :** `src/hooks/useTableState.ts`

```typescript
interface UseTableStateOptions<T> {
  items: T[];
  getItemId: (item: T) => string;
  initialFilters?: Record<string, any>;
}

interface UseTableStateReturn<T> {
  // Sélection
  selectedIds: string[];
  isSelected: (id: string) => boolean;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  toggleOne: (id: string) => void;
  toggleAll: () => void;
  clearSelection: () => void;
  selectAll: () => void;

  // Filtres
  filters: Record<string, any>;
  setFilter: (key: string, value: any) => void;
  resetFilters: () => void;

  // Tri
  sortBy: string | null;
  sortOrder: 'asc' | 'desc';
  setSort: (column: string) => void;

  // Items filtrés
  filteredItems: T[];
  selectedItems: T[];
}
```

**Fonctionnalités :**
- Gestion sélection (single, all, clear)
- Support checkbox indeterminate
- Filtres dynamiques
- Tri par colonne
- Raccourcis clavier intégrés

---

### 1.2 Composant `<DataTable>`
**Fichier :** `src/components/admin/shared/DataTable.tsx`

```typescript
interface Column<T> {
  key: string;
  header: string;
  cell: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  items: T[];
  columns: Column<T>[];
  getItemId: (item: T) => string;

  // Sélection (optionnel)
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;

  // Actions row (optionnel)
  rowActions?: (item: T) => React.ReactNode;

  // États
  loading?: boolean;
  emptyMessage?: string;

  // Styles
  className?: string;
  rowClassName?: (item: T) => string;
}
```

**Fonctionnalités :**
- Colonnes configurables avec render custom
- Checkbox de sélection optionnelle
- Menu actions par ligne (dropdown)
- État loading avec skeleton
- Message vide personnalisable
- Highlight ligne sélectionnée
- Responsive (colonnes cachées sur mobile)

---

### 1.3 Composant `<SelectionToolbar>`
**Fichier :** `src/components/admin/shared/SelectionToolbar.tsx`

```typescript
interface SelectionToolbarProps {
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  onSelectAll: () => void;
  children: React.ReactNode; // Actions custom
  className?: string;
}
```

**Design :**
```
┌─────────────────────────────────────────────────────────────────┐
│ ☑ 15 sélectionné(s) sur 234   [Tout] [Aucun]    │ [Actions...] │
└─────────────────────────────────────────────────────────────────┘
```

**Fonctionnalités :**
- Badge compteur sélection
- Boutons Tout/Aucun
- Slot pour actions custom (boutons, dropdowns)
- Animation apparition/disparition
- Style indigo cohérent

---

### 1.4 Composant `<StatsGrid>`
**Fichier :** `src/components/admin/shared/StatsGrid.tsx`

```typescript
interface StatCard {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: 'indigo' | 'green' | 'orange' | 'red' | 'purple' | 'blue';
  suffix?: string;
  trend?: { value: number; isPositive: boolean };
}

interface StatsGridProps {
  stats: StatCard[];
  columns?: 2 | 3 | 4 | 5 | 6;
  loading?: boolean;
  className?: string;
}
```

**Design :**
- Cards avec icône colorée
- Valeur grande + label petit
- Option trend (+12% ↑)
- Grid responsive (2 cols mobile, N cols desktop)

---

### 1.5 Composant `<FilterBar>`
**Fichier :** `src/components/admin/shared/FilterBar.tsx`

```typescript
interface FilterConfig {
  key: string;
  type: 'search' | 'select' | 'multi-select' | 'date-range';
  label: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

interface FilterBarProps {
  filters: FilterConfig[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onReset?: () => void;
  className?: string;
}
```

**Design :**
```
┌──────────────────────────────────────────────────────────────┐
│ 🔍 [Rechercher...    ] │ Site: [Tous ▼] │ Status: [Tous ▼] │
└──────────────────────────────────────────────────────────────┘
```

---

### 1.6 Composant `<ConfirmDialog>`
**Fichier :** `src/components/admin/shared/ConfirmDialog.tsx`

```typescript
interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}
```

---

### 1.7 Hook `useKeyboardShortcuts`
**Fichier :** `src/hooks/useKeyboardShortcuts.ts`

```typescript
interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  action: () => void;
  enabled?: boolean;
}

function useKeyboardShortcuts(shortcuts: ShortcutConfig[]): void;
```

**Raccourcis par défaut :**
| Raccourci | Action |
|-----------|--------|
| `Ctrl+A` | Tout sélectionner |
| `Escape` | Désélectionner tout |
| `Delete` | Supprimer sélection (si callback fourni) |
| `Ctrl+Enter` | Confirmer action en cours |
| `↑/↓` | Navigation dans la table |

---

## Phase 2 : Refactorisation Page Articles (Modèle)

### 2.1 Fichiers à modifier

| Fichier Actuel | Action | Nouveau Fichier |
|----------------|--------|-----------------|
| `ArticlesTable.tsx` | Remplacer | Utilise `<DataTable>` |
| `ArticlesStats.tsx` | Remplacer | Utilise `<StatsGrid>` |
| `articles/page.tsx` | Refactoriser | Utilise nouveaux composants |

### 2.2 Structure cible

```tsx
// articles/page.tsx
export default function ArticlesPage() {
  const { data: articles } = useArticles(filters);
  const { data: stats } = useArticleStats();

  const table = useTableState({
    items: articles,
    getItemId: (a) => a.id,
  });

  useKeyboardShortcuts([
    { key: 'a', ctrl: true, action: table.selectAll },
    { key: 'Escape', action: table.clearSelection },
    { key: 'Delete', action: handleBulkDelete, enabled: table.selectedIds.length > 0 },
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Articles" actions={<CreateButton />} />

      <StatsGrid stats={articleStats} columns={4} />

      <FilterBar
        filters={ARTICLE_FILTERS}
        values={table.filters}
        onChange={table.setFilter}
      />

      {table.selectedIds.length > 0 && (
        <SelectionToolbar
          selectedCount={table.selectedIds.length}
          totalCount={articles.length}
          onClearSelection={table.clearSelection}
          onSelectAll={table.selectAll}
        >
          <BulkStatusDropdown />
          <BulkRegenerateButton />
          <BulkImproveButton />
          <BulkIndexNowButton />
          <BulkDeleteButton />
        </SelectionToolbar>
      )}

      <DataTable
        items={table.filteredItems}
        columns={ARTICLE_COLUMNS}
        getItemId={(a) => a.id}
        selectable
        selectedIds={table.selectedIds}
        onSelectionChange={table.setSelectedIds}
        rowActions={(article) => <ArticleRowActions article={article} />}
      />
    </div>
  );
}
```

### 2.3 Colonnes Articles

```typescript
const ARTICLE_COLUMNS: Column<Article>[] = [
  {
    key: 'title',
    header: 'Article',
    cell: (a) => (
      <div className="flex items-center gap-3">
        {a.image_url && <Thumbnail src={a.image_url} />}
        <div>
          <div className="font-medium">{a.title}</div>
          <div className="text-sm text-gray-500">{a.slug}</div>
        </div>
      </div>
    ),
  },
  { key: 'site', header: 'Site', cell: (a) => a.site?.name || '-' },
  { key: 'keyword', header: 'Mot-clé', cell: (a) => a.keyword?.keyword || '-' },
  {
    key: 'status',
    header: 'Statut',
    cell: (a) => <StatusBadge status={a.status} />,
  },
  {
    key: 'created_at',
    header: 'Date',
    cell: (a) => formatDate(a.created_at),
    sortable: true,
  },
];
```

---

## Phase 3 : Refactorisation Pages Restantes

### 3.1 Page Sites

**Nouvelles fonctionnalités bulk :**
- ✅ Template (existant)
- ✅ SEO generation (existant)
- ➕ Suppression bulk
- ➕ Export configs
- ➕ Favicon generation bulk

**Colonnes Sites :**
```typescript
const SITE_COLUMNS: Column<Site>[] = [
  { key: 'name', header: 'Site', cell: (s) => s.name },
  { key: 'domain', header: 'Domaine', cell: (s) => <ExternalLink href={s.domain} /> },
  { key: 'keywords', header: 'Mots-clés', cell: (s) => <Badge>{s.keywordsCount}</Badge> },
  { key: 'articles', header: 'Articles', cell: (s) => <Badge>{s.articlesCount}</Badge> },
  { key: 'template', header: 'Template', cell: (s) => <TemplateBadge template={s.template} /> },
  { key: 'colors', header: 'Couleurs', cell: (s) => <ColorSwatches primary={s.primary_color} secondary={s.secondary_color} /> },
  { key: 'seo', header: 'SEO', cell: (s) => s.meta_title ? <Badge color="green">OK</Badge> : '-' },
];
```

---

### 3.2 Page Keywords

**Nouvelles fonctionnalités bulk :**
- ✅ Status change (existant)
- ✅ Delete (existant)
- ➕ Génération articles bulk (avec progress)
- ➕ Export CSV
- ➕ Assignation site bulk

**Colonnes Keywords :**
```typescript
const KEYWORD_COLUMNS: Column<Keyword>[] = [
  { key: 'keyword', header: 'Mot-clé', cell: (k) => <span className="font-medium">{k.keyword}</span> },
  { key: 'site', header: 'Site', cell: (k) => k.site?.name || <Badge variant="outline">Global</Badge> },
  { key: 'status', header: 'Statut', cell: (k) => <KeywordStatusBadge status={k.status} generating={isGenerating(k.id)} /> },
  { key: 'priority', header: 'Priorité', cell: (k) => k.priority, sortable: true },
  { key: 'volume', header: 'Volume', cell: (k) => k.search_volume || '-' },
  { key: 'created_at', header: 'Date', cell: (k) => formatDate(k.created_at), sortable: true },
];
```

---

### 3.3 Page Scheduler (Conversion en Table)

**Conversion des cards en tableau :**

**Colonnes Scheduler :**
```typescript
const SCHEDULER_COLUMNS: Column<SchedulerConfig>[] = [
  {
    key: 'site',
    header: 'Site',
    cell: (c) => (
      <div>
        <div className="font-medium">{c.site?.name}</div>
        <div className="text-sm text-gray-500">{c.site?.domain}</div>
      </div>
    ),
  },
  {
    key: 'enabled',
    header: 'Actif',
    cell: (c) => <Switch checked={c.enabled} onChange={() => toggleEnabled(c.site_id)} />,
  },
  { key: 'articles', header: 'Articles', cell: (c) => <Badge color="blue">{c.articlesCount}</Badge> },
  { key: 'keywords', header: 'Mots-clés', cell: (c) => <Badge>{c.keyword_ids?.length || 0}</Badge> },
  { key: 'schedule', header: 'Planning', cell: (c) => <ScheduleSummary config={c} /> },
  { key: 'auto_publish', header: 'Auto-pub', cell: (c) => c.auto_publish ? '✓' : '-' },
];
```

**Actions bulk Scheduler :**
- Activer/Désactiver bulk
- Génération bulk (existant, à migrer)
- Configuration bulk (même schedule)

---

### 3.4 Page Logs (Inchangée)

Garder en lecture seule, seulement adapter le style avec `<DataTable>` sans sélection.

---

## Phase 4 : Migration Progress Bar

### 4.1 Unification BulkProgressContext

Le contexte actuel est bon, mais s'assurer qu'il est utilisé partout :

**Pages utilisant la progress bar :**
- ✅ Articles (amélioration IA, régénération images)
- ✅ Scheduler (génération bulk)
- ➕ Sites (SEO generation, favicon generation)
- ➕ Keywords (génération articles bulk)

**Modifications :**
```typescript
// Ajouter au contexte
interface BulkProgressState {
  isRunning: boolean;
  total: number;
  completed: number;
  currentItem: string | null;
  errors: string[];
  results: Array<{ label: string; success: boolean; message?: string }>;
  operationType: 'generate' | 'improve' | 'seo' | 'favicon' | 'delete' | 'export';
}
```

---

## Phase 5 : Harmonisation Modales

### 5.1 Liste des modales à harmoniser

| Modale | Page | Action |
|--------|------|--------|
| AddSiteDialog | Sites | Utiliser `<FormDialog>` |
| DeleteSiteDialog | Sites | Utiliser `<ConfirmDialog>` |
| ImportKeywordsDialog | Keywords | Garder (wizard multi-step) |
| GenerateArticleDialog | Articles | Garder (tabs) |
| CreateArticleDialog | Articles | Utiliser `<FormDialog>` |
| ArticlePreviewDialog | Articles | Garder (lecture seule) |
| EditArticleForm | Articles | Page dédiée (garder) |
| SchedulerConfigDialog | Scheduler | Utiliser `<FormDialog>` |
| BulkGenerationDialog | Scheduler | Garder (wizard complexe) |
| RegenerateImagesDialog | Articles | Utiliser `<FormDialog>` simple |
| ImproveArticlesDialog | Articles | Utiliser `<FormDialog>` simple |

### 5.2 Nouveau composant `<FormDialog>`

```typescript
interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  onSubmit: () => void | Promise<void>;
  submitLabel?: string;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
```

---

## Phase 6 : Responsive Mobile

### 6.1 Adaptations DataTable

```typescript
// Colonnes avec visibilité responsive
interface Column<T> {
  // ...
  hideOnMobile?: boolean;  // Cacher sur écrans < 768px
  hideOnTablet?: boolean;  // Cacher sur écrans < 1024px
}
```

### 6.2 Adaptations Toolbar

- Mobile : Actions dans menu hamburger
- Desktop : Actions en ligne

### 6.3 Adaptations FilterBar

- Mobile : Filtres dans drawer/bottom-sheet
- Desktop : Filtres en ligne

---

## Ordre d'Implémentation

### Semaine 1 : Fondations
1. [ ] Créer `useTableState` hook
2. [ ] Créer `useKeyboardShortcuts` hook
3. [ ] Créer `<DataTable>` composant
4. [ ] Créer `<SelectionToolbar>` composant

### Semaine 2 : Composants Support
5. [ ] Créer `<StatsGrid>` composant
6. [ ] Créer `<FilterBar>` composant
7. [ ] Créer `<ConfirmDialog>` composant
8. [ ] Créer `<FormDialog>` composant

### Semaine 3 : Page Articles (Modèle)
9. [ ] Refactoriser `articles/page.tsx`
10. [ ] Supprimer `ArticlesTable.tsx` (ancien)
11. [ ] Supprimer `ArticlesStats.tsx` (ancien)
12. [ ] Tester intégration complète

### Semaine 4 : Pages Sites & Keywords
13. [ ] Refactoriser `sites/page.tsx`
14. [ ] Ajouter nouvelles actions bulk Sites
15. [ ] Refactoriser `keywords/page.tsx`
16. [ ] Ajouter nouvelles actions bulk Keywords
17. [ ] Supprimer anciens composants

### Semaine 5 : Scheduler & Finalisation
18. [ ] Convertir Scheduler en tableau
19. [ ] Migrer BulkGenerationDialog
20. [ ] Adapter page Logs
21. [ ] Tests responsive mobile
22. [ ] Documentation composants

---

## Fichiers à Supprimer (Fin de Migration)

```
src/components/admin/
├── articles/
│   ├── ArticlesTable.tsx          ❌ Supprimer
│   └── ArticlesStats.tsx          ❌ Supprimer
├── keywords/
│   ├── KeywordsTable.tsx          ❌ Supprimer
│   ├── KeywordsStats.tsx          ❌ Supprimer
│   ├── KeywordsFilters.tsx        ❌ Supprimer
│   └── BulkActions.tsx            ❌ Supprimer
├── sites/
│   └── SitesTable.tsx             ❌ Supprimer (remplacé)
├── scheduler/
│   ├── SchedulerStats.tsx         ❌ Supprimer
│   └── SchedulerConfigCard.tsx    ❌ Supprimer
└── logs/
    ├── LogsTable.tsx              ❌ Supprimer
    ├── LogsStats.tsx              ❌ Supprimer
    └── LogsFilters.tsx            ❌ Supprimer
```

---

## Nouveaux Fichiers (Structure Finale)

```
src/
├── hooks/
│   ├── useTableState.ts           ✅ Nouveau
│   ├── useKeyboardShortcuts.ts    ✅ Nouveau
│   └── useBulkOperation.ts        ✅ Nouveau (optionnel)
├── components/admin/
│   ├── shared/
│   │   ├── DataTable.tsx          ✅ Nouveau
│   │   ├── SelectionToolbar.tsx   ✅ Nouveau
│   │   ├── StatsGrid.tsx          ✅ Nouveau
│   │   ├── FilterBar.tsx          ✅ Nouveau
│   │   ├── ConfirmDialog.tsx      ✅ Nouveau
│   │   ├── FormDialog.tsx         ✅ Nouveau
│   │   ├── StatusBadge.tsx        ✅ Nouveau (unifié)
│   │   └── index.ts               ✅ Exports
│   ├── articles/
│   │   ├── ArticleColumns.tsx     ✅ Nouveau (définition colonnes)
│   │   ├── ArticleRowActions.tsx  ✅ Nouveau (menu actions)
│   │   └── ArticleBulkActions.tsx ✅ Nouveau (boutons bulk)
│   ├── keywords/
│   │   ├── KeywordColumns.tsx     ✅ Nouveau
│   │   ├── KeywordRowActions.tsx  ✅ Nouveau
│   │   └── KeywordBulkActions.tsx ✅ Nouveau
│   ├── sites/
│   │   ├── SiteColumns.tsx        ✅ Nouveau
│   │   ├── SiteRowActions.tsx     ✅ Nouveau
│   │   └── SiteBulkActions.tsx    ✅ Nouveau
│   └── scheduler/
│       ├── SchedulerColumns.tsx   ✅ Nouveau
│       └── SchedulerBulkActions.tsx ✅ Nouveau
```

---

## Tests à Effectuer

### Tests Fonctionnels
- [ ] Sélection single/all/clear sur chaque page
- [ ] Raccourcis clavier fonctionnels
- [ ] Bulk operations avec progress bar
- [ ] Annulation en cours d'opération
- [ ] Filtres et tri fonctionnels
- [ ] Actions row (edit, delete, etc.)

### Tests Responsive
- [ ] Tables lisibles sur mobile (colonnes cachées)
- [ ] Toolbar adaptée mobile (menu hamburger)
- [ ] Filtres en drawer sur mobile
- [ ] Progress bar visible sur mobile

### Tests Performance
- [ ] Sélection 100+ items fluide
- [ ] Filtrage temps réel réactif
- [ ] Pas de re-render inutiles

---

## Notes Techniques

### Convention de Nommage
- Composants génériques : `src/components/admin/shared/`
- Colonnes par entité : `{Entity}Columns.tsx`
- Actions row : `{Entity}RowActions.tsx`
- Actions bulk : `{Entity}BulkActions.tsx`

### Patterns à Suivre
- Composition over inheritance
- Render props pour customisation
- Hooks pour logique réutilisable
- Types génériques pour flexibilité

### Dépendances Existantes (pas de nouvelles)
- shadcn/ui (Dialog, DropdownMenu, Table, etc.)
- lucide-react (icônes)
- sonner (toasts)
- Tailwind CSS

---

## Validation Finale

Avant de considérer la migration terminée :

1. [ ] Toutes les pages utilisent les nouveaux composants
2. [ ] Anciens composants supprimés
3. [ ] Tests manuels passés
4. [ ] Responsive testé sur mobile réel
5. [ ] Performance validée (100+ items)
6. [ ] Documentation à jour (CLAUDE.md)
