import Link from 'next/link';
import { CalendarClock, Trophy } from '@/components/ui/icons';
import { PageFrame, PageHeader } from '@/components/ui/page-layout';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function ChallengesPage() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('challenges')
    .select('*')
    .gt('ends_at', new Date().toISOString())
    .order('ends_at', { ascending: true });

  return (
    <PageFrame>
      <PageHeader
        eyebrow="Creative prompts"
        title="Challenges"
        description="Time-boxed prompts published by the PixAnony team."
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
                <span className="flex shrink-0 items-center gap-1.5 text-xs text-text-muted"><CalendarClock size={14} />{new Date(challenge.ends_at).toLocaleDateString()}</span>
              </div>
              <Link href="/paint" className="mt-5 inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white">Create entry</Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-border px-6 text-center">
          <Trophy size={30} className="mb-4 text-primary" />
          <h2 className="text-lg font-semibold text-text">No active challenge</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-text-muted">The next curated prompt will appear here when it is published.</p>
          <Link href="/paint" className="mt-6 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-text">Draw freely</Link>
        </div>
      )}
    </PageFrame>
  );
}
