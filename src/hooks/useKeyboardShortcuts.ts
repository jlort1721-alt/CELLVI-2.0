/**
 * Global Keyboard Shortcuts
 * Provides application-wide keyboard navigation
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
}

const shortcuts: ShortcutConfig[] = [];

export function registerShortcut(config: ShortcutConfig) {
  shortcuts.push(config);
}

export function useCommonShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K - Search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        focusSearch();
      }

      // / - Focus search
      if (e.key === '/' && !isInputFocused()) {
        e.preventDefault();
        focusSearch();
      }

      // Cmd/Ctrl + D - Dashboard
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        navigate('/platform');
      }

      // Cmd/Ctrl + T - Tracking
      if ((e.metaKey || e.ctrlKey) && e.key === 't') {
        e.preventDefault();
        navigate('/tracking');
      }

      // Cmd/Ctrl + M - Maintenance
      if ((e.metaKey || e.ctrlKey) && e.key === 'm') {
        e.preventDefault();
        navigate('/mantenimiento');
      }

      // Esc - Close modals/dialogs
      if (e.key === 'Escape') {
        closeTopModal();
      }

      // Check registered shortcuts
      shortcuts.forEach(shortcut => {
        const matchesKey = e.key === shortcut.key;
        const matchesCtrl = !shortcut.ctrlKey || e.ctrlKey;
        const matchesMeta = !shortcut.metaKey || e.metaKey;
        const matchesShift = !shortcut.shiftKey || e.shiftKey;

        if (matchesKey && matchesCtrl && matchesMeta && matchesShift) {
          e.preventDefault();
          shortcut.action();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
}

function isInputFocused(): boolean {
  const activeElement = document.activeElement;
  return (
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement ||
    activeElement?.getAttribute('contenteditable') === 'true'
  );
}

function focusSearch() {
  const searchInput = document.querySelector<HTMLInputElement>('input[type="search"], input[placeholder*="Buscar" i], input[placeholder*="Search" i]');
  searchInput?.focus();
}

function closeTopModal() {
  const escButton = document.querySelector('[data-dialog-close], [data-modal-close]') as HTMLButtonElement;
  escButton?.click();
}

/**
 * Display keyboard shortcuts help
 */
export function useShortcutHelp() {
  return {
    shortcuts: [
      { key: 'Cmd/Ctrl + K', description: 'Buscar' },
      { key: '/', description: 'Enfocar búsqueda' },
      { key: 'Cmd/Ctrl + D', description: 'Dashboard' },
      { key: 'Cmd/Ctrl + T', description: 'Rastreo' },
      { key: 'Cmd/Ctrl + M', description: 'Mantenimiento' },
      { key: 'Esc', description: 'Cerrar modal' },
      ...shortcuts.map(s => ({
        key: `${s.ctrlKey ? 'Ctrl + ' : ''}${s.metaKey ? 'Cmd + ' : ''}${s.shiftKey ? 'Shift + ' : ''}${s.key}`,
        description: s.description,
      })),
    ],
  };
}
