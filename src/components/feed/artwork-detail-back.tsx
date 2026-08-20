'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from '@/components/ui/icons';

export function ArtworkDetailBack({ label }: { label: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-text-muted transition-colors hover:text-text"
    >
      <ArrowLeft className="rtl-flip" size={16} />
      {label}
    </button>
  );
}
