import { cn } from '@/lib/utils';

export function SectionHeader({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      {eyebrow && <p className="mb-2 text-xs font-semibold uppercase text-primary">{eyebrow}</p>}
      <h2 className="text-2xl font-semibold text-text sm:text-3xl">{title}</h2>
      {description && <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">{description}</p>}
    </div>
  );
}
