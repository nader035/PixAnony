import Link from 'next/link';
import { CalendarClock, Trophy } from '@/components/ui/icons';
import { PageFrame, PageHeader } from '@/components/ui/page-layout';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServerI18n } from '@/lib/i18n/server';

export default async function ChallengesPage() {
  const { t, locale } = await getServerI18n();
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('challenges')
    .select('*')
    .gt('ends_at', new Date().toISOString())
    .order('ends_at', { ascending: true });

  return (
    <PageFrame>
      <PageHeader
        eyebrow={t('challenges.eyebrow')}
        title={t('challenges.title')}
        description={t('challenges.description')}
      />
      {data?.length ? (
        <div className="space-y-3">
          {data.map((challenge) => (
            <article key={challenge.id} className="surface-panel interactive-surface rounded-2xl p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-primary">{challenge.theme}</p>
                  <h2 className="mt-1 text-lg font-semibold text-text">{challenge.title}</h2>
                  {challenge.description && <p className="mt-2 text-sm leading-6 text-text-muted">{challenge.description}</p>}
                </div>
                <span className="flex shrink-0 items-center gap-1.5 text-xs text-text-muted"><CalendarClock size={14} />{new Date(challenge.ends_at).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')}</span>
              </div>
              <Link href="/paint" className="mt-5 inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white">{t('challenges.createEntry')}</Link>
            </article>
          ))}
        </div>
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
