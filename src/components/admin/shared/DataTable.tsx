"use client";

import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  cell: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
}

export interface DataTableProps<T> {
  items: T[];
  columns: Column<T>[];
  getItemId: (item: T) => string;

  // Sélection (optionnel)
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;

  // Actions row (optionnel)
  rowActions?: (item: T) => React.ReactNode;

  // Tri (optionnel)
  sortBy?: string | null;
  sortOrder?: "asc" | "desc";
  onSort?: (column: string) => void;

  // États
  loading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;

  // Styles
  className?: string;
  rowClassName?: (item: T) => string;
}

export function DataTable<T>({
  items,
  columns,
  getItemId,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  rowActions,
  sortBy,
  sortOrder,
  onSort,
  loading = false,
  emptyMessage = "Aucun élément",
  emptyDescription,
  className,
  rowClassName,
}: DataTableProps<T>) {
  // Computed values
  const isAllSelected = useMemo(
    () => items.length > 0 && selectedIds.length === items.length,
    [items.length, selectedIds.length]
  );

  const isIndeterminate = useMemo(
    () => selectedIds.length > 0 && selectedIds.length < items.length,
    [selectedIds.length, items.length]
  );

  // Handlers
  const handleToggleAll = () => {
    if (!onSelectionChange) return;
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(items.map(getItemId));
    }
  };

  const handleToggleOne = (id: string) => {
    if (!onSelectionChange) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className={cn("bg-white rounded-lg border border-gray-200 overflow-hidden", className)}>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              {selectable && (
                <TableHead className="w-[50px]">
                  <Skeleton className="h-4 w-4" />
                </TableHead>
              )}
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    "font-semibold text-gray-700",
                    col.headerClassName,
                    col.hideOnMobile && "hidden md:table-cell",
                    col.hideOnTablet && "hidden lg:table-cell"
                  )}
                >
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
              {rowActions && <TableHead className="w-[50px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {selectable && (
                  <TableCell>
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                )}
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    className={cn(
                      col.hideOnMobile && "hidden md:table-cell",
                      col.hideOnTablet && "hidden lg:table-cell"
                    )}
                  >
                    <Skeleton className="h-4 w-full max-w-[200px]" />
                  </TableCell>
                ))}
                {rowActions && (
                  <TableCell>
                    <Skeleton className="h-8 w-8" />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className={cn("bg-white rounded-lg border border-gray-200 p-8 text-center", className)}>
        <p className="text-gray-500">{emptyMessage}</p>
        {emptyDescription && (
          <p className="text-sm text-gray-400 mt-1">{emptyDescription}</p>
        )}
      </div>
    );
  }

  return (
    <div className={cn("bg-white rounded-lg border border-gray-200 overflow-hidden", className)}>
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            {selectable && (
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={isIndeterminate ? "indeterminate" : isAllSelected}
                  onCheckedChange={handleToggleAll}
                  aria-label="Sélectionner tout"
                />
              </TableHead>
            )}
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={cn(
                  "font-semibold text-gray-700",
                  col.headerClassName,
                  col.hideOnMobile && "hidden md:table-cell",
                  col.hideOnTablet && "hidden lg:table-cell",
                  col.sortable && onSort && "cursor-pointer hover:bg-gray-100 select-none"
                )}
                onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && sortBy === col.key && (
                    <span className="text-xs">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </TableHead>
            ))}
            {rowActions && <TableHead className="w-[50px]" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const id = getItemId(item);
            const isSelected = selectedIds.includes(id);

            return (
              <TableRow
                key={id}
                className={cn(
                  "hover:bg-gray-50 transition-colors",
                  isSelected && "bg-indigo-50 hover:bg-indigo-50",
                  rowClassName?.(item)
                )}
              >
                {selectable && (
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleOne(id)}
                      aria-label={`Sélectionner l'élément`}
                    />
                  </TableCell>
                )}
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    className={cn(
                      col.className,
                      col.hideOnMobile && "hidden md:table-cell",
                      col.hideOnTablet && "hidden lg:table-cell"
                    )}
                  >
                    {col.cell(item)}
                  </TableCell>
                ))}
                {rowActions && <TableCell>{rowActions(item)}</TableCell>}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
