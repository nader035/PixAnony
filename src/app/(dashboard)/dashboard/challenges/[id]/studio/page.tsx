import { redirect } from 'next/navigation';
import { getAccessContext, hasAccess } from '@/lib/auth/access';

export default async function ChallengeStudioRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await getAccessContext();
  if (!access || access.role !== 'admin' || !hasAccess(access, 'platform.manage')) redirect('/dashboard');
  redirect(`/paint?mode=challenge-template&challenge=${id}`);
}
