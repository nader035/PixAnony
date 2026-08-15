import Link from 'next/link';
import { ArrowLeft, Compass } from '@/components/ui/icons';
import { Logo } from '@/components/ui/logo';

export default function NotFound() {
  return (
    <main id="main-content" className="grid min-h-screen place-items-center bg-bg px-4 py-10 text-text">
      <div className="relative w-full max-w-xl overflow-hidden rounded-[32px] bg-card p-8 text-center shadow-float sm:p-12">
        <span className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[var(--butter)]" />
        <div className="relative"><Logo className="justify-center" /><span className="mx-auto mt-12 grid h-16 w-16 place-items-center rounded-full bg-[var(--powder)]"><Compass size={28} /></span><p className="mt-8 text-sm font-bold text-pink">404</p><h1 className="mt-3 text-4xl font-bold">This page wandered off.</h1><p className="mx-auto mt-4 max-w-md text-base leading-7 text-text-muted">The link may be old, or the page may have moved somewhere new.</p><Link href="/" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-6 text-base font-semibold text-bg"><ArrowLeft size={16} />Back home</Link></div>
      </div>
    </main>
  );
}
