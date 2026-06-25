'use client';

import { useEffect } from 'react';
import { usePaintStore } from '@/stores/paint-store';
import { getPaintToolByShortcut, isTypingTarget } from '@/lib/paint-shortcuts';

interface UsePaintKeyboardShortcutsOptions {
  disabled?: boolean;
  onHelp?: () => void;
  onEscape?: () => void;
}

export function usePaintKeyboardShortcuts({
  disabled = false,
  onHelp,
  onEscape,
}: UsePaintKeyboardShortcutsOptions = {}) {
  const {
    setTool,
    toggleGrid,
    togglePreview,
    undo,
    redo,
    zoom,
    setZoom,
  } = usePaintStore();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;

      const key = event.key;
      const lowerKey = key.toLowerCase();
      const commandKey = event.ctrlKey || event.metaKey;

      if (key === 'Escape') {
        onEscape?.();
        return;
      }

      if (disabled) return;

      if (commandKey && lowerKey === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
        return;
      }

      if ((commandKey && lowerKey === 'y') || (commandKey && lowerKey === 'z' && event.shiftKey)) {
        event.preventDefault();
        redo();
        return;
      }

      if (event.altKey || event.ctrlKey || event.metaKey) return;

      if (key === '?' || (event.shiftKey && key === '/')) {
        event.preventDefault();
        onHelp?.();
        return;
      }

      if (lowerKey === 'g') {
        event.preventDefault();
        toggleGrid();
        return;
      }

      if (lowerKey === 'v') {
        event.preventDefault();
        togglePreview();
        return;
      }

      if (key === '+' || key === '=') {
        event.preventDefault();
        setZoom(zoom + 20);
        return;
      }

      if (key === '-' || key === '_') {
        event.preventDefault();
        setZoom(zoom - 20);
        return;
      }

      const tool = getPaintToolByShortcut(key);
      if (tool) {
        event.preventDefault();
        setTool(tool);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    disabled,
    onEscape,
    onHelp,
    redo,
    setTool,
    setZoom,
    toggleGrid,
    togglePreview,
    undo,
    zoom,
  ]);
}
