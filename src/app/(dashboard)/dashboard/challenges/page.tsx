import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CalendarClock, Pencil, Plus, Trash2, Trophy } from '@/components/ui/icons';
import { PixelArtRenderer } from '@/components/ui/pixel-art-renderer';
import { DashboardSubmitButton } from '@/components/dashboard/submit-button';
import { CANVAS_PRESETS } from '@/lib/constants';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAccessContext, hasAccess } from '@/lib/auth/access';
import { getServerI18n } from '@/lib/i18n/server';
import type { TranslationKey, TranslationValues } from '@/lib/i18n/translations';
import {
  createChallengeAction,
  removeChallengeAction,
  setChallengeStatusAction,
  updateChallengeAction,
} from '../actions';

type ChallengeArtwork = {
  id: string;
  pixel_data: unknown;
  grid_size: number;
  grid_width: number;
  grid_height: number;
};

type DashboardChallenge = {
  id: string;
  slug: string;
  title: string;
  theme: string;
  description: string | null;
  instructions: string | null;
  starts_at: string;
  ends_at: string;
  status: 'draft' | 'published' | 'archived';
  grid_width: number;
  grid_height: number;
  template_mode: 'editable' | 'locked';
  template_artwork_id: string | null;
  participants_count: number;
  template?: ChallengeArtwork | ChallengeArtwork[] | null;
};

function first<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function pixels(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function localDateInput(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function temporalState(challenge: DashboardChallenge) {
  const now = Date.now();
  if (challenge.status === 'archived') return 'archived';
  if (challenge.status === 'draft') return 'draft';
  if (new Date(challenge.starts_at).getTime() > now) return 'upcoming';
  if (new Date(challenge.ends_at).getTime() <= now) return 'ended';
  return 'active';
}

export default async function DashboardChallengesPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state = 'all' } = await searchParams;
  const { t, locale } = await getServerI18n();
  const access = await getAccessContext();
  if (!access || !hasAccess(access, 'platform.manage')) redirect('/dashboard');

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('challenges')
    .select(`
      id, slug, title, theme, description, instructions, starts_at, ends_at,
      status, grid_width, grid_height, template_mode, template_artwork_id,
      participants_count,
      template:artworks!challenges_template_artwork_id_fkey(
        id, pixel_data, grid_size, grid_width, grid_height
      )
    `)
    .order('created_at', { ascending: false });

  const challenges = ((data ?? []) as unknown as DashboardChallenge[]).filter(
    (challenge) => state === 'all' || temporalState(challenge) === state,
  );

  return (
    <div className="mx-auto max-w-[1380px] space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">{t('dashboard.challengeManagement')}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-[-0.04em] text-text">{t('dashboard.challenges')}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">{t('dashboard.challengesDescription')}</p>
        </div>
        <details className="group relative">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(0,94,254,.2)]">
            <Plus size={16} />{t('dashboard.createChallenge')}
          </summary>
          <div className="absolute end-0 top-full z-40 mt-2 w-[min(92vw,620px)] rounded-[26px] border border-border bg-card p-5 shadow-float">
            <ChallengeForm action={createChallengeAction} submitLabel={t('dashboard.createAndDraw')} t={t} />
          </div>
        </details>
      </section>

      <nav className="flex gap-2 overflow-x-auto pb-1">
        {(['all', 'active', 'upcoming', 'ended', 'draft', 'archived'] as const).map((item) => (
          <Link
            key={item}
            href={`/dashboard/challenges?state=${item}`}
            className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition-colors ${state === item ? 'border-primary bg-primary text-white' : 'border-border bg-card text-text-muted hover:text-text'}`}
          >
            {t(`dashboard.challengeState.${item}`)}
          </Link>
        ))}
      </nav>

      {challenges.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {challenges.map((challenge) => {
            const template = first(challenge.template);
            const currentState = temporalState(challenge);
            return (
              <article key={challenge.id} className="overflow-hidden rounded-[26px] border border-border bg-card shadow-card">
                <div className="grid sm:grid-cols-[180px_minmax(0,1fr)]">
                  <div className="flex min-h-48 items-center justify-center bg-surface p-4">
                    {template ? (
                      <PixelArtRenderer
                        pixels={pixels(template.pixel_data)}
                        gridSize={template.grid_size}
                        gridWidth={template.grid_width}
                        gridHeight={template.grid_height}
                        className="max-h-56 w-full"
                      />
                    ) : (
                      <div className="text-center text-xs text-text-muted"><Trophy size={28} className="mx-auto mb-2 text-primary" />{t('dashboard.noTemplate')}</div>
                    )}
                  </div>
                  <div className="min-w-0 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase text-primary">{t(`dashboard.challengeState.${currentState}`)}</span>
                        <h2 className="mt-2 truncate text-lg font-bold text-text">{challenge.title}</h2>
                        <p className="mt-1 text-xs text-text-muted">{challenge.grid_width}×{challenge.grid_height} · {challenge.template_mode === 'locked' ? t('dashboard.lockedBase') : t('dashboard.editableBase')}</p>
                      </div>
                      <span className="flex shrink-0 items-center gap-1 text-[10px] text-text-muted"><CalendarClock size={12} />{new Date(challenge.ends_at).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')}</span>
                    </div>
                    <p className="mt-3 line-clamp-2 text-xs leading-5 text-text-muted">{challenge.description || t('dashboard.noDescription')}</p>
                    <p className="mt-3 text-xs font-semibold text-text">{t('dashboard.submissionCount', { count: challenge.participants_count })}</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link href={`/paint?mode=challenge-template&challenge=${challenge.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary/10 px-3 text-xs font-bold text-primary"><Pencil size={13} />{t('dashboard.editTemplate')}</Link>
                      {challenge.status === 'published' && <Link href={`/challenges/${challenge.slug}`} className="inline-flex h-9 items-center rounded-full border border-border px-3 text-xs font-bold text-text-muted">{t('dashboard.viewSubmissions')}</Link>}
                      <form action={setChallengeStatusAction}>
                        <input type="hidden" name="challengeId" value={challenge.id} />
                        <input type="hidden" name="status" value={challenge.status === 'published' ? 'draft' : 'published'} />
                        <DashboardSubmitButton className="bg-surface text-text">
                          {challenge.status === 'published' ? t('dashboard.unpublish') : t('dashboard.publish')}
                        </DashboardSubmitButton>
                      </form>
                      {challenge.status !== 'archived' && (
                        <form action={setChallengeStatusAction}>
                          <input type="hidden" name="challengeId" value={challenge.id} />
                          <input type="hidden" name="status" value="archived" />
                          <DashboardSubmitButton className="bg-surface text-text-muted">{t('dashboard.archive')}</DashboardSubmitButton>
                        </form>
                      )}
                    </div>
                  </div>
                </div>

                <details className="border-t border-border px-4 py-3">
                  <summary className="cursor-pointer text-xs font-bold text-text-muted">{t('dashboard.editChallengeDetails')}</summary>
                  <div className="pt-4">
                    <ChallengeForm action={updateChallengeAction} challenge={challenge} submitLabel={t('common.save')} t={t} />
                    <form action={removeChallengeAction} className="mt-3 border-t border-border pt-3">
                      <input type="hidden" name="challengeId" value={challenge.id} />
                      <DashboardSubmitButton confirmMessage={t('dashboard.removeChallengeConfirm')} className="bg-red/10 text-red"><Trash2 size={13} />{t('dashboard.removeChallenge')}</DashboardSubmitButton>
                    </form>
                  </div>
                </details>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-[28px] border border-dashed border-border bg-card px-6 text-center">
          <Trophy size={30} className="mb-4 text-primary" />
          <h2 className="font-bold text-text">{t('dashboard.noChallenges')}</h2>
          <p className="mt-2 text-sm text-text-muted">{t('dashboard.noChallengesDescription')}</p>
        </div>
      )}
    </div>
  );
}

function ChallengeForm({
  action,
  challenge,
  submitLabel,
  t,
}: {
  action: (formData: FormData) => Promise<void>;
  challenge?: DashboardChallenge;
  submitLabel: string;
  t: (key: TranslationKey, values?: TranslationValues) => string;
}) {
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      {challenge && <input type="hidden" name="challengeId" value={challenge.id} />}
      <label className="text-xs font-semibold text-text-muted">{t('dashboard.field.title')}<input required name="title" defaultValue={challenge?.title} maxLength={120} className="mt-1 h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary" /></label>
      <label className="text-xs font-semibold text-text-muted">{t('dashboard.field.theme')}<input name="theme" defaultValue={challenge?.theme} maxLength={80} className="mt-1 h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary" /></label>
      <label className="text-xs font-semibold text-text-muted sm:col-span-2">{t('dashboard.field.description')}<textarea name="description" defaultValue={challenge?.description ?? ''} maxLength={2000} rows={2} className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary" /></label>
      <label className="text-xs font-semibold text-text-muted sm:col-span-2">{t('dashboard.field.instructions')}<textarea name="instructions" defaultValue={challenge?.instructions ?? ''} maxLength={4000} rows={3} className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary" /></label>
      <label className="text-xs font-semibold text-text-muted">{t('dashboard.field.starts')}<input required type="datetime-local" name="startsAt" defaultValue={challenge ? localDateInput(challenge.starts_at) : ''} className="mt-1 h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary" /></label>
      <label className="text-xs font-semibold text-text-muted">{t('dashboard.field.ends')}<input required type="datetime-local" name="endsAt" defaultValue={challenge ? localDateInput(challenge.ends_at) : ''} className="mt-1 h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary" /></label>
      <label className="text-xs font-semibold text-text-muted">{t('dashboard.field.canvas')}<select name="dimensions" defaultValue={challenge ? `${challenge.grid_width}x${challenge.grid_height}` : '32x32'} className="mt-1 h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none">{CANVAS_PRESETS.map((preset) => <option key={preset.id} value={`${preset.width}x${preset.height}`}>{preset.label} · {preset.ratio}</option>)}</select></label>
      <label className="text-xs font-semibold text-text-muted">{t('dashboard.field.templateBehavior')}<select name="templateMode" defaultValue={challenge?.template_mode ?? 'editable'} className="mt-1 h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none"><option value="editable">{t('dashboard.editableBase')}</option><option value="locked">{t('dashboard.lockedBase')}</option></select></label>
      <div className="sm:col-span-2"><DashboardSubmitButton className="bg-primary text-white">{submitLabel}</DashboardSubmitButton></div>
    </form>
  );
}
