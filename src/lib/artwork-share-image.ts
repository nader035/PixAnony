type ArtworkShareImageOptions = {
  pixels: string[];
  gridSize: number;
  title: string;
  caption?: string | null;
  displayName: string;
  username: string;
  isAnonymous: boolean;
};

const WIDTH = 1080;
const HEIGHT = 1350;

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let line = '';
  let truncated = false;

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    line = word;
    if (lines.length === maxLines - 1) {
      truncated = true;
      break;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);

  if (truncated && lines.length === maxLines) {
    while (lines[maxLines - 1] && ctx.measureText(`${lines[maxLines - 1]}…`).width > maxWidth) {
      lines[maxLines - 1] = lines[maxLines - 1].slice(0, -1);
    }
    lines[maxLines - 1] += '…';
  }

  lines.forEach((value, index) => ctx.fillText(value, x, y + index * lineHeight));
}

function drawArtwork(
  ctx: CanvasRenderingContext2D,
  pixels: string[],
  gridSize: number,
  x: number,
  y: number,
  size: number,
) {
  ctx.save();
  roundedRect(ctx, x, y, size, size, 38);
  ctx.clip();
  ctx.fillStyle = '#f6f4f0';
  ctx.fillRect(x, y, size, size);

  const cellSize = size / gridSize;
  for (let row = 0; row < gridSize; row += 1) {
    for (let column = 0; column < gridSize; column += 1) {
      ctx.fillStyle = (row + column) % 2 === 0 ? '#f7f5f1' : '#efede8';
      ctx.fillRect(
        Math.floor(x + column * cellSize),
        Math.floor(y + row * cellSize),
        Math.ceil(cellSize),
        Math.ceil(cellSize),
      );
    }
  }

  ctx.imageSmoothingEnabled = false;
  pixels.forEach((color, index) => {
    if (!color || color === 'transparent') return;
    const column = index % gridSize;
    const row = Math.floor(index / gridSize);
    ctx.fillStyle = color;
    ctx.fillRect(
      Math.floor(x + column * cellSize),
      Math.floor(y + row * cellSize),
      Math.ceil(cellSize),
      Math.ceil(cellSize),
    );
  });
  ctx.restore();
}

function canvasToFile(canvas: HTMLCanvasElement, fileName: string) {
  return new Promise<File>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Could not render the artwork image.'));
        return;
      }
      resolve(new File([blob], fileName, { type: 'image/png' }));
    }, 'image/png');
  });
}

export async function createArtworkShareImage({
  pixels,
  gridSize,
  title,
  caption,
  displayName,
  username,
  isAnonymous,
}: ArtworkShareImageOptions) {
  await document.fonts?.ready;

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported in this browser.');

  const background = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  background.addColorStop(0, '#dce7f7');
  background.addColorStop(0.48, '#eee4f7');
  background.addColorStop(1, '#f9e1e7');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.globalAlpha = 0.72;
  ctx.fillStyle = '#f6ce8f';
  ctx.beginPath();
  ctx.arc(984, 126, 150, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8ed6c7';
  ctx.beginPath();
  ctx.arc(72, 1240, 170, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.shadowColor = 'rgba(44, 40, 58, 0.14)';
  ctx.shadowBlur = 48;
  ctx.shadowOffsetY = 22;
  ctx.fillStyle = '#fffefa';
  roundedRect(ctx, 54, 54, 972, 1242, 58);
  ctx.fill();
  ctx.shadowColor = 'transparent';

  ctx.fillStyle = '#ece2f7';
  ctx.beginPath();
  ctx.arc(116, 122, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f29ab0';
  ctx.beginPath();
  ctx.arc(129, 111, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#80d0bf';
  ctx.beginPath();
  ctx.arc(102, 137, 13, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#18171c';
  ctx.font = '800 34px Manrope, Arial, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText('PixAnony', 164, 122);
  ctx.fillStyle = '#77727d';
  ctx.font = '600 18px Manrope, Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('MAKE · SHARE · STAY YOU', 958, 122);
  ctx.textAlign = 'left';

  drawArtwork(ctx, pixels, gridSize, 106, 188, 868);

  ctx.fillStyle = '#18171c';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '800 38px Manrope, Arial, sans-serif';
  drawWrappedText(ctx, title || 'Untitled artwork', 108, 1122, 864, 46, 2);

  const creatorLine = isAnonymous ? 'Anonymous artist' : `${displayName}  @${username}`;
  ctx.fillStyle = '#6f687b';
  ctx.font = '650 22px Manrope, Arial, sans-serif';
  ctx.fillText(creatorLine, 108, 1222);

  if (caption?.trim()) {
    ctx.textAlign = 'right';
    ctx.font = '500 20px Manrope, Arial, sans-serif';
    ctx.fillStyle = '#8c8596';
    ctx.fillText('Shared from PixAnony', 972, 1222);
    ctx.textAlign = 'left';
  }

  const safeTitle = (title || 'artwork')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'artwork';
  return canvasToFile(canvas, `pixanony-${safeTitle}.png`);
}

export function downloadArtworkShareImage(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
