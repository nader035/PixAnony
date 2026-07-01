import Link from 'next/link';
import { cn } from '@/lib/utils';

export function FilterChips<T extends string>({
  items,
  active,
  hrefFor,
}: {
  items: readonly T[];
  active: string;
  hrefFor: (item: T) => string;
}) {
  return (
    <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Filters">
      {items.map((item) => (
        <Link
          key={item}
          href={hrefFor(item)}
          className={cn(
            'rounded-full border px-4 py-2 text-xs font-semibold capitalize transition-colors',
            active === item
              ? 'border-primary bg-primary text-white shadow-[0_10px_26px_rgba(124,58,237,0.18)]'
              : 'border-border bg-card text-text-muted hover:border-primary/25 hover:bg-card-hover hover:text-text',
          )}
        >
          {item.replaceAll('-', ' ')}
        </Link>
      ))}
    </nav>
  );
}
