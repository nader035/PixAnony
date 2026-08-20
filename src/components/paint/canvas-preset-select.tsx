'use client';

import { CANVAS_PRESETS } from '@/lib/constants';
import { usePaintStore } from '@/stores/paint-store';
import { useI18n } from '@/components/i18n/locale-provider';
import { cn } from '@/lib/utils';

export function CanvasPresetSelect({
  className,
  disabled = false,
  includeExtended = false,
}: {
  className?: string;
  disabled?: boolean;
  includeExtended?: boolean;
}) {
  const { gridWidth, gridHeight, setCanvasDimensions } = usePaintStore();
  const { t } = useI18n();
  const selected = CANVAS_PRESETS.find(
    (preset) => preset.width === gridWidth && preset.height === gridHeight,
  );
  const regularPresets = CANVAS_PRESETS.filter((preset) => preset.ratio === '1:1');
  const availablePresets = includeExtended ? CANVAS_PRESETS : regularPresets;
  const options = selected && !availablePresets.some((preset) => preset.id === selected.id)
    ? [selected, ...availablePresets]
    : availablePresets;

  return (
    <select
      value={selected?.id ?? ''}
      disabled={disabled}
      onChange={(event) => {
        const preset = options.find((item) => item.id === event.target.value);
        if (preset) setCanvasDimensions(preset.width, preset.height);
      }}
      aria-label={t('paint.canvasPreset')}
      className={cn(
        'h-10 max-w-[164px] rounded-full bg-surface px-3 text-xs font-semibold text-text outline-none transition-colors hover:bg-card-hover disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
    >
      {options.map((preset) => (
        <option key={preset.id} value={preset.id}>
          {preset.label} · {preset.ratio}
        </option>
      ))}
    </select>
  );
}
