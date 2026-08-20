import type { PixelLayer } from '@/lib/types';
import { createEmptyPixelArray, generateId } from '@/lib/utils';

export function compositePixelLayers(
  layers: PixelLayer[],
  width: number,
  height: number,
) {
  const pixels = createEmptyPixelArray(width, height);
  for (const layer of layers) {
    if (!layer.visible) continue;
    for (let index = 0; index < Math.min(layer.pixels.length, pixels.length); index += 1) {
      const color = layer.pixels[index];
      if (color && color !== 'transparent') pixels[index] = color;
    }
  }
  return pixels;
}

export function createChallengeEntryLayers(
  pixels: string[],
  width: number,
  height: number,
  locked: boolean,
): PixelLayer[] {
  const safePixels = pixels.length === width * height
    ? [...pixels]
    : createEmptyPixelArray(width, height);

  if (locked) {
    return [
      {
        id: generateId(),
        name: 'Challenge template',
        visible: true,
        opacity: 1,
        locked: true,
        pixels: safePixels,
      },
      {
        id: generateId(),
        name: 'Your drawing',
        visible: true,
        opacity: 1,
        locked: false,
        pixels: createEmptyPixelArray(width, height),
      },
    ];
  }

  return [
    {
      id: generateId(),
      name: 'Background',
      visible: true,
      opacity: 1,
      locked: true,
      pixels: createEmptyPixelArray(width, height),
    },
    {
      id: generateId(),
      name: 'Challenge template',
      visible: true,
      opacity: 1,
      locked: false,
      pixels: safePixels,
    },
  ];
}

function quantizeChannel(value: number) {
  return Math.round(value / 17) * 17;
}

function channelHex(value: number) {
  return Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0');
}

export async function convertImageFileToPixels(
  file: File,
  width: number,
  height: number,
) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas is unavailable.');

  context.clearRect(0, 0, width, height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  const scale = Math.min(width / bitmap.width, height / bitmap.height);
  const renderedWidth = bitmap.width * scale;
  const renderedHeight = bitmap.height * scale;
  const offsetX = (width - renderedWidth) / 2;
  const offsetY = (height - renderedHeight) / 2;
  context.drawImage(bitmap, offsetX, offsetY, renderedWidth, renderedHeight);
  bitmap.close();

  const rgba = context.getImageData(0, 0, width, height).data;
  const pixels: string[] = [];
  for (let index = 0; index < rgba.length; index += 4) {
    if (rgba[index + 3] < 32) {
      pixels.push('transparent');
      continue;
    }
    pixels.push(
      `#${channelHex(quantizeChannel(rgba[index]))}${channelHex(quantizeChannel(rgba[index + 1]))}${channelHex(quantizeChannel(rgba[index + 2]))}`.toUpperCase(),
    );
  }
  return pixels;
}
