import Link from 'next/link';
import { cn } from '@/lib/utils';

export function FilterChips<T extends string>({
  items,
  active,
  hrefFor,
  ariaLabel,
}: {
  items: readonly T[];
  active: string;
  hrefFor: (item: T) => string;
  ariaLabel?: string;
}) {
  return (
    <nav className="flex gap-2 overflow-x-auto pb-1" aria-label={ariaLabel}>
      {items.map((item) => (
        <Link
          key={item}
          href={hrefFor(item)}
          className={cn(
            'rounded-full px-4 py-2 text-sm font-semibold capitalize transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]',
            active === item
              ? 'bg-primary text-bg shadow-[0_10px_26px_rgba(44,40,58,0.16)]'
              : 'bg-surface text-text-muted hover:bg-card-hover hover:text-text',
          )}
        >
          {item.replaceAll('-', ' ')}
        </Link>
      ))}
    </nav>
  );
}
