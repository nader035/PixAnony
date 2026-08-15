import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from '@/components/ui/icons';
import { FeedCard } from '@/components/feed/feed-card';
import { ArtworkComments } from '@/components/feed/artwork-comments';
import { PageFrame } from '@/components/ui/page-layout';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { normalizeArtwork } from '@/lib/supabase/data';
import { PUBLIC_ROBOTS } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('artworks')
    .select('title, caption, visibility, is_anonymous, profile:profiles!artworks_user_id_fkey(username, display_name)')
    .eq('id', id)
    .single();

  if (!data) {
    return {
      title: 'Artwork not found',
      robots: { index: false, follow: false },
    };
  }

  if (data.visibility === 'private') {
    return {
      title: 'Private artwork',
      description: 'This PixAnony artwork is available only to people with access.',
      robots: { index: false, follow: false },
    };
  }

  const rawProfile = data.profile;
  const joinedProfile = (Array.isArray(rawProfile) ? rawProfile[0] : rawProfile) as {
    username: string;
    display_name: string;
  } | null | undefined;
  const creator = data.is_anonymous
    ? 'an anonymous artist'
    : joinedProfile?.username
      ? `@${joinedProfile.username}`
      : joinedProfile?.display_name || 'a PixAnony artist';
  const artworkTitle = data.title?.trim();
  const seoTitle = artworkTitle ? `${artworkTitle} — Pixel Art by ${creator}` : `Pixel Art by ${creator}`;
  const caption = data.caption?.trim().replace(/\s+/g, ' ') || '';
  const fallbackDescription = `Discover pixel art shared by ${creator} in the PixAnony creative community.`;
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
      locale: 'en_US',
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
    <PageFrame width="compact">
      <Link href="/home" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text">
        <ArrowLeft size={16} />
        Back to feed
      </Link>
      <div className="space-y-4">
        <FeedCard artwork={artwork} />
        <ArtworkComments artworkId={id} initialComments={normalizedComments} viewer={viewerProfile} />
      </div>
    </PageFrame>
  );
}
