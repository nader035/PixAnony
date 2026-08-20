import { notFound, redirect } from 'next/navigation';
import {
  PixelBoard,
  type PixelBoardChallenge,
  type PixelBoardMode,
} from '@/components/paint/pixel-board';
import { getAccessContext, hasAccess } from '@/lib/auth/access';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { PixelLayer } from '@/lib/types';

type PaintSearchParams = Promise<Record<string, string | string[] | undefined>>;

type ChallengeTemplateRow = {
  id: string;
  pixel_data: unknown;
  layers: unknown;
  grid_width: number;
  grid_height: number;
};

type ChallengeRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  status: 'draft' | 'published' | 'archived';
  grid_width: number;
  grid_height: number;
  template_mode: 'editable' | 'locked';
  template_artwork_id: string | null;
  template: ChallengeTemplateRow | ChallengeTemplateRow[] | null;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function pixelLayers(value: unknown): PixelLayer[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is PixelLayer => {
    if (!item || typeof item !== 'object') return false;
    const layer = item as Partial<PixelLayer>;
    return typeof layer.id === 'string'
      && typeof layer.name === 'string'
      && typeof layer.visible === 'boolean'
      && typeof layer.opacity === 'number'
      && typeof layer.locked === 'boolean'
      && Array.isArray(layer.pixels)
      && layer.pixels.every((pixel) => typeof pixel === 'string');
  });
}

export default async function PaintPage({ searchParams }: { searchParams: PaintSearchParams }) {
  const query = await searchParams;
  const requestedMode = firstValue(query.mode);
  const challengeId = firstValue(query.challenge);
  const mode: PixelBoardMode = requestedMode === 'challenge-entry'
    || requestedMode === 'challenge-template'
    ? requestedMode
    : 'standard';

  const access = await getAccessContext();
  if (!access) redirect('/login?next=%2Fpaint');

  const isAdmin = access.role === 'admin' && hasAccess(access, 'platform.manage');
  if (mode === 'challenge-template' && !isAdmin) redirect('/paint');
  if (mode !== 'standard' && !challengeId) notFound();

  let challenge: PixelBoardChallenge | null = null;
  if (challengeId && mode !== 'standard') {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from('challenges')
      .select(`
        id, slug, title, description, starts_at, ends_at, status,
        grid_width, grid_height, template_mode, template_artwork_id,
        template:artworks!challenges_template_artwork_id_fkey(
          id, pixel_data, layers, grid_width, grid_height
        )
      `)
      .eq('id', challengeId)
      .single();
    if (!data) notFound();

    const row = data as unknown as ChallengeRow;
    if (mode === 'challenge-entry') {
      // The submit RPC repeats these checks to prevent stale or forged clients.
      // eslint-disable-next-line react-hooks/purity
      const now = Date.now();
      if (
        row.status !== 'published'
        || new Date(row.starts_at).getTime() > now
        || new Date(row.ends_at).getTime() <= now
      ) {
        notFound();
      }
    }

    const template = Array.isArray(row.template) ? row.template[0] ?? null : row.template;
    const useTemplateDimensions = mode === 'challenge-template' && template;
    challenge = {
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      gridWidth: useTemplateDimensions ? template.grid_width : row.grid_width,
      gridHeight: useTemplateDimensions ? template.grid_height : row.grid_height,
      templateArtworkId: row.template_artwork_id,
      templatePixels: stringArray(template?.pixel_data),
      templateLayers: pixelLayers(template?.layers),
      templateLocked: row.template_mode === 'locked',
    };
  }

  return (
    <PixelBoard
      key={`${mode}:${challenge?.id ?? 'blank'}`}
      isAdmin={isAdmin}
      mode={mode}
      challenge={challenge}
    />
  );
}
