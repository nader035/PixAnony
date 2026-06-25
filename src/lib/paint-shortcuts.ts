import type { PaintTool } from '@/lib/types';

export type PaintShortcutTool = Exclude<PaintTool, 'text' | 'mirror'>;

export interface PaintToolShortcut {
  tool: PaintShortcutTool;
  label: string;
  shortcut: string;
  aliases: string[];
}

export const PAINT_TOOL_SHORTCUTS: PaintToolShortcut[] = [
  { tool: 'pencil', label: 'Pencil', shortcut: 'B', aliases: ['b', 'p', '1'] },
  { tool: 'eraser', label: 'Eraser', shortcut: 'E', aliases: ['e', '2'] },
  { tool: 'fill', label: 'Fill', shortcut: 'F', aliases: ['f', '3'] },
  { tool: 'line', label: 'Line', shortcut: 'L', aliases: ['l', '4'] },
  { tool: 'rectangle', label: 'Rectangle', shortcut: 'R', aliases: ['r', '5'] },
  { tool: 'circle', label: 'Circle', shortcut: 'C', aliases: ['c', '6'] },
  { tool: 'picker', label: 'Picker', shortcut: 'I', aliases: ['i', '7'] },
  { tool: 'move', label: 'Move / Pan', shortcut: 'Space', aliases: [' ', 'm', '8'] },
];

export const PAINT_SHORTCUT_HELP = [
  ...PAINT_TOOL_SHORTCUTS.map(({ label, shortcut }) => ({ label, shortcut })),
  { label: 'Undo', shortcut: 'Ctrl Z' },
  { label: 'Redo', shortcut: 'Ctrl Y' },
  { label: 'Toggle grid', shortcut: 'G' },
  { label: 'Toggle preview', shortcut: 'V' },
  { label: 'Zoom in / out', shortcut: '+ / -' },
  { label: 'Open shortcuts', shortcut: '?' },
] as const;

const shortcutMap = new Map<string, PaintShortcutTool>(
  PAINT_TOOL_SHORTCUTS.flatMap((item) =>
    item.aliases.map((alias) => [alias.toLowerCase(), item.tool] as const),
  ),
);

export function getPaintToolByShortcut(key: string): PaintShortcutTool | null {
  const normalized = key === ' ' ? ' ' : key.toLowerCase();
  return shortcutMap.get(normalized) ?? null;
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}
