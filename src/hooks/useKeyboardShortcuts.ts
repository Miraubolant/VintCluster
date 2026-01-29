"use client";

import { useEffect, useCallback } from "react";

export interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  enabled?: boolean;
  preventDefault?: boolean;
}

export interface UseKeyboardShortcutsOptions {
  shortcuts: ShortcutConfig[];
  enabled?: boolean;
}

/**
 * Hook pour gérer les raccourcis clavier
 *
 * @example
 * useKeyboardShortcuts({
 *   shortcuts: [
 *     { key: 'a', ctrl: true, action: selectAll },
 *     { key: 'Escape', action: clearSelection },
 *     { key: 'Delete', action: handleDelete, enabled: hasSelection },
 *     { key: 'Enter', ctrl: true, action: confirmAction },
 *   ],
 * });
 */
export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
}: UseKeyboardShortcutsOptions): void {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Ignorer si on est dans un input/textarea
      const target = event.target as HTMLElement;
      const isInputFocused =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      for (const shortcut of shortcuts) {
        // Vérifier si le raccourci est activé
        if (shortcut.enabled === false) continue;

        // Vérifier les modificateurs
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        // Vérifier la touche
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          // Pour certaines touches, permettre même si input focusé
          const allowInInput = shortcut.key === "Escape" || (shortcut.ctrl && shortcut.key === "a");

          if (isInputFocused && !allowInInput) continue;

          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.action();
          return;
        }
      }
    },
    [enabled, shortcuts]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}

/**
 * Raccourcis prédéfinis pour les tables
 */
export function useTableKeyboardShortcuts({
  onSelectAll,
  onClearSelection,
  onDelete,
  onConfirm,
  hasSelection = false,
  enabled = true,
}: {
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onDelete?: () => void;
  onConfirm?: () => void;
  hasSelection?: boolean;
  enabled?: boolean;
}): void {
  const shortcuts: ShortcutConfig[] = [];

  if (onSelectAll) {
    shortcuts.push({
      key: "a",
      ctrl: true,
      action: onSelectAll,
      preventDefault: true,
    });
  }

  if (onClearSelection) {
    shortcuts.push({
      key: "Escape",
      action: onClearSelection,
    });
  }

  if (onDelete) {
    shortcuts.push({
      key: "Delete",
      action: onDelete,
      enabled: hasSelection,
    });
  }

  if (onConfirm) {
    shortcuts.push({
      key: "Enter",
      ctrl: true,
      action: onConfirm,
      enabled: hasSelection,
    });
  }

  useKeyboardShortcuts({ shortcuts, enabled });
}
