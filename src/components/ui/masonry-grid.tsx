import { cn } from '@/lib/utils';

export function MasonryGrid({
  children,
  className,
  columns = 'responsive',
}: {
  children: React.ReactNode;
  className?: string;
  columns?: 'responsive' | 'compact';
}) {
  return (
    <div
      className={cn(
        'gap-4',
        columns === 'compact'
          ? 'columns-1 sm:columns-2'
          : 'columns-1 sm:columns-2 xl:columns-3',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function MasonryItem({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return <div className={cn('mb-4 break-inside-avoid', className)} style={style}>{children}</div>;
}
