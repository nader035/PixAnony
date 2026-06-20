'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, ChevronDown, Check } from '@/components/ui/icons';
import { usePaintStore } from '@/stores/paint-store';
import { PALETTES } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function ColorPalette({ compact = false }: { compact?: boolean }) {
  const {
    color, setColor, activePalette, setActivePalette,
    recentColors, addRecentColor,
  } = usePaintStore();

  const [hexInput, setHexInput] = useState(color);
  const [showPaletteDropdown, setShowPaletteDropdown] = useState(false);
  const [customColors, setCustomColors] = useState<string[]>([]);

  const currentPalette = PALETTES.find(p => p.name === activePalette) ?? PALETTES[0];

  const handleHexChange = useCallback((value: string) => {
    setHexInput(value);
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      setColor(value.toUpperCase());
    }
  }, [setColor]);

  const handleHexBlur = useCallback(() => {
    if (/^#[0-9A-Fa-f]{6}$/.test(hexInput)) {
      setColor(hexInput.toUpperCase());
    } else {
      setHexInput(color);
    }
  }, [hexInput, color, setColor]);

  const handleColorClick = useCallback((c: string) => {
    setColor(c);
    setHexInput(c);
    addRecentColor(c);
  }, [setColor, addRecentColor]);

  const handleAddCustomColor = useCallback(() => {
    if (!customColors.includes(color)) {
      setCustomColors(prev => [...prev, color]);
    }
  }, [color, customColors]);

  // Sync hex input when color changes externally
  const displayHex = color === 'transparent' ? '#FFFFFF' : color;
  if (hexInput !== displayHex && /^#[0-9A-Fa-f]{6}$/.test(displayHex)) {
    // Will update on next render if needed
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className={cn(
        'bg-surface border border-border',
        compact ? 'flex items-center gap-2 overflow-x-auto rounded-xl p-1.5 hide-scrollbar' : 'flex flex-col gap-3 p-3 rounded-xl'
      )}
    >
      {/* Header */}
      <div className={cn('text-[10px] font-semibold text-text-muted uppercase tracking-wider', compact && 'hidden')}>
        Colors
      </div>

      {/* Current Color + Hex */}
      <div className={cn('flex items-center gap-2', compact && 'flex-shrink-0')}>
        <div
          className={cn('rounded-lg border-2 border-border shadow-inner flex-shrink-0', compact ? 'h-10 w-10' : 'w-10 h-10')}
          style={{ backgroundColor: color === 'transparent' ? '#000' : color }}
        >
          {color === 'transparent' && (
            <div className="w-full h-full checkerboard rounded-md" />
          )}
        </div>
        <div className={cn('flex-1', compact && 'hidden')}>
          <input
            type="text"
            value={hexInput}
            onChange={(e) => handleHexChange(e.target.value)}
            onBlur={handleHexBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleHexBlur()}
            className="w-full px-2 py-1.5 text-xs font-mono bg-card border border-border rounded-md
                       text-text focus:outline-none focus:border-primary transition-colors"
            placeholder="#000000"
            maxLength={7}
          />
        </div>
        {/* Native color picker */}
        <label className={cn('relative w-8 h-8 rounded-md overflow-hidden border border-border cursor-pointer flex-shrink-0', compact && 'hidden')}>
          <input
            type="color"
            value={color === 'transparent' ? '#ffffff' : color}
            onChange={(e) => handleColorClick(e.target.value.toUpperCase())}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(135deg, #ff0000, #ff9900, #ffff00, #00ff00, #0099ff, #6633ff, #ff00ff)`,
            }}
          />
        </label>
      </div>

      {/* Palette Selector */}
      <div className={cn('relative', compact && 'hidden')}>
        <button
          onClick={() => setShowPaletteDropdown(!showPaletteDropdown)}
          className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs bg-card border border-border
                     rounded-md text-text hover:bg-card-hover transition-colors"
        >
          <span className="font-medium">{activePalette}</span>
          <ChevronDown size={12} className={`transition-transform ${showPaletteDropdown ? 'rotate-180' : ''}`} />
        </button>

        {showPaletteDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute z-20 top-full left-0 right-0 mt-1 bg-card border border-border rounded-md
                       shadow-lg overflow-hidden"
          >
            {PALETTES.map(p => (
              <button
                key={p.name}
                onClick={() => {
                  setActivePalette(p.name);
                  setShowPaletteDropdown(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors
                  ${p.name === activePalette
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-muted hover:bg-card-hover hover:text-text'
                  }`}
              >
                {/* Mini color preview */}
                <div className="flex gap-0.5">
                  {p.colors.slice(0, 4).map((c, i) => (
                    <div
                      key={i}
                      className="w-2.5 h-2.5 rounded-sm"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <span className="flex-1">{p.name}</span>
                {p.name === activePalette && <Check size={12} />}
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Palette Colors Grid */}
      <div className={cn(compact ? 'flex gap-1.5' : 'grid grid-cols-6 gap-1')}>
        {currentPalette.colors.slice(0, compact ? 12 : undefined).map((c, i) => {
          const isSelected = c.toUpperCase() === color.toUpperCase();
          return (
            <button
              key={`${c}-${i}`}
              onClick={() => handleColorClick(c)}
              className={`
                rounded-md border-2 transition-all duration-100
                ${compact ? 'h-9 w-9 flex-shrink-0' : 'w-full aspect-square'}
                hover:scale-110 hover:z-10 relative
                ${isSelected
                  ? 'border-white shadow-lg scale-110 z-10'
                  : 'border-transparent hover:border-white/30'
                }
              `}
              style={{ backgroundColor: c }}
              title={c}
            >
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Check size={10} className={`${isLightColor(c) ? 'text-black' : 'text-white'}`} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Custom Colors */}
      {!compact && customColors.length > 0 && (
        <div>
          <div className="text-[9px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
            Custom
          </div>
          <div className="flex flex-wrap gap-1">
            {customColors.map((c, i) => (
              <button
                key={i}
                onClick={() => handleColorClick(c)}
                className={`w-6 h-6 rounded border-2 transition-all hover:scale-110
                  ${c.toUpperCase() === color.toUpperCase()
                    ? 'border-white'
                    : 'border-transparent hover:border-white/30'
                  }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add Custom Color Button */}
      <button
        onClick={handleAddCustomColor}
        className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] font-medium
                   bg-card border border-dashed border-border rounded-md text-text-muted
                   hover:border-primary hover:text-primary transition-colors"
        hidden={compact}
      >
        <Plus size={10} />
        Add Current Color
      </button>

      {/* Recent Colors */}
      {!compact && recentColors.length > 0 && (
        <div>
          <div className="text-[9px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
            Recent
          </div>
          <div className="flex flex-wrap gap-1">
            {recentColors.map((c, i) => (
              <button
                key={`${c}-${i}`}
                onClick={() => handleColorClick(c)}
                className={`w-5 h-5 rounded border transition-all hover:scale-110
                  ${c.toUpperCase() === color.toUpperCase()
                    ? 'border-white'
                    : 'border-border hover:border-white/30'
                  }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Helper to determine if a color is light
function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}
