import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Shield } from '@/components/ui/icons';
import { Logo } from '@/components/ui/logo';
import { createPublicPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPublicPageMetadata({
  title: 'Privacy',
  description: 'Learn how PixAnony handles account information, public artwork, private delivery, and anonymous creative expression.',
  path: '/privacy',
});

export default function PrivacyPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg px-4 py-6 text-text sm:px-8 sm:py-10">
      <div className="mx-auto max-w-3xl rounded-[32px] bg-card p-6 shadow-float sm:p-12">
        <div className="flex items-center justify-between gap-4"><Logo /><Link href="/" className="flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-semibold text-text-muted"><ArrowLeft size={15} />Home</Link></div>
        <span className="mt-16 grid h-14 w-14 place-items-center rounded-full bg-[var(--mint)]"><Shield size={24} /></span>
        <h1 className="mt-6 text-4xl font-bold sm:text-5xl">Privacy at PixAnony</h1>
        <div className="mt-8 space-y-8 text-base leading-7 text-text-muted">
          <section><h2 className="text-xl font-bold text-text">What we store</h2><p className="mt-2">PixAnony stores the account, profile, artwork, and social activity needed to provide the product. Authentication and application data are managed through Supabase.</p></section>
          <section><h2 className="text-xl font-bold text-text">Anonymous delivery</h2><p className="mt-2">When you choose anonymous delivery, the recipient does not receive your identity. Access rules in the database restrict who can read private artwork and sender information.</p></section>
          <section><h2 className="text-xl font-bold text-text">Your choices</h2><p className="mt-2">You control whether artwork is public, private, anonymous, or signed. You can edit profile information from settings and manage saved artwork from your account.</p></section>
          <section><h2 className="text-xl font-bold text-text">Questions</h2><p className="mt-2">For privacy questions, contact the PixAnony team through the project support channel.</p></section>
        </div>
      </div>
    </main>
  );
}
