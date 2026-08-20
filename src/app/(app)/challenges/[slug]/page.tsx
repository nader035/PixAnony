import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarClock, Lock, Palette, Trophy } from '@/components/ui/icons';
import { PixelArtRenderer } from '@/components/ui/pixel-art-renderer';
import { FeedCard } from '@/components/feed/feed-card';
import { MasonryGrid, MasonryItem } from '@/components/ui/masonry-grid';
import { PageFrame } from '@/components/ui/page-layout';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { normalizeArtwork } from '@/lib/supabase/data';
import { getServerI18n } from '@/lib/i18n/server';

export default async function ChallengeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t, locale } = await getServerI18n();
  const supabase = await createServerSupabaseClient();
  const { data: challenge } = await supabase
    .from('challenges')
    .select(`
      id, slug, title, theme, description, instructions, starts_at, ends_at,
      grid_width, grid_height, template_mode, participants_count,
      template:artworks!challenges_template_artwork_id_fkey(
        id, pixel_data, grid_size, grid_width, grid_height
      )
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  if (!challenge) notFound();

  const template = Array.isArray(challenge.template) ? challenge.template[0] : challenge.template;
  // Supabase access makes this page request-bound, so the current challenge window is safe to derive here.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const active = new Date(challenge.starts_at).getTime() <= now && new Date(challenge.ends_at).getTime() > now;
  const upcoming = new Date(challenge.starts_at).getTime() > now;
  const { data: submissionRows } = await supabase
    .from('challenge_submissions')
    .select('artwork:artworks!challenge_submissions_artwork_id_fkey(*, profile:profiles!artworks_user_id_fkey(*))')
    .eq('challenge_id', challenge.id)
    .order('submitted_at', { ascending: false });
  const submissions = (submissionRows ?? []).flatMap((row) => {
    const artwork = Array.isArray(row.artwork) ? row.artwork[0] : row.artwork;
    return artwork ? [normalizeArtwork(artwork)] : [];
  });

  return (
    <PageFrame width="wide">
      <Link href="/challenges" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-text"><ArrowLeft className="rtl-flip" size={15} />{t('challenges.back')}</Link>
      <section className="overflow-hidden rounded-[32px] border border-border/70 bg-card shadow-card lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,.75fr)]">
        <div className="flex min-h-80 items-center justify-center bg-surface p-5 sm:p-8">
          {template ? (
            <PixelArtRenderer pixels={Array.isArray(template.pixel_data) ? template.pixel_data as string[] : []} gridSize={template.grid_size} gridWidth={template.grid_width} gridHeight={template.grid_height} className="max-h-[620px] max-w-full" />
          ) : <Trophy size={40} className="text-primary" />}
        </div>
        <div className="flex flex-col justify-center border-t border-border p-5 lg:border-s lg:border-t-0 sm:p-8">
          <p className="text-xs font-bold text-primary">{challenge.theme}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-text">{challenge.title}</h1>
          {challenge.description && <p className="mt-4 text-sm leading-7 text-text-muted">{challenge.description}</p>}
          {challenge.instructions && <div className="mt-5 rounded-[20px] bg-surface p-4"><h2 className="text-sm font-bold text-text">{t('challenges.instructions')}</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-muted">{challenge.instructions}</p></div>}
          <div className="mt-5 flex flex-wrap gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1"><CalendarClock size={13} />{new Date(challenge.starts_at).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')} – {new Date(challenge.ends_at).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')}</span>
            <span>{challenge.grid_width}×{challenge.grid_height}</span>
            {challenge.template_mode === 'locked' && <span className="flex items-center gap-1"><Lock size={12} />{t('challenges.lockedTemplate')}</span>}
          </div>
          {active ? (
            <Link href={`/paint?mode=challenge-entry&challenge=${challenge.id}`} className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-white shadow-[0_12px_30px_rgba(0,94,254,.2)]"><Palette size={17} />{t('challenges.startDrawing')}</Link>
          ) : (
            <p className="mt-6 rounded-xl bg-surface px-4 py-3 text-center text-sm font-semibold text-text-muted">{upcoming ? t('challenges.notStarted') : t('challenges.ended')}</p>
          )}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-5 flex items-end justify-between gap-3"><div><p className="text-xs font-bold text-primary">{t('challenges.community')}</p><h2 className="mt-1 text-2xl font-bold text-text">{t('challenges.submissions')}</h2></div><span className="text-sm font-semibold text-text-muted">{t('challenges.entriesCount', { count: challenge.participants_count })}</span></div>
        {submissions.length ? (
          <MasonryGrid>
            {submissions.map((artwork) => <MasonryItem key={artwork.id}><FeedCard artwork={artwork} /></MasonryItem>)}
          </MasonryGrid>
        ) : (
          <div className="flex min-h-56 flex-col items-center justify-center rounded-[28px] border border-dashed border-border text-center"><Trophy size={26} className="mb-3 text-primary" /><h3 className="font-bold text-text">{t('challenges.noSubmissions')}</h3><p className="mt-1 text-sm text-text-muted">{t('challenges.noSubmissionsDescription')}</p></div>
        )}
      </section>
    </PageFrame>
  );
}
