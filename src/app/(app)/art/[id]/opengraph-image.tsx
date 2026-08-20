import { ImageResponse } from 'next/og';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const alt = 'Artwork shared on PixAnony';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function ArtworkOpenGraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('artworks')
    .select('title, caption, preview_url, visibility, is_anonymous, profile:profiles!artworks_user_id_fkey(username, display_name)')
    .eq('id', id)
    .single();

  const rawProfile = data?.profile;
  const joinedProfile = (Array.isArray(rawProfile) ? rawProfile[0] : rawProfile) as {
    username: string;
    display_name: string;
  } | null | undefined;
  const canPreview = data && data.visibility !== 'private';
  const creator = !canPreview
    ? 'Private artwork'
    : data.is_anonymous
      ? 'Anonymous artist'
      : joinedProfile?.display_name || (joinedProfile?.username ? `@${joinedProfile.username}` : 'PixAnony artist');
  const title = canPreview ? data.title?.trim() || 'A fresh artwork' : 'Made for a smaller circle';
  const caption = canPreview
    ? data.caption?.trim().slice(0, 150) || 'Discover something new from the PixAnony community.'
    : 'This artwork is available only to people with access.';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          padding: 42,
          background: 'linear-gradient(135deg, #dedcf4 0%, #f6eff8 48%, #dbe8f6 100%)',
          color: '#25212f',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            overflow: 'hidden',
            borderRadius: 42,
            background: '#fffdfa',
            boxShadow: '0 24px 70px rgba(44, 40, 58, 0.16)',
          }}
        >
          <div style={{ width: '54%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '54px 50px' }}>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: 28, fontWeight: 800 }}>
              <div style={{ width: 18, height: 18, borderRadius: 9, marginRight: 12, background: '#ee789f' }} />
              PixAnony
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', marginBottom: 18, fontSize: 21, fontWeight: 700, color: '#7b7388' }}>{creator}</div>
              <div style={{ display: 'flex', fontSize: title.length > 38 ? 48 : 58, lineHeight: 1.05, fontWeight: 800, letterSpacing: '-2px' }}>{title.slice(0, 70)}</div>
              <div style={{ display: 'flex', marginTop: 22, maxWidth: 530, fontSize: 23, lineHeight: 1.45, color: '#6f687b' }}>{caption}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: 19, fontWeight: 700, color: '#6f687b' }}>
              Open the artwork · join the conversation
            </div>
          </div>

          <div style={{ width: '46%', display: 'flex', padding: 24 }}>
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                borderRadius: 30,
                background: 'linear-gradient(145deg, #d9d7f2 0%, #f7dce5 52%, #f8edc9 100%)',
              }}
            >
              {canPreview && data.preview_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.preview_url}
                  alt=""
                  width="500"
                  height="540"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 210, height: 210, display: 'flex', borderRadius: 105, background: 'rgba(255,255,255,.72)' }} />
                  <div style={{ marginTop: -132, display: 'flex', fontSize: 74, fontWeight: 800, color: '#8375d1' }}>P</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
