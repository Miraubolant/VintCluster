"use client";

import { useState, useMemo, useCallback } from "react";

export interface UseTableStateOptions<T> {
  items: T[];
  getItemId: (item: T) => string;
  initialFilters?: Record<string, string | null>;
  initialSortBy?: string | null;
  initialSortOrder?: "asc" | "desc";
}

export interface UseTableStateReturn<T> {
  // Sélection
  selectedIds: string[];
  isSelected: (id: string) => boolean;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  toggleOne: (id: string) => void;
  toggleAll: () => void;
  clearSelection: () => void;
  selectAll: () => void;
  setSelectedIds: (ids: string[]) => void;

  // Filtres
  filters: Record<string, string | null>;
  setFilter: (key: string, value: string | null) => void;
  resetFilters: () => void;

  // Tri
  sortBy: string | null;
  sortOrder: "asc" | "desc";
  setSort: (column: string) => void;
  setSortOrder: (order: "asc" | "desc") => void;

  // Items
  filteredItems: T[];
  selectedItems: T[];
  totalCount: number;
  selectedCount: number;
}

export function useTableState<T>({
  items,
  getItemId,
  initialFilters = {},
  initialSortBy = null,
  initialSortOrder = "desc",
}: UseTableStateOptions<T>): UseTableStateReturn<T> {
  // State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<Record<string, string | null>>(initialFilters);
  const [sortBy, setSortBy] = useState<string | null>(initialSortBy);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(initialSortOrder);

  // Computed values
  const itemIds = useMemo(() => items.map(getItemId), [items, getItemId]);

  const filteredItems = useMemo(() => {
    // Pour l'instant, le filtrage est géré côté serveur
    // Ce hook gère principalement la sélection
    return items;
  }, [items]);

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.includes(getItemId(item))),
    [items, selectedIds, getItemId]
  );

  const isAllSelected = useMemo(
    () => filteredItems.length > 0 && selectedIds.length === filteredItems.length,
    [filteredItems.length, selectedIds.length]
  );

  const isIndeterminate = useMemo(
    () => selectedIds.length > 0 && selectedIds.length < filteredItems.length,
    [selectedIds.length, filteredItems.length]
  );

  // Selection actions
  const isSelected = useCallback(
    (id: string) => selectedIds.includes(id),
    [selectedIds]
  );

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const toggleAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(itemIds);
    }
  }, [isAllSelected, itemIds]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(itemIds);
  }, [itemIds]);

  // Filter actions
  const setFilter = useCallback((key: string, value: string | null) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    // Clear selection when filters change
    setSelectedIds([]);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setSelectedIds([]);
  }, [initialFilters]);

  // Sort actions
  const setSort = useCallback((column: string) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  }, [sortBy]);

  return {
    // Sélection
    selectedIds,
    isSelected,
    isAllSelected,
    isIndeterminate,
    toggleOne,
    toggleAll,
    clearSelection,
    selectAll,
    setSelectedIds,

    // Filtres
    filters,
    setFilter,
    resetFilters,

    // Tri
    sortBy,
    sortOrder,
    setSort,
    setSortOrder,

    // Items
    filteredItems,
    selectedItems,
    totalCount: filteredItems.length,
    selectedCount: selectedIds.length,
  };
}
