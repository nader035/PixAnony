import type { Artwork, GridSize, Profile } from '@/lib/types';

type JoinedArtwork = Record<string, unknown> & {
  profile?: Profile | Profile[] | null;
  profiles?: Profile | Profile[] | null;
};

export function normalizeArtwork(row: JoinedArtwork): Artwork {
  const joined = row.profile ?? row.profiles;
  const profile = Array.isArray(joined) ? joined[0] : joined;

  return {
    id: String(row.id),
    user_id: String(row.user_id),
    receiver_id: row.receiver_id ? String(row.receiver_id) : null,
    title: row.title ? String(row.title) : null,
    caption: row.caption ? String(row.caption) : null,
    grid_size: Number(row.grid_size) as GridSize,
    pixel_data: JSON.stringify(row.pixel_data ?? []),
    layers: JSON.stringify(row.layers ?? []),
    preview_url: row.preview_url ? String(row.preview_url) : null,
    visibility: row.visibility as Artwork['visibility'],
    is_anonymous: Boolean(row.is_anonymous),
    likes_count: Number(row.likes_count ?? 0),
    reposts_count: Number(row.reposts_count ?? 0),
    comments_count: Number(row.comments_count ?? 0),
    views_count: Number(row.views_count ?? 0),
    created_at: String(row.created_at),
    profile: profile ?? undefined,
  };
}
