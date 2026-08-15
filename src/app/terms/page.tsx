import Link from 'next/link';
import { ArrowLeft, Heart } from '@/components/ui/icons';
import { Logo } from '@/components/ui/logo';

export default function TermsPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg px-4 py-6 text-text sm:px-8 sm:py-10">
      <div className="mx-auto max-w-3xl rounded-[32px] bg-card p-6 shadow-float sm:p-12">
        <div className="flex items-center justify-between gap-4"><Logo /><Link href="/" className="flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-semibold text-text-muted"><ArrowLeft size={15} />Home</Link></div>
        <span className="mt-16 grid h-14 w-14 place-items-center rounded-full bg-[var(--blush)]"><Heart size={24} /></span>
        <h1 className="mt-6 text-4xl font-bold sm:text-5xl">Community terms</h1>
        <div className="mt-8 space-y-8 text-base leading-7 text-text-muted">
          <section><h2 className="text-xl font-bold text-text">Create with care</h2><p className="mt-2">Only share artwork you have the right to use. Do not publish or send abusive, hateful, exploitative, or illegal content.</p></section>
          <section><h2 className="text-xl font-bold text-text">Respect anonymity</h2><p className="mt-2">Anonymous tools are for honest expression, not harassment or attempts to evade responsibility. Product safeguards may limit abusive activity.</p></section>
          <section><h2 className="text-xl font-bold text-text">Protect accounts</h2><p className="mt-2">Keep your account credentials secure and provide accurate information when creating a profile.</p></section>
          <section><h2 className="text-xl font-bold text-text">Product changes</h2><p className="mt-2">Features may change as PixAnony develops. Material changes to these terms should be communicated in the product.</p></section>
        </div>
      </div>
    </main>
  );
}
