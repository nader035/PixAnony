import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FeedCard } from '@/components/feed/feed-card';
import { ArtworkComments } from '@/components/feed/artwork-comments';
import { ArtworkDetailBack } from '@/components/feed/artwork-detail-back';
import { PixelArtRenderer } from '@/components/ui/pixel-art-renderer';
import { PageFrame } from '@/components/ui/page-layout';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { normalizeArtwork } from '@/lib/supabase/data';
import { PUBLIC_ROBOTS } from '@/lib/seo';
import { getServerI18n } from '@/lib/i18n/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { locale, t } = await getServerI18n();
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('artworks')
    .select('title, caption, visibility, is_anonymous, profile:profiles!artworks_user_id_fkey(username, display_name)')
    .eq('id', id)
    .single();

  if (!data) {
    return {
      title: t('art.notFound'),
      robots: { index: false, follow: false },
    };
  }

  if (data.visibility === 'private') {
    return {
      title: t('art.privateTitle'),
      description: t('art.privateDescription'),
      robots: { index: false, follow: false },
    };
  }

  const rawProfile = data.profile;
  const joinedProfile = (Array.isArray(rawProfile) ? rawProfile[0] : rawProfile) as {
    username: string;
    display_name: string;
  } | null | undefined;
  const creator = data.is_anonymous
    ? t('art.anonymousArtist')
    : joinedProfile?.username
      ? `@${joinedProfile.username}`
      : joinedProfile?.display_name || t('art.communityArtist');
  const artworkTitle = data.title?.trim();
  const seoTitle = artworkTitle
    ? t('art.withTitle', { title: artworkTitle, creator })
    : t('art.by', { creator });
  const caption = data.caption?.trim().replace(/\s+/g, ' ') || '';
  const fallbackDescription = t('art.discover', { creator });
  const description = caption.length >= 80
    ? caption.slice(0, 160)
    : `${caption}${caption ? ' ' : ''}${fallbackDescription}`.slice(0, 160);

  return {
    title: seoTitle,
    description,
    alternates: { canonical: `/art/${id}` },
    robots: PUBLIC_ROBOTS,
    openGraph: {
      title: `${seoTitle} | PixAnony`,
      description,
      type: 'article',
      url: `/art/${id}`,
      siteName: 'PixAnony',
      locale: locale === 'ar' ? 'ar_AR' : 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${seoTitle} | PixAnony`,
      description,
    },
  };
}

export default async function ArtworkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { t } = await getServerI18n();
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase
    .from('artworks')
    .select('*, profile:profiles!artworks_user_id_fkey(*)')
    .eq('id', id)
    .single();
  if (!data) notFound();

  const [{ data: comments }, { data: viewerProfile }, { data: like }, { data: repost }, { data: bookmark }] = await Promise.all([
    supabase
      .from('comments')
      .select('id, content, created_at, profile:profiles!comments_user_id_fkey(username, display_name, avatar_url)')
      .eq('artwork_id', id)
      .order('created_at', { ascending: true }),
    user ? supabase.from('profiles').select('id, username, display_name, avatar_url').eq('id', user.id).single() : Promise.resolve({ data: null }),
    user ? supabase.from('likes').select('id').eq('user_id', user.id).eq('artwork_id', id).maybeSingle() : Promise.resolve({ data: null }),
    user ? supabase.from('reposts').select('id').eq('user_id', user.id).eq('artwork_id', id).maybeSingle() : Promise.resolve({ data: null }),
    user ? supabase.from('bookmarks').select('id').eq('user_id', user.id).eq('artwork_id', id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  const artwork = {
    ...normalizeArtwork(data),
    liked_by_user: Boolean(like),
    reposted_by_user: Boolean(repost),
    bookmarked_by_user: Boolean(bookmark),
  };
  const normalizedComments = (comments ?? []).map((comment) => ({
    id: comment.id,
    content: comment.content,
    created_at: comment.created_at ?? new Date().toISOString(),
    profile: Array.isArray(comment.profile) ? comment.profile[0] ?? null : comment.profile,
  }));

  return (
    <PageFrame width="wide">
      <ArtworkDetailBack label={t('art.backToFeed')} />
      <div className="overflow-hidden rounded-[32px] border border-border/70 bg-card shadow-[0_24px_70px_rgba(44,40,58,.1)] lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(340px,.75fr)]">
        <div className="flex min-h-[340px] items-center justify-center bg-surface p-4 sm:p-8 lg:min-h-[calc(100dvh-10rem)]">
          <PixelArtRenderer
            pixels={JSON.parse(artwork.pixel_data) as string[]}
            gridSize={artwork.grid_size}
            gridWidth={artwork.grid_width}
            gridHeight={artwork.grid_height}
            className="max-h-[calc(100dvh-13rem)] max-w-full !rounded-[24px]"
          />
        </div>
        <aside className="min-w-0 border-t border-border/70 bg-bg/40 p-3 lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto lg:border-s lg:border-t-0 sm:p-4">
          <div className="space-y-4">
            <FeedCard artwork={artwork} showArtwork={false} />
            <ArtworkComments artworkId={id} initialComments={normalizedComments} viewer={viewerProfile} />
          </div>
        </aside>
      </div>
    </PageFrame>
  );
}
