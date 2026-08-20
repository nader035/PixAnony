import Link from 'next/link';
import { CalendarClock, Lock, Trophy } from '@/components/ui/icons';
import { PageFrame, PageHeader } from '@/components/ui/page-layout';
import { PixelArtRenderer } from '@/components/ui/pixel-art-renderer';
import { MasonryGrid, MasonryItem } from '@/components/ui/masonry-grid';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServerI18n } from '@/lib/i18n/server';

type ChallengeRow = {
  id: string;
  slug: string;
  title: string;
  theme: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  grid_width: number;
  grid_height: number;
  template_mode: 'editable' | 'locked';
  participants_count: number;
  template?: {
    pixel_data: unknown;
    grid_size: number;
    grid_width: number;
    grid_height: number;
  } | Array<{
    pixel_data: unknown;
    grid_size: number;
    grid_width: number;
    grid_height: number;
  }> | null;
};

function stateOf(challenge: ChallengeRow) {
  const now = Date.now();
  if (new Date(challenge.starts_at).getTime() > now) return 'upcoming';
  if (new Date(challenge.ends_at).getTime() <= now) return 'ended';
  return 'active';
}

export default async function ChallengesPage({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  const { state = 'active' } = await searchParams;
  const { t, locale } = await getServerI18n();
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('challenges')
    .select(`
      id, slug, title, theme, description, starts_at, ends_at, grid_width,
      grid_height, template_mode, participants_count,
      template:artworks!challenges_template_artwork_id_fkey(
        pixel_data, grid_size, grid_width, grid_height
      )
    `)
    .eq('status', 'published')
    .order('starts_at', { ascending: false });
  const challenges = ((data ?? []) as unknown as ChallengeRow[]).filter(
    (challenge) => state === 'all' || stateOf(challenge) === state,
  );

  return (
    <PageFrame width="wide">
      <PageHeader eyebrow={t('challenges.eyebrow')} title={t('challenges.title')} description={t('challenges.description')} />

      <nav className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {(['active', 'upcoming', 'ended', 'all'] as const).map((item) => (
          <Link key={item} href={`/challenges?state=${item}`} className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold ${state === item ? 'border-primary bg-primary text-white' : 'border-border bg-card text-text-muted'}`}>
            {t(`challenges.state.${item}`)}
          </Link>
        ))}
      </nav>

      {challenges.length ? (
        <MasonryGrid>
          {challenges.map((challenge) => {
            const template = Array.isArray(challenge.template) ? challenge.template[0] : challenge.template;
            const challengeState = stateOf(challenge);
            return (
              <MasonryItem key={challenge.id}>
                <Link href={`/challenges/${challenge.slug}`} className="group block overflow-hidden rounded-[28px] border border-border/70 bg-card shadow-card transition-transform hover:-translate-y-0.5">
                  <div className="relative m-3 overflow-hidden rounded-[22px] bg-surface p-4" style={{ aspectRatio: `${challenge.grid_width} / ${challenge.grid_height}` }}>
                    {template && (
                      <PixelArtRenderer
                        pixels={Array.isArray(template.pixel_data) ? template.pixel_data as string[] : []}
                        gridSize={template.grid_size}
                        gridWidth={template.grid_width}
                        gridHeight={template.grid_height}
                        className="h-full w-full"
                      />
                    )}
                    <span className="absolute start-3 top-3 rounded-full bg-bg/85 px-2.5 py-1 text-[10px] font-bold text-primary backdrop-blur">{t(`challenges.state.${challengeState}`)}</span>
                  </div>
                  <div className="px-4 pb-5">
                    <p className="text-xs font-bold text-primary">{challenge.theme}</p>
                    <h2 className="mt-1 text-lg font-bold text-text">{challenge.title}</h2>
                    {challenge.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-text-muted">{challenge.description}</p>}
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                      <span className="flex items-center gap-1"><CalendarClock size={13} />{new Date(challenge.ends_at).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')}</span>
                      <span>{challenge.grid_width}×{challenge.grid_height}</span>
                      {challenge.template_mode === 'locked' && <span className="flex items-center gap-1"><Lock size={12} />{t('challenges.lockedTemplate')}</span>}
                      <span className="ms-auto font-semibold text-text">{t('challenges.entriesCount', { count: challenge.participants_count })}</span>
                    </div>
                  </div>
                </Link>
              </MasonryItem>
            );
          })}
        </MasonryGrid>
      ) : (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-border px-6 text-center">
          <Trophy size={30} className="mb-4 text-primary" />
          <h2 className="text-lg font-semibold text-text">{t('challenges.emptyTitle')}</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-text-muted">{t('challenges.emptyDescription')}</p>
          <Link href="/paint" className="mt-6 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-text">{t('challenges.drawFreely')}</Link>
        </div>
      )}
    </PageFrame>
  );
}
