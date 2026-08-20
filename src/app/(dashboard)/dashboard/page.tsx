import Link from 'next/link';
import {
  CheckCircle2,
  Eye,
  FileImage,
  Heart,
  MessageSquare,
  Search,
  Shield,
  Trash2,
  Users,
} from '@/components/ui/icons';
import { PixelArtRenderer } from '@/components/ui/pixel-art-renderer';
import { PixelAvatar } from '@/components/ui/pixel-avatar';
import { DashboardSubmitButton } from '@/components/dashboard/submit-button';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAccessContext, hasAccess } from '@/lib/auth/access';
import { formatNumber, formatTimeAgo } from '@/lib/utils';
import { getServerI18n } from '@/lib/i18n/server';
import { removeArtworkAction, reviewReportAction, setUserRoleAction } from './actions';

type DashboardStats = Record<string, number>;

type DashboardUser = {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  is_verified: boolean;
  created_at: string;
  role: 'admin' | 'moderator' | 'user';
};

type JoinedProfile = {
  id?: string;
  username: string;
  display_name: string;
  avatar_url?: string | null;
};

type DashboardArtwork = {
  id: string;
  title: string | null;
  caption: string | null;
  pixel_data: unknown;
  grid_size: number;
  visibility: string;
  is_anonymous: boolean;
  likes_count?: number;
  views_count?: number;
  created_at: string;
  profile?: JoinedProfile | JoinedProfile[] | null;
};

type ReportRow = {
  id: string;
  target_id: string;
  reason: string;
  details: string | null;
  status: 'open' | 'in_review' | 'resolved' | 'dismissed';
  created_at: string;
  reporter?: JoinedProfile | JoinedProfile[] | null;
  target_owner?: JoinedProfile | JoinedProfile[] | null;
  artwork?: DashboardArtwork | DashboardArtwork[] | null;
};

type ActivityRow = {
  id: number;
  action: string;
  target_id: string;
  note: string | null;
  created_at: string;
  actor?: JoinedProfile | JoinedProfile[] | null;
  target_owner?: JoinedProfile | JoinedProfile[] | null;
};

function first<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function pixelsFrom(value: unknown) {
  if (Array.isArray(value)) return value.filter((pixel): pixel is string => typeof pixel === 'string');
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((pixel): pixel is string => typeof pixel === 'string') : [];
  } catch {
    return [];
  }
}

function titleCase(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function StatusPill({ status }: { status: string }) {
  const tones: Record<string, string> = {
    open: 'bg-[#fff3dd] text-[#9b5d00] dark:bg-yellow/12 dark:text-yellow',
    in_review: 'bg-[#eaf1ff] text-[#005efe] dark:bg-primary/12 dark:text-primary',
    resolved: 'bg-[#e5f5ed] text-[#287653] dark:bg-green/12 dark:text-green',
    dismissed: 'bg-[#eef0f4] text-[#687386] dark:bg-surface dark:text-text-muted',
    admin: 'bg-[#eaf1ff] text-[#005efe] dark:bg-primary/12 dark:text-primary',
    moderator: 'bg-[#f1ebff] text-[#7150ba] dark:bg-[var(--lilac)] dark:text-text',
    user: 'bg-[#eef0f4] text-[#687386] dark:bg-surface dark:text-text-muted',
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${tones[status] ?? tones.user}`}>
      {titleCase(status)}
    </span>
  );
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#005efe]">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#172033] dark:text-text sm:text-2xl">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-[#758095] dark:text-text-muted">{description}</p>
      </div>
    </div>
  );
}
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q = '', status = 'active' } = await searchParams;
  const { locale } = await getServerI18n();
  const access = await getAccessContext();
  if (!access) return null;

  const isAdmin = access.role === 'admin';
  const supabase = await createServerSupabaseClient();

  let reportsQuery = supabase
    .from('reports')
    .select(`
      id, target_id, reason, details, status, created_at,
      reporter:profiles!reports_reporter_id_fkey(id, username, display_name, avatar_url),
      target_owner:profiles!reports_target_owner_id_fkey(id, username, display_name, avatar_url),
      artwork:artworks!reports_artwork_id_fkey(
        id, title, caption, pixel_data, grid_size, visibility, is_anonymous,
        likes_count, views_count, created_at,
        profile:profiles!artworks_user_id_fkey(id, username, display_name, avatar_url)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(24);

  if (status === 'active') reportsQuery = reportsQuery.in('status', ['open', 'in_review']);
  else if (['open', 'in_review', 'resolved', 'dismissed'].includes(status)) reportsQuery = reportsQuery.eq('status', status);

  let contentQuery = supabase
    .from('artworks')
    .select('id, title, caption, pixel_data, grid_size, visibility, is_anonymous, likes_count, views_count, created_at, profile:profiles!artworks_user_id_fkey(id, username, display_name, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(24);
  if (q.trim()) contentQuery = contentQuery.ilike('title', `%${q.trim()}%`);

  const [statsResult, reportsResult, activityResult, usersResult, contentResult] = await Promise.all([
    supabase.rpc('get_dashboard_stats'),
    reportsQuery,
    supabase
      .from('moderation_actions')
      .select(`
        id, action, target_id, note, created_at,
        actor:profiles!moderation_actions_actor_id_fkey(id, username, display_name, avatar_url),
        target_owner:profiles!moderation_actions_target_owner_id_fkey(id, username, display_name, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .limit(16),
    isAdmin
      ? supabase.rpc('get_dashboard_users', { search_term: q.trim() || null, result_limit: 50, result_offset: 0 })
      : Promise.resolve({ data: [] }),
    isAdmin ? contentQuery : Promise.resolve({ data: [] }),
  ]);

  const stats = (statsResult.data ?? {}) as DashboardStats;
  const reports = (reportsResult.data ?? []) as unknown as ReportRow[];
  const activities = (activityResult.data ?? []) as unknown as ActivityRow[];
  const users = (usersResult.data ?? []) as unknown as DashboardUser[];
  const content = (contentResult.data ?? []) as unknown as DashboardArtwork[];

  const statCards = isAdmin
    ? [
        { key: 'total_users', label: 'Total users', hint: 'All registered creators', icon: Users, tone: '#eaf1ff' },
        { key: 'total_artworks', label: 'Pixel arts', hint: 'Across all visibility levels', icon: FileImage, tone: '#f1ebff' },
        { key: 'open_reports', label: 'Open reports', hint: 'Waiting for review', icon: MessageSquare, tone: '#fff3dd' },
        { key: 'total_likes', label: 'Community likes', hint: 'All-time engagement', icon: Heart, tone: '#ffe9ef' },
      ]
    : [
        { key: 'open_reports', label: 'Open reports', hint: 'Waiting for review', icon: MessageSquare, tone: '#fff3dd' },
        { key: 'in_review_reports', label: 'In review', hint: 'Currently assigned', icon: Eye, tone: '#eaf1ff' },
        { key: 'resolved_reports', label: 'Resolved', hint: 'Completed cases', icon: CheckCircle2, tone: '#e5f5ed' },
        { key: 'moderation_actions_30d', label: '30-day actions', hint: 'Recent moderation work', icon: Shield, tone: '#f1ebff' },
      ];

  return (
    <div className="mx-auto max-w-[1380px] space-y-10">
      <section id="overview" className="scroll-mt-28">
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-[#005efe]">{isAdmin ? 'Platform overview' : 'Moderation overview'}</p>
            <h2 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-[#172033] dark:text-text sm:text-3xl">
              {isAdmin ? 'Keep PixAnony healthy and growing.' : 'Keep the community safe and expressive.'}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#758095] dark:text-text-muted">
              {isAdmin
                ? 'Manage people, artwork, reports, permissions, and platform health from one focused workspace.'
                : 'Review reported artwork and take only the moderation actions assigned to your role.'}
            </p>
          </div>

          <form className="flex w-full max-w-md items-center gap-2 rounded-full border border-[#e5e9f0] bg-white p-1.5 shadow-[0_8px_24px_rgba(20,39,73,.05)] dark:border-border dark:bg-card">
            <Search size={16} className="ms-3 shrink-0 text-[#8a94a6]" />
            <input
              name="q"
              defaultValue={q}
              placeholder={isAdmin ? 'Search users or artwork' : 'Search the queue'}
              className="h-9 min-w-0 flex-1 bg-transparent text-sm text-[#172033] outline-none placeholder:text-[#9ba4b5] dark:text-text"
            />
            <input type="hidden" name="status" value={status} />
            <button className="h-9 rounded-full bg-[#005efe] px-4 text-xs font-bold text-white transition-colors hover:bg-[#004dcc]">Search</button>
          </form>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map(({ key, label, hint, icon: Icon, tone }) => (
            <article key={key} className="rounded-[22px] border border-[#e5e9f0] bg-white p-4 shadow-[0_8px_28px_rgba(20,39,73,.045)] dark:border-border dark:bg-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-[#7b8699] dark:text-text-muted">{label}</p>
                  <strong className="mt-2 block text-2xl font-bold tracking-[-0.04em] text-[#172033] dark:text-text">
                    {formatNumber(Number(stats[key] ?? 0), locale)}
                  </strong>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl text-[#005efe]" style={{ background: tone }}>
                  <Icon size={19} weight="duotone" />
                </span>
              </div>
              <p className="mt-3 text-[11px] text-[#929bad] dark:text-text-muted">{hint}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="reports" className="scroll-mt-28">
        <SectionHeading
          eyebrow="Moderation queue"
          title="Reported pixel arts"
          description="Review the context, move reports into review, dismiss false positives, or remove artwork that violates the community rules."
        />

        <div className="mb-4 flex gap-2 overflow-x-auto">
          {[
            ['active', 'Active'],
            ['open', 'Open'],
            ['in_review', 'In review'],
            ['resolved', 'Resolved'],
            ['dismissed', 'Dismissed'],
          ].map(([value, label]) => (
            <Link
              key={value}
              href={`/dashboard?status=${value}${q ? `&q=${encodeURIComponent(q)}` : ''}#reports`}
              className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-bold transition-colors ${
                status === value
                  ? 'border-[#005efe] bg-[#005efe] text-white'
                  : 'border-[#e5e9f0] bg-white text-[#687386] hover:text-[#172033] dark:border-border dark:bg-card dark:text-text-muted dark:hover:text-text'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {reports.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {reports.map((report) => {
              const artwork = first(report.artwork);
              const reporter = first(report.reporter);
              const owner = first(report.target_owner);
              const pixels = pixelsFrom(artwork?.pixel_data);
              const active = report.status === 'open' || report.status === 'in_review';

              return (
                <article key={report.id} className="overflow-hidden rounded-[24px] border border-[#e5e9f0] bg-white shadow-[0_10px_32px_rgba(20,39,73,.05)] dark:border-border dark:bg-card">
                  <div className="grid min-h-56 sm:grid-cols-[190px_minmax(0,1fr)]">
                    <div className="flex min-h-48 items-center justify-center bg-[#f7f8fa] p-4 dark:bg-surface">
                      {artwork && pixels.length ? (
                        <PixelArtRenderer pixels={pixels} gridSize={artwork.grid_size} className="h-full w-full" />
                      ) : (
                        <div className="text-center text-xs text-[#8a94a6]">
                          <FileImage size={28} className="mx-auto mb-2" />
                          Artwork unavailable
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusPill status={report.status} />
                            <span className="rounded-full bg-[#fff0f3] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#b7465b] dark:bg-red/12 dark:text-red">
                              {titleCase(report.reason)}
                            </span>
                          </div>
                          <h3 className="mt-3 truncate text-base font-bold text-[#172033] dark:text-text">
                            {artwork?.title || 'Untitled pixel art'}
                          </h3>
                        </div>
                        <time className="shrink-0 text-[11px] text-[#929bad] dark:text-text-muted">{formatTimeAgo(report.created_at, locale)}</time>
                      </div>

                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#758095] dark:text-text-muted">
                        {report.details || artwork?.caption || 'No additional report details were provided.'}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#8a94a6] dark:text-text-muted">
                        <span>Reported by <strong className="text-[#4c566b] dark:text-text">@{reporter?.username || 'unknown'}</strong></span>
                        <span>Creator <strong className="text-[#4c566b] dark:text-text">@{owner?.username || 'unknown'}</strong></span>
                      </div>

                      {active && (
                        <div className="mt-4 space-y-2 border-t border-[#edf0f4] pt-3 dark:border-border">
                          <form action={reviewReportAction} className="flex flex-wrap items-center gap-2">
                            <input type="hidden" name="reportId" value={report.id} />
                            <input
                              name="note"
                              maxLength={2000}
                              placeholder="Optional moderation note"
                              className="h-9 min-w-36 flex-1 rounded-full border border-[#e5e9f0] bg-[#f8f9fb] px-3 text-xs outline-none focus:border-[#005efe] dark:border-border dark:bg-surface"
                            />
                            {report.status === 'open' && (
                              <DashboardSubmitButton name="decision" value="in_review" className="bg-[#eef3ff] text-[#005efe] dark:bg-primary/12 dark:text-primary">
                                Review
                              </DashboardSubmitButton>
                            )}
                            <DashboardSubmitButton name="decision" value="dismissed" className="bg-[#eef0f4] text-[#657087] dark:bg-surface dark:text-text-muted">
                              Dismiss
                            </DashboardSubmitButton>
                          </form>

                          {artwork && (
                            <form action={removeArtworkAction}>
                              <input type="hidden" name="artworkId" value={artwork.id} />
                              <input type="hidden" name="reportId" value={report.id} />
                              <DashboardSubmitButton
                                confirmMessage="Remove this pixel art from PixAnony? This cannot be undone."
                                className="w-full bg-[#fff0f3] text-[#bd4057] hover:bg-[#ffe3e9] dark:bg-red/12 dark:text-red"
                              >
                                <Trash2 size={14} />
                                Remove violating artwork
                              </DashboardSubmitButton>
                            </form>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-52 flex-col items-center justify-center rounded-[24px] border border-dashed border-[#dfe4eb] bg-white px-6 text-center dark:border-border dark:bg-card">
            <CheckCircle2 size={28} className="mb-3 text-[#3d9b71]" />
            <h3 className="font-bold text-[#172033] dark:text-text">The queue is clear</h3>
            <p className="mt-1 text-sm text-[#7b8699] dark:text-text-muted">No reports match this filter.</p>
          </div>
        )}
      </section>

      {isAdmin && (
        <section id="content" className="scroll-mt-28">
          <SectionHeading
            eyebrow="Platform content"
            title="Posts & pixel arts"
            description="A compact view of recent artwork across public, private, and anonymous visibility levels."
          />
          <div className="overflow-hidden rounded-[24px] border border-[#e5e9f0] bg-white shadow-[0_10px_32px_rgba(20,39,73,.045)] dark:border-border dark:bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-start text-sm">
                <thead className="bg-[#f8f9fb] text-[10px] font-bold uppercase tracking-[0.12em] text-[#8a94a6] dark:bg-surface dark:text-text-muted">
                  <tr>
                    <th className="px-4 py-3 text-start">Artwork</th>
                    <th className="px-4 py-3 text-start">Creator</th>
                    <th className="px-4 py-3 text-start">Visibility</th>
                    <th className="px-4 py-3 text-start">Engagement</th>
                    <th className="px-4 py-3 text-end">Management</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf0f4] dark:divide-border">
                  {content.map((artwork) => {
                    const profile = first(artwork.profile);
                    return (
                      <tr key={artwork.id} className="hover:bg-[#fbfcfd] dark:hover:bg-surface/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f4f6f9] p-1 dark:bg-surface">
                              <PixelArtRenderer pixels={pixelsFrom(artwork.pixel_data)} gridSize={artwork.grid_size} className="h-full w-full" />
                            </div>
                            <div className="min-w-0">
                              <Link href={`/art/${artwork.id}`} className="block max-w-64 truncate font-bold text-[#172033] hover:text-[#005efe] dark:text-text">
                                {artwork.title || 'Untitled pixel art'}
                              </Link>
                              <span className="text-[11px] text-[#929bad]">{formatTimeAgo(artwork.created_at, locale)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-[#5f6a80] dark:text-text-muted">@{profile?.username || 'unknown'}</td>
                        <td className="px-4 py-3"><StatusPill status={artwork.is_anonymous ? 'anonymous' : artwork.visibility} /></td>
                        <td className="px-4 py-3 text-xs text-[#758095] dark:text-text-muted">
                          <span className="me-3 inline-flex items-center gap-1"><Eye size={13} />{formatNumber(artwork.views_count ?? 0, locale)}</span>
                          <span className="inline-flex items-center gap-1"><Heart size={13} />{formatNumber(artwork.likes_count ?? 0, locale)}</span>
                        </td>
                        <td className="px-4 py-3 text-end">
                          <form action={removeArtworkAction}>
                            <input type="hidden" name="artworkId" value={artwork.id} />
                            <DashboardSubmitButton
                              confirmMessage="Remove this pixel art from PixAnony? This cannot be undone."
                              className="bg-[#fff0f3] text-[#bd4057] hover:bg-[#ffe3e9] dark:bg-red/12 dark:text-red"
                            >
                              Remove
                            </DashboardSubmitButton>
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {isAdmin && hasAccess(access, 'users.read') && (
        <section id="users" className="scroll-mt-28">
          <SectionHeading
            eyebrow="Access control"
            title="Users & roles"
            description="Assign the minimum role each person needs. Role mutations are verified by PostgreSQL and recorded in the role audit log."
          />
          <div className="overflow-hidden rounded-[24px] border border-[#e5e9f0] bg-white shadow-[0_10px_32px_rgba(20,39,73,.045)] dark:border-border dark:bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-start text-sm">
                <thead className="bg-[#f8f9fb] text-[10px] font-bold uppercase tracking-[0.12em] text-[#8a94a6] dark:bg-surface dark:text-text-muted">
                  <tr>
                    <th className="px-4 py-3 text-start">User</th>
                    <th className="px-4 py-3 text-start">Joined</th>
                    <th className="px-4 py-3 text-start">Current role</th>
                    <th className="px-4 py-3 text-end">Role assignment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf0f4] dark:divide-border">
                  {users.map((user) => {
                    const ownAccount = user.user_id === access.userId;
                    return (
                      <tr key={user.user_id} className="hover:bg-[#fbfcfd] dark:hover:bg-surface/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <PixelAvatar username={user.username} src={user.avatar_url} size="sm" isVerified={user.is_verified} />
                            <div className="min-w-0">
                              <p className="truncate font-bold text-[#172033] dark:text-text">{user.display_name}</p>
                              <p className="rtl-isolate truncate text-xs text-[#8a94a6]">@{user.username}{ownAccount ? ' · you' : ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#758095] dark:text-text-muted">{new Date(user.created_at).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')}</td>
                        <td className="px-4 py-3"><StatusPill status={user.role} /></td>
                        <td className="px-4 py-3">
                          <form action={setUserRoleAction} className="flex items-center justify-end gap-2">
                            <input type="hidden" name="userId" value={user.user_id} />
                            <select
                              name="role"
                              defaultValue={user.role}
                              disabled={ownAccount}
                              className="h-9 rounded-full border border-[#e5e9f0] bg-[#f8f9fb] px-3 text-xs font-semibold text-[#4f5a70] outline-none focus:border-[#005efe] disabled:cursor-not-allowed disabled:opacity-55 dark:border-border dark:bg-surface dark:text-text"
                            >
                              <option value="user">User</option>
                              <option value="moderator">Moderator</option>
                              <option value="admin">Admin</option>
                            </select>
                            <DashboardSubmitButton disabled={ownAccount} className="bg-[#eef3ff] text-[#005efe] dark:bg-primary/12 dark:text-primary">
                              Save
                            </DashboardSubmitButton>
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      <section id="activity" className="scroll-mt-28 pb-6">
        <SectionHeading
          eyebrow="Audit trail"
          title="Moderation activity"
          description="A durable record of report decisions and artwork removals made by the staff team."
        />
        <div className="overflow-hidden rounded-[24px] border border-[#e5e9f0] bg-white shadow-[0_10px_32px_rgba(20,39,73,.045)] dark:border-border dark:bg-card">
          {activities.length ? (
            <div className="divide-y divide-[#edf0f4] dark:divide-border">
              {activities.map((activity) => {
                const actor = first(activity.actor);
                const owner = first(activity.target_owner);
                return (
                  <div key={activity.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#eef3ff] text-[#005efe] dark:bg-primary/12 dark:text-primary">
                      <Shield size={16} weight="duotone" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#172033] dark:text-text">
                        {actor?.display_name || actor?.username || 'Staff member'} <span className="font-normal text-[#758095] dark:text-text-muted">{titleCase(activity.action).toLowerCase()}</span>
                      </p>
                      <p className="mt-1 truncate text-xs text-[#929bad] dark:text-text-muted">
                        {activity.note || 'No note'}{owner?.username ? ` · creator @${owner.username}` : ''}
                      </p>
                    </div>
                    <time className="shrink-0 text-[11px] text-[#929bad] dark:text-text-muted">{formatTimeAgo(activity.created_at, locale)}</time>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-40 items-center justify-center px-6 text-sm text-[#8a94a6] dark:text-text-muted">No moderation actions yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}
