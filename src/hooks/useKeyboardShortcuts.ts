/**
 * Keyboard Shortcuts Hook
 * Provides global keyboard navigation and command shortcuts
 * WCAG 2.1 Success Criterion 2.1.1 (Keyboard Accessible)
 */

import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { announce } from '@/components/accessibility/LiveRegion';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean; // Command on Mac
  description: string;
  action: () => void;
  preventDefault?: boolean;
  enabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
  announceShortcut?: boolean;
}

export const useKeyboardShortcuts = (options: UseKeyboardShortcutsOptions) => {
  const { shortcuts, enabled = true, announceShortcut = false } = options;
  const shortcutsRef = useRef(shortcuts);

  // Update ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs/textareas
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Exception: Allow Escape key
        if (event.key !== 'Escape') {
          return;
        }
      }

      // Find matching shortcut
      const matchingShortcut = shortcutsRef.current.find((shortcut) => {
        if (shortcut.enabled === false) return false;

        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const metaMatch = shortcut.meta ? event.metaKey : !event.metaKey;

        return keyMatch && ctrlMatch && altMatch && shiftMatch && (shortcut.ctrl ? true : metaMatch);
      });

      if (matchingShortcut) {
        if (matchingShortcut.preventDefault !== false) {
          event.preventDefault();
        }

        matchingShortcut.action();

        if (announceShortcut) {
          announce(`Atajo activado: ${matchingShortcut.description}`, 'polite');
        }
      }
    },
    [enabled, announceShortcut]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  return {
    shortcuts: shortcutsRef.current,
  };
};

/**
 * Common application shortcuts
 */
export const useCommonShortcuts = () => {
  const navigate = useNavigate();

  const shortcuts: KeyboardShortcut[] = [
    // Navigation
    {
      key: 'g',
      description: 'Ir al dashboard general',
      action: () => navigate('/platform'),
    },
    {
      key: 'm',
      description: 'Ir al mapa de rastreo',
      action: () => navigate('/platform/tracking'),
    },
    {
      key: 'a',
      description: 'Ir a alertas',
      action: () => navigate('/platform/alerts'),
    },
    {
      key: 'r',
      description: 'Ir a reportes',
      action: () => navigate('/platform/reports'),
    },
    {
      key: 'i',
      description: 'Ir a inspecciones',
      action: () => navigate('/platform/checklist'),
    },

    // Search
    {
      key: 'k',
      ctrl: true,
      description: 'Abrir búsqueda global',
      action: () => {
        const searchInput = document.getElementById('search-input') as HTMLInputElement;
        searchInput?.focus();
      },
    },
    {
      key: '/',
      description: 'Enfocar búsqueda',
      action: () => {
        const searchInput = document.getElementById('search-input') as HTMLInputElement;
        searchInput?.focus();
      },
    },

    // UI
    {
      key: 'Escape',
      description: 'Cerrar modal/diálogo',
      action: () => {
        // Trigger escape on topmost dialog
        const dialogs = document.querySelectorAll('[role="dialog"]');
        if (dialogs.length > 0) {
          const topDialog = dialogs[dialogs.length - 1];
          const closeButton = topDialog.querySelector('[aria-label*="Cerrar"], [aria-label*="Close"]');
          if (closeButton instanceof HTMLElement) {
            closeButton.click();
          }
        }
      },
      preventDefault: false,
    },

    // Help
    {
      key: '?',
      shift: true,
      description: 'Mostrar atajos de teclado',
      action: () => {
        announce('Presiona las teclas mostradas para navegar rápidamente', 'polite');
        // You can implement a modal showing all shortcuts here
      },
    },
  ];

  useKeyboardShortcuts({
    shortcuts,
    enabled: true,
    announceShortcut: false,
  });

  return shortcuts;
};

/**
 * Format shortcut for display
 */
export const formatShortcut = (shortcut: KeyboardShortcut): string => {
  const parts: string[] = [];

  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.meta) parts.push('Cmd');

  parts.push(shortcut.key.toUpperCase());

  return parts.join(' + ');
};
